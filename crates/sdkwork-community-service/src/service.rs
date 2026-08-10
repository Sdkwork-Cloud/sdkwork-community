use std::sync::Arc;

use chrono::Utc;
use sdkwork_community_storage_sqlx::{
    CommunityFeedQuery, CommunityGroupPatch, CommunityMemberPatch, CommunitySqlxStore,
    CommunityStoredCategory, CommunityStoredComment, CommunityStoredEntry, CommunityStoredGroup,
    CommunityStoredGroupQr, CommunityStoredMember, NewCommunityCategory, NewCommunityComment,
    NewCommunityEntry, NewCommunityGroup, NewCommunityMember, SetCommunityReaction,
};
use sdkwork_utils_rust::{slugify, uuid, validated_offset_list_params};

use crate::error::CommunityServiceError;

#[derive(Debug, Clone)]
pub struct CommunityCategoryView {
    pub id: String,
    pub tenant_id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub cover_image: Option<String>,
    pub avatar: Option<String>,
    pub owner_id: Option<String>,
    pub member_count: i64,
    pub post_count: i64,
    pub is_paid: bool,
    pub price: Option<f64>,
    pub tags: Vec<String>,
    pub priority: i64,
    pub enabled: bool,
}

#[derive(Debug, Clone)]
pub struct CommunityMemberView {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub user_id: String,
    pub user_name: String,
    pub role: String,
    pub status: String,
    pub bio: Option<String>,
    pub joined_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CommunityGroupQrView {
    pub url: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CommunityGroupView {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub name: String,
    pub platform: String,
    pub description: Option<String>,
    pub member_count: i64,
    pub qr_codes: Vec<CommunityGroupQrView>,
    pub created_at: String,
    pub updated_at: String,
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
pub struct CommunityEntryPageView {
    pub items: Vec<CommunityEntryView>,
    pub page: i64,
    pub page_size: i64,
    pub total_items: i64,
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

/// App-facing circle (圈子) creation/update command. `slug` is derived from
/// the title by the service.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityCircleCommand {
    pub title: String,
    pub description: Option<String>,
    pub cover_image: Option<String>,
    pub avatar: Option<String>,
    pub is_paid: Option<bool>,
    pub price: Option<f64>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityMemberPatchCommand {
    pub role: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityGroupCommand {
    pub name: String,
    pub platform: String,
    pub description: Option<String>,
    pub member_count: Option<i64>,
    pub qr_codes: Option<Vec<CommunityGroupQrView>>,
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
        mut query: CommunityFeedQuery,
    ) -> Result<CommunityEntryPageView, CommunityServiceError> {
        let pagination = validated_offset_list_params(Some(query.page), Some(query.page_size))
            .map_err(|_| {
                CommunityServiceError::InvalidParameter(
                    "page must be at least 1 and page_size must be between 1 and 200".to_owned(),
                )
            })?;
        query.page = pagination.page;
        query.page_size = pagination.page_size;
        self.store
            .list_feed(tenant_id, &query)
            .await
            .map(|result| CommunityEntryPageView {
                items: result.items.into_iter().map(map_entry).collect(),
                page: result.page,
                page_size: result.page_size,
                total_items: result.total_items,
            })
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
            .ok_or_else(|| {
                CommunityServiceError::NotFound(format!("entry {entry_id} not found"))
            })?;
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
            .ok_or_else(|| {
                CommunityServiceError::NotFound(format!("entry slug {slug} not found"))
            })?;
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
        let category_id = command.category_id.clone();
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
        self.adjust_category_counts(tenant_id, &category_id, 0, 1)
            .await?;
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
        if entry
            .tags
            .iter()
            .filter(|tag| !tag.trim().is_empty())
            .count()
            < 1
        {
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
        candidates
            .items
            .retain(|candidate| candidate.id != source.id);
        candidates.items.sort_by(|left, right| {
            recommendation_score(&source, right)
                .cmp(&recommendation_score(&source, left))
                .then_with(|| right.updated_at.cmp(&left.updated_at))
        });
        candidates.items.truncate(10);
        Ok(candidates.items)
    }

    pub async fn list_comments(
        &self,
        tenant_id: &str,
        entry_id: &str,
        page: i64,
        page_size: i64,
    ) -> Result<(Vec<CommunityCommentView>, i64), CommunityServiceError> {
        let offset = (page - 1).max(0) * page_size;
        let items = self
            .store
            .list_comments(tenant_id, entry_id, page_size, offset)
            .await
            .map(|items| items.into_iter().map(map_comment).collect())
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        let total = self
            .store
            .count_comments(tenant_id, entry_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        Ok((items, total))
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
            .retrieve_comment(tenant_id, comment_id.as_str())
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?
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
                cover_image: None,
                avatar: None,
                owner_id: None,
                is_paid: false,
                price: None,
                tags: Vec::new(),
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
                    cover_image: None,
                    avatar: None,
                    owner_id: None,
                    member_count: None,
                    post_count: None,
                    is_paid: None,
                    price: None,
                    tags: None,
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

    /// Creates a circle (圈子): a category owned by the creator with an owner
    /// membership row.
    pub async fn create_circle(
        &self,
        tenant_id: &str,
        user_id: &str,
        display_name: &str,
        command: CommunityCircleCommand,
    ) -> Result<CommunityCategoryView, CommunityServiceError> {
        if command.title.trim().is_empty() {
            return Err(CommunityServiceError::Validation(
                "circle title is required".to_owned(),
            ));
        }
        let now = Utc::now().to_rfc3339();
        let category_id = uuid();
        self.store
            .create_category(NewCommunityCategory {
                id: category_id.clone(),
                tenant_id: tenant_id.to_owned(),
                slug: slugify(&command.title),
                title: command.title,
                description: command.description,
                cover_image: command.cover_image,
                avatar: command.avatar,
                owner_id: Some(user_id.to_owned()),
                is_paid: command.is_paid.unwrap_or(false),
                price: command.price,
                tags: command.tags.unwrap_or_default(),
                priority: 0,
                enabled: true,
                now: now.clone(),
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.store
            .create_member(NewCommunityMember {
                id: uuid(),
                tenant_id: tenant_id.to_owned(),
                category_id: category_id.clone(),
                user_id: user_id.to_owned(),
                user_name: display_name.to_owned(),
                role: "owner".to_owned(),
                bio: None,
                now,
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.adjust_category_counts(tenant_id, &category_id, 1, 0)
            .await?;
        self.retrieve_category(tenant_id, &category_id).await
    }

    pub async fn update_circle(
        &self,
        tenant_id: &str,
        actor_user_id: &str,
        category_id: &str,
        command: CommunityCircleCommand,
    ) -> Result<CommunityCategoryView, CommunityServiceError> {
        self.require_manager(tenant_id, category_id, actor_user_id)
            .await?;
        self.store
            .update_category(
                tenant_id,
                category_id,
                &sdkwork_community_storage_sqlx::CommunityCategoryPatch {
                    slug: None,
                    title: (!command.title.trim().is_empty()).then_some(command.title),
                    description: command.description,
                    cover_image: command.cover_image,
                    avatar: command.avatar,
                    owner_id: None,
                    member_count: None,
                    post_count: None,
                    is_paid: command.is_paid,
                    price: command.price,
                    tags: command.tags,
                    priority: None,
                    enabled: None,
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.retrieve_category(tenant_id, category_id).await
    }

    pub async fn retrieve_category(
        &self,
        tenant_id: &str,
        category_id: &str,
    ) -> Result<CommunityCategoryView, CommunityServiceError> {
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

    pub async fn list_members(
        &self,
        tenant_id: &str,
        category_id: &str,
    ) -> Result<Vec<CommunityMemberView>, CommunityServiceError> {
        self.store
            .list_members(tenant_id, category_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
            .map(|items| items.into_iter().map(map_member).collect())
    }

    pub async fn current_member(
        &self,
        tenant_id: &str,
        category_id: &str,
        user_id: &str,
    ) -> Result<Option<CommunityMemberView>, CommunityServiceError> {
        self.store
            .current_member(tenant_id, category_id, user_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
            .map(|member| member.map(map_member))
    }

    pub async fn join_category(
        &self,
        tenant_id: &str,
        category_id: &str,
        user_id: &str,
        display_name: &str,
    ) -> Result<CommunityMemberView, CommunityServiceError> {
        self.retrieve_category(tenant_id, category_id).await?;
        if let Some(member) = self.current_member(tenant_id, category_id, user_id).await? {
            return Ok(member);
        }
        let now = Utc::now().to_rfc3339();
        let member_id = uuid();
        self.store
            .create_member(NewCommunityMember {
                id: member_id.clone(),
                tenant_id: tenant_id.to_owned(),
                category_id: category_id.to_owned(),
                user_id: user_id.to_owned(),
                user_name: display_name.to_owned(),
                role: "member".to_owned(),
                bio: None,
                now,
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.adjust_category_counts(tenant_id, category_id, 1, 0)
            .await?;
        self.current_member(tenant_id, category_id, user_id)
            .await?
            .ok_or_else(|| CommunityServiceError::Storage("joined membership not found".to_owned()))
    }

    pub async fn update_member(
        &self,
        tenant_id: &str,
        actor_user_id: &str,
        category_id: &str,
        member_id: &str,
        command: CommunityMemberPatchCommand,
    ) -> Result<CommunityMemberView, CommunityServiceError> {
        self.require_manager(tenant_id, category_id, actor_user_id)
            .await?;
        let member = self
            .list_members(tenant_id, category_id)
            .await?
            .into_iter()
            .find(|member| member.id == member_id)
            .ok_or_else(|| {
                CommunityServiceError::NotFound(format!("member {member_id} not found"))
            })?;
        if member.role == "owner" && command.role.as_deref() == Some("member") {
            return Err(CommunityServiceError::Validation(
                "the owner role cannot be demoted".to_owned(),
            ));
        }
        self.store
            .update_member(
                tenant_id,
                category_id,
                member_id,
                &CommunityMemberPatch {
                    role: command.role,
                    status: command.status,
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.list_members(tenant_id, category_id)
            .await?
            .into_iter()
            .find(|member| member.id == member_id)
            .ok_or_else(|| CommunityServiceError::NotFound(format!("member {member_id} not found")))
    }

    pub async fn remove_member(
        &self,
        tenant_id: &str,
        actor_user_id: &str,
        category_id: &str,
        member_id: &str,
    ) -> Result<CommunityCommandAccepted, CommunityServiceError> {
        self.require_manager(tenant_id, category_id, actor_user_id)
            .await?;
        let deleted = self
            .store
            .delete_member(tenant_id, category_id, member_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        if !deleted {
            return Err(CommunityServiceError::NotFound(format!(
                "member {member_id} not found"
            )));
        }
        self.adjust_category_counts(tenant_id, category_id, -1, 0)
            .await?;
        Ok(CommunityCommandAccepted {
            accepted: true,
            resource_id: Some(member_id.to_owned()),
            status: Some("removed".to_owned()),
        })
    }

    pub async fn list_groups(
        &self,
        tenant_id: &str,
        category_id: &str,
    ) -> Result<Vec<CommunityGroupView>, CommunityServiceError> {
        self.store
            .list_groups(tenant_id, category_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
            .map(|items| items.into_iter().map(map_group).collect())
    }

    pub async fn create_group(
        &self,
        tenant_id: &str,
        actor_user_id: &str,
        category_id: &str,
        command: CommunityGroupCommand,
    ) -> Result<CommunityGroupView, CommunityServiceError> {
        self.require_member(tenant_id, category_id, actor_user_id)
            .await?;
        if command.name.trim().is_empty() {
            return Err(CommunityServiceError::Validation(
                "group name is required".to_owned(),
            ));
        }
        let now = Utc::now().to_rfc3339();
        let group_id = uuid();
        self.store
            .create_group(NewCommunityGroup {
                id: group_id.clone(),
                tenant_id: tenant_id.to_owned(),
                category_id: category_id.to_owned(),
                name: command.name,
                platform: command.platform,
                description: command.description,
                member_count: command.member_count.unwrap_or(0),
                qr_codes: command
                    .qr_codes
                    .unwrap_or_default()
                    .into_iter()
                    .map(|qr| CommunityStoredGroupQr {
                        url: qr.url,
                        description: qr.description,
                    })
                    .collect(),
                now,
            })
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.list_groups(tenant_id, category_id)
            .await?
            .into_iter()
            .find(|group| group.id == group_id)
            .ok_or_else(|| CommunityServiceError::Storage("created group not found".to_owned()))
    }

    pub async fn update_group(
        &self,
        tenant_id: &str,
        actor_user_id: &str,
        category_id: &str,
        group_id: &str,
        command: CommunityGroupCommand,
    ) -> Result<CommunityGroupView, CommunityServiceError> {
        self.require_manager(tenant_id, category_id, actor_user_id)
            .await?;
        self.store
            .update_group(
                tenant_id,
                category_id,
                group_id,
                &CommunityGroupPatch {
                    name: (!command.name.trim().is_empty()).then_some(command.name),
                    platform: (!command.platform.trim().is_empty()).then_some(command.platform),
                    description: command.description,
                    member_count: command.member_count,
                    qr_codes: command.qr_codes.map(|qrs| {
                        qrs.into_iter()
                            .map(|qr| CommunityStoredGroupQr {
                                url: qr.url,
                                description: qr.description,
                            })
                            .collect()
                    }),
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        self.list_groups(tenant_id, category_id)
            .await?
            .into_iter()
            .find(|group| group.id == group_id)
            .ok_or_else(|| CommunityServiceError::NotFound(format!("group {group_id} not found")))
    }

    pub async fn delete_group(
        &self,
        tenant_id: &str,
        actor_user_id: &str,
        category_id: &str,
        group_id: &str,
    ) -> Result<CommunityCommandAccepted, CommunityServiceError> {
        self.require_manager(tenant_id, category_id, actor_user_id)
            .await?;
        let deleted = self
            .store
            .delete_group(tenant_id, category_id, group_id)
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))?;
        if !deleted {
            return Err(CommunityServiceError::NotFound(format!(
                "group {group_id} not found"
            )));
        }
        Ok(CommunityCommandAccepted {
            accepted: true,
            resource_id: Some(group_id.to_owned()),
            status: Some("deleted".to_owned()),
        })
    }

    async fn adjust_category_counts(
        &self,
        tenant_id: &str,
        category_id: &str,
        member_delta: i64,
        post_delta: i64,
    ) -> Result<(), CommunityServiceError> {
        let category = self.retrieve_category(tenant_id, category_id).await?;
        self.store
            .update_category(
                tenant_id,
                category_id,
                &sdkwork_community_storage_sqlx::CommunityCategoryPatch {
                    slug: None,
                    title: None,
                    description: None,
                    cover_image: None,
                    avatar: None,
                    owner_id: None,
                    member_count: Some((category.member_count + member_delta).max(0)),
                    post_count: Some((category.post_count + post_delta).max(0)),
                    is_paid: None,
                    price: None,
                    tags: None,
                    priority: None,
                    enabled: None,
                },
            )
            .await
            .map_err(|error| CommunityServiceError::Storage(error.to_string()))
    }

    async fn require_member(
        &self,
        tenant_id: &str,
        category_id: &str,
        user_id: &str,
    ) -> Result<(), CommunityServiceError> {
        let member = self.current_member(tenant_id, category_id, user_id).await?;
        if member.is_none() {
            return Err(CommunityServiceError::Unauthorized(
                "membership required".to_owned(),
            ));
        }
        Ok(())
    }

    async fn require_manager(
        &self,
        tenant_id: &str,
        category_id: &str,
        user_id: &str,
    ) -> Result<(), CommunityServiceError> {
        let member = self.current_member(tenant_id, category_id, user_id).await?;
        match member.as_ref().map(|member| member.role.as_str()) {
            Some("owner" | "admin") => Ok(()),
            _ => Err(CommunityServiceError::Unauthorized(
                "owner or admin role required".to_owned(),
            )),
        }
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
        cover_image: category.cover_image,
        avatar: category.avatar,
        owner_id: category.owner_id,
        member_count: category.member_count,
        post_count: category.post_count,
        is_paid: category.is_paid,
        price: category.price,
        tags: category.tags,
        priority: category.priority,
        enabled: category.enabled,
    }
}

fn map_member(member: CommunityStoredMember) -> CommunityMemberView {
    CommunityMemberView {
        id: member.id,
        tenant_id: member.tenant_id,
        category_id: member.category_id,
        user_id: member.user_id,
        user_name: member.user_name,
        role: member.role,
        status: member.status,
        bio: member.bio,
        joined_at: member.joined_at,
    }
}

fn map_group(group: CommunityStoredGroup) -> CommunityGroupView {
    CommunityGroupView {
        id: group.id,
        tenant_id: group.tenant_id,
        category_id: group.category_id,
        name: group.name,
        platform: group.platform,
        description: group.description,
        member_count: group.member_count,
        qr_codes: group
            .qr_codes
            .into_iter()
            .map(|qr| CommunityGroupQrView {
                url: qr.url,
                description: qr.description,
            })
            .collect(),
        created_at: group.created_at,
        updated_at: group.updated_at,
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
    score
        + candidate
            .tags
            .iter()
            .filter(|tag| source.tags.contains(tag))
            .count() as i64
}
