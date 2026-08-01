use sdkwork_utils_rust::{is_blank, parse_bool};
use url::Url;

pub const REDIS_ENABLED_ENV: &str = "SDKWORK_COMMUNITY_REDIS_ENABLED";
const REDIS_HOST_ENV: &str = "SDKWORK_COMMUNITY_REDIS_HOST";
const REDIS_PORT_ENV: &str = "SDKWORK_COMMUNITY_REDIS_PORT";
const REDIS_DATABASE_ENV: &str = "SDKWORK_COMMUNITY_REDIS_DATABASE";
const REDIS_USERNAME_ENV: &str = "SDKWORK_COMMUNITY_REDIS_USERNAME";
const REDIS_PASSWORD_FILE_ENV: &str = "SDKWORK_COMMUNITY_REDIS_PASSWORD_FILE";
const REDIS_PASSWORD_ENV: &str = "SDKWORK_COMMUNITY_REDIS_PASSWORD";
const REDIS_URL_ENV: &str = "SDKWORK_COMMUNITY_REDIS_URL";
const REDIS_KEY_PREFIX_ENV: &str = "SDKWORK_COMMUNITY_REDIS_KEY_PREFIX";
const REDIS_TLS_ENV: &str = "SDKWORK_COMMUNITY_REDIS_TLS";

#[derive(Clone)]
pub struct RedisRuntimeConfig {
    url: String,
    key_prefix: String,
}

impl RedisRuntimeConfig {
    pub fn url(&self) -> &str {
        &self.url
    }

    pub fn key_prefix(&self) -> &str {
        &self.key_prefix
    }

    pub fn from_sources<L, R>(lookup: &L, read_secret: &R) -> Result<Self, String>
    where
        L: Fn(&str) -> Option<String>,
        R: Fn(&str) -> Result<String, String>,
    {
        let key_prefix = required_value(lookup, REDIS_KEY_PREFIX_ENV)?;
        validate_key_prefix(&key_prefix)?;
        let password = redis_password(lookup, read_secret)?;
        let mut url = match optional_value(lookup, REDIS_URL_ENV) {
            Some(value) => parse_redis_url(&value)?,
            None => structured_redis_url(lookup)?,
        };

        if let Some(username) = optional_value(lookup, REDIS_USERNAME_ENV) {
            url.set_username(&username)
                .map_err(|_| format!("{REDIS_USERNAME_ENV} cannot be encoded in a Redis URL"))?;
        }
        if let Some(password) = password {
            url.set_password(Some(&password))
                .map_err(|_| "Redis password cannot be encoded in a Redis URL".to_owned())?;
        }

        Ok(Self {
            url: url.to_string(),
            key_prefix,
        })
    }
}

pub fn redis_enabled<L>(lookup: &L) -> Result<bool, String>
where
    L: Fn(&str) -> Option<String>,
{
    Ok(optional_bool(lookup, REDIS_ENABLED_ENV)?.unwrap_or(false))
}

fn parse_redis_url(value: &str) -> Result<Url, String> {
    let url = Url::parse(value).map_err(|error| format!("{REDIS_URL_ENV} is invalid: {error}"))?;
    if !matches!(url.scheme(), "redis" | "rediss") {
        return Err(format!(
            "{REDIS_URL_ENV} must use the redis or rediss scheme"
        ));
    }
    if url.host_str().is_none() {
        return Err(format!("{REDIS_URL_ENV} must include a host"));
    }
    if url.query().is_some() || url.fragment().is_some() {
        return Err(format!(
            "{REDIS_URL_ENV} must not contain a query string or fragment"
        ));
    }
    Ok(url)
}

fn structured_redis_url<L>(lookup: &L) -> Result<Url, String>
where
    L: Fn(&str) -> Option<String>,
{
    let host = required_value(lookup, REDIS_HOST_ENV)?;
    let port = optional_number::<u16, _>(lookup, REDIS_PORT_ENV)?.unwrap_or(6379);
    if port == 0 {
        return Err(format!("{REDIS_PORT_ENV} must be greater than zero"));
    }
    let database = optional_number::<u32, _>(lookup, REDIS_DATABASE_ENV)?.unwrap_or(0);
    let tls = optional_bool(lookup, REDIS_TLS_ENV)?.unwrap_or(false);
    let scheme = if tls { "rediss" } else { "redis" };
    let mut url = Url::parse(&format!("{scheme}://localhost/"))
        .map_err(|error| format!("construct Redis URL failed: {error}"))?;
    url.set_host(Some(&host))
        .map_err(|_| format!("{REDIS_HOST_ENV} is invalid"))?;
    url.set_port(Some(port))
        .map_err(|_| format!("{REDIS_PORT_ENV} is invalid"))?;
    url.set_path(&format!("/{database}"));
    Ok(url)
}

fn redis_password<L, R>(lookup: &L, read_secret: &R) -> Result<Option<String>, String>
where
    L: Fn(&str) -> Option<String>,
    R: Fn(&str) -> Result<String, String>,
{
    if let Some(path) = optional_value(lookup, REDIS_PASSWORD_FILE_ENV) {
        let password = read_secret(&path)?;
        let password = password.trim_end_matches(['\r', '\n']).to_owned();
        if is_blank(Some(&password)) {
            return Err(format!(
                "{REDIS_PASSWORD_FILE_ENV} resolved to an empty secret"
            ));
        }
        return Ok(Some(password));
    }
    Ok(lookup(REDIS_PASSWORD_ENV).filter(|value| !is_blank(Some(value))))
}

fn validate_key_prefix(value: &str) -> Result<(), String> {
    if value.len() > 128
        || value.starts_with(':')
        || value.ends_with(':')
        || !value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || ":._-".contains(character))
    {
        return Err(format!(
            "{REDIS_KEY_PREFIX_ENV} must be 1-128 safe namespace characters without a leading or trailing colon"
        ));
    }
    Ok(())
}

fn required_value<L>(lookup: &L, key: &str) -> Result<String, String>
where
    L: Fn(&str) -> Option<String>,
{
    optional_value(lookup, key).ok_or_else(|| format!("{key} is required"))
}

fn optional_value<L>(lookup: &L, key: &str) -> Option<String>
where
    L: Fn(&str) -> Option<String>,
{
    lookup(key)
        .filter(|value| !is_blank(Some(value)))
        .map(|value| value.trim().to_owned())
}

fn optional_bool<L>(lookup: &L, key: &str) -> Result<Option<bool>, String>
where
    L: Fn(&str) -> Option<String>,
{
    optional_value(lookup, key)
        .map(|value| {
            parse_bool(&value)
                .ok_or_else(|| format!("{key} must be a standard boolean value, got {value:?}"))
        })
        .transpose()
}

fn optional_number<T, L>(lookup: &L, key: &str) -> Result<Option<T>, String>
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
    L: Fn(&str) -> Option<String>,
{
    optional_value(lookup, key)
        .map(|value| {
            value
                .parse::<T>()
                .map_err(|error| format!("{key} is invalid: {error}"))
        })
        .transpose()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    fn parse(values: &BTreeMap<String, String>) -> Result<RedisRuntimeConfig, String> {
        RedisRuntimeConfig::from_sources(&|key| values.get(key).cloned(), &|_| {
            Err("unexpected secret read".to_owned())
        })
    }

    #[test]
    fn structured_config_encodes_credentials() {
        let values = BTreeMap::from([
            (REDIS_HOST_ENV.to_owned(), "redis.example.com".to_owned()),
            (REDIS_PORT_ENV.to_owned(), "6380".to_owned()),
            (REDIS_DATABASE_ENV.to_owned(), "4".to_owned()),
            (REDIS_USERNAME_ENV.to_owned(), "community worker".to_owned()),
            (REDIS_PASSWORD_ENV.to_owned(), "p@ss:/ word".to_owned()),
            (
                REDIS_KEY_PREFIX_ENV.to_owned(),
                "sdkwork:community".to_owned(),
            ),
            (REDIS_TLS_ENV.to_owned(), "true".to_owned()),
        ]);

        let redis = parse(&values).expect("structured Redis config");
        assert_eq!(redis.key_prefix(), "sdkwork:community");
        assert!(redis.url().starts_with("rediss://"));
        assert!(redis.url().contains("redis.example.com:6380/4"));
        assert!(!redis.url().contains("p@ss:/ word"));
    }

    #[test]
    fn password_file_overrides_direct_password() {
        let values = BTreeMap::from([
            (
                REDIS_URL_ENV.to_owned(),
                "redis://user:old@redis.example.com/2".to_owned(),
            ),
            (
                REDIS_PASSWORD_FILE_ENV.to_owned(),
                "/run/secrets/redis".to_owned(),
            ),
            (REDIS_PASSWORD_ENV.to_owned(), "direct".to_owned()),
            (
                REDIS_KEY_PREFIX_ENV.to_owned(),
                "sdkwork:community".to_owned(),
            ),
        ]);

        let config = RedisRuntimeConfig::from_sources(&|key| values.get(key).cloned(), &|path| {
            assert_eq!(path, "/run/secrets/redis");
            Ok("file-secret\r\n".to_owned())
        })
        .expect("Redis URL override");
        assert!(config.url().contains("file-secret"));
        assert!(!config.url().contains("direct"));
        assert!(!config.url().contains("old@"));
    }

    #[test]
    fn rejects_non_redis_url_override() {
        let values = BTreeMap::from([
            (
                REDIS_URL_ENV.to_owned(),
                "https://redis.example.com".to_owned(),
            ),
            (
                REDIS_KEY_PREFIX_ENV.to_owned(),
                "sdkwork:community".to_owned(),
            ),
        ]);
        let error = parse(&values).err().expect("invalid scheme");
        assert!(error.contains("redis or rediss"));
    }

    #[test]
    fn rejects_unsafe_key_prefix() {
        let values = BTreeMap::from([
            (REDIS_HOST_ENV.to_owned(), "127.0.0.1".to_owned()),
            (REDIS_KEY_PREFIX_ENV.to_owned(), ":community".to_owned()),
        ]);
        let error = parse(&values).err().expect("invalid key prefix");
        assert!(error.contains(REDIS_KEY_PREFIX_ENV));
    }
}
