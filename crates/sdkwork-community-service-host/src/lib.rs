use std::sync::Arc;

use sdkwork_community_database_host::bootstrap_community_database;
use sdkwork_community_service::CommunityService;
use sdkwork_community_storage_sqlx::{CommunitySqlxStore, community_initial_migration_sql};
use sdkwork_database_config::{DatabaseConfig, DatabaseEngine};
use sdkwork_database_sqlx::{DatabasePool, PoolContext};

pub struct CommunityServiceHost {
    database_pool: DatabasePool,
    service: Arc<CommunityService>,
}

impl CommunityServiceHost {
    pub async fn from_env() -> Result<Self, String> {
        let _ = dotenvy::dotenv();
        let database = sdkwork_community_storage_sqlx::bootstrap_community_database_from_env().await?;
        let store = Arc::new(CommunitySqlxStore::new(database.pool().clone()));
        let service = Arc::new(CommunityService::new(store));
        Ok(Self {
            database_pool: database.pool().clone(),
            service,
        })
    }

    /// Bootstrap an in-memory SQLite host for integration tests and local smoke checks.
    pub async fn from_sqlite_memory() -> Result<Arc<Self>, String> {
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .map_err(|error| format!("sqlite memory pool failed: {error}"))?;
        sqlx::raw_sql(community_initial_migration_sql())
            .execute(&pool)
            .await
            .map_err(|error| format!("community sqlite migration failed: {error}"))?;

        let config = DatabaseConfig {
            engine: DatabaseEngine::Sqlite,
            url: "sqlite::memory:".to_owned(),
            ..Default::default()
        };
        let database_pool = DatabasePool::Sqlite(pool, PoolContext { config });
        let store = Arc::new(CommunitySqlxStore::new(database_pool.clone()));
        Ok(Arc::new(Self {
            database_pool,
            service: Arc::new(CommunityService::new(store)),
        }))
    }

    pub async fn from_database_pool(pool: DatabasePool) -> Result<Arc<Self>, String> {
        let database = bootstrap_community_database(pool.clone()).await?;
        let store = Arc::new(CommunitySqlxStore::new(database.pool().clone()));
        Ok(Arc::new(Self {
            database_pool: database.pool().clone(),
            service: Arc::new(CommunityService::new(store)),
        }))
    }

    pub fn database_pool(&self) -> &DatabasePool {
        &self.database_pool
    }

    pub fn service(&self) -> Arc<CommunityService> {
        self.service.clone()
    }
}
