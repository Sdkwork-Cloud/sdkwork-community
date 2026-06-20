mod bootstrap;

pub use bootstrap::{
    bootstrap_community_database, bootstrap_community_database_from_env,
    connect_and_bootstrap_community_database_from_env, connect_community_database_pool_from_env,
    CommunityDatabaseHost, CommunityDatabasePool,
};

use sqlx::{Row, SqlitePool};

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

#[derive(Clone, Debug)]
pub struct SqliteCommunityStore {
    pool: SqlitePool,
}

impl SqliteCommunityStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        sqlx::raw_sql(community_initial_migration_sql())
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn create_category(&self, input: NewCommunityCategory) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO community_category
                (id, tenant_id, slug, title, description, priority, enabled, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(input.id)
        .bind(input.tenant_id)
        .bind(input.slug)
        .bind(input.title)
        .bind(input.description)
        .bind(input.priority)
        .bind(input.enabled)
        .bind(&input.now)
        .bind(&input.now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn create_entry(&self, input: NewCommunityEntry) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;
        sqlx::query(
            r#"
            INSERT INTO community_entry
                (id, tenant_id, category_id, author_id, author_name, slug, kind, title, excerpt,
                 review_state, is_featured, is_pinned, has_accepted_answer, comment_count,
                 reaction_count, share_count, view_count, published_at, last_activity_at, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', FALSE, FALSE, FALSE, 0, 0, 0, 0, NULL, ?, ?, ?)
            "#,
        )
        .bind(&input.id)
        .bind(&input.tenant_id)
        .bind(&input.category_id)
        .bind(&input.author_id)
        .bind(&input.author_name)
        .bind(&input.slug)
        .bind(&input.kind)
        .bind(&input.title)
        .bind(&input.excerpt)
        .bind(&input.now)
        .bind(&input.now)
        .bind(&input.now)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO community_entry_body (entry_id, body_markdown, body_format, content_checksum, updated_at)
            VALUES (?, ?, 'markdown', NULL, ?)
            "#,
        )
        .bind(&input.id)
        .bind(&input.body_markdown)
        .bind(&input.now)
        .execute(&mut *tx)
        .await?;

        let mut tags = input
            .tags
            .iter()
            .map(|tag| normalize_tag_slug(tag))
            .filter(|tag| !tag.is_empty())
            .collect::<Vec<_>>();
        tags.sort();
        tags.dedup();

        for tag in tags {
            let tag_id = format!("tag_{}_{}", input.tenant_id, tag);
            sqlx::query(
                r#"
                INSERT INTO community_tag (id, tenant_id, slug, title, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (tenant_id, slug) DO UPDATE SET title = excluded.title
                "#,
            )
            .bind(&tag_id)
            .bind(&input.tenant_id)
            .bind(&tag)
            .bind(&tag)
            .bind(&input.now)
            .execute(&mut *tx)
            .await?;

            sqlx::query(
                r#"
                INSERT OR IGNORE INTO community_entry_tag (entry_id, tag_id)
                VALUES (?, ?)
                "#,
            )
            .bind(&input.id)
            .bind(&tag_id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    pub async fn approve_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
        actor_user_id: &str,
        now: &str,
    ) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;
        sqlx::query(
            r#"
            UPDATE community_entry
            SET review_state = 'approved',
                published_at = COALESCE(published_at, ?),
                last_activity_at = ?,
                updated_at = ?
            WHERE tenant_id = ? AND id = ?
            "#,
        )
        .bind(now)
        .bind(now)
        .bind(now)
        .bind(tenant_id)
        .bind(entry_id)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO community_moderation_event
                (id, tenant_id, entry_id, action, actor_user_id, reason, before_state, after_state, created_at)
            VALUES
                (?, ?, ?, 'approve', ?, NULL, 'draft', 'approved', ?)
            "#,
        )
        .bind(format!("moderation_{tenant_id}_{entry_id}_{now}"))
        .bind(tenant_id)
        .bind(entry_id)
        .bind(actor_user_id)
        .bind(now)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn list_feed(
        &self,
        tenant_id: &str,
        category_id: Option<&str>,
        q: Option<&str>,
    ) -> Result<Vec<CommunityStoredEntry>, sqlx::Error> {
        let rows = sqlx::query(
            r#"
            SELECT e.id, e.tenant_id, e.category_id, e.author_id, e.author_name, e.slug, e.kind,
                   e.title, e.excerpt, b.body_markdown, e.review_state, e.is_featured, e.is_pinned,
                   e.has_accepted_answer, e.comment_count, e.reaction_count, e.share_count,
                   e.view_count, e.published_at, e.last_activity_at, e.updated_at
            FROM community_entry e
            JOIN community_entry_body b ON b.entry_id = e.id
            WHERE e.tenant_id = ?
              AND e.review_state = 'approved'
              AND (? IS NULL OR e.category_id = ?)
            ORDER BY e.is_pinned DESC, e.last_activity_at DESC, e.published_at DESC, e.slug ASC
            "#,
        )
        .bind(tenant_id)
        .bind(category_id)
        .bind(category_id)
        .fetch_all(&self.pool)
        .await?;

        let mut entries = Vec::with_capacity(rows.len());
        for row in rows {
            let mut entry = self.entry_from_row(row).await?;
            if let Some(query) = q {
                let normalized = query.trim().to_ascii_lowercase();
                if !normalized.is_empty()
                    && !entry.title.to_ascii_lowercase().contains(&normalized)
                    && !entry.excerpt.to_ascii_lowercase().contains(&normalized)
                    && !entry.tags.iter().any(|tag| tag.contains(&normalized))
                {
                    continue;
                }
            }
            entry.tags.sort();
            entries.push(entry);
        }
        Ok(entries)
    }

    pub async fn retrieve_entry_by_slug(
        &self,
        tenant_id: &str,
        slug: &str,
    ) -> Result<Option<CommunityStoredEntry>, sqlx::Error> {
        let row = sqlx::query(
            r#"
            SELECT e.id, e.tenant_id, e.category_id, e.author_id, e.author_name, e.slug, e.kind,
                   e.title, e.excerpt, b.body_markdown, e.review_state, e.is_featured, e.is_pinned,
                   e.has_accepted_answer, e.comment_count, e.reaction_count, e.share_count,
                   e.view_count, e.published_at, e.last_activity_at, e.updated_at
            FROM community_entry e
            JOIN community_entry_body b ON b.entry_id = e.id
            WHERE e.tenant_id = ?
              AND e.slug = ?
              AND e.review_state = 'approved'
            LIMIT 1
            "#,
        )
        .bind(tenant_id)
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => self.entry_from_row(row).await.map(Some),
            None => Ok(None),
        }
    }

    async fn entry_from_row(
        &self,
        row: sqlx::sqlite::SqliteRow,
    ) -> Result<CommunityStoredEntry, sqlx::Error> {
        let entry_id = string_cell(&row, "id");
        let tags = self.entry_tags(&entry_id).await?;
        Ok(CommunityStoredEntry {
            id: entry_id,
            tenant_id: string_cell(&row, "tenant_id"),
            category_id: string_cell(&row, "category_id"),
            author_id: string_cell(&row, "author_id"),
            author_name: string_cell(&row, "author_name"),
            slug: string_cell(&row, "slug"),
            kind: string_cell(&row, "kind"),
            title: string_cell(&row, "title"),
            excerpt: string_cell(&row, "excerpt"),
            body_markdown: string_cell(&row, "body_markdown"),
            review_state: string_cell(&row, "review_state"),
            is_featured: bool_cell(&row, "is_featured"),
            is_pinned: bool_cell(&row, "is_pinned"),
            has_accepted_answer: bool_cell(&row, "has_accepted_answer"),
            comment_count: integer_cell(&row, "comment_count"),
            reaction_count: integer_cell(&row, "reaction_count"),
            share_count: integer_cell(&row, "share_count"),
            view_count: integer_cell(&row, "view_count"),
            tags,
            published_at: optional_string_cell(&row, "published_at"),
            last_activity_at: optional_string_cell(&row, "last_activity_at"),
            updated_at: string_cell(&row, "updated_at"),
        })
    }

    async fn entry_tags(&self, entry_id: &str) -> Result<Vec<String>, sqlx::Error> {
        let rows = sqlx::query(
            r#"
            SELECT t.slug
            FROM community_entry_tag et
            JOIN community_tag t ON t.id = et.tag_id
            WHERE et.entry_id = ?
            ORDER BY t.slug ASC
            "#,
        )
        .bind(entry_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.iter().map(|row| string_cell(row, "slug")).collect())
    }
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
    vec!["0001_community_foundation.sql"]
}

pub fn community_initial_migration_sql() -> &'static str {
    include_str!("../migrations/0001_community_foundation.sql")
}

pub fn community_migration_plan() -> Vec<CommunityStorageMigration> {
    vec![migration(
        1,
        "0001_community_foundation.sql",
        "community",
        "migrations/0001_community_foundation.sql",
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

fn normalize_tag_slug(value: &str) -> String {
    value.trim().to_ascii_lowercase().replace(' ', "-")
}

fn optional_string_cell(row: &sqlx::sqlite::SqliteRow, column: &str) -> Option<String> {
    row.try_get::<Option<String>, _>(column).ok().flatten()
}

fn string_cell(row: &sqlx::sqlite::SqliteRow, column: &str) -> String {
    optional_string_cell(row, column).unwrap_or_default()
}

fn integer_cell(row: &sqlx::sqlite::SqliteRow, column: &str) -> i64 {
    row.try_get::<i64, _>(column)
        .or_else(|_| row.try_get::<i32, _>(column).map(i64::from))
        .unwrap_or(0)
}

fn bool_cell(row: &sqlx::sqlite::SqliteRow, column: &str) -> bool {
    row.try_get::<bool, _>(column)
        .or_else(|_| row.try_get::<i64, _>(column).map(|value| value != 0))
        .unwrap_or(false)
}
