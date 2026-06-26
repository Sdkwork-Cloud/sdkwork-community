use sdkwork_community_core::{
    community_capability_manifest, evaluate_publication_readiness, CommunityEntry,
    CommunityEntryKind, CommunityReviewState,
};

#[test]
fn community_core_manifest_owns_community_domain_contracts() {
    let manifest = community_capability_manifest();
    assert_eq!(manifest.owner, "sdkwork-community");
    assert_eq!(manifest.domain, "community");
    assert_eq!(
        manifest.review_states,
        vec!["draft", "pending-review", "approved", "flagged", "rejected"]
    );
    assert!(manifest.operations.contains(&"feed.list"));
    assert!(manifest.operations.contains(&"entries.publicationReadiness.retrieve"));
    assert!(manifest.operations.contains(&"entries.moderation.update"));
}

#[test]
fn community_core_evaluates_publication_readiness() {
    let entry = CommunityEntry {
        id: "entry_1",
        tenant_id: "100001",
        category_id: "category_product",
        author_id: "user_1",
        kind: CommunityEntryKind::Question,
        review_state: CommunityReviewState::Draft,
        title: "How do community SDKs work?",
        excerpt: Some("Question about generated SDKs"),
        body: Some("Full question body"),
        tags: vec!["sdk", "community"],
        has_accepted_answer: false,
    };

    let readiness = evaluate_publication_readiness(&entry, 2, false);
    assert!(readiness.ready);
    assert!(!readiness.degraded);
    assert!(readiness.issues.is_empty());

    let flagged = CommunityEntry {
        review_state: CommunityReviewState::Flagged,
        body: None,
        tags: vec![],
        ..entry
    };
    let blocked = evaluate_publication_readiness(&flagged, 1, false);
    assert!(!blocked.ready);
    assert_eq!(blocked.issues, vec!["flagged", "missing-body", "missing-tags"]);
}
