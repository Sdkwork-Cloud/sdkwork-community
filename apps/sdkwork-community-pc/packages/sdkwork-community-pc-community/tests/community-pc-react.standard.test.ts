import { describe, expect, it } from "vitest";
import {
  createCommunityPostRouteIntent,
  createCommunityWorkspaceManifest,
  filterCommunityEntries,
  type SdkworkCommunityEntry,
} from "../src";

const entries: SdkworkCommunityEntry[] = [
  {
    author: {
      id: "author-1",
      name: "Sdkwork Team",
    },
    categoryId: "product",
    id: "assistant-release",
    isFeatured: true,
    isPinned: true,
    kind: "announcement",
    lastActivityAt: "2026-04-02T10:00:00.000Z",
    reviewState: "approved",
    stats: {
      commentCount: 18,
      reactionCount: 60,
      shareCount: 6,
      viewCount: 900,
    },
    tags: ["release", "assistant"],
    title: "Assistant release notes",
  },
  {
    author: {
      id: "author-2",
      name: "Rita",
    },
    categoryId: "support",
    hasAcceptedAnswer: false,
    id: "pricing-help-question",
    kind: "question",
    lastActivityAt: "2026-04-02T10:20:00.000Z",
    reviewState: "approved",
    stats: {
      commentCount: 7,
      reactionCount: 12,
      shareCount: 1,
      viewCount: 200,
    },
    tags: ["pricing", "assistant"],
    title: "How should we package assistant pricing?",
  },
];

describe("@sdkwork/community-pc-community", () => {
  it("keeps community feed behavior available through the PC React package", () => {
    expect(
      filterCommunityEntries(entries, {
        categories: ["support"],
        query: "pricing",
        reviewStates: ["approved"],
        tags: ["assistant"],
      }).map((entry) => entry.id),
    ).toEqual(["pricing-help-question"]);
  });

  it("creates a community workspace manifest and route intent for desktop shells", () => {
    expect(
      createCommunityWorkspaceManifest({
        packageNames: ["@sdkwork/community-pc-community", "@sdkwork/search-pc-react"],
        title: "Community",
      }),
    ).toEqual({
      architecture: "pc-react",
      capability: "community",
      composerRoutePath: "/community/new",
      description: "Community workspace for discussions, recommendations, and public post routing.",
      detailRoutePattern: "/community/:entryId",
      host: "tauri",
      id: "sdkwork-community",
      packageNames: ["@sdkwork/community-pc-community", "@sdkwork/search-pc-react"],
      routePath: "/community",
      theme: {
        color: "lobster",
        preset: "sdkwork",
        selection: "system",
      },
      title: "Community",
    });

    expect(
      createCommunityPostRouteIntent("pricing-help-question", {
        commentId: "comment-9",
      }),
    ).toEqual({
      commentId: "comment-9",
      entryId: "pricing-help-question",
      focusWindow: true,
      route: "/community/pricing-help-question?comment=comment-9",
      source: "community-feed",
      type: "community-post-route-intent",
    });
  });
});
