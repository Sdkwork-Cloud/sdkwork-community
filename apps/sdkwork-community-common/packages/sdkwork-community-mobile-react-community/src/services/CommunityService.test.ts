import { beforeEach, describe, expect, it } from "vitest";

import { createInMemoryCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import type {
  SdkworkCommunityCategory,
  SdkworkCommunityComment,
  SdkworkCommunityEntry,
} from "@sdkwork/community-contracts";
import { CommunityService } from "./CommunityService";
import { configureCommunityRuntimePort, resetCommunityRuntimePort } from "./communityRuntimePort";

const CATEGORIES: readonly SdkworkCommunityCategory[] = [
  {
    coverImage: "https://example.test/cover.png",
    description: "AI 开发者联盟",
    enabled: true,
    id: "comm_1",
    memberCount: 100,
    postCount: 0,
    priority: 0,
    slug: "ai",
    tags: ["AI"],
    tenantId: "local",
    title: "AI 开发者联盟",
  },
  {
    coverImage: "https://example.test/cover-2.png",
    description: "产品经理交流圈",
    enabled: true,
    id: "comm_2",
    isPaid: true,
    memberCount: 50,
    postCount: 0,
    priority: 0,
    price: 99,
    slug: "pm",
    tags: ["产品"],
    tenantId: "local",
    title: "产品经理交流圈",
  },
];

const COMMENTS: readonly SdkworkCommunityComment[] = [
  {
    author: { id: "user-2", name: "Alex" },
    body: "支持！",
    createdAt: "2026-05-28T02:10:00Z",
    entryId: "post_1",
    id: "cm_1",
    reviewState: "approved",
    tenantId: "local",
  },
];

const ENTRIES: readonly SdkworkCommunityEntry[] = [
  {
    author: { id: "user-1", name: "AI 极客" },
    body: "开源了一个 RAG 项目",
    categoryId: "comm_1",
    id: "post_1",
    kind: "discussion",
    publishedAt: "2026-05-28T01:30:00Z",
    reviewState: "approved",
    stats: { commentCount: 1, reactionCount: 5 },
    tags: ["开源"],
    title: "RAG 项目",
  },
];

describe("CommunityService", () => {
  beforeEach(() => {
    resetCommunityRuntimePort();
    configureCommunityRuntimePort(
      createInMemoryCommunityAppSdkPort({
        categories: CATEGORIES,
        comments: COMMENTS,
        currentUserId: "user-1",
        entries: ENTRIES,
        memberships: [
          {
            communityId: "comm_1",
            id: "user-1-membership",
            joinedAt: "2026-05-01T00:00:00Z",
            role: "owner",
            status: "active",
            user: { id: "user-1", name: "AI 极客" },
          },
        ],
      }),
    );
  });

  it("lists communities with joined state", async () => {
    const communities = await CommunityService.getCommunities();

    expect(communities).toHaveLength(2);
    expect(communities[0]).toMatchObject({
      id: "comm_1",
      name: "AI 开发者联盟",
      memberCount: 100,
      isJoined: true,
    });
    expect(communities[1]).toMatchObject({
      id: "comm_2",
      isJoined: false,
      isPaid: true,
      price: 99,
    });
  });

  it("retrieves a community by id", async () => {
    const community = await CommunityService.getCommunityById("comm_2");
    expect(community?.name).toBe("产品经理交流圈");
    expect(community?.isJoined).toBe(false);
    await expect(CommunityService.getCommunityById("missing")).resolves.toBeUndefined();
  });

  it("creates a community and becomes its owner member", async () => {
    const created = await CommunityService.createCommunity({
      avatar: undefined,
      coverImage: "https://example.test/new.png",
      description: "新圈子",
      name: "独立开发者聚集地",
      tags: ["独立开发"],
    });

    expect(created.id).toBeTruthy();
    expect(created.isJoined).toBe(true);

    const members = await CommunityService.getMembersByCommunity(created.id);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ role: "owner", name: "Local User" });
  });

  it("joins a community", async () => {
    await CommunityService.joinCommunity("comm_2");

    const community = await CommunityService.getCommunityById("comm_2");
    expect(community?.isJoined).toBe(true);
  });

  it("lists posts with comments and maps entry fields", async () => {
    const posts = await CommunityService.getPostsByCommunity("comm_1");

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      id: "post_1",
      communityId: "comm_1",
      authorName: "AI 极客",
      content: "开源了一个 RAG 项目",
      likes: 5,
      comments: 1,
      isLiked: false,
    });
    expect(posts[0].commentsList).toEqual([
      expect.objectContaining({ authorName: "Alex", content: "支持！" }),
    ]);
  });

  it("creates posts and comments, and toggles likes", async () => {
    const post = await CommunityService.createPost("comm_1", "第一行\n正文内容");
    expect(post.communityId).toBe("comm_1");

    await CommunityService.addComment("comm_1", post.id, "评论内容");

    await CommunityService.toggleLikePost("comm_1", post.id);
    const posts = await CommunityService.getPostsByCommunity("comm_1");
    const created = posts.find((item) => item.id === post.id);
    expect(created?.isLiked).toBe(true);
  });

  it("manages members: role, status and removal", async () => {
    await CommunityService.updateMemberRole("comm_1", "user-1-membership", "admin");
    await CommunityService.updateMemberStatus("comm_1", "user-1-membership", "muted");

    let members = await CommunityService.getMembersByCommunity("comm_1");
    expect(members[0]).toMatchObject({ role: "admin", status: "muted" });

    await CommunityService.removeMember("comm_1", "user-1-membership");
    members = await CommunityService.getMembersByCommunity("comm_1");
    expect(members).toHaveLength(0);
  });

  it("manages groups: create, update and delete", async () => {
    const group = await CommunityService.createGroup("comm_1", {
      memberCount: 120,
      name: "AI 开发者交流群",
      platform: "wechat",
      qrCodes: [{ url: "https://example.test/qr.png", description: "扫码加入" }],
    });
    expect(group).toMatchObject({ name: "AI 开发者交流群", platform: "wechat", qrCodeUrl: "https://example.test/qr.png" });

    const updated = await CommunityService.updateGroup("comm_1", group.id, { name: "新群名" });
    expect(updated.name).toBe("新群名");

    await CommunityService.deleteGroup("comm_1", group.id);
    await expect(CommunityService.getGroupsByCommunity("comm_1")).resolves.toEqual([]);
  });

  it("updates a community", async () => {
    await CommunityService.updateCommunity("comm_1", { name: "AI 开发者联盟 2.0" });

    const community = await CommunityService.getCommunityById("comm_1");
    expect(community?.name).toBe("AI 开发者联盟 2.0");
  });

  it("keeps resources client-local", async () => {
    const resources = await CommunityService.getResourcesByCommunity("comm_1");
    expect(resources.map((resource) => resource.title)).toEqual([
      "2026年AI行业发展白皮书.pdf",
      "斯坦福深度学习课程笔记.md",
    ]);
    await expect(CommunityService.getResourcesByCommunity("comm_2")).resolves.toEqual([]);
  });
});
