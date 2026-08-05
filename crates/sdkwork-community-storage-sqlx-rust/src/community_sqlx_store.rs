use sdkwork_database_sqlx::DatabasePool;

#[derive(Clone, Debug)]
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

impl Default for CommunityFeedQuery {
    fn default() -> Self {
        Self {
            category_id: None,
            kind: None,
            q: None,
            review_state: None,
            tag: None,
            page: 1,
            page_size: 20,
            approved_only: false,
        }
    }
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

    fn postgres_pool(&self) -> &sqlx::PgPool {
        self.pool
            .as_postgres()
            .expect("CommunitySqlxStore requires a validated PostgreSQL pool")
    }

    pub async fn list_categories(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<super::CommunityStoredCategory>, sqlx::Error> {
        super::postgres_queries::list_categories(self.postgres_pool(), tenant_id).await
    }

    pub async fn create_category(
        &self,
        input: super::NewCommunityCategory,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::create_category(self.postgres_pool(), input).await
    }

    pub async fn update_category(
        &self,
        tenant_id: &str,
        category_id: &str,
        patch: &CommunityCategoryPatch,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::update_category(
            self.postgres_pool(),
            tenant_id,
            category_id,
            patch,
        )
        .await
    }

    pub async fn delete_category(
        &self,
        tenant_id: &str,
        category_id: &str,
    ) -> Result<bool, sqlx::Error> {
        super::postgres_queries::delete_category(self.postgres_pool(), tenant_id, category_id).await
    }

    pub async fn create_entry(&self, input: super::NewCommunityEntry) -> Result<(), sqlx::Error> {
        super::postgres_queries::create_entry(self.postgres_pool(), input).await
    }

    pub async fn update_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
        patch: &CommunityEntryPatch,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::update_entry(self.postgres_pool(), tenant_id, entry_id, patch)
            .await
    }

    pub async fn list_feed(
        &self,
        tenant_id: &str,
        query: &CommunityFeedQuery,
    ) -> Result<super::CommunityStoredEntryPage, sqlx::Error> {
        super::postgres_queries::list_feed(self.postgres_pool(), tenant_id, query).await
    }

    pub async fn retrieve_entry_by_id(
        &self,
        tenant_id: &str,
        entry_id: &str,
        approved_only: bool,
    ) -> Result<Option<super::CommunityStoredEntry>, sqlx::Error> {
        super::postgres_queries::retrieve_entry_by_id(
            self.postgres_pool(),
            tenant_id,
            entry_id,
            approved_only,
        )
        .await
    }

    pub async fn retrieve_entry_by_slug(
        &self,
        tenant_id: &str,
        slug: &str,
    ) -> Result<Option<super::CommunityStoredEntry>, sqlx::Error> {
        super::postgres_queries::retrieve_entry_by_slug(self.postgres_pool(), tenant_id, slug).await
    }

    pub async fn list_comments(
        &self,
        tenant_id: &str,
        entry_id: &str,
        page_size: i64,
        offset: i64,
    ) -> Result<Vec<super::CommunityStoredComment>, sqlx::Error> {
        super::postgres_queries::list_comments(
            self.postgres_pool(),
            tenant_id,
            entry_id,
            page_size,
            offset,
        )
        .await
    }

    pub async fn count_comments(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<i64, sqlx::Error> {
        super::postgres_queries::count_comments(self.postgres_pool(), tenant_id, entry_id).await
    }

    pub async fn retrieve_comment(
        &self,
        tenant_id: &str,
        comment_id: &str,
    ) -> Result<Option<super::CommunityStoredComment>, sqlx::Error> {
        super::postgres_queries::retrieve_comment(self.postgres_pool(), tenant_id, comment_id)
            .await
    }

    pub async fn create_comment(
        &self,
        input: super::NewCommunityComment,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::create_comment(self.postgres_pool(), input).await
    }

    pub async fn update_moderation(
        &self,
        tenant_id: &str,
        entry_id: &str,
        actor_user_id: &str,
        patch: &CommunityModerationPatch,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::update_moderation(
            self.postgres_pool(),
            tenant_id,
            entry_id,
            actor_user_id,
            patch,
        )
        .await
    }

    pub async fn set_featured(
        &self,
        tenant_id: &str,
        entry_id: &str,
        featured: bool,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::set_featured(self.postgres_pool(), tenant_id, entry_id, featured)
            .await
    }

    pub async fn set_pinned(
        &self,
        tenant_id: &str,
        entry_id: &str,
        pinned: bool,
    ) -> Result<(), sqlx::Error> {
        super::postgres_queries::set_pinned(self.postgres_pool(), tenant_id, entry_id, pinned).await
    }

    pub async fn set_reaction(
        &self,
        input: super::SetCommunityReaction,
    ) -> Result<i64, sqlx::Error> {
        super::postgres_queries::set_reaction(self.postgres_pool(), &input).await
    }

    pub async fn delete_entry(&self, tenant_id: &str, entry_id: &str) -> Result<bool, sqlx::Error> {
        super::postgres_queries::delete_entry(self.postgres_pool(), tenant_id, entry_id).await
    }

    pub async fn list_moderation_queue(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<super::CommunityStoredEntry>, sqlx::Error> {
        super::postgres_queries::list_moderation_queue(self.postgres_pool(), tenant_id).await
    }

    pub async fn rebuild_recommendations(&self, tenant_id: &str) -> Result<i64, sqlx::Error> {
        super::postgres_queries::rebuild_recommendations(self.postgres_pool(), tenant_id).await
    }
}
