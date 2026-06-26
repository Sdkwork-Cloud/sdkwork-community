use sdkwork_community_storage_sqlx::{
    community_database_tables, community_migration_names, community_storage_capability_manifest,
    NewCommunityCategory, NewCommunityEntry, SqliteCommunityStore,
};
use sqlx::sqlite::SqlitePoolOptions;

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
    assert_eq!(manifest.migration_plan[0].name, "0001_community_foundation.sql");
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
async fn sqlite_community_store_migrates_creates_publishes_and_reads_feed() {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("sqlite pool");
    let store = SqliteCommunityStore::new(pool);
    store.migrate().await.expect("community migration");

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

    assert!(store
        .list_feed("100001", None, None)
        .await
        .expect("draft feed")
        .is_empty());

    store
        .approve_entry("100001", "entry_sdk", "moderator_1", "2026-06-06T00:02:00Z")
        .await
        .expect("approve entry");

    let feed = store
        .list_feed("100001", Some("category_product"), Some("sdk"))
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
