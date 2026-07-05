import { describe, expect, it } from "vitest";
import { createInMemoryCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import {
  createCommunityService,
  PC_COMMUNITY_CONTENT_REQUIRED,
  PC_COMMUNITY_SUPPORTED_TABS,
} from "../src/services/CommunityService";

describe("@sdkwork/community-pc-community service", () => {
  it("exposes only the shipped App API community surface", () => {
    const service = createCommunityService({
      port: createInMemoryCommunityAppSdkPort({
        entries: [
          {
            author: { id: "author-1", name: "Author" },
            categoryId: "cat-1",
            id: "entry-1",
            kind: "discussion",
            reviewState: "approved",
            stats: { commentCount: 0, reactionCount: 0 },
            title: "Hello",
            excerpt: "Hello world",
          },
        ],
      }),
    });

    const shippedMethods = [
      "createComment",
      "createPost",
      "deletePost",
      "getComments",
      "getCommunities",
      "getCommunity",
      "getPosts",
      "setPostReaction",
    ] as const;

    for (const method of shippedMethods) {
      expect(typeof service[method]).toBe("function");
    }

    expect(PC_COMMUNITY_SUPPORTED_TABS).toEqual(["feeds"]);
  });

  it("creates posts and comments through the injected SDK port", async () => {
    const service = createCommunityService({
      port: createInMemoryCommunityAppSdkPort(),
    });

    const post = await service.createPost("cat-1", "New discussion");
    expect(post.content).toContain("New discussion");

    await service.createComment("cat-1", post.id, "Nice post");
    await expect(service.getComments(post.id)).resolves.toHaveLength(1);
  });

  it("sets reactions and deletes posts through the injected SDK port", async () => {
    const service = createCommunityService({
      port: createInMemoryCommunityAppSdkPort(),
    });

    const post = await service.createPost("cat-1", "Reaction target");
    const liked = await service.setPostReaction(post.id, true);
    expect(liked.active).toBe(true);
    expect(liked.reactionCount).toBe(1);

    await service.deletePost(post.id);
    await expect(service.getPosts("cat-1")).resolves.toHaveLength(0);
  });

  it("rejects blank post and comment content", async () => {
    const service = createCommunityService({
      port: createInMemoryCommunityAppSdkPort(),
    });

    await expect(service.createPost("cat-1", "   ")).rejects.toThrow(
      PC_COMMUNITY_CONTENT_REQUIRED,
    );
    await expect(service.createComment("cat-1", "entry-1", "")).rejects.toThrow(
      PC_COMMUNITY_CONTENT_REQUIRED,
    );
  });
});
