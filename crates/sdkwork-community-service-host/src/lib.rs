use std::sync::Arc;

use sdkwork_community_database_host::bootstrap_community_database;
use sdkwork_community_service::CommunityService;
use sdkwork_community_storage_sqlx::CommunitySqlxStore;
use sdkwork_database_sqlx::DatabasePool;

pub struct CommunityServiceHost {
    database_pool: DatabasePool,
    service: Arc<CommunityService>,
}

impl CommunityServiceHost {
    pub async fn from_env() -> Result<Self, String> {
        let _ = dotenvy::dotenv();
        let database =
            sdkwork_community_storage_sqlx::bootstrap_community_database_from_env().await?;
        let store = Arc::new(CommunitySqlxStore::new(database.pool().clone()));
        let service = Arc::new(CommunityService::new(store));
        Ok(Self {
            database_pool: database.pool().clone(),
            service,
        })
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
