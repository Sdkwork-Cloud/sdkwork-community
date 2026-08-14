use std::path::PathBuf;
use std::sync::Arc;

use sdkwork_database_config::DatabaseConfig;
use sdkwork_database_lifecycle::{lifecycle_options_from_env, LifecycleOrchestrator};
use sdkwork_database_spi::{DatabaseAssetProvider, DatabaseManifest, DefaultDatabaseModule};
use sdkwork_database_sqlx::{create_pool_from_config, DatabasePool};

pub struct CommunityDatabaseHost {
    pool: DatabasePool,
    module: Arc<DefaultDatabaseModule>,
}

impl CommunityDatabaseHost {
    pub fn pool(&self) -> &DatabasePool {
        &self.pool
    }

    pub fn module(&self) -> Arc<DefaultDatabaseModule> {
        self.module.clone()
    }
}

pub async fn bootstrap_community_database(
    pool: DatabasePool,
) -> Result<CommunityDatabaseHost, String> {
    bootstrap_community_database_with_options(pool, false).await
}

/// Bootstraps the community database and applies the official seed data
/// (circles, tiers, welcome entries — all idempotent `ON CONFLICT` upserts).
/// Host gateways that embed the community domain (e.g. the IM standalone
/// gateway) use this so official circles are usable out of the box without
/// relying on the global `SDKWORK_DATABASE_SEED_ON_BOOT` switch (which would
/// also seed every other embedded dependency).
pub async fn bootstrap_community_database_with_seed(
    pool: DatabasePool,
) -> Result<CommunityDatabaseHost, String> {
    bootstrap_community_database_with_options(pool, true).await
}

async fn bootstrap_community_database_with_options(
    pool: DatabasePool,
    force_seed: bool,
) -> Result<CommunityDatabaseHost, String> {
    if pool.as_postgres().is_none() {
        return Err(
            "community authoritative-server database requires PostgreSQL; SQLite is client-local only"
                .to_owned(),
        );
    }
    let app_root = resolve_app_root();
    let module = Arc::new(
        DefaultDatabaseModule::from_app_root(&app_root)
            .map_err(|error| format!("load community database module failed: {error}"))?,
    );
    let manifest = DatabaseManifest::from_file(module.manifest_path())
        .map_err(|error| format!("read community database manifest failed: {error}"))?;
    let options = lifecycle_options_from_env("COMMUNITY", &manifest);
    let orchestrator = LifecycleOrchestrator::new(pool.clone(), module.clone())
        .with_applied_by("sdkwork-community");

    orchestrator
        .init()
        .await
        .map_err(|error| format!("community database init failed: {error}"))?;

    if options.auto_migrate {
        orchestrator
            .migrate()
            .await
            .map_err(|error| format!("community database migrate failed: {error}"))?;
    }

    if options.seed_on_boot || force_seed {
        orchestrator
            .seed(&options.seed_locale, &options.seed_profile)
            .await
            .map_err(|error| {
                format!(
                    "community database module {} seed failed: {error}",
                    manifest.module_id
                )
            })?;
    }

    Ok(CommunityDatabaseHost { pool, module })
}

pub async fn bootstrap_community_database_from_env() -> Result<CommunityDatabaseHost, String> {
    bootstrap_community_database_from_env_with_options(false).await
}

/// Same as [`bootstrap_community_database_from_env`] but always applies the
/// official seed data (idempotent).
pub async fn bootstrap_community_database_with_seed_from_env(
) -> Result<CommunityDatabaseHost, String> {
    bootstrap_community_database_from_env_with_options(true).await
}

async fn bootstrap_community_database_from_env_with_options(
    force_seed: bool,
) -> Result<CommunityDatabaseHost, String> {
    let _ = dotenvy::dotenv();
    let config = DatabaseConfig::from_env("COMMUNITY")
        .map_err(|error| format!("read community database config failed: {error}"))?;
    let pool = create_pool_from_config(config)
        .await
        .map_err(|error| format!("create community database pool failed: {error}"))?;
    bootstrap_community_database_with_options(pool, force_seed).await
}

fn resolve_app_root() -> PathBuf {
    std::env::var("SDKWORK_COMMUNITY_APP_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                .join("../..")
                .canonicalize()
                .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
        })
}
