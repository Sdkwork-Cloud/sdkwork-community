use sdkwork_community_service::{
    CommunityCategoryView, CommunityCommentView, CommunityEntryView,
};
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityAuthorResponse {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityStatsResponse {
    pub comment_count: i64,
    pub reaction_count: i64,
    pub share_count: i64,
    pub view_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityEntryResponse {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_label: Option<String>,
    pub author: CommunityAuthorResponse,
    pub slug: String,
    pub kind: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub excerpt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    pub review_state: String,
    pub is_featured: bool,
    pub is_pinned: bool,
    pub has_accepted_answer: bool,
    pub stats: CommunityStatsResponse,
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_activity_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityCategoryResponse {
    pub id: String,
    pub tenant_id: String,
    pub slug: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub priority: i64,
    pub enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityCommentResponse {
    pub id: String,
    pub tenant_id: String,
    pub entry_id: String,
    pub author: CommunityAuthorResponse,
    pub body: String,
    pub review_state: String,
    pub is_accepted_answer: bool,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

pub fn map_entry(entry: CommunityEntryView) -> CommunityEntryResponse {
    CommunityEntryResponse {
        id: entry.id,
        tenant_id: entry.tenant_id,
        category_id: entry.category_id,
        category_label: entry.category_label,
        author: CommunityAuthorResponse {
            id: entry.author_id,
            name: entry.author_name,
            avatar_url: None,
        },
        slug: entry.slug,
        kind: entry.kind,
        title: entry.title,
        excerpt: entry.excerpt,
        body: entry.body,
        review_state: entry.review_state,
        is_featured: entry.is_featured,
        is_pinned: entry.is_pinned,
        has_accepted_answer: entry.has_accepted_answer,
        stats: CommunityStatsResponse {
            comment_count: entry.comment_count,
            reaction_count: entry.reaction_count,
            share_count: entry.share_count,
            view_count: entry.view_count,
        },
        tags: entry.tags,
        published_at: entry.published_at,
        last_activity_at: entry.last_activity_at,
        updated_at: entry.updated_at,
    }
}

pub fn map_category(category: CommunityCategoryView) -> CommunityCategoryResponse {
    CommunityCategoryResponse {
        id: category.id,
        tenant_id: category.tenant_id,
        slug: category.slug,
        title: category.title,
        description: category.description,
        priority: category.priority,
        enabled: category.enabled,
    }
}

pub fn map_comment(comment: CommunityCommentView) -> CommunityCommentResponse {
    CommunityCommentResponse {
        id: comment.id,
        tenant_id: comment.tenant_id,
        entry_id: comment.entry_id,
        author: CommunityAuthorResponse {
            id: comment.author_id,
            name: comment.author_name,
            avatar_url: None,
        },
        body: comment.body,
        review_state: comment.review_state,
        is_accepted_answer: comment.is_accepted_answer,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
    }
}
