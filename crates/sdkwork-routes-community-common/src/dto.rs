use sdkwork_community_service::{
    CommunityCategoryView, CommunityCommentView, CommunityEntryView, CommunityGroupView,
    CommunityMemberView, CommunityTierView,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cover_image: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_id: Option<String>,
    pub member_count: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub member_limit: Option<i64>,
    pub post_count: i64,
    pub is_paid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revenue_target: Option<f64>,
    pub revenue_raised: f64,
    pub tags: Vec<String>,
    pub priority: i64,
    pub enabled: bool,
    pub is_joined: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityMemberResponse {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub user_id: String,
    pub user_name: String,
    pub role: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tier_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tier_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub membership_expires_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_order_id: Option<String>,
    pub joined_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityTierResponse {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub price: f64,
    pub duration_days: i64,
    pub benefits: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub catalog_package_id: Option<String>,
    pub sort_order: i64,
    pub enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityGroupQrResponse {
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommunityGroupResponse {
    pub id: String,
    pub tenant_id: String,
    pub category_id: String,
    pub name: String,
    pub platform: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub member_count: i64,
    pub qr_codes: Vec<CommunityGroupQrResponse>,
    pub created_at: String,
    pub updated_at: String,
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
        cover_image: category.cover_image,
        avatar: category.avatar,
        owner_id: category.owner_id,
        member_count: category.member_count,
        member_limit: category.member_limit,
        post_count: category.post_count,
        is_paid: category.is_paid,
        price: category.price,
        revenue_target: category.revenue_target,
        revenue_raised: category.revenue_raised,
        tags: category.tags,
        priority: category.priority,
        enabled: category.enabled,
        is_joined: category.is_joined,
    }
}

pub fn map_member(member: CommunityMemberView) -> CommunityMemberResponse {
    CommunityMemberResponse {
        id: member.id,
        tenant_id: member.tenant_id,
        category_id: member.category_id,
        user_id: member.user_id,
        user_name: member.user_name,
        role: member.role,
        status: member.status,
        bio: member.bio,
        tier_id: member.tier_id,
        tier_name: member.tier_name,
        membership_expires_at: member.membership_expires_at,
        last_order_id: member.last_order_id,
        joined_at: member.joined_at,
    }
}

pub fn map_tier(tier: CommunityTierView) -> CommunityTierResponse {
    CommunityTierResponse {
        id: tier.id,
        tenant_id: tier.tenant_id,
        category_id: tier.category_id,
        name: tier.name,
        description: tier.description,
        price: tier.price,
        duration_days: tier.duration_days,
        benefits: tier.benefits,
        catalog_package_id: tier.catalog_package_id,
        sort_order: tier.sort_order,
        enabled: tier.enabled,
    }
}

pub fn map_group(group: CommunityGroupView) -> CommunityGroupResponse {
    CommunityGroupResponse {
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
            .map(|qr| CommunityGroupQrResponse {
                url: qr.url,
                description: qr.description,
            })
            .collect(),
        created_at: group.created_at,
        updated_at: group.updated_at,
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
