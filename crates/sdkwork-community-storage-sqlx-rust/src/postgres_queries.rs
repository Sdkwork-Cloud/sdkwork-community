//! PostgreSQL query implementations for Community authoritative persistence.

use sqlx::{PgPool, Row};

use super::{
    CommunityCategoryPatch, CommunityEntryPatch, CommunityFeedQuery, CommunityModerationPatch,
    CommunityStoredCategory, CommunityStoredComment, CommunityStoredEntry,
    CommunityStoredEntryPage, NewCommunityCategory, NewCommunityComment, NewCommunityEntry,
};

pub async fn list_categories(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<Vec<CommunityStoredCategory>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, tenant_id, slug, title, description, priority, enabled
        FROM community_category
        WHERE tenant_id = $1 AND enabled = TRUE
        ORDER BY priority DESC, slug ASC
        "#,
    )
    .bind(tenant_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .iter()
        .map(|row| CommunityStoredCategory {
            id: string_cell(row, "id"),
            tenant_id: string_cell(row, "tenant_id"),
            slug: string_cell(row, "slug"),
            title: string_cell(row, "title"),
            description: optional_string_cell(row, "description"),
            priority: integer_cell(row, "priority"),
            enabled: bool_cell(row, "enabled"),
        })
        .collect())
}

pub async fn create_category(
    pool: &PgPool,
    input: NewCommunityCategory,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO community_category
            (id, tenant_id, slug, title, description, priority, enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_category(
    pool: &PgPool,
    tenant_id: &str,
    category_id: &str,
    patch: &CommunityCategoryPatch,
) -> Result<(), sqlx::Error> {
    let existing = list_categories(pool, tenant_id).await?;
    let Some(existing) = existing.into_iter().find(|item| item.id == category_id) else {
        return Ok(());
    };
    sqlx::query(
        r#"
        UPDATE community_category
        SET slug = $1, title = $2, description = $3, priority = $4, enabled = $5, updated_at = $6
        WHERE tenant_id = $7 AND id = $8
        "#,
    )
    .bind(patch.slug.as_ref().unwrap_or(&existing.slug))
    .bind(patch.title.as_ref().unwrap_or(&existing.title))
    .bind(patch.description.as_ref().or(existing.description.as_ref()))
    .bind(patch.priority.unwrap_or(existing.priority))
    .bind(patch.enabled.unwrap_or(existing.enabled))
    .bind(chrono::Utc::now().to_rfc3339())
    .bind(tenant_id)
    .bind(category_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_category(
    pool: &PgPool,
    tenant_id: &str,
    category_id: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM community_category WHERE tenant_id = $1 AND id = $2")
        .bind(tenant_id)
        .bind(category_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn create_entry(pool: &PgPool, input: NewCommunityEntry) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query(
        r#"
        INSERT INTO community_entry
            (id, tenant_id, category_id, author_id, author_name, slug, kind, title, excerpt,
             review_state, is_featured, is_pinned, has_accepted_answer, comment_count,
             reaction_count, share_count, view_count, published_at, last_activity_at, created_at, updated_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', FALSE, FALSE, FALSE, 0, 0, 0, 0, NULL, $10, $11, $12)
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
        VALUES ($1, $2, 'markdown', NULL, $3)
        "#,
    )
    .bind(&input.id)
    .bind(&input.body_markdown)
    .bind(&input.now)
    .execute(&mut *tx)
    .await?;
    upsert_entry_tags(&mut tx, &input).await?;
    tx.commit().await
}

pub async fn update_entry(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
    patch: &CommunityEntryPatch,
) -> Result<(), sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339();
    if let Some(entry) = retrieve_entry_by_id(pool, tenant_id, entry_id, false).await? {
        sqlx::query(
            r#"
            UPDATE community_entry
            SET category_id = $1, kind = $2, title = $3, excerpt = $4, updated_at = $5
            WHERE tenant_id = $6 AND id = $7
            "#,
        )
        .bind(patch.category_id.as_ref().unwrap_or(&entry.category_id))
        .bind(patch.kind.as_ref().unwrap_or(&entry.kind))
        .bind(patch.title.as_ref().unwrap_or(&entry.title))
        .bind(patch.excerpt.as_ref().unwrap_or(&entry.excerpt))
        .bind(&now)
        .bind(tenant_id)
        .bind(entry_id)
        .execute(pool)
        .await?;
        if let Some(body) = &patch.body {
            sqlx::query(
                "UPDATE community_entry_body SET body_markdown = $1, updated_at = $2 WHERE entry_id = $3",
            )
            .bind(body)
            .bind(&now)
            .bind(entry_id)
            .execute(pool)
            .await?;
        }
    }
    Ok(())
}

pub async fn list_feed(
    pool: &PgPool,
    tenant_id: &str,
    query: &CommunityFeedQuery,
) -> Result<CommunityStoredEntryPage, sqlx::Error> {
    let review_state = if query.approved_only {
        Some("approved".to_owned())
    } else {
        query.review_state.clone()
    };
    let q = query
        .q
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_ascii_lowercase);
    let tag = query
        .tag
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_ascii_lowercase);
    let page = query.page.max(1);
    let page_size = query.page_size.clamp(1, 200);
    let offset = (page - 1) * page_size;
    let count_row = sqlx::query(
        r#"
        SELECT COUNT(*) AS total_items
        FROM community_entry e
        JOIN community_entry_body b ON b.entry_id = e.id
        WHERE e.tenant_id = $1
          AND ($2::text IS NULL OR e.review_state = $2)
          AND ($3::text IS NULL OR e.category_id = $3)
          AND ($4::text IS NULL OR e.kind = $4)
          AND (
            $5::text IS NULL
            OR POSITION($5 IN LOWER(e.title)) > 0
            OR POSITION($5 IN LOWER(COALESCE(e.excerpt, ''))) > 0
            OR EXISTS (
              SELECT 1
              FROM community_entry_tag et
              JOIN community_tag t ON t.id = et.tag_id
              WHERE et.entry_id = e.id
                AND t.tenant_id = e.tenant_id
                AND POSITION($5 IN LOWER(t.slug)) > 0
            )
          )
          AND (
            $6::text IS NULL
            OR EXISTS (
              SELECT 1
              FROM community_entry_tag et
              JOIN community_tag t ON t.id = et.tag_id
              WHERE et.entry_id = e.id
                AND t.tenant_id = e.tenant_id
                AND LOWER(t.slug) = $6
            )
          )
        "#,
    )
    .bind(tenant_id)
    .bind(review_state.as_deref())
    .bind(query.category_id.as_deref())
    .bind(query.kind.as_deref())
    .bind(q.as_deref())
    .bind(tag.as_deref())
    .fetch_one(pool)
    .await?;
    let total_items = integer_cell(&count_row, "total_items");
    let rows = sqlx::query(
        r#"
        SELECT e.id, e.tenant_id, e.category_id, e.author_id, e.author_name, e.slug, e.kind,
               e.title, e.excerpt, b.body_markdown, e.review_state, e.is_featured, e.is_pinned,
               e.has_accepted_answer, e.comment_count, e.reaction_count, e.share_count,
               e.view_count, e.published_at, e.last_activity_at, e.updated_at
        FROM community_entry e
        JOIN community_entry_body b ON b.entry_id = e.id
        WHERE e.tenant_id = $1
          AND ($2::text IS NULL OR e.review_state = $2)
          AND ($3::text IS NULL OR e.category_id = $3)
          AND ($4::text IS NULL OR e.kind = $4)
          AND (
            $5::text IS NULL
            OR POSITION($5 IN LOWER(e.title)) > 0
            OR POSITION($5 IN LOWER(COALESCE(e.excerpt, ''))) > 0
            OR EXISTS (
              SELECT 1
              FROM community_entry_tag et
              JOIN community_tag t ON t.id = et.tag_id
              WHERE et.entry_id = e.id
                AND t.tenant_id = e.tenant_id
                AND POSITION($5 IN LOWER(t.slug)) > 0
            )
          )
          AND (
            $6::text IS NULL
            OR EXISTS (
              SELECT 1
              FROM community_entry_tag et
              JOIN community_tag t ON t.id = et.tag_id
              WHERE et.entry_id = e.id
                AND t.tenant_id = e.tenant_id
                AND LOWER(t.slug) = $6
            )
          )
        ORDER BY e.is_pinned DESC, e.last_activity_at DESC, e.published_at DESC, e.slug ASC
        LIMIT $7 OFFSET $8
        "#,
    )
    .bind(tenant_id)
    .bind(review_state.as_deref())
    .bind(query.category_id.as_deref())
    .bind(query.kind.as_deref())
    .bind(q.as_deref())
    .bind(tag.as_deref())
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    let mut items = Vec::with_capacity(rows.len());
    for row in rows {
        items.push(entry_from_row(pool, row).await?);
    }
    Ok(CommunityStoredEntryPage {
        items,
        page,
        page_size,
        total_items,
    })
}

pub async fn retrieve_entry_by_id(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
    approved_only: bool,
) -> Result<Option<CommunityStoredEntry>, sqlx::Error> {
    let row = sqlx::query(
        r#"
        SELECT e.id, e.tenant_id, e.category_id, e.author_id, e.author_name, e.slug, e.kind,
               e.title, e.excerpt, b.body_markdown, e.review_state, e.is_featured, e.is_pinned,
               e.has_accepted_answer, e.comment_count, e.reaction_count, e.share_count,
               e.view_count, e.published_at, e.last_activity_at, e.updated_at
        FROM community_entry e
        JOIN community_entry_body b ON b.entry_id = e.id
        WHERE e.tenant_id = $1 AND e.id = $2
          AND ($3 = FALSE OR e.review_state = 'approved')
        LIMIT 1
        "#,
    )
    .bind(tenant_id)
    .bind(entry_id)
    .bind(approved_only)
    .fetch_optional(pool)
    .await?;
    match row {
        Some(row) => entry_from_row(pool, row).await.map(Some),
        None => Ok(None),
    }
}

pub async fn retrieve_entry_by_slug(
    pool: &PgPool,
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
        WHERE e.tenant_id = $1 AND e.slug = $2 AND e.review_state = 'approved'
        LIMIT 1
        "#,
    )
    .bind(tenant_id)
    .bind(slug)
    .fetch_optional(pool)
    .await?;
    match row {
        Some(row) => entry_from_row(pool, row).await.map(Some),
        None => Ok(None),
    }
}

pub async fn list_comments(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
) -> Result<Vec<CommunityStoredComment>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, tenant_id, entry_id, author_id, author_name, body_markdown, review_state,
               is_accepted_answer, created_at, updated_at
        FROM community_comment
        WHERE tenant_id = $1 AND entry_id = $2
        ORDER BY created_at ASC
        "#,
    )
    .bind(tenant_id)
    .bind(entry_id)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .iter()
        .map(|row| CommunityStoredComment {
            id: string_cell(row, "id"),
            tenant_id: string_cell(row, "tenant_id"),
            entry_id: string_cell(row, "entry_id"),
            author_id: string_cell(row, "author_id"),
            author_name: string_cell(row, "author_name"),
            body_markdown: string_cell(row, "body_markdown"),
            review_state: string_cell(row, "review_state"),
            is_accepted_answer: bool_cell(row, "is_accepted_answer"),
            created_at: string_cell(row, "created_at"),
            updated_at: optional_string_cell(row, "updated_at"),
        })
        .collect())
}

pub async fn create_comment(pool: &PgPool, input: NewCommunityComment) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO community_comment
            (id, tenant_id, entry_id, author_id, author_name, body_markdown, review_state,
             is_accepted_answer, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'approved', FALSE, $7, $8)
        "#,
    )
    .bind(&input.id)
    .bind(&input.tenant_id)
    .bind(&input.entry_id)
    .bind(&input.author_id)
    .bind(&input.author_name)
    .bind(&input.body_markdown)
    .bind(&input.now)
    .bind(&input.now)
    .execute(pool)
    .await?;
    sqlx::query(
        "UPDATE community_entry SET comment_count = comment_count + 1, updated_at = $1 WHERE id = $2",
    )
    .bind(&input.now)
    .bind(&input.entry_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_moderation(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
    actor_user_id: &str,
    patch: &CommunityModerationPatch,
) -> Result<(), sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339();
    let before = retrieve_entry_by_id(pool, tenant_id, entry_id, false)
        .await?
        .map(|entry| entry.review_state)
        .unwrap_or_else(|| "draft".to_owned());
    sqlx::query(
        r#"
        UPDATE community_entry
        SET review_state = $1,
            published_at = CASE WHEN $2 = 'approved' THEN COALESCE(published_at, $3) ELSE published_at END,
            last_activity_at = $4, updated_at = $5
        WHERE tenant_id = $6 AND id = $7
        "#,
    )
    .bind(&patch.review_state)
    .bind(&patch.review_state)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .bind(tenant_id)
    .bind(entry_id)
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO community_moderation_event
            (id, tenant_id, entry_id, action, actor_user_id, reason, before_state, after_state, created_at)
        VALUES ($1, $2, $3, 'moderate', $4, $5, $6, $7, $8)
        "#,
    )
    .bind(format!("moderation_{tenant_id}_{entry_id}_{now}"))
    .bind(tenant_id)
    .bind(entry_id)
    .bind(actor_user_id)
    .bind(&patch.reason)
    .bind(before)
    .bind(&patch.review_state)
    .bind(&now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_featured(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
    featured: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE community_entry SET is_featured = $1, updated_at = $2 WHERE tenant_id = $3 AND id = $4")
        .bind(featured)
        .bind(chrono::Utc::now().to_rfc3339())
        .bind(tenant_id)
        .bind(entry_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_pinned(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
    pinned: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE community_entry SET is_pinned = $1, updated_at = $2 WHERE tenant_id = $3 AND id = $4")
        .bind(pinned)
        .bind(chrono::Utc::now().to_rfc3339())
        .bind(tenant_id)
        .bind(entry_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_reaction(
    pool: &PgPool,
    input: &super::SetCommunityReaction,
) -> Result<i64, sqlx::Error> {
    if input.active {
        let inserted = sqlx::query(
            r#"
            INSERT INTO community_reaction
                (id, tenant_id, entry_id, user_id, reaction_type, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tenant_id, entry_id, user_id, reaction_type) DO NOTHING
            "#,
        )
        .bind(&input.id)
        .bind(&input.tenant_id)
        .bind(&input.entry_id)
        .bind(&input.user_id)
        .bind(&input.reaction_type)
        .bind(&input.now)
        .execute(pool)
        .await?;
        if inserted.rows_affected() > 0 {
            sqlx::query(
                r#"
                UPDATE community_entry
                SET reaction_count = reaction_count + 1,
                    last_activity_at = $1,
                    updated_at = $2
                WHERE tenant_id = $3 AND id = $4
                "#,
            )
            .bind(&input.now)
            .bind(&input.now)
            .bind(&input.tenant_id)
            .bind(&input.entry_id)
            .execute(pool)
            .await?;
        }
    } else {
        let deleted = sqlx::query(
            r#"
            DELETE FROM community_reaction
            WHERE tenant_id = $1 AND entry_id = $2 AND user_id = $3 AND reaction_type = $4
            "#,
        )
        .bind(&input.tenant_id)
        .bind(&input.entry_id)
        .bind(&input.user_id)
        .bind(&input.reaction_type)
        .execute(pool)
        .await?;
        if deleted.rows_affected() > 0 {
            sqlx::query(
                r#"
                UPDATE community_entry
                SET reaction_count = GREATEST(reaction_count - 1, 0),
                    last_activity_at = $1,
                    updated_at = $2
                WHERE tenant_id = $3 AND id = $4
                "#,
            )
            .bind(&input.now)
            .bind(&input.now)
            .bind(&input.tenant_id)
            .bind(&input.entry_id)
            .execute(pool)
            .await?;
        }
    }

    let row =
        sqlx::query("SELECT reaction_count FROM community_entry WHERE tenant_id = $1 AND id = $2")
            .bind(&input.tenant_id)
            .bind(&input.entry_id)
            .fetch_one(pool)
            .await?;
    Ok(integer_cell(&row, "reaction_count"))
}

pub async fn delete_entry(
    pool: &PgPool,
    tenant_id: &str,
    entry_id: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM community_entry WHERE tenant_id = $1 AND id = $2")
        .bind(tenant_id)
        .bind(entry_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn list_moderation_queue(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<Vec<CommunityStoredEntry>, sqlx::Error> {
    list_feed(
        pool,
        tenant_id,
        &CommunityFeedQuery {
            review_state: Some("pending-review".to_owned()),
            page: 1,
            page_size: 200,
            approved_only: false,
            ..CommunityFeedQuery::default()
        },
    )
    .await
    .map(|page| page.items)
}

pub async fn rebuild_recommendations(pool: &PgPool, tenant_id: &str) -> Result<i64, sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0_i64;
    let page_size = 200_i64;
    let mut page = 1_i64;
    loop {
        let result = list_feed(
            pool,
            tenant_id,
            &CommunityFeedQuery {
                page,
                page_size,
                approved_only: true,
                ..CommunityFeedQuery::default()
            },
        )
        .await?;
        let total_items = result.total_items;
        if result.items.is_empty() {
            break;
        }
        for entry in result.items {
            sqlx::query(
                r#"
                INSERT INTO community_recommendation_snapshot
                    (id, tenant_id, source_entry_id, target_entry_id, score, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET score = excluded.score, created_at = excluded.created_at
                "#,
            )
            .bind(format!("rec_{}_{}", entry.id, tenant_id))
            .bind(tenant_id)
            .bind(&entry.id)
            .bind(&entry.id)
            .bind(1_i64)
            .bind(&now)
            .execute(pool)
            .await?;
            count += 1;
        }
        if page * page_size >= total_items {
            break;
        }
        page += 1;
    }
    Ok(count)
}

async fn entry_from_row(
    pool: &PgPool,
    row: sqlx::postgres::PgRow,
) -> Result<CommunityStoredEntry, sqlx::Error> {
    let entry_id = string_cell(&row, "id");
    let tags = entry_tags(pool, &entry_id).await?;
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

async fn entry_tags(pool: &PgPool, entry_id: &str) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT t.slug
        FROM community_entry_tag et
        JOIN community_tag t ON t.id = et.tag_id
        WHERE et.entry_id = $1
        ORDER BY t.slug ASC
        "#,
    )
    .bind(entry_id)
    .fetch_all(pool)
    .await?;
    Ok(rows.iter().map(|row| string_cell(row, "slug")).collect())
}

async fn upsert_entry_tags(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    input: &NewCommunityEntry,
) -> Result<(), sqlx::Error> {
    let mut tags = input
        .tags
        .iter()
        .map(|tag| sdkwork_utils_rust::slugify(tag))
        .filter(|tag| !tag.is_empty())
        .collect::<Vec<_>>();
    tags.sort();
    tags.dedup();
    for tag in tags {
        let tag_id = format!("tag_{}_{}", input.tenant_id, tag);
        sqlx::query(
            r#"
            INSERT INTO community_tag (id, tenant_id, slug, title, created_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (tenant_id, slug) DO UPDATE SET title = excluded.title
            "#,
        )
        .bind(&tag_id)
        .bind(&input.tenant_id)
        .bind(&tag)
        .bind(&tag)
        .bind(&input.now)
        .execute(&mut **tx)
        .await?;
        sqlx::query(
            "INSERT INTO community_entry_tag (entry_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(&input.id)
        .bind(&tag_id)
        .execute(&mut **tx)
        .await?;
    }
    Ok(())
}

fn optional_string_cell(row: &sqlx::postgres::PgRow, column: &str) -> Option<String> {
    row.try_get::<Option<String>, _>(column).ok().flatten()
}

fn string_cell(row: &sqlx::postgres::PgRow, column: &str) -> String {
    optional_string_cell(row, column).unwrap_or_default()
}

fn integer_cell(row: &sqlx::postgres::PgRow, column: &str) -> i64 {
    row.try_get::<i64, _>(column)
        .or_else(|_| row.try_get::<i32, _>(column).map(i64::from))
        .unwrap_or(0)
}

fn bool_cell(row: &sqlx::postgres::PgRow, column: &str) -> bool {
    row.try_get::<bool, _>(column)
        .or_else(|_| row.try_get::<i64, _>(column).map(|value| value != 0))
        .unwrap_or(false)
}
