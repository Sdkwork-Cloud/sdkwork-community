use std::sync::Arc;

use chrono::Utc;
use sdkwork_community_storage_sqlx::{
    CommunityFeedQuery, CommunitySqlxStore, CommunityStoredCategory, CommunityStoredComment,
    CommunityStoredEntry, NewCommunityCategory, NewCommunityComment, NewCommunityEntry,
    SetCommunityReaction,
};
use sdkwork_utils_rust::{slugify, uuid};

use crate::error::CommunityServiceError;

#[derive(Debug, Clone)]
pub struct CommunityCategoryView {
    pub id: String,
    pub tenant_id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: i64,
    pub enabled: bool,
}

#[derive(Debug, Clone)]
pub struct CommunityEntryView {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub category_label: Option<String>,
    pub author_id: String,
    pub author_name: String,
    pub slug: String,
    pub kind: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body: Option<String>,
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

#[derive(Debug, Clone)]
pub struct CommunityCommentView {
    pub id: String,
    pub tenant_id: String,
    pub entry_id: String,
    pub author_id: String,
    pub author_name: String,
    pub body: String,
    pub review_state: String,
    pub is_accepted_answer: bool,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityEntryCommand {
    pub category_id: String,
    pub kind: String,
    pub title: String,
    pub excerpt: Option<String>,
    pub body: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityCategoryCommand {
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<i64>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CommunityCommentCommand {
    pub body: String,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityReactionCommand {
    pub reaction_type: String,
    pub active: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityReactionSetAccepted {
    pub accepted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    pub reaction_count: i64,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityModerationCommand {
    pub review_state: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityPublicationReadinessView {
    pub ready: bool,
    pub degraded: bool,
    pub issues: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityCommandAccepted {
    pub accepted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

pub struct CommunityService {
    store: Arc<CommunitySqlxStore>,
}

impl CommunityService {
    pub fn new(store: Arc<CommunitySqlxStore>) -> Self {
        Self { store }
    }

    pub async fn list_categories(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<CommunityCategoryView>, CommunityServiceError> {
        self.store
            .list_categories(tenant_id)
            .await
            .map(|items| items.into_iter().map(map_category).collect())
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
    }

    pub async fn list_feed(
        &self,
        tenant_id: &str,
        query: CommunityFeedQuery,
    ) -> Result<Vec<CommunityEntryView>, CommunityServiceError> {
        self.store
            .list_feed(tenant_id, &query)
            .await
            .map(|items| items.into_iter().map(map_entry).collect())
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
    }

    pub async fn retrieve_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
        approved_only: bool,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        let entry = self
            .store
            .retrieve_entry_by_id(tenant_id, entry_id, approved_only)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?
            .ok_or_else(|| CommunityServiceError::NotFound(format!("entry {entry_id} not found")))?;
        Ok(map_entry(entry))
    }

    pub async fn retrieve_entry_by_slug(
        &self,
        tenant_id: &str,
        slug: &str,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        let entry = self
            .store
            .retrieve_entry_by_slug(tenant_id, slug)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?
            .ok_or_else(|| CommunityServiceError::NotFound(format!("entry slug {slug} not found")))?;
        Ok(map_entry(entry))
    }

    pub async fn create_entry(
        &self,
        tenant_id: &str,
        author_id: &str,
        author_name: &str,
        command: CommunityEntryCommand,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        validate_entry_command(&command)?;
        let now = Utc::now().to_rfc3339();
        let entry_id = uuid();
        let slug = slugify(&command.title);
        let input = NewCommunityEntry {
            id: entry_id.clone(),
            tenant_id: tenant_id.to_owned(),
            category_id: command.category_id,
            author_id: author_id.to_owned(),
            author_name: author_name.to_owned(),
            slug,
            kind: command.kind,
            title: command.title,
            excerpt: command.excerpt.unwrap_or_default(),
            body_markdown: command.body.unwrap_or_default(),
            tags: command.tags,
            now,
        };
        self.store
            .create_entry(input)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.retrieve_entry(tenant_id, &entry_id, false).await
    }

    pub async fn update_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
        command: CommunityEntryCommand,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        if command.title.trim().is_empty() && command.category_id.trim().is_empty() {
            return Err(CommunityServiceError::Validation(
                "at least one field is required".to_owned(),
            ));
        }
        self.store
            .update_entry(
                tenant_id,
                entry_id,
                &sdkwork_community_storage_sqlx::CommunityEntryPatch {
                    category_id: (!command.category_id.trim().is_empty())
                        .then_some(command.category_id),
                    kind: (!command.kind.trim().is_empty()).then_some(command.kind),
                    title: (!command.title.trim().is_empty()).then_some(command.title),
                    excerpt: command.excerpt,
                    body: command.body,
                    tags: Some(command.tags),
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.retrieve_entry(tenant_id, entry_id, false).await
    }

    pub async fn publication_readiness(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<CommunityPublicationReadinessView, CommunityServiceError> {
        let entry = self.retrieve_entry(tenant_id, entry_id, false).await?;
        let mut issues = Vec::new();
        if entry.review_state == "flagged" {
            issues.push("flagged".to_owned());
        } else if entry.review_state == "pending-review" {
            issues.push("pending-review".to_owned());
        } else if entry.review_state == "rejected" {
            issues.push("rejected".to_owned());
        }
        if entry.title.trim().is_empty() {
            issues.push("missing-title".to_owned());
        }
        if entry.category_id.trim().is_empty() {
            issues.push("missing-category".to_owned());
        }
        if entry.body.as_deref().unwrap_or("").trim().is_empty() {
            issues.push("missing-body".to_owned());
        }
        let excerpt_required = matches!(entry.kind.as_str(), "resource" | "service");
        if excerpt_required && entry.excerpt.as_deref().unwrap_or("").trim().is_empty() {
            issues.push("missing-excerpt".to_owned());
        }
        if entry.tags.iter().filter(|tag| !tag.trim().is_empty()).count() < 1 {
            issues.push("missing-tags".to_owned());
        }
        let ready = issues.iter().all(|issue| {
            !matches!(
                issue.as_str(),
                "pending-review"
                    | "flagged"
                    | "missing-body"
                    | "missing-category"
                    | "missing-excerpt"
                    | "missing-tags"
                    | "missing-title"
                    | "rejected"
            )
        });
        Ok(CommunityPublicationReadinessView {
            ready,
            degraded: ready && !issues.is_empty(),
            issues,
        })
    }

    pub async fn list_recommendations(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<Vec<CommunityEntryView>, CommunityServiceError> {
        let source = self.retrieve_entry(tenant_id, entry_id, true).await?;
        let mut candidates = self
            .list_feed(
                tenant_id,
                CommunityFeedQuery {
                    approved_only: true,
                    page: 1,
                    page_size: 100,
                    ..CommunityFeedQuery::default()
                },
            )
            .await?;
        candidates.retain(|candidate| candidate.id != source.id);
        candidates.sort_by(|left, right| {
            recommendation_score(&source, right)
                .cmp(&recommendation_score(&source, left))
                .then_with(|| right.updated_at.cmp(&left.updated_at))
        });
        candidates.truncate(10);
        Ok(candidates)
    }

    pub async fn list_comments(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<Vec<CommunityCommentView>, CommunityServiceError> {
        self.store
            .list_comments(tenant_id, entry_id)
            .await
            .map(|items| items.into_iter().map(map_comment).collect())
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
    }

    pub async fn create_comment(
        &self,
        tenant_id: &str,
        entry_id: &str,
        author_id: &str,
        author_name: &str,
        command: CommunityCommentCommand,
    ) -> Result<CommunityCommentView, CommunityServiceError> {
        if command.body.trim().is_empty() {
            return Err(CommunityServiceError::Validation(
                "comment body is required".to_owned(),
            ));
        }
        let _ = self.retrieve_entry(tenant_id, entry_id, false).await?;
        let now = Utc::now().to_rfc3339();
        let comment_id = uuid();
        self.store
            .create_comment(NewCommunityComment {
                id: comment_id.clone(),
                tenant_id: tenant_id.to_owned(),
                entry_id: entry_id.to_owned(),
                author_id: author_id.to_owned(),
                author_name: author_name.to_owned(),
                body_markdown: command.body,
                now,
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.store
            .list_comments(tenant_id, entry_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?
            .into_iter()
            .find(|comment| comment.id == comment_id)
            .map(map_comment)
            .ok_or_else(|| CommunityServiceError::Storage("created comment not found".to_owned()))
    }

    pub async fn set_reaction(
        &self,
        tenant_id: &str,
        entry_id: &str,
        user_id: &str,
        command: CommunityReactionCommand,
    ) -> Result<CommunityReactionSetAccepted, CommunityServiceError> {
        let reaction_type = command.reaction_type.trim();
        if reaction_type.is_empty() {
            return Err(CommunityServiceError::Validation(
                "reactionType is required".to_owned(),
            ));
        }
        let _ = self.retrieve_entry(tenant_id, entry_id, false).await?;
        let now = Utc::now().to_rfc3339();
        let reaction_count = self
            .store
            .set_reaction(SetCommunityReaction {
                id: uuid(),
                tenant_id: tenant_id.to_owned(),
                entry_id: entry_id.to_owned(),
                user_id: user_id.to_owned(),
                reaction_type: reaction_type.to_owned(),
                active: command.active,
                now,
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        Ok(CommunityReactionSetAccepted {
            accepted: true,
            resource_id: Some(entry_id.to_owned()),
            status: Some(if command.active { "active" } else { "inactive" }.to_owned()),
            reaction_count,
        })
    }

    pub async fn delete_entry_for_author(
        &self,
        tenant_id: &str,
        author_id: &str,
        entry_id: &str,
    ) -> Result<CommunityCommandAccepted, CommunityServiceError> {
        let entry = self.retrieve_entry(tenant_id, entry_id, false).await?;
        if entry.author_id != author_id {
            return Err(CommunityServiceError::Unauthorized(
                "only the author can delete this entry".to_owned(),
            ));
        }
        self.delete_entry(tenant_id, entry_id).await
    }

    pub async fn create_category(
        &self,
        tenant_id: &str,
        command: CommunityCategoryCommand,
    ) -> Result<CommunityCategoryView, CommunityServiceError> {
        if command.slug.trim().is_empty() || command.title.trim().is_empty() {
            return Err(CommunityServiceError::Validation(
                "slug and title are required".to_owned(),
            ));
        }
        let now = Utc::now().to_rfc3339();
        let category_id = uuid();
        self.store
            .create_category(NewCommunityCategory {
                id: category_id.clone(),
                tenant_id: tenant_id.to_owned(),
                slug: slugify(&command.slug),
                title: command.title,
                description: command.description,
                priority: command.priority.unwrap_or(0),
                enabled: command.enabled.unwrap_or(true),
                now,
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.store
            .list_categories(tenant_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?
            .into_iter()
            .find(|category| category.id == category_id)
            .map(map_category)
            .ok_or_else(|| CommunityServiceError::Storage("created category not found".to_owned()))
    }

    pub async fn update_category(
        &self,
        tenant_id: &str,
        category_id: &str,
        command: CommunityCategoryCommand,
    ) -> Result<CommunityCategoryView, CommunityServiceError> {
        self.store
            .update_category(
                tenant_id,
                category_id,
                &sdkwork_community_storage_sqlx::CommunityCategoryPatch {
                    slug: (!command.slug.trim().is_empty()).then_some(slugify(&command.slug)),
                    title: (!command.title.trim().is_empty()).then_some(command.title),
                    description: command.description,
                    priority: command.priority,
                    enabled: command.enabled,
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.store
            .list_categories(tenant_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?
            .into_iter()
            .find(|category| category.id == category_id)
            .map(map_category)
            .ok_or_else(|| {
                CommunityServiceError::NotFound(format!("category {category_id} not found"))
            })
    }

    pub async fn delete_category(
        &self,
        tenant_id: &str,
        category_id: &str,
    ) -> Result<CommunityCommandAccepted, CommunityServiceError> {
        let deleted = self
            .store
            .delete_category(tenant_id, category_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        if !deleted {
            return Err(CommunityServiceError::NotFound(format!(
                "category {category_id} not found"
            )));
        }
        Ok(CommunityCommandAccepted {
            accepted: true,
            resource_id: Some(category_id.to_owned()),
            status: Some("deleted".to_owned()),
        })
    }

    pub async fn update_moderation(
        &self,
        tenant_id: &str,
        entry_id: &str,
        actor_user_id: &str,
        command: CommunityModerationCommand,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        self.store
            .update_moderation(
                tenant_id,
                entry_id,
                actor_user_id,
                &sdkwork_community_storage_sqlx::CommunityModerationPatch {
                    review_state: command.review_state,
                    reason: command.reason,
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.retrieve_entry(tenant_id, entry_id, false).await
    }

    pub async fn set_featured(
        &self,
        tenant_id: &str,
        entry_id: &str,
        featured: bool,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        self.store
            .set_featured(tenant_id, entry_id, featured)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.retrieve_entry(tenant_id, entry_id, false).await
    }

    pub async fn set_pinned(
        &self,
        tenant_id: &str,
        entry_id: &str,
        pinned: bool,
    ) -> Result<CommunityEntryView, CommunityServiceError> {
        self.store
            .set_pinned(tenant_id, entry_id, pinned)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.retrieve_entry(tenant_id, entry_id, false).await
    }

    pub async fn delete_entry(
        &self,
        tenant_id: &str,
        entry_id: &str,
    ) -> Result<CommunityCommandAccepted, CommunityServiceError> {
        let deleted = self
            .store
            .delete_entry(tenant_id, entry_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        if !deleted {
            return Err(CommunityServiceError::NotFound(format!(
                "entry {entry_id} not found"
            )));
        }
        Ok(CommunityCommandAccepted {
            accepted: true,
            resource_id: Some(entry_id.to_owned()),
            status: Some("deleted".to_owned()),
        })
    }

    pub async fn list_moderation_queue(
        &self,
        tenant_id: &str,
    ) -> Result<Vec<CommunityEntryView>, CommunityServiceError> {
        self.store
            .list_moderation_queue(tenant_id)
            .await
            .map(|items| items.into_iter().map(map_entry).collect())
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
    }

    pub async fn rebuild_recommendations(
        &self,
        tenant_id: &str,
    ) -> Result<CommunityCommandAccepted, CommunityServiceError> {
        let rebuilt = self
            .store
            .rebuild_recommendations(tenant_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        Ok(CommunityCommandAccepted {
            accepted: true,
            resource_id: None,
            status: Some(format!("rebuilt:{rebuilt}")),
        })
    }
}

fn map_category(category: CommunityStoredCategory) -> CommunityCategoryView {
    CommunityCategoryView {
        id: category.id,
        tenant_id: category.tenant_id,
        slug: category.slug,
        title: category.title,
        description: category.description,
        priority: category.priority,
        enabled: category.enabled,
    }
}

fn map_entry(entry: CommunityStoredEntry) -> CommunityEntryView {
    CommunityEntryView {
        id: entry.id,
        tenant_id: entry.tenant_id,
        category_id: entry.category_id,
        category_label: None,
        author_id: entry.author_id,
        author_name: entry.author_name,
        slug: entry.slug,
        kind: entry.kind,
        title: entry.title,
        excerpt: Some(entry.excerpt),
        body: Some(entry.body_markdown),
        review_state: entry.review_state,
        is_featured: entry.is_featured,
        is_pinned: entry.is_pinned,
        has_accepted_answer: entry.has_accepted_answer,
        comment_count: entry.comment_count,
        reaction_count: entry.reaction_count,
        share_count: entry.share_count,
        view_count: entry.view_count,
        tags: entry.tags,
        published_at: entry.published_at,
        last_activity_at: entry.last_activity_at,
        updated_at: entry.updated_at,
    }
}

fn map_comment(comment: CommunityStoredComment) -> CommunityCommentView {
    CommunityCommentView {
        id: comment.id,
        tenant_id: comment.tenant_id,
        entry_id: comment.entry_id,
        author_id: comment.author_id,
        author_name: comment.author_name,
        body: comment.body_markdown,
        review_state: comment.review_state,
        is_accepted_answer: comment.is_accepted_answer,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
    }
}

fn validate_entry_command(command: &CommunityEntryCommand) -> Result<(), CommunityServiceError> {
    if command.category_id.trim().is_empty() {
        return Err(CommunityServiceError::Validation(
            "categoryId is required".to_owned(),
        ));
    }
    if command.title.trim().is_empty() {
        return Err(CommunityServiceError::Validation(
            "title is required".to_owned(),
        ));
    }
    if command.kind.trim().is_empty() {
        return Err(CommunityServiceError::Validation(
            "kind is required".to_owned(),
        ));
    }
    Ok(())
}

fn recommendation_score(source: &CommunityEntryView, candidate: &CommunityEntryView) -> i64 {
    let mut score = 0;
    if source.category_id == candidate.category_id {
        score += 3;
    }
    if source.kind == candidate.kind {
        score += 2;
    }
    if source.author_id == candidate.author_id {
        score += 1;
    }
    if candidate.is_featured {
        score += 2;
    }
    if candidate.has_accepted_answer {
        score += 1;
    }
    score + candidate
        .tags
        .iter()
        .filter(|tag| source.tags.contains(tag))
        .count() as i64
}
