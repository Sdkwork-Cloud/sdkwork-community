import type {
  SdkworkCommunityCategory,
  SdkworkCommunityComment,
  SdkworkCommunityEntry,
} from "@sdkwork/community-contracts";
import {
  createInMemoryCommunityAppSdkPort,
  type SdkworkCommunityAppSdkPort,
} from "@sdkwork/community-sdk-ports";

/**
 * Host-injectable runtime port for the community App SDK.
 *
 * Hosts (sdkwork-im h5, standalone sdkwork-community h5) configure the real
 * generated SDK port through `configureCommunityRuntimePort`. Without a host
 * configuration the package falls back to an in-memory port seeded with the
 * same sample circles the legacy implementation shipped, so the UI keeps
 * working in demos and tests.
 */

let runtimePort: SdkworkCommunityAppSdkPort | null = null;

export function configureCommunityRuntimePort(port: SdkworkCommunityAppSdkPort): void {
  runtimePort = port;
}

export function resetCommunityRuntimePort(): void {
  runtimePort = null;
}

export function getCommunityRuntimePort(): SdkworkCommunityAppSdkPort {
  if (!runtimePort) {
    runtimePort = createDefaultCommunityAppSdkPort();
  }
  return runtimePort;
}

export function createDefaultCommunityAppSdkPort(): SdkworkCommunityAppSdkPort {
  return createInMemoryCommunityAppSdkPort({
    categories: SAMPLE_CATEGORIES,
    comments: SAMPLE_COMMENTS,
    currentUserId: "local-user",
    entries: SAMPLE_ENTRIES,
    memberships: [
      {
        communityId: "comm_1",
        id: "local-user-membership",
        joinedAt: "2026-05-01T00:00:00Z",
        role: "member",
        status: "active",
        user: { id: "local-user", name: "Local User" },
      },
    ],
  });
}

const SAMPLE_CATEGORIES: readonly SdkworkCommunityCategory[] = [
  {
    avatar: "https://i.pravatar.cc/150?u=comm_1",
    coverImage: "https://picsum.photos/seed/comm_1/400/200",
    description: "专注人工智能、大模型、AIGC技术交流与落地应用的实战社区。",
    enabled: true,
    id: "comm_1",
    memberCount: 12500,
    postCount: 2,
    priority: 0,
    slug: "ai-developers",
    tags: ["AI", "大模型", "AIGC", "开发"],
    tenantId: "local",
    title: "AI 开发者联盟",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=comm_2",
    coverImage: "https://picsum.photos/seed/comm_2/400/200",
    description: "分享产品方法论、行业洞察、好书推荐。致力于培养顶尖产品经理。",
    enabled: true,
    id: "comm_2",
    isPaid: true,
    memberCount: 8430,
    postCount: 0,
    priority: 0,
    price: 99,
    slug: "product-managers",
    tags: ["产品", "商业", "增长"],
    tenantId: "local",
    title: "产品经理交流圈",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=comm_3",
    coverImage: "https://picsum.photos/seed/comm_3/400/200",
    description: "Indie Hackers, 分享一人公司的开发经验、出海经验和变现思路。",
    enabled: true,
    id: "comm_3",
    isPaid: true,
    memberCount: 5200,
    postCount: 0,
    priority: 0,
    price: 199,
    slug: "indie-hackers",
    tags: ["独立开发", "出海", "搞钱"],
    tenantId: "local",
    title: "独立开发者聚集地",
  },
];

const SAMPLE_COMMENTS: readonly SdkworkCommunityComment[] = [
  {
    author: { id: "user_4", name: "飞翔的企鹅" },
    body: "必须支持！期待更新~",
    createdAt: "2026-05-28T02:10:00Z",
    entryId: "post_1",
    id: "cm_1",
    reviewState: "approved",
    tenantId: "local",
  },
  {
    author: { id: "user_5", name: "Alex" },
    body: "太棒了，已经star了",
    createdAt: "2026-05-28T03:45:00Z",
    entryId: "post_1",
    id: "cm_2",
    reviewState: "approved",
    tenantId: "local",
  },
];

const SAMPLE_ENTRIES: readonly SdkworkCommunityEntry[] = [
  {
    author: { id: "user_1", name: "AI 极客" },
    body: "今天开源了一个基于本地大模型的RAG问答项目，支持LangChain，可以直接平替各种昂贵的API，大家去我的Github支持下求个Star！",
    categoryId: "comm_1",
    excerpt: "今天开源了一个基于本地大模型的RAG问答项目，支持LangChain，可以直接平替各种昂贵的API，大家去我的Github支持下求个Star！",
    id: "post_1",
    kind: "discussion",
    publishedAt: "2026-05-28T01:30:00Z",
    reviewState: "approved",
    stats: { commentCount: 2, reactionCount: 124 },
    tags: ["AI", "开源"],
    title: "开源了一个基于本地大模型的RAG问答项目",
  },
  {
    author: { id: "user_2", name: "算法打工人" },
    body: "今年大模型在自动驾驶方向有没有搞头？感觉年底几家大厂又要卷出天际了...",
    categoryId: "comm_1",
    excerpt: "今年大模型在自动驾驶方向有没有搞头？感觉年底几家大厂又要卷出天际了...",
    id: "post_2",
    kind: "question",
    publishedAt: "2026-05-27T14:15:00Z",
    reviewState: "approved",
    stats: { commentCount: 0, reactionCount: 45 },
    tags: ["自动驾驶"],
    title: "大模型在自动驾驶方向还有搞头吗？",
  },
];

export { SAMPLE_CATEGORIES, SAMPLE_COMMENTS, SAMPLE_ENTRIES };
