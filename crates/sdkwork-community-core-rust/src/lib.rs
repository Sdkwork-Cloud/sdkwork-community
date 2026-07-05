#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CommunityEntryKind {
    Announcement,
    Discussion,
    Question,
    Resource,
    Service,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CommunityReviewState {
    Approved,
    Draft,
    Flagged,
    PendingReview,
    Rejected,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityEntry {
    pub id: &'static str,
    pub tenant_id: &'static str,
    pub category_id: &'static str,
    pub author_id: &'static str,
    pub kind: CommunityEntryKind,
    pub review_state: CommunityReviewState,
    pub title: &'static str,
    pub excerpt: Option<&'static str>,
    pub body: Option<&'static str>,
    pub tags: Vec<&'static str>,
    pub has_accepted_answer: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityPublicationChecklist {
    pub has_body: bool,
    pub has_category: bool,
    pub has_excerpt: bool,
    pub has_minimum_tags: bool,
    pub has_title: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityPublicationReadiness {
    pub checklist: CommunityPublicationChecklist,
    pub degraded: bool,
    pub issues: Vec<&'static str>,
    pub ready: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CommunityCapabilityManifest {
    pub owner: &'static str,
    pub domain: &'static str,
    pub kinds: Vec<&'static str>,
    pub review_states: Vec<&'static str>,
    pub operations: Vec<&'static str>,
}

pub fn community_capability_manifest() -> CommunityCapabilityManifest {
    CommunityCapabilityManifest {
        owner: "sdkwork-community",
        domain: "community",
        kinds: vec!["announcement", "discussion", "question", "resource", "service"],
        review_states: vec![
            "draft",
            "pending-review",
            "approved",
            "flagged",
            "rejected",
        ],
        operations: vec![
            "categories.list",
            "feed.list",
            "entries.retrieve",
            "entries.recommendations.list",
            "entries.create",
            "entries.update",
            "entries.publicationReadiness.retrieve",
            "comments.list",
            "comments.create",
            "reactions.set",
            "categories.management.list",
            "categories.create",
            "categories.update",
            "categories.delete",
            "entries.management.list",
            "entries.moderation.update",
            "entries.feature",
            "entries.pin",
            "entries.delete",
            "moderation.queue.list",
            "recommendations.rebuild",
        ],
    }
}

pub fn evaluate_publication_readiness(
    entry: &CommunityEntry,
    minimum_tags: usize,
    allow_pending_review: bool,
) -> CommunityPublicationReadiness {
    let excerpt_required = matches!(
        entry.kind,
        CommunityEntryKind::Resource | CommunityEntryKind::Service
    );
    let checklist = CommunityPublicationChecklist {
        has_body: !entry.body.map(str::trim).unwrap_or_default().is_empty(),
        has_category: !entry.category_id.trim().is_empty(),
        has_excerpt: !excerpt_required
            || !entry.excerpt.map(str::trim).unwrap_or_default().is_empty(),
        has_minimum_tags: entry.tags.iter().filter(|tag| !tag.trim().is_empty()).count()
            >= minimum_tags,
        has_title: !entry.title.trim().is_empty(),
    };

    let mut issues = Vec::new();
    match entry.review_state {
        CommunityReviewState::Flagged => issues.push("flagged"),
        CommunityReviewState::PendingReview => issues.push("pending-review"),
        CommunityReviewState::Rejected => issues.push("rejected"),
        CommunityReviewState::Approved | CommunityReviewState::Draft => {}
    }
    if !checklist.has_title {
        issues.push("missing-title");
    }
    if !checklist.has_category {
        issues.push("missing-category");
    }
    if !checklist.has_body {
        issues.push("missing-body");
    }
    if !checklist.has_excerpt {
        issues.push("missing-excerpt");
    }
    if !checklist.has_minimum_tags {
        issues.push("missing-tags");
    }

    let ready = issues.iter().all(|issue| match *issue {
        "pending-review" => allow_pending_review,
        "flagged" | "missing-body" | "missing-category" | "missing-excerpt"
        | "missing-tags" | "missing-title" | "rejected" => false,
        _ => true,
    });

    CommunityPublicationReadiness {
        checklist,
        degraded: ready && !issues.is_empty(),
        issues,
        ready,
    }
}
