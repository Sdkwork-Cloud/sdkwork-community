//! SDKWork Community database pool bootstrap via `sdkwork-database`.

use sdkwork_database_config::DatabaseConfig;
use sdkwork_database_sqlx::{create_pool_from_config, DatabasePool, PoolError};

pub use sdkwork_community_database_host::{
    bootstrap_community_database, bootstrap_community_database_from_env, CommunityDatabaseHost,
};

pub type CommunityDatabasePool = DatabasePool;

pub async fn connect_community_database_pool_from_env() -> Result<CommunityDatabasePool, PoolError> {
    let config = DatabaseConfig::from_env("COMMUNITY")?;
    create_pool_from_config(config).await
}

pub async fn connect_and_bootstrap_community_database_from_env(
) -> Result<CommunityDatabaseHost, String> {
    let pool = connect_community_database_pool_from_env()
        .await
        .map_err(|error| error.to_string())?;
    bootstrap_community_database(pool).await
}
