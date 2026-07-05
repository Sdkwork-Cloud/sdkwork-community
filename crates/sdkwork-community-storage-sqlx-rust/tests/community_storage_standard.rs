use sdkwork_community_storage_sqlx::{
    community_database_tables, community_initial_migration_sql, community_migration_names,
    community_storage_capability_manifest, CommunityFeedQuery, CommunityModerationPatch,
    CommunitySqlxStore, NewCommunityCategory, NewCommunityEntry,
};
use sdkwork_database_config::{DatabaseConfig, DatabaseEngine};
use sdkwork_database_sqlx::{DatabasePool, PoolContext};
use sqlx::sqlite::SqlitePoolOptions;

async fn sqlite_memory_store() -> CommunitySqlxStore {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite pool");
    sqlx::raw_sql(community_initial_migration_sql())
        .execute(&pool)
        .await
        .expect("community migration");
    let config = DatabaseConfig {
        engine: DatabaseEngine::Sqlite,
        url: "sqlite::memory:".to_owned(),
        ..Default::default()
    };
    CommunitySqlxStore::new(DatabasePool::Sqlite(pool, PoolContext { config }))
}

#[test]
fn community_storage_manifest_declares_complete_tables_and_migrations() {
    let manifest = community_storage_capability_manifest();
    assert_eq!(manifest.name, "sdkwork-community-storage-sqlx");
    assert_eq!(manifest.schema_version, "community.storage.v1");
    assert_eq!(community_database_tables(), manifest.tables);
    assert_eq!(community_migration_names(), manifest.migrations);
    assert_eq!(
        manifest.tables,
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
        ],
    );
    assert!(manifest.indexes.contains(&"idx_community_entry_tenant_state_activity"));
    assert!(manifest.indexes.contains(&"idx_community_entry_tenant_slug"));
    assert_eq!(manifest.migration_plan[0].name, "0001_community_baseline.sql");
    assert!(manifest
        .migration_plan[0]
        .sql
        .contains("CREATE TABLE IF NOT EXISTS community_entry"));
}

#[test]
fn community_storage_repositories_bind_to_community_tables() {
    let manifest = community_storage_capability_manifest();
    let names = manifest
        .repository_bindings
        .iter()
        .map(|binding| binding.repository_name)
        .collect::<Vec<_>>();
    assert_eq!(
        names,
        vec![
            "community.category.repository",
            "community.entry.repository",
            "community.comment.repository",
            "community.reaction.repository",
            "community.moderation.repository",
            "community.recommendation.repository",
        ],
    );
}

#[tokio::test]
async fn community_sqlx_store_migrates_creates_publishes_and_reads_feed() {
    let store = sqlite_memory_store().await;

    store
        .create_category(NewCommunityCategory {
            id: "category_product".to_owned(),
            tenant_id: "100001".to_owned(),
            slug: "product".to_owned(),
            title: "Product".to_owned(),
            description: Some("Product discussions".to_owned()),
            priority: 1,
            enabled: true,
            now: "2026-06-06T00:00:00Z".to_owned(),
        })
        .await
        .expect("create category");

    store
        .create_entry(NewCommunityEntry {
            id: "entry_sdk".to_owned(),
            tenant_id: "100001".to_owned(),
            category_id: "category_product".to_owned(),
            author_id: "user_1".to_owned(),
            author_name: "Sdkwork Team".to_owned(),
            slug: "community-sdk-release".to_owned(),
            kind: "announcement".to_owned(),
            title: "Community SDK release".to_owned(),
            excerpt: "Generated community SDKs are ready.".to_owned(),
            body_markdown: "Community SDK body".to_owned(),
            tags: vec!["release".to_owned(), "sdk".to_owned()],
            now: "2026-06-06T00:01:00Z".to_owned(),
        })
        .await
        .expect("create entry");

    let approved_feed = CommunityFeedQuery {
        approved_only: true,
        ..CommunityFeedQuery::default()
    };
    assert!(store
        .list_feed("100001", &approved_feed)
        .await
        .expect("draft feed")
        .is_empty());

    store
        .update_moderation(
            "100001",
            "entry_sdk",
            "moderator_1",
            &CommunityModerationPatch {
                review_state: "approved".to_owned(),
                reason: None,
            },
        )
        .await
        .expect("approve entry");

    let feed = store
        .list_feed(
            "100001",
            &CommunityFeedQuery {
                category_id: Some("category_product".to_owned()),
                q: Some("sdk".to_owned()),
                approved_only: true,
                ..CommunityFeedQuery::default()
            },
        )
        .await
        .expect("feed list");
    assert_eq!(feed.len(), 1);
    assert_eq!(feed[0].slug, "community-sdk-release");
    assert_eq!(feed[0].tags, vec!["release", "sdk"]);
    assert_eq!(
        store
            .retrieve_entry_by_slug("100001", "community-sdk-release")
            .await
            .expect("retrieve by slug")
            .expect("approved entry")
            .body_markdown,
        "Community SDK body",
    );
}

#[tokio::test]
async fn community_sqlx_store_sets_and_unsets_reactions() {
    use sdkwork_community_storage_sqlx::SetCommunityReaction;

    let store = sqlite_memory_store().await;

    store
        .create_category(NewCommunityCategory {
            id: "category_product".to_owned(),
            tenant_id: "100001".to_owned(),
            slug: "product".to_owned(),
            title: "Product".to_owned(),
            description: None,
            priority: 1,
            enabled: true,
            now: "2026-06-06T00:00:00Z".to_owned(),
        })
        .await
        .expect("create category");

    store
        .create_entry(NewCommunityEntry {
            id: "entry_reaction".to_owned(),
            tenant_id: "100001".to_owned(),
            category_id: "category_product".to_owned(),
            author_id: "user_1".to_owned(),
            author_name: "User One".to_owned(),
            slug: "reaction-entry".to_owned(),
            kind: "discussion".to_owned(),
            title: "Reaction entry".to_owned(),
            excerpt: "Reaction excerpt".to_owned(),
            body_markdown: "Reaction body".to_owned(),
            tags: vec![],
            now: "2026-06-06T00:02:00Z".to_owned(),
        })
        .await
        .expect("create entry");

    let liked = store
        .set_reaction(SetCommunityReaction {
            id: "reaction_1".to_owned(),
            tenant_id: "100001".to_owned(),
            entry_id: "entry_reaction".to_owned(),
            user_id: "user_2".to_owned(),
            reaction_type: "like".to_owned(),
            active: true,
            now: "2026-06-06T00:03:00Z".to_owned(),
        })
        .await
        .expect("set reaction");
    assert_eq!(liked, 1);

    let duplicate = store
        .set_reaction(SetCommunityReaction {
            id: "reaction_2".to_owned(),
            tenant_id: "100001".to_owned(),
            entry_id: "entry_reaction".to_owned(),
            user_id: "user_2".to_owned(),
            reaction_type: "like".to_owned(),
            active: true,
            now: "2026-06-06T00:04:00Z".to_owned(),
        })
        .await
        .expect("duplicate reaction");
    assert_eq!(duplicate, 1);

    let unliked = store
        .set_reaction(SetCommunityReaction {
            id: "reaction_3".to_owned(),
            tenant_id: "100001".to_owned(),
            entry_id: "entry_reaction".to_owned(),
            user_id: "user_2".to_owned(),
            reaction_type: "like".to_owned(),
            active: false,
            now: "2026-06-06T00:05:00Z".to_owned(),
        })
        .await
        .expect("unset reaction");
    assert_eq!(unliked, 0);
}
