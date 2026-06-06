import { describe, expect, it } from "vitest";
import {
  COMMUNITY_APP_API_ROUTES,
  COMMUNITY_BACKEND_API_ROUTES,
  COMMUNITY_OPEN_API_ROUTES,
  buildCommunityRecommendations,
  createCommunityEntryDigest,
  evaluateCommunityPublicationReadiness,
  filterCommunityEntries,
  normalizeCommunityReviewState,
  sortCommunityEntries,
  summarizeCommunityEntryDigests,
  summarizeCommunityFeed,
  type SdkworkCommunityEntry,
} from "../src";

const entries: SdkworkCommunityEntry[] = [
  {
    author: { id: "author-1", name: "Sdkwork Team" },
    categoryId: "product",
    id: "entry-release",
    isFeatured: true,
    isPinned: true,
    kind: "announcement",
    lastActivityAt: "2026-06-06T10:00:00Z",
    reviewState: "approved",
    stats: { commentCount: 3, reactionCount: 10, shareCount: 1, viewCount: 400 },
    tags: ["release", "sdk"],
    title: "Community SDK release",
  },
  {
    author: { id: "author-2", name: "Rita" },
    categoryId: "support",
    hasAcceptedAnswer: false,
    id: "entry-question",
    kind: "question",
    lastActivityAt: "2026-06-06T11:00:00Z",
    reviewState: "approved",
    stats: { commentCount: 1, reactionCount: 2, shareCount: 0, viewCount: 100 },
    tags: ["sdk", "help"],
    title: "How should I call community app SDKs?",
  },
  {
    author: { id: "author-3", name: "Moderator" },
    categoryId: "support",
    id: "entry-flagged",
    kind: "discussion",
    lastActivityAt: "2026-06-06T09:00:00Z",
    reviewState: "flagged",
    stats: { commentCount: 0, reactionCount: 0, shareCount: 0, viewCount: 4 },
    tags: ["moderation"],
    title: "Flagged discussion",
  },
  {
    author: { id: "author-4", name: "Nina" },
    categoryId: "support",
    id: "entry-discussion",
    kind: "discussion",
    lastActivityAt: "2026-06-06T10:30:00Z",
    reviewState: "approved",
    stats: { commentCount: 9, reactionCount: 20, shareCount: 3, viewCount: 480 },
    tags: ["sdk", "guide"],
    title: "Community SDK guide discussion",
  },
  {
    author: { id: "author-5", name: "Studio Partner" },
    categoryId: "marketplace",
    excerpt: "Design service for community rollout.",
    id: "entry-service",
    kind: "service",
    lastActivityAt: "2026-06-06T09:30:00Z",
    reviewState: "pending-review",
    stats: { commentCount: 2, reactionCount: 5, shareCount: 0, viewCount: 110 },
    tags: ["design", "sdk"],
    title: "Community launch design service",
  },
];

describe("@sdkwork/community-contracts", () => {
  it("declares owner-only community route contracts", () => {
    expect(COMMUNITY_APP_API_ROUTES).toHaveLength(9);
    expect(COMMUNITY_BACKEND_API_ROUTES).toHaveLength(11);
    expect(COMMUNITY_OPEN_API_ROUTES).toHaveLength(4);
    expect(COMMUNITY_APP_API_ROUTES.every((route) => route.path.startsWith("/app/v3/api/community"))).toBe(true);
    expect(COMMUNITY_BACKEND_API_ROUTES.every((route) => route.path.startsWith("/backend/v3/api/community"))).toBe(true);
    expect(COMMUNITY_OPEN_API_ROUTES.every((route) => route.path.startsWith("/community/v3/api"))).toBe(true);
    expect(COMMUNITY_APP_API_ROUTES.every((route) => route.tag === "community")).toBe(true);
  });

  it("filters and digests feed entries without raw HTTP assumptions", () => {
    expect(
      filterCommunityEntries(entries, {
        categories: ["support"],
        query: "sdk",
        reviewStates: ["approved"],
        tags: ["help"],
      }).map((entry) => entry.id),
    ).toEqual(["entry-question"]);

    expect(createCommunityEntryDigest(entries[0], { activeEntryId: "entry-release" })).toMatchObject({
      digestStatus: "featured",
      id: "entry-release",
      isActive: true,
      isFeatured: true,
      isPinned: true,
      isTrending: true,
      tagCount: 2,
    });
  });

  it("keeps migrated feed sorting, summaries, recommendations, and moderation state normalization", () => {
    expect(sortCommunityEntries(entries, { mode: "trending" }).map((entry) => entry.id)).toEqual([
      "entry-release",
      "entry-discussion",
      "entry-service",
      "entry-question",
      "entry-flagged",
    ]);

    expect(summarizeCommunityFeed(entries)).toEqual({
      featuredEntries: 1,
      flaggedEntries: 1,
      pendingReviewEntries: 1,
      totalEntries: 5,
      unansweredQuestions: 1,
    });

    expect(buildCommunityRecommendations(entries[1], entries)).toEqual([
      {
        entry: entries[3],
        reasons: ["shared-category", "shared-tag", "trending"],
        score: 57,
      },
      {
        entry: entries[0],
        reasons: ["shared-tag", "featured", "trending"],
        score: 23,
      },
    ]);

    expect(normalizeCommunityReviewState("published")).toBe("approved");
    expect(normalizeCommunityReviewState("queued")).toBe("pending-review");
    expect(normalizeCommunityReviewState("reported")).toBe("flagged");
    expect(normalizeCommunityReviewState("removed")).toBe("rejected");
    expect(normalizeCommunityReviewState(undefined)).toBe("draft");
  });

  it("keeps migrated digest summary coverage for attention, draft, featured, live, and rejected states", () => {
    const draftEntry: SdkworkCommunityEntry = {
      author: { id: "author-6", name: "Draft Author" },
      categoryId: "support",
      excerpt: "Working draft for the launch support guide.",
      id: "entry-draft",
      kind: "resource",
      reviewState: "draft",
      stats: { commentCount: 0, reactionCount: 0, shareCount: 0, viewCount: 12 },
      tags: ["guide"],
      title: "Draft support guide",
    };
    const rejectedEntry: SdkworkCommunityEntry = {
      author: { id: "author-7", name: "Rejected Author" },
      categoryId: "support",
      excerpt: "Rejected template copy.",
      id: "entry-rejected",
      kind: "discussion",
      reviewState: "rejected",
      stats: { commentCount: 0, reactionCount: 0, shareCount: 0, viewCount: 4 },
      tags: ["template"],
      title: "Rejected template",
    };

    expect(
      summarizeCommunityEntryDigests([
        createCommunityEntryDigest(entries[0], { activeEntryId: "entry-release" }),
        createCommunityEntryDigest(entries[1]),
        createCommunityEntryDigest(entries[2]),
        createCommunityEntryDigest(entries[4]),
        createCommunityEntryDigest(draftEntry),
        createCommunityEntryDigest(rejectedEntry),
      ]),
    ).toEqual({
      attentionEntries: 2,
      draftEntries: 1,
      featuredEntries: 1,
      liveEntries: 1,
      rejectedEntries: 1,
      totalEntries: 6,
      trendingEntries: 1,
      unansweredQuestions: 1,
    });
  });

  it("evaluates publication readiness for blocked and degraded states", () => {
    expect(
      evaluateCommunityPublicationReadiness(
        {
          ...entries[1],
          excerpt: "SDK usage question",
        },
        { hasBody: true, minimumTags: 2 },
      ),
    ).toEqual({
      checklist: {
        hasBody: true,
        hasCategory: true,
        hasExcerpt: true,
        hasMinimumTags: true,
        hasTitle: true,
      },
      degraded: false,
      issues: [],
      ready: true,
    });

    expect(
      evaluateCommunityPublicationReadiness(entries[2], {
        hasBody: false,
        minimumTags: 2,
      }).issues,
    ).toEqual(["flagged", "missing-body", "missing-tags"]);
  });
});
