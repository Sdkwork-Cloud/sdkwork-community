use sdkwork_database_sqlx::DatabasePool;

#[derive(Clone, Debug, Default)]
pub struct CommunityFeedQuery {
    pub category_id: Option<String>,
    pub kind: Option<String>,
    pub q: Option<String>,
    pub review_state: Option<String>,
    pub tag: Option<String>,
    pub page: i64,
    pub page_size: i64,
    pub approved_only: bool,
}

#[derive(Clone, Debug)]
pub struct CommunityEntryPatch {
    pub category_id: Option<String>,
    pub kind: Option<String>,
    pub title: Option<String>,
    pub excerpt: Option<String>,
    pub body: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Clone, Debug)]
pub struct CommunityCategoryPatch {
    pub slug: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<i64>,
    pub enabled: Option<bool>,
}

#[derive(Clone, Debug)]
pub struct CommunityModerationPatch {
    pub review_state: String,
    pub reason: Option<String>,
}

#[derive(Clone, Debug)]
pub struct CommunitySqlxStore {
    pool: DatabasePool,
}

impl CommunitySqlxStore {
    pub fn new(pool: DatabasePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &DatabasePool {
        &self.pool
    }

    pub async fn list_categories(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<super::CommunityStoredCategory>, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::list_categories(pool, tenant_id).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::list_categories(pool, tenant_id).await
            }
        }
    }

    pub async fn create_category(
        &self,
        input: super::NewCommunityCategory,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::create_category(pool, input).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::create_category(pool, input).await
            }
        }
    }

    pub async fn update_category(
        &self,
        tenant_id: &str,
        category_id: &str,
        patch: &CommunityCategoryPatch,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::update_category(pool, tenant_id, category_id, patch).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::update_category(pool, tenant_id, category_id, patch).await
            }
        }
    }

    pub async fn delete_category(
        &self,
        tenant_id: &str,
        category_id: &str,
    ) -> Result<bool, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::delete_category(pool, tenant_id, category_id).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::delete_category(pool, tenant_id, category_id).await
            }
        }
    }

    pub async fn create_entry(&self, input: super::NewCommunityEntry) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => super::sqlite_queries::create_entry(pool, input).await,
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::create_entry(pool, input).await
            }
        }
    }

    pub async fn update_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
        patch: &CommunityEntryPatch,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::update_entry(pool, tenant_id, entry_id, patch).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::update_entry(pool, tenant_id, entry_id, patch).await
            }
        }
    }

    pub async fn list_feed(
        &self,
        tenant_id: &str,
        query: &CommunityFeedQuery,
    ) -> Result<Vec<super::CommunityStoredEntry>, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::list_feed(pool, tenant_id, query).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::list_feed(pool, tenant_id, query).await
            }
        }
    }

    pub async fn retrieve_entry_by_id(
        &self,
        tenant_id: &str,
        entry_id: &str,
        approved_only: bool,
    ) -> Result<Option<super::CommunityStoredEntry>, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::retrieve_entry_by_id(pool, tenant_id, entry_id, approved_only)
                    .await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::retrieve_entry_by_id(
                    pool, tenant_id, entry_id, approved_only,
                )
                .await
            }
        }
    }

    pub async fn retrieve_entry_by_slug(
        &self,
        tenant_id: &str,
        slug: &str,
    ) -> Result<Option<super::CommunityStoredEntry>, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::retrieve_entry_by_slug(pool, tenant_id, slug).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::retrieve_entry_by_slug(pool, tenant_id, slug).await
            }
        }
    }

    pub async fn list_comments(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<Vec<super::CommunityStoredComment>, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::list_comments(pool, tenant_id, entry_id).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::list_comments(pool, tenant_id, entry_id).await
            }
        }
    }

    pub async fn create_comment(
        &self,
        input: super::NewCommunityComment,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::create_comment(pool, input).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::create_comment(pool, input).await
            }
        }
    }

    pub async fn update_moderation(
        &self,
        tenant_id: &str,
        entry_id: &str,
        actor_user_id: &str,
        patch: &CommunityModerationPatch,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::update_moderation(
                    pool, tenant_id, entry_id, actor_user_id, patch,
                )
                .await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::update_moderation(
                    pool, tenant_id, entry_id, actor_user_id, patch,
                )
                .await
            }
        }
    }

    pub async fn set_featured(
        &self,
        tenant_id: &str,
        entry_id: &str,
        featured: bool,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::set_featured(pool, tenant_id, entry_id, featured).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::set_featured(pool, tenant_id, entry_id, featured).await
            }
        }
    }

    pub async fn set_pinned(
        &self,
        tenant_id: &str,
        entry_id: &str,
        pinned: bool,
    ) -> Result<(), sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::set_pinned(pool, tenant_id, entry_id, pinned).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::set_pinned(pool, tenant_id, entry_id, pinned).await
            }
        }
    }

    pub async fn set_reaction(
        &self,
        input: super::SetCommunityReaction,
    ) -> Result<i64, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::set_reaction(pool, &input).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::set_reaction(pool, &input).await
            }
        }
    }

    pub async fn delete_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<bool, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::delete_entry(pool, tenant_id, entry_id).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::delete_entry(pool, tenant_id, entry_id).await
            }
        }
    }

    pub async fn list_moderation_queue(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<super::CommunityStoredEntry>, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::list_moderation_queue(pool, tenant_id).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::list_moderation_queue(pool, tenant_id).await
            }
        }
    }

    pub async fn rebuild_recommendations(&self, tenant_id: &str) -> Result<i64, sqlx::Error> {
        match &self.pool {
            DatabasePool::Sqlite(pool, _) => {
                super::sqlite_queries::rebuild_recommendations(pool, tenant_id).await
            }
            DatabasePool::Postgres(pool, _) => {
                super::postgres_queries::rebuild_recommendations(pool, tenant_id).await
            }
        }
    }
}
