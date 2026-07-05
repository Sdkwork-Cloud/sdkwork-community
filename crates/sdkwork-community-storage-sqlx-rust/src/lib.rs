mod bootstrap;
mod community_sqlx_store;
mod postgres_queries;
mod sqlite_queries;

pub use bootstrap::{
    bootstrap_community_database, bootstrap_community_database_from_env,
    connect_and_bootstrap_community_database_from_env, connect_community_database_pool_from_env,
    CommunityDatabaseHost, CommunityDatabasePool,
};
pub use community_sqlx_store::{
    CommunityCategoryPatch, CommunityEntryPatch, CommunityFeedQuery, CommunityModerationPatch,
    CommunitySqlxStore,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityRepositoryBinding {
    pub domain: &'static str,
    pub repository_name: &'static str,
    pub tables: Vec<&'static str>,
    pub requires_transaction: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityStorageMigration {
    pub sequence: u32,
    pub name: &'static str,
    pub domain: &'static str,
    pub source_path: &'static str,
    pub sql: &'static str,
    pub checksum: String,
    pub required_tables: Vec<&'static str>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityStorageCapabilityManifest {
    pub name: &'static str,
    pub schema_version: &'static str,
    pub tables: Vec<&'static str>,
    pub indexes: Vec<&'static str>,
    pub migrations: Vec<&'static str>,
    pub migration_plan: Vec<CommunityStorageMigration>,
    pub repository_bindings: Vec<CommunityRepositoryBinding>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityStoredCategory {
    pub id: String,
    pub tenant_id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: i64,
    pub enabled: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityStoredComment {
    pub id: String,
    pub tenant_id: String,
    pub entry_id: String,
    pub author_id: String,
    pub author_name: String,
    pub body_markdown: String,
    pub review_state: String,
    pub is_accepted_answer: bool,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewCommunityComment {
    pub id: String,
    pub tenant_id: String,
    pub entry_id: String,
    pub author_id: String,
    pub author_name: String,
    pub body_markdown: String,
    pub now: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SetCommunityReaction {
    pub id: String,
    pub tenant_id: String,
    pub entry_id: String,
    pub user_id: String,
    pub reaction_type: String,
    pub active: bool,
    pub now: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewCommunityCategory {
    pub id: String,
    pub tenant_id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: i64,
    pub enabled: bool,
    pub now: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewCommunityEntry {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub author_id: String,
    pub author_name: String,
    pub slug: String,
    pub kind: String,
    pub title: String,
    pub excerpt: String,
    pub body_markdown: String,
    pub tags: Vec<String>,
    pub now: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityStoredEntry {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub author_id: String,
    pub author_name: String,
    pub slug: String,
    pub kind: String,
    pub title: String,
    pub excerpt: String,
    pub body_markdown: String,
    pub review_state: String,
    pub is_featured: bool,
    pub is_pinned: bool,
    pub has_accepted_answer: bool,
    pub comment_count: i64,
    pub reaction_count: i64,
    pub share_count: i64,
    pub view_count: i64,
    pub tags: Vec<String>,
    pub published_at: Option<String>,
    pub last_activity_at: Option<String>,
    pub updated_at: String,
}

pub fn community_database_tables() -> Vec<&'static str> {
    vec![
        "community_category",
        "community_entry",
        "community_entry_body",
        "community_tag",
        "community_entry_tag",
        "community_comment",
        "community_reaction",
        "community_moderation_event",
        "community_recommendation_snapshot",
        "community_schema_version",
        "community_migration_lock",
    ]
}

pub fn community_database_indexes() -> Vec<&'static str> {
    vec![
        "idx_community_category_tenant_priority",
        "idx_community_entry_tenant_state_activity",
        "idx_community_entry_tenant_slug",
        "idx_community_entry_tenant_category_state",
        "idx_community_entry_tenant_kind_state",
        "idx_community_entry_tenant_featured_pinned",
        "idx_community_tag_tenant_slug",
        "idx_community_entry_tag_tag",
        "idx_community_comment_entry",
        "idx_community_reaction_entry",
        "idx_community_moderation_event_entry",
        "idx_community_recommendation_source",
    ]
}

pub fn community_migration_names() -> Vec<&'static str> {
    vec!["0001_community_baseline.sql"]
}

pub fn community_initial_migration_sql() -> &'static str {
    include_str!("../../../database/ddl/baseline/sqlite/0001_community_baseline.sql")
}

pub fn community_migration_plan() -> Vec<CommunityStorageMigration> {
    vec![migration(
        1,
        "0001_community_baseline.sql",
        "community",
        "database/ddl/baseline/sqlite/0001_community_baseline.sql",
        community_initial_migration_sql(),
        community_database_tables(),
    )]
}

pub fn community_repository_bindings() -> Vec<CommunityRepositoryBinding> {
    vec![
        binding(
            "community",
            "community.category.repository",
            vec!["community_category"],
        ),
        binding(
            "community",
            "community.entry.repository",
            vec![
                "community_entry",
                "community_entry_body",
                "community_tag",
                "community_entry_tag",
            ],
        ),
        binding(
            "community",
            "community.comment.repository",
            vec!["community_comment"],
        ),
        binding(
            "community",
            "community.reaction.repository",
            vec!["community_reaction"],
        ),
        binding(
            "community",
            "community.moderation.repository",
            vec!["community_moderation_event"],
        ),
        binding(
            "community",
            "community.recommendation.repository",
            vec!["community_recommendation_snapshot"],
        ),
    ]
}

pub fn community_storage_capability_manifest() -> CommunityStorageCapabilityManifest {
    CommunityStorageCapabilityManifest {
        name: "sdkwork-community-storage-sqlx",
        schema_version: "community.storage.v1",
        tables: community_database_tables(),
        indexes: community_database_indexes(),
        migrations: community_migration_names(),
        migration_plan: community_migration_plan(),
        repository_bindings: community_repository_bindings(),
    }
}

fn binding(
    domain: &'static str,
    repository_name: &'static str,
    tables: Vec<&'static str>,
) -> CommunityRepositoryBinding {
    CommunityRepositoryBinding {
        domain,
        repository_name,
        tables,
        requires_transaction: true,
    }
}

fn migration(
    sequence: u32,
    name: &'static str,
    domain: &'static str,
    source_path: &'static str,
    sql: &'static str,
    required_tables: Vec<&'static str>,
) -> CommunityStorageMigration {
    CommunityStorageMigration {
        sequence,
        name,
        domain,
        source_path,
        sql,
        checksum: migration_checksum(name, sql),
        required_tables,
    }
}

fn migration_checksum(name: &str, sql: &str) -> String {
    let mut hash = 0xcbf29ce484222325u64;
    for byte in name.bytes().chain(sql.bytes()) {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("community-migration-checksum:{hash:016x}")
}

