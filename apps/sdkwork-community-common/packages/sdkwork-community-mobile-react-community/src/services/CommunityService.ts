import type {
  SdkworkCommunityCategory,
  SdkworkCommunityComment,
  SdkworkCommunityEntry,
  SdkworkCommunityGroup,
  SdkworkCommunityMember as SdkworkCommunityMemberRecord,
  SdkworkCommunityMembershipTier,
} from "@sdkwork/community-contracts";
import type { SdkworkCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import { getCommunityRuntimePort } from "./communityRuntimePort";
import type { Community, CommunityGroup, CommunityMember, MembershipTier, Post, PostComment, Resource } from "../types";

/**
 * Community (圈子) service facade for the mobile React UI.
 *
 * Keeps the original method surface and signatures unchanged; the data layer
 * delegates to the configured community App SDK port (default: seeded
 * in-memory port). Resources stay client-local, matching the original
 * implementation.
 */

// Client-local resources (original implementation kept resources local).
const LOCAL_RESOURCES: Record<string, Resource[]> = {
  comm_1: [
    {
      id: "res_1",
      communityId: "comm_1",
      title: "2026年AI行业发展白皮书.pdf",
      type: "pdf",
      size: "4.5MB",
      url: "#",
      uploadedBy: "Admin",
      createdAt: "2026-05-25T10:00:00Z",
    },
    {
      id: "res_2",
      communityId: "comm_1",
      title: "斯坦福深度学习课程笔记.md",
      type: "doc",
      size: "1.2MB",
      url: "#",
      uploadedBy: "LearnBot",
      createdAt: "2026-05-20T12:00:00Z",
    },
  ],
};

// Session-local post images (entry media is not part of the App API surface).
const POST_IMAGES = new Map<string, string[]>();

// Session-local liked post ids (reactions are per-viewer).
const LIKED_POST_IDS = new Set<string>();

function port(): SdkworkCommunityAppSdkPort {
  return getCommunityRuntimePort();
}

function mapCategoryToCommunity(category: SdkworkCommunityCategory, isJoined: boolean): Community {
  return {
    id: category.id,
    name: category.title,
    description: category.description ?? "",
    coverImage: category.coverImage ?? "",
    avatar: category.avatar,
    memberCount: category.memberCount ?? 0,
    postCount: category.postCount ?? 0,
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

function mapEntryToPost(entry: SdkworkCommunityEntry, commentsList?: PostComment[]): Post {
  return {
    id: entry.id,
    communityId: entry.categoryId,
    authorId: entry.author.id,
    authorName: entry.author.name,
    authorAvatar: entry.author.avatar?.publicUrl ?? "",
    content: entry.body ?? entry.excerpt ?? entry.title,
    images: POST_IMAGES.get(entry.id),
    createdAt: String(entry.publishedAt ?? entry.lastActivityAt ?? ""),
    likes: entry.stats.reactionCount ?? 0,
    comments: commentsList?.length ?? entry.stats.commentCount ?? 0,
    commentsList,
    isLiked: LIKED_POST_IDS.has(entry.id),
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

async function isJoined(communityId: string): Promise<boolean> {
  try {
    const member = await port().community.members.current(communityId);
    return Boolean(member);
  } catch {
    return false;
  }
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
      price: community.price,
      tags: community.tags,
    });
    return mapCategoryToCommunity(category, true);
  },

  async getCommunities(): Promise<Community[]> {
    const categories = await port().community.categories.list();
    return Promise.all(
      categories.map(async (category) =>
        mapCategoryToCommunity(category, await isJoined(category.id)),
      ),
    );
  },

  async getCommunityById(id: string): Promise<Community | undefined> {
    const categories = await port().community.categories.list();
    const category = categories.find((candidate) => candidate.id === id);
    return category ? mapCategoryToCommunity(category, await isJoined(category.id)) : undefined;
  },

  async joinCommunity(id: string): Promise<void> {
    await port().community.members.join(id);
  },

  async getPostsByCommunity(communityId: string): Promise<Post[]> {
    const entries = await port().community.feed.list({ categoryId: communityId });
    return Promise.all(
      entries.map(async (entry) => {
        const comments = await port().community.comments.list(entry.id);
        return mapEntryToPost(entry, comments.map(mapCommentToPostComment));
      }),
    );
  },

  async createPost(communityId: string, content: string, images?: string[]): Promise<Post> {
    const entry = await port().community.entries.create({
      categoryId: communityId,
      kind: "discussion",
      title: truncate(content.split("\n")[0] ?? "", 120) || "Untitled",
      excerpt: truncate(content, 240),
      body: content,
    });
    if (images && images.length > 0) {
      POST_IMAGES.set(entry.id, images);
    }
    return mapEntryToPost(entry);
  },

  async addComment(communityId: string, postId: string, text: string): Promise<void> {
    await port().community.comments.create(postId, { body: text });
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

  async getResourcesByCommunity(communityId: string): Promise<Resource[]> {
    return LOCAL_RESOURCES[communityId] ?? [];
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
    await port().community.categories.update(communityId, {
      title: updates.name,
      description: updates.description,
      avatar: updates.avatar,
      coverImage: updates.coverImage,
      isPaid: updates.isPaid,
      price: updates.price,
      tags: updates.tags,
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
  ): Promise<CommunityMember> {
    const member = await port().community.members.activate(communityId, { orderId, tierId });
    return mapMemberToCommunityMember(member);
  },
};
