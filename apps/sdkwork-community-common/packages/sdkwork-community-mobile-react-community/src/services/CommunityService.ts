import type {
  SdkworkCommunityCategory,
  SdkworkCommunityComment,
  SdkworkCommunityEntry,
  SdkworkCommunityGroup,
  SdkworkCommunityMember as SdkworkCommunityMemberRecord,
  SdkworkCommunityMembershipTier,
} from "@sdkwork/community-contracts";
import type { SdkworkCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import type { FeedItem, SdkworkFeedsClient } from "@sdkwork/feeds-sdk";
import {
  getCommunityFeedsPort,
  getCommunityRuntimePort,
  isCommunityFeedsPortConfigured,
} from "./communityRuntimePort";
import { getCommunityMediaRuntime } from "./communityMediaRuntimePort";
import type { Community, CommunityGroup, CommunityMember, MembershipTier, Post, PostComment, Resource } from "../types";

/**
 * Community (圈子) service facade for the mobile React UI.
 *
 * Every read and write delegates to the configured community App SDK port
 * (generated SDK backed by the backend service). There is deliberately no
 * client-local data: circles, posts, comments, media, resources, groups and
 * memberships all come from the backend, and all entity ids are minted
 * server-side (snowflake).
 */

// Session-local liked post ids (reactions are per-viewer; the backend keeps
// the authoritative reaction count, the set only tracks the viewer's state).
const LIKED_POST_IDS = new Set<string>();

function port(): SdkworkCommunityAppSdkPort {
  return getCommunityRuntimePort();
}

/** Standard feeds stream key for one circle's posts (all kinds). */
function circlePostsStreamKey(communityId: string): string {
  return `community-${communityId}`;
}

/** Standard feeds stream key for one circle's resources (kind=resource). */
function circleResourcesStreamKey(communityId: string): string {
  return `community-${communityId}-resources`;
}

function payloadKind(item: FeedItem): string {
  const kind = item.payload?.kind;
  return typeof kind === "string" ? kind : "";
}

function toReadableFeedText(item: FeedItem): string {
  return (item.excerpt ?? item.title ?? "").trim();
}

function mapFeedItemToPost(item: FeedItem): Post {
  return {
    id: item.id,
    communityId: item.streamKey?.replace(/^community-/, "").replace(/-resources$/, "") ?? "",
    authorId: item.author?.id ?? "",
    authorName: item.author?.name ?? "",
    authorAvatar: item.author?.avatarUrl ?? "",
    content: toReadableFeedText(item),
    images: undefined,
    createdAt: String(item.publishedAt ?? item.createdAt ?? ""),
    likes: item.reactionCount ?? 0,
    comments: item.commentCount ?? 0,
    isLiked: LIKED_POST_IDS.has(item.id),
  };
}

function mapFeedItemToResource(item: FeedItem): Resource {
  const payload = item.payload as Record<string, unknown> | undefined;
  const firstTag = typeof payload?.tag === "string" ? payload.tag : "";
  return {
    id: item.id,
    communityId: item.streamKey?.replace(/^community-/, "").replace(/-resources$/, "") ?? "",
    title: item.title,
    type: firstTag || "link",
    url: item.coverUrl ?? "#",
    createdAt: String(item.publishedAt ?? item.createdAt ?? ""),
    uploadedBy: item.author?.name ?? "",
  };
}

/** Reads one circle feed page through the standard feeds stream client. */
async function listCircleFeedItems(
  feeds: SdkworkFeedsClient,
  streamKey: string,
): Promise<FeedItem[]> {
  const page = await feeds.feeds.streams.items.list(streamKey, { pageSize: 100 });
  return page.items as unknown as FeedItem[];
}

function mapCategoryToCommunity(category: SdkworkCommunityCategory, isJoined: boolean): Community {
  return {
    id: category.id,
    name: category.title,
    description: category.description ?? "",
    coverImage: category.coverImage ?? "",
    avatar: category.avatar,
    ownerId: category.ownerId,
    memberCount: category.memberCount ?? 0,
    memberLimit: category.memberLimit,
    postCount: category.postCount ?? 0,
    revenueTarget: category.revenueTarget,
    revenueRaised: category.revenueRaised ?? 0,
    tags: category.tags ? [...category.tags] : [],
    tabs: category.tabs ? [...category.tabs] : undefined,
    isJoined,
    isPaid: category.isPaid,
    price: category.price,
  };
}

function mapCommentToPostComment(comment: SdkworkCommunityComment): PostComment {
  return {
    id: comment.id,
    authorName: comment.author.name,
    content: comment.body,
    createdAt: String(comment.createdAt),
  };
}

/**
 * Human-readable fields that product surfaces may embed in JSON-structured
 * entry bodies (e.g. the Agents 灵感广场 activity cards). The feed must never
 * dump the raw JSON document into a post.
 */
const JSON_BODY_TEXT_FIELDS = [
  "background",
  "desc",
  "description",
  "summary",
  "timeRange",
  "status",
  "tag",
] as const;

/** True when the entry body is a serialized JSON document (object or array). */
function isJsonDocument(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return false;
  }
  try {
    return typeof JSON.parse(trimmed) === "object";
  } catch {
    return false;
  }
}

/**
 * Renders an entry body as readable post text. Plain markdown passes through;
 * JSON-structured bodies (used as structured payloads by other surfaces) are
 * reduced to their human-readable text fields, falling back to excerpt/title.
 */
function toReadableEntryText(body: string | undefined, excerpt?: string, title?: string): string {
  if (!body) {
    return excerpt?.trim() || title?.trim() || "";
  }
  if (!isJsonDocument(body)) {
    return body;
  }
  try {
    const record = JSON.parse(body.trim()) as Record<string, unknown>;
    const parts = JSON_BODY_TEXT_FIELDS.map((key) => record[key])
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());
    if (parts.length > 0) {
      return parts.join("\n\n");
    }
  } catch {
    // Fall through to the excerpt/title fallback below.
  }
  return excerpt?.trim() || title?.trim() || "";
}

function mapEntryToPost(entry: SdkworkCommunityEntry, commentsList?: PostComment[]): Post {
  return {
    id: entry.id,
    communityId: entry.categoryId,
    authorId: entry.author.id,
    authorName: entry.author.name,
    authorAvatar: entry.author.avatar?.publicUrl ?? "",
    content: toReadableEntryText(entry.body, entry.excerpt, entry.title),
    images: entry.media ? [...entry.media] : undefined,
    createdAt: String(entry.publishedAt ?? entry.lastActivityAt ?? ""),
    likes: entry.stats.reactionCount ?? 0,
    comments: commentsList?.length ?? entry.stats.commentCount ?? 0,
    commentsList,
    isLiked: LIKED_POST_IDS.has(entry.id),
  };
}

/** Maps a backend entry of kind "resource" to the resources-tab view. */
function mapEntryToResource(entry: SdkworkCommunityEntry): Resource {
  return {
    id: entry.id,
    communityId: entry.categoryId,
    title: entry.title,
    // Entries carry the resource type through their first tag (pdf/doc/...).
    type: entry.tags?.[0] ?? "link",
    url: entry.media?.[0] ?? "#",
    uploadedBy: entry.author.name,
    createdAt: String(entry.publishedAt ?? entry.lastActivityAt ?? ""),
  };
}

function mapGroupToCommunityGroup(group: SdkworkCommunityGroup): CommunityGroup {
  return {
    id: group.id,
    communityId: group.communityId,
    name: group.name,
    platform: group.platform,
    description: group.description,
    memberCount: group.memberCount,
    qrCodeUrl: group.qrCodeUrl ?? group.qrCodes?.[0]?.url,
    qrCodes: group.qrCodes
      ? group.qrCodes.map((item) => ({ url: item.url, description: item.description ?? "" }))
      : undefined,
    createdAt: String(group.createdAt),
  };
}

function mapMemberToCommunityMember(member: SdkworkCommunityMemberRecord): CommunityMember {
  return {
    id: member.id,
    communityId: member.communityId,
    name: member.user.name,
    avatar: member.user.avatar?.publicUrl ?? "",
    role: member.role,
    joinDate: String(member.joinedAt),
    status: member.status,
    bio: member.bio,
    tierId: member.tierId,
    tierName: member.tierName,
    membershipExpiresAt: member.membershipExpiresAt
      ? String(member.membershipExpiresAt)
      : undefined,
  };
}

function mapTierToMembershipTier(tier: SdkworkCommunityMembershipTier): MembershipTier {
  return {
    id: tier.id,
    categoryId: tier.categoryId,
    name: tier.name,
    description: tier.description,
    price: tier.price,
    durationDays: tier.durationDays,
    benefits: [...tier.benefits],
    enabled: tier.enabled,
    sortOrder: tier.sortOrder,
    catalogPackageId: tier.catalogPackageId,
  };
}

/** True when the error indicates the circle member limit was reached. */
export function isMemberLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("limit") || message.includes("满");
}

/** True when the circle's funding target was reached and purchases are closed. */
export function isRevenueTargetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("revenue target") || message.includes("融资") || message.includes("目标已达成");
}

function truncate(value: string, length: number): string {
  const normalized = value.trim();
  return normalized.length <= length ? normalized : `${normalized.slice(0, length)}…`;
}

export const CommunityService = {
  async getMembersByCommunity(communityId: string): Promise<CommunityMember[]> {
    const members = await port().community.members.list(communityId);
    return members.map(mapMemberToCommunityMember);
  },

  async updateMemberRole(
    communityId: string,
    memberId: string,
    role: CommunityMember["role"],
  ): Promise<void> {
    await port().community.members.updateRole(communityId, memberId, role);
  },

  async updateMemberStatus(
    communityId: string,
    memberId: string,
    status: CommunityMember["status"],
  ): Promise<void> {
    await port().community.members.updateStatus(communityId, memberId, status);
  },

  async removeMember(communityId: string, memberId: string): Promise<void> {
    await port().community.members.remove(communityId, memberId);
  },

  async createCommunity(
    community: Omit<Community, "id" | "memberCount" | "postCount" | "isJoined">,
  ): Promise<Community> {
    const category = await port().community.categories.create({
      title: community.name,
      description: community.description,
      avatar: community.avatar,
      coverImage: community.coverImage,
      isPaid: community.isPaid,
      memberLimit: community.memberLimit,
      price: community.price,
      revenueTarget: community.revenueTarget,
      tags: community.tags,
      tabs: community.tabs,
    });
    return mapCategoryToCommunity(category, true);
  },

  async getCommunities(): Promise<Community[]> {
    const categories = await port().community.categories.list();
    // The list endpoint already carries the current user's membership state;
    // no per-circle members.current requests (N+1).
    return categories.map((category) =>
      mapCategoryToCommunity(category, Boolean(category.isJoined)),
    );
  },

  async getCommunityById(id: string): Promise<Community | undefined> {
    try {
      const category = await port().community.categories.retrieve(id);
      return mapCategoryToCommunity(category, Boolean(category.isJoined));
    } catch {
      // The backend returns not-found for missing or disabled circles.
      return undefined;
    }
  },

  async joinCommunity(id: string): Promise<void> {
    await port().community.members.join(id);
  },

  /** Leaves a circle: resolves the current membership and removes it. */
  async leaveCommunity(communityId: string): Promise<void> {
    const member = await port().community.members.current(communityId);
    if (!member) {
      return;
    }
    await port().community.members.remove(communityId, member.id);
  },

  /** Deletes a circle; the backend requires the owner role. */
  async deleteCommunity(communityId: string): Promise<void> {
    await port().community.categories.remove(communityId);
  },

  async getPostsByCommunity(communityId: string): Promise<Post[]> {
    // 动态 tab shows non-resource entries; resources have their own tab.
    // The standard feeds stream carries the source kind in the standardized
    // payload, so the exclusion filter stays client-side and explicit.
    if (isCommunityFeedsPortConfigured()) {
      const items = await listCircleFeedItems(
        getCommunityFeedsPort(),
        circlePostsStreamKey(communityId),
      );
      const posts = items
        .filter((item) => payloadKind(item) !== "resource")
        .map(mapFeedItemToPost);
      return Promise.all(
        posts.map(async (post) => {
          const comments = await port().community.comments.list(post.id);
          return { ...post, commentsList: comments.map(mapCommentToPostComment) };
        }),
      );
    }
    // Migration fallback: legacy community feed surface.
    const entries = await port().community.feed.list({
      categoryId: communityId,
      kinds: ["announcement", "discussion", "question", "service"],
    });
    return Promise.all(
      entries.map(async (entry) => {
        const comments = await port().community.comments.list(entry.id);
        return mapEntryToPost(entry, comments.map(mapCommentToPostComment));
      }),
    );
  },

  /**
   * Creates a post. Images are uploaded through the host-injected media
   * runtime (drive-backed) and stored on the backend entry as media URLs;
   * the backend mints the post id.
   */
  async createPost(communityId: string, content: string, images?: File[]): Promise<Post> {
    const media =
      images && images.length > 0 ? await getCommunityMediaRuntime().uploadImages(images) : [];
    const entry = await port().community.entries.create({
      categoryId: communityId,
      kind: "discussion",
      title: truncate(content.split("\n")[0] ?? "", 120) || "Untitled",
      excerpt: truncate(content, 240),
      body: content,
      media,
    });
    return mapEntryToPost(entry);
  },

  /** Creates a comment and returns the backend-minted comment (id included). */
  async addComment(communityId: string, postId: string, text: string): Promise<PostComment> {
    const comment = await port().community.comments.create(postId, { body: text });
    return mapCommentToPostComment(comment);
  },

  async toggleLikePost(communityId: string, postId: string): Promise<void> {
    const active = !LIKED_POST_IDS.has(postId);
    await port().community.reactions.set(postId, { reactionType: "like", active });
    if (active) {
      LIKED_POST_IDS.add(postId);
    } else {
      LIKED_POST_IDS.delete(postId);
    }
  },

  /** Resources are backend entries of kind "resource" within the circle. */
  async getResourcesByCommunity(communityId: string): Promise<Resource[]> {
    if (isCommunityFeedsPortConfigured()) {
      const items = await listCircleFeedItems(
        getCommunityFeedsPort(),
        circleResourcesStreamKey(communityId),
      );
      return items.map(mapFeedItemToResource);
    }
    // Migration fallback: legacy community feed surface.
    const entries = await port().community.feed.list({
      categoryId: communityId,
      kinds: ["resource"],
    });
    return entries.map(mapEntryToResource);
  },

  async getGroupsByCommunity(communityId: string): Promise<CommunityGroup[]> {
    const groups = await port().community.groups.list(communityId);
    return groups.map(mapGroupToCommunityGroup);
  },

  async createGroup(
    communityId: string,
    group: Omit<CommunityGroup, "id" | "createdAt" | "communityId">,
  ): Promise<CommunityGroup> {
    const created = await port().community.groups.create(communityId, {
      name: group.name,
      platform: group.platform,
      description: group.description,
      memberCount: group.memberCount,
      qrCodes: group.qrCodes,
    });
    return mapGroupToCommunityGroup(created);
  },

  async updateGroup(
    communityId: string,
    groupId: string,
    data: Partial<CommunityGroup>,
  ): Promise<CommunityGroup> {
    const updated = await port().community.groups.update(communityId, groupId, {
      name: data.name,
      platform: data.platform,
      description: data.description,
      memberCount: data.memberCount,
      qrCodes: data.qrCodes,
    });
    return mapGroupToCommunityGroup(updated);
  },

  async updateCommunity(communityId: string, updates: Partial<Community>): Promise<void> {
    // Only defined fields are sent; the backend keeps the remaining fields.
    await port().community.categories.update(communityId, {
      ...(updates.name !== undefined ? { title: updates.name } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.avatar !== undefined ? { avatar: updates.avatar } : {}),
      ...(updates.coverImage !== undefined ? { coverImage: updates.coverImage } : {}),
      ...(updates.isPaid !== undefined ? { isPaid: updates.isPaid } : {}),
      ...(updates.memberLimit !== undefined ? { memberLimit: updates.memberLimit } : {}),
      ...(updates.price !== undefined ? { price: updates.price } : {}),
      ...(updates.revenueTarget !== undefined ? { revenueTarget: updates.revenueTarget } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      ...(updates.tabs !== undefined ? { tabs: updates.tabs } : {}),
    });
  },

  async deleteGroup(communityId: string, groupId: string): Promise<void> {
    await port().community.groups.remove(communityId, groupId);
  },

  /** Lists purchasable (enabled) membership tiers of a circle. */
  async getMembershipTiers(communityId: string): Promise<MembershipTier[]> {
    const tiers = await port().community.tiers.list(communityId);
    return tiers.map(mapTierToMembershipTier);
  },

  /** Owner/admin: lists all tiers including unpublished ones. */
  async listAllMembershipTiers(communityId: string): Promise<MembershipTier[]> {
    const tiers = await port().community.tiers.listAll(communityId);
    return tiers.map(mapTierToMembershipTier);
  },

  /** Owner/admin: creates an unpublished membership tier. */
  async createMembershipTier(
    communityId: string,
    tier: Omit<MembershipTier, "id" | "categoryId" | "enabled">,
  ): Promise<MembershipTier> {
    const created = await port().community.tiers.create(communityId, {
      name: tier.name,
      description: tier.description,
      price: tier.price,
      durationDays: tier.durationDays,
      benefits: tier.benefits,
      sortOrder: tier.sortOrder,
    });
    return mapTierToMembershipTier(created);
  },

  /** Owner/admin: updates a membership tier. */
  async updateMembershipTier(
    communityId: string,
    tierId: string,
    tier: Partial<Omit<MembershipTier, "id" | "categoryId" | "enabled">>,
  ): Promise<MembershipTier> {
    const updated = await port().community.tiers.update(communityId, tierId, {
      name: tier.name,
      description: tier.description,
      price: tier.price,
      durationDays: tier.durationDays,
      benefits: tier.benefits,
      sortOrder: tier.sortOrder,
    });
    return mapTierToMembershipTier(updated);
  },

  /** Owner/admin: publishes a tier (registers its catalog package). */
  async publishMembershipTier(communityId: string, tierId: string): Promise<MembershipTier> {
    const tier = await port().community.tiers.publish(communityId, tierId);
    return mapTierToMembershipTier(tier);
  },

  /** Owner/admin: unpublishes a tier. */
  async unpublishMembershipTier(communityId: string, tierId: string): Promise<MembershipTier> {
    const tier = await port().community.tiers.unpublish(communityId, tierId);
    return mapTierToMembershipTier(tier);
  },

  /** Owner/admin: deletes a membership tier. */
  async deleteMembershipTier(communityId: string, tierId: string): Promise<void> {
    await port().community.tiers.remove(communityId, tierId);
  },

  /** Activates a paid membership after order payment (order verified server-side). */
  async activateMembership(
    communityId: string,
    orderId: string,
    tierId: string,
    packageId?: string,
  ): Promise<CommunityMember> {
    const member = await port().community.members.activate(communityId, {
      orderId,
      tierId,
      ...(packageId ? { packageId } : {}),
    });
    return mapMemberToCommunityMember(member);
  },
};
