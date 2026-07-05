use sqlx::{Row, SqlitePool};

use super::{
    CommunityCategoryPatch, CommunityEntryPatch, CommunityFeedQuery, CommunityModerationPatch,
    CommunityStoredCategory, CommunityStoredComment, CommunityStoredEntry, NewCommunityCategory,
    NewCommunityComment, NewCommunityEntry,
};

pub async fn list_categories(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<Vec<CommunityStoredCategory>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, tenant_id, slug, title, description, priority, enabled
        FROM community_category
        WHERE tenant_id = ? AND enabled = TRUE
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
    pool: &SqlitePool,
    input: NewCommunityCategory,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO community_category
            (id, tenant_id, slug, title, description, priority, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    pool: &SqlitePool,
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
        SET slug = ?, title = ?, description = ?, priority = ?, enabled = ?, updated_at = ?
        WHERE tenant_id = ? AND id = ?
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
    pool: &SqlitePool,
    tenant_id: &str,
    category_id: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM community_category WHERE tenant_id = ? AND id = ?")
        .bind(tenant_id)
        .bind(category_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn create_entry(pool: &SqlitePool, input: NewCommunityEntry) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
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
    upsert_entry_tags(&mut tx, &input).await?;
    tx.commit().await
}

pub async fn update_entry(
    pool: &SqlitePool,
    tenant_id: &str,
    entry_id: &str,
    patch: &CommunityEntryPatch,
) -> Result<(), sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339();
    if let Some(entry) = retrieve_entry_by_id(pool, tenant_id, entry_id, false).await? {
        sqlx::query(
            r#"
            UPDATE community_entry
            SET category_id = ?, kind = ?, title = ?, excerpt = ?, updated_at = ?
            WHERE tenant_id = ? AND id = ?
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
                "UPDATE community_entry_body SET body_markdown = ?, updated_at = ? WHERE entry_id = ?",
            )
            .bind(body)
            .bind(&now)
            .bind(entry_id)
            .execute(pool)
            .await?;
        }
        if let Some(tags) = &patch.tags {
            let mut tx = pool.begin().await?;
            sqlx::query("DELETE FROM community_entry_tag WHERE entry_id = ?")
                .bind(entry_id)
                .execute(&mut *tx)
                .await?;
            let input = NewCommunityEntry {
                id: entry_id.to_owned(),
                tenant_id: tenant_id.to_owned(),
                category_id: entry.category_id,
                author_id: entry.author_id,
                author_name: entry.author_name,
                slug: entry.slug,
                kind: entry.kind,
                title: entry.title,
                excerpt: entry.excerpt,
                body_markdown: body_or_empty(patch.body.as_ref()),
                tags: tags.clone(),
                now: now.clone(),
            };
            upsert_entry_tags(&mut tx, &input).await?;
            tx.commit().await?;
        }
    }
    Ok(())
}

pub async fn list_feed(
    pool: &SqlitePool,
    tenant_id: &str,
    query: &CommunityFeedQuery,
) -> Result<Vec<CommunityStoredEntry>, sqlx::Error> {
    let review_state = if query.approved_only {
        Some("approved".to_owned())
    } else {
        query.review_state.clone()
    };
    let rows = sqlx::query(
        r#"
        SELECT e.id, e.tenant_id, e.category_id, e.author_id, e.author_name, e.slug, e.kind,
               e.title, e.excerpt, b.body_markdown, e.review_state, e.is_featured, e.is_pinned,
               e.has_accepted_answer, e.comment_count, e.reaction_count, e.share_count,
               e.view_count, e.published_at, e.last_activity_at, e.updated_at
        FROM community_entry e
        JOIN community_entry_body b ON b.entry_id = e.id
        WHERE e.tenant_id = ?
          AND (? IS NULL OR e.review_state = ?)
          AND (? IS NULL OR e.category_id = ?)
          AND (? IS NULL OR e.kind = ?)
        ORDER BY e.is_pinned DESC, e.last_activity_at DESC, e.published_at DESC, e.slug ASC
        "#,
    )
    .bind(tenant_id)
    .bind(review_state.as_deref())
    .bind(review_state.as_deref())
    .bind(query.category_id.as_deref())
    .bind(query.category_id.as_deref())
    .bind(query.kind.as_deref())
    .bind(query.kind.as_deref())
    .fetch_all(pool)
    .await?;
    filter_entries(pool, rows, query).await
}

pub async fn retrieve_entry_by_id(
    pool: &SqlitePool,
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
        WHERE e.tenant_id = ? AND e.id = ?
          AND (? = 0 OR e.review_state = 'approved')
        LIMIT 1
        "#,
    )
    .bind(tenant_id)
    .bind(entry_id)
    .bind(if approved_only { 1 } else { 0 })
    .fetch_optional(pool)
    .await?;
    match row {
        Some(row) => entry_from_row(pool, row).await.map(Some),
        None => Ok(None),
    }
}

pub async fn retrieve_entry_by_slug(
    pool: &SqlitePool,
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
        WHERE e.tenant_id = ? AND e.slug = ? AND e.review_state = 'approved'
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
    pool: &SqlitePool,
    tenant_id: &str,
    entry_id: &str,
) -> Result<Vec<CommunityStoredComment>, sqlx::Error> {
    let rows = sqlx::query(
        r#"
        SELECT id, tenant_id, entry_id, author_id, author_name, body_markdown, review_state,
               is_accepted_answer, created_at, updated_at
        FROM community_comment
        WHERE tenant_id = ? AND entry_id = ?
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

pub async fn create_comment(
    pool: &SqlitePool,
    input: NewCommunityComment,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO community_comment
            (id, tenant_id, entry_id, author_id, author_name, body_markdown, review_state,
             is_accepted_answer, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'approved', FALSE, ?, ?)
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
        "UPDATE community_entry SET comment_count = comment_count + 1, updated_at = ? WHERE id = ?",
    )
    .bind(&input.now)
    .bind(&input.entry_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_moderation(
    pool: &SqlitePool,
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
        SET review_state = ?,
            published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, ?) ELSE published_at END,
            last_activity_at = ?, updated_at = ?
        WHERE tenant_id = ? AND id = ?
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
        VALUES (?, ?, ?, 'moderate', ?, ?, ?, ?, ?)
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
    pool: &SqlitePool,
    tenant_id: &str,
    entry_id: &str,
    featured: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE community_entry SET is_featured = ?, updated_at = ? WHERE tenant_id = ? AND id = ?",
    )
    .bind(featured)
    .bind(chrono::Utc::now().to_rfc3339())
    .bind(tenant_id)
    .bind(entry_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_pinned(
    pool: &SqlitePool,
    tenant_id: &str,
    entry_id: &str,
    pinned: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE community_entry SET is_pinned = ?, updated_at = ? WHERE tenant_id = ? AND id = ?",
    )
    .bind(pinned)
    .bind(chrono::Utc::now().to_rfc3339())
    .bind(tenant_id)
    .bind(entry_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_reaction(
    pool: &SqlitePool,
    input: &super::SetCommunityReaction,
) -> Result<i64, sqlx::Error> {
    if input.active {
        let inserted = sqlx::query(
            r#"
            INSERT OR IGNORE INTO community_reaction
                (id, tenant_id, entry_id, user_id, reaction_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
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
                    last_activity_at = ?,
                    updated_at = ?
                WHERE tenant_id = ? AND id = ?
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
            WHERE tenant_id = ? AND entry_id = ? AND user_id = ? AND reaction_type = ?
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
                SET reaction_count = CASE WHEN reaction_count > 0 THEN reaction_count - 1 ELSE 0 END,
                    last_activity_at = ?,
                    updated_at = ?
                WHERE tenant_id = ? AND id = ?
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

    let row = sqlx::query(
        "SELECT reaction_count FROM community_entry WHERE tenant_id = ? AND id = ?",
    )
    .bind(&input.tenant_id)
    .bind(&input.entry_id)
    .fetch_one(pool)
    .await?;
    Ok(integer_cell(&row, "reaction_count"))
}

pub async fn delete_entry(
    pool: &SqlitePool,
    tenant_id: &str,
    entry_id: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM community_entry WHERE tenant_id = ? AND id = ?")
        .bind(tenant_id)
        .bind(entry_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn list_moderation_queue(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<Vec<CommunityStoredEntry>, sqlx::Error> {
    let query = CommunityFeedQuery {
        review_state: Some("pending-review".to_owned()),
        approved_only: false,
        ..CommunityFeedQuery::default()
    };
    list_feed(pool, tenant_id, &query).await
}

pub async fn rebuild_recommendations(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<i64, sqlx::Error> {
    let entries = list_feed(
        pool,
        tenant_id,
        &CommunityFeedQuery {
            approved_only: true,
            ..CommunityFeedQuery::default()
        },
    )
    .await?;
    let now = chrono::Utc::now().to_rfc3339();
    let mut count = 0_i64;
    for entry in entries {
        sqlx::query(
            r#"
            INSERT INTO community_recommendation_snapshot
                (id, tenant_id, source_entry_id, target_entry_id, score, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
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
    Ok(count)
}

async fn filter_entries(
    pool: &SqlitePool,
    rows: Vec<sqlx::sqlite::SqliteRow>,
    query: &CommunityFeedQuery,
) -> Result<Vec<CommunityStoredEntry>, sqlx::Error> {
    let mut entries = Vec::with_capacity(rows.len());
    for row in rows {
        let entry = entry_from_row(pool, row).await?;
        if let Some(query_text) = &query.q {
            let normalized = query_text.trim().to_ascii_lowercase();
            if !normalized.is_empty()
                && !entry.title.to_ascii_lowercase().contains(&normalized)
                && !entry.excerpt.to_ascii_lowercase().contains(&normalized)
                && !entry.tags.iter().any(|tag| tag.contains(&normalized))
            {
                continue;
            }
        }
        if let Some(tag) = &query.tag {
            if !entry.tags.iter().any(|value| value == tag) {
                continue;
            }
        }
        entries.push(entry);
    }
    let page = query.page.max(1);
    let page_size = query.page_size.clamp(1, 100);
    let start = ((page - 1) * page_size) as usize;
    Ok(entries.into_iter().skip(start).take(page_size as usize).collect())
}

async fn entry_from_row(
    pool: &SqlitePool,
    row: sqlx::sqlite::SqliteRow,
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

async fn entry_tags(pool: &SqlitePool, entry_id: &str) -> Result<Vec<String>, sqlx::Error> {
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
    .fetch_all(pool)
    .await?;
    Ok(rows.iter().map(|row| string_cell(row, "slug")).collect())
}

async fn upsert_entry_tags(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    input: &NewCommunityEntry,
) -> Result<(), sqlx::Error> {
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
        .execute(&mut **tx)
        .await?;
        sqlx::query(
            "INSERT OR IGNORE INTO community_entry_tag (entry_id, tag_id) VALUES (?, ?)",
        )
        .bind(&input.id)
        .bind(&tag_id)
        .execute(&mut **tx)
        .await?;
    }
    Ok(())
}

fn normalize_tag_slug(value: &str) -> String {
    sdkwork_utils_rust::slugify(value)
}

fn body_or_empty(value: Option<&String>) -> String {
    value.cloned().unwrap_or_default()
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
