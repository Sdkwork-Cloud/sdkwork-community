use crate::redis_config::{redis_enabled, RedisRuntimeConfig, REDIS_ENABLED_ENV};
use sdkwork_utils_rust::is_blank;
use std::net::SocketAddr;

const ENVIRONMENT_ENV: &str = "SDKWORK_ENVIRONMENT";
const COMMUNITY_ENVIRONMENT_ENV: &str = "SDKWORK_COMMUNITY_ENVIRONMENT";
const SERVER_BIND_ENV: &str = "SDKWORK_COMMUNITY_SERVER_BIND";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum LifecycleEnvironment {
    Development,
    Production,
}

impl LifecycleEnvironment {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Development => "development",
            Self::Production => "production",
        }
    }

    fn parse(value: &str) -> Result<Self, String> {
        match value.trim().to_ascii_lowercase().as_str() {
            "development" => Ok(Self::Development),
            "production" => Ok(Self::Production),
            other => Err(format!(
                "{ENVIRONMENT_ENV} must be development or production, got {other:?}"
            )),
        }
    }
}

pub struct GatewayRuntimeConfig {
    pub bind: SocketAddr,
    pub environment: LifecycleEnvironment,
    redis: Option<RedisRuntimeConfig>,
}

impl GatewayRuntimeConfig {
    pub fn from_env() -> Result<Self, String> {
        Self::from_sources(
            |key| std::env::var(key).ok(),
            |path| {
                std::fs::read_to_string(path)
                    .map_err(|error| format!("read Redis password file failed: {error}"))
            },
        )
    }

    pub fn is_production(&self) -> bool {
        self.environment == LifecycleEnvironment::Production
    }

    pub fn redis(&self) -> Option<&RedisRuntimeConfig> {
        self.redis.as_ref()
    }

    fn from_sources<L, R>(lookup: L, read_secret: R) -> Result<Self, String>
    where
        L: Fn(&str) -> Option<String>,
        R: Fn(&str) -> Result<String, String>,
    {
        let environment_value = required_value(&lookup, ENVIRONMENT_ENV)?;
        let community_environment = required_value(&lookup, COMMUNITY_ENVIRONMENT_ENV)?;
        if !environment_value.eq_ignore_ascii_case(&community_environment) {
            return Err(format!(
                "{ENVIRONMENT_ENV} and {COMMUNITY_ENVIRONMENT_ENV} must select the same lifecycle environment"
            ));
        }
        let environment = LifecycleEnvironment::parse(&environment_value)?;
        let bind = required_value(&lookup, SERVER_BIND_ENV)?
            .parse::<SocketAddr>()
            .map_err(|error| format!("{SERVER_BIND_ENV} is invalid: {error}"))?;

        let redis_enabled = redis_enabled(&lookup)?;
        if environment == LifecycleEnvironment::Production && !redis_enabled {
            return Err(format!(
                "production server runtime requires {REDIS_ENABLED_ENV}=true"
            ));
        }
        let redis = redis_enabled
            .then(|| RedisRuntimeConfig::from_sources(&lookup, &read_secret))
            .transpose()?;

        Ok(Self {
            bind,
            environment,
            redis,
        })
    }
}

fn required_value<L>(lookup: &L, key: &str) -> Result<String, String>
where
    L: Fn(&str) -> Option<String>,
{
    lookup(key)
        .filter(|value| !is_blank(Some(value)))
        .map(|value| value.trim().to_owned())
        .ok_or_else(|| format!("{key} is required"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    fn base_environment(environment: &str) -> BTreeMap<String, String> {
        BTreeMap::from([
            (ENVIRONMENT_ENV.to_owned(), environment.to_owned()),
            (COMMUNITY_ENVIRONMENT_ENV.to_owned(), environment.to_owned()),
            (SERVER_BIND_ENV.to_owned(), "127.0.0.1:18094".to_owned()),
        ])
    }

    fn parse(values: &BTreeMap<String, String>) -> Result<GatewayRuntimeConfig, String> {
        GatewayRuntimeConfig::from_sources(
            |key| values.get(key).cloned(),
            |_| Err("unexpected secret read".to_owned()),
        )
    }

    #[test]
    fn development_allows_redis_to_be_disabled() {
        let config = parse(&base_environment("development")).expect("development config");
        assert!(!config.is_production());
        assert!(config.redis().is_none());
    }

    #[test]
    fn production_requires_redis() {
        let error = parse(&base_environment("production"))
            .err()
            .expect("missing Redis must fail closed");
        assert!(error.contains(REDIS_ENABLED_ENV));
    }
}
