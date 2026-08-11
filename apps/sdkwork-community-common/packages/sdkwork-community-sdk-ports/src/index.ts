import {
  buildCommunityRecommendations,
  filterCommunityEntries,
  type FilterCommunityEntriesOptions,
  type SdkworkCommunityActivateMembershipCommand,
  type SdkworkCommunityCategory,
  type SdkworkCommunityCircleCommand,
  type SdkworkCommunityComment,
  type SdkworkCommunityEntry,
  type SdkworkCommunityEntryKind,
  type SdkworkCommunityGroup,
  type SdkworkCommunityGroupCommand,
  type SdkworkCommunityMember,
  type SdkworkCommunityMemberRole,
  type SdkworkCommunityMemberStatus,
  type SdkworkCommunityMembershipTier,
  type SdkworkCommunityPublicationReadiness,
  type SdkworkCommunityReviewState,
  type SdkworkCommunityTierCommand,
  evaluateCommunityPublicationReadiness,
} from "@sdkwork/community-contracts";

export interface SdkworkCommunityListParams
  extends Pick<FilterCommunityEntriesOptions, "categories" | "featuredOnly" | "kinds" | "mode" | "query" | "reviewStates" | "tags"> {
  categoryId?: string;
  kind?: SdkworkCommunityEntryKind;
  q?: string;
  reviewState?: SdkworkCommunityReviewState;
  tag?: string;
}

export interface SdkworkCommunityEntryCommand {
  body?: string;
  categoryId: string;
  excerpt?: string;
  kind: SdkworkCommunityEntry["kind"];
  tags?: readonly string[];
  title: string;
}

export interface SdkworkCommunityCommentCommand {
  body: string;
}

export interface SdkworkCommunityReactionCommand {
  active: boolean;
  reactionType: string;
}

export interface SdkworkCommunityReactionSetResult {
  accepted: boolean;
  reactionCount: number;
  resourceId?: string;
  status?: string;
}

export interface SdkworkCommunityAppSdkPort {
  community: {
    categories: {
      create(command: SdkworkCommunityCircleCommand): Promise<SdkworkCommunityCategory>;
      list(): Promise<readonly SdkworkCommunityCategory[]>;
      update(
        categoryId: string,
        command: Partial<SdkworkCommunityCircleCommand>,
      ): Promise<SdkworkCommunityCategory>;
    };
    comments: {
      create(entryId: string, command: SdkworkCommunityCommentCommand): Promise<SdkworkCommunityComment>;
      list(entryId: string): Promise<readonly SdkworkCommunityComment[]>;
    };
    feed: {
      list(params?: SdkworkCommunityListParams): Promise<SdkworkCommunityEntry[]>;
    };
    reactions: {
      set(entryId: string, command: SdkworkCommunityReactionCommand): Promise<SdkworkCommunityReactionSetResult>;
    };
    entries: {
      create(command: SdkworkCommunityEntryCommand): Promise<SdkworkCommunityEntry>;
      delete(entryId: string): Promise<void>;
      retrieve(entryId: string): Promise<SdkworkCommunityEntry>;
      update(entryId: string, command: Partial<SdkworkCommunityEntryCommand>): Promise<SdkworkCommunityEntry>;
      publicationReadiness: {
        retrieve(entryId: string): Promise<SdkworkCommunityPublicationReadiness>;
      };
      recommendations: {
        list(entryId: string): Promise<SdkworkCommunityEntry[]>;
      };
    };
    members: {
      activate(
        communityId: string,
        command: SdkworkCommunityActivateMembershipCommand,
      ): Promise<SdkworkCommunityMember>;
      current(communityId: string): Promise<SdkworkCommunityMember | undefined>;
      join(communityId: string): Promise<SdkworkCommunityMember>;
      list(communityId: string): Promise<readonly SdkworkCommunityMember[]>;
      remove(communityId: string, memberId: string): Promise<void>;
      updateRole(
        communityId: string,
        memberId: string,
        role: SdkworkCommunityMemberRole,
      ): Promise<SdkworkCommunityMember>;
      updateStatus(
        communityId: string,
        memberId: string,
        status: SdkworkCommunityMemberStatus,
      ): Promise<SdkworkCommunityMember>;
    };
    tiers: {
      create(
        communityId: string,
        command: SdkworkCommunityTierCommand,
      ): Promise<SdkworkCommunityMembershipTier>;
      list(communityId: string): Promise<readonly SdkworkCommunityMembershipTier[]>;
      /** Owner management view: includes unpublished tiers. */
      listAll(communityId: string): Promise<readonly SdkworkCommunityMembershipTier[]>;
      publish(communityId: string, tierId: string): Promise<SdkworkCommunityMembershipTier>;
      remove(communityId: string, tierId: string): Promise<void>;
      unpublish(communityId: string, tierId: string): Promise<SdkworkCommunityMembershipTier>;
      update(
        communityId: string,
        tierId: string,
        command: Partial<SdkworkCommunityTierCommand>,
      ): Promise<SdkworkCommunityMembershipTier>;
    };
    groups: {
      create(
        communityId: string,
        command: SdkworkCommunityGroupCommand,
      ): Promise<SdkworkCommunityGroup>;
      list(communityId: string): Promise<readonly SdkworkCommunityGroup[]>;
      remove(communityId: string, groupId: string): Promise<void>;
      update(
        communityId: string,
        groupId: string,
        command: Partial<SdkworkCommunityGroupCommand>,
      ): Promise<SdkworkCommunityGroup>;
    };
  };
}

export interface CreateInMemoryCommunityAppSdkPortOptions {
  categories?: readonly SdkworkCommunityCategory[];
  comments?: readonly SdkworkCommunityComment[];
  currentUserId?: string;
  entries?: readonly SdkworkCommunityEntry[];
  memberships?: readonly SdkworkCommunityMember[];
  tiers?: readonly SdkworkCommunityMembershipTier[];
}

export function createInMemoryCommunityAppSdkPort(
  options: CreateInMemoryCommunityAppSdkPortOptions = {},
): SdkworkCommunityAppSdkPort {
  const categories = [...(options.categories ?? [])];
  const currentUserId = options.currentUserId ?? "local-user";
  const entries = [...(options.entries ?? [])];
  const comments: SdkworkCommunityComment[] = [...(options.comments ?? [])];
  const reactions = new Map<string, Set<string>>();
  const members = new Map<string, SdkworkCommunityMember[]>();
  const groups = new Map<string, SdkworkCommunityGroup[]>();
  const tiers = new Map<string, SdkworkCommunityMembershipTier[]>();
  for (const membership of options.memberships ?? []) {
    const list = members.get(membership.communityId) ?? [];
    list.push(membership);
    members.set(membership.communityId, list);
  }
  for (const tier of options.tiers ?? []) {
    const list = tiers.get(tier.categoryId) ?? [];
    list.push(tier);
    tiers.set(tier.categoryId, list);
  }

  function findEntry(entryId: string): SdkworkCommunityEntry {
    const entry = entries.find((candidate) => candidate.id === entryId);
    if (!entry) {
      throw new Error(`community entry not found: ${entryId}`);
    }
    return entry;
  }

  function findCategory(categoryId: string): SdkworkCommunityCategory {
    const category = categories.find((candidate) => candidate.id === categoryId);
    if (!category) {
      throw new Error(`community category not found: ${categoryId}`);
    }
    return category;
  }

  function communityMembers(communityId: string): SdkworkCommunityMember[] {
    const list = members.get(communityId) ?? [];
    members.set(communityId, list);
    return list;
  }

  function communityGroups(communityId: string): SdkworkCommunityGroup[] {
    const list = groups.get(communityId) ?? [];
    groups.set(communityId, list);
    return list;
  }

  function communityTiers(communityId: string): SdkworkCommunityMembershipTier[] {
    const list = tiers.get(communityId) ?? [];
    tiers.set(communityId, list);
    return list;
  }

  function findTier(communityId: string, tierId: string): SdkworkCommunityMembershipTier {
    const tier = communityTiers(communityId).find((candidate) => candidate.id === tierId);
    if (!tier) {
      throw new Error(`community membership tier not found: ${tierId}`);
    }
    return tier;
  }

  function assertMemberCapacity(category: SdkworkCommunityCategory): void {
    if (category.memberLimit !== undefined && (category.memberCount ?? 0) >= category.memberLimit) {
      throw new Error("circle member limit reached");
    }
  }

  function findMember(communityId: string, memberId: string): SdkworkCommunityMember {
    const member = communityMembers(communityId).find((candidate) => candidate.id === memberId);
    if (!member) {
      throw new Error(`community member not found: ${memberId}`);
    }
    return member;
  }

  function findGroup(communityId: string, groupId: string): SdkworkCommunityGroup {
    const group = communityGroups(communityId).find((candidate) => candidate.id === groupId);
    if (!group) {
      throw new Error(`community group not found: ${groupId}`);
    }
    return group;
  }

  function toFilterOptions(params: SdkworkCommunityListParams): FilterCommunityEntriesOptions {
    return {
      categories: params.categoryId ? [params.categoryId] : params.categories,
      featuredOnly: params.featuredOnly,
      kinds: params.kind ? [params.kind] : params.kinds,
      mode: params.mode,
      query: params.q ?? params.query,
      reviewStates: params.reviewState ? [params.reviewState] : params.reviewStates,
      tags: params.tag ? [params.tag] : params.tags,
    };
  }

  return {
    community: {
      categories: {
        async create(command) {
          const slug = `${command.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${categories.length + 1}`;
          const category: SdkworkCommunityCategory = {
            avatar: command.avatar,
            coverImage: command.coverImage,
            description: command.description,
            enabled: true,
            id: `category-${categories.length + 1}`,
            isPaid: command.isPaid,
            memberCount: 0,
            ownerId: currentUserId,
            postCount: 0,
            price: command.price,
            priority: 0,
            slug,
            tags: command.tags,
            tenantId: "local",
            title: command.title,
          };
          categories.push(category);
          communityMembers(category.id).push({
            bio: undefined,
            communityId: category.id,
            id: `${currentUserId}-membership`,
            joinedAt: new Date().toISOString(),
            role: "owner",
            status: "active",
            user: { id: currentUserId, name: "Local User" },
          });
          category.memberCount = 1;
          return category;
        },
        async list() {
          return categories;
        },
        async update(categoryId, command) {
          const category = findCategory(categoryId);
          Object.assign(category, command);
          return category;
        },
      },
      comments: {
        async list(entryId) {
          return comments.filter((comment) => comment.entryId === entryId);
        },
        async create(entryId, command) {
          findEntry(entryId);
          const comment: SdkworkCommunityComment = {
            author: { id: currentUserId, name: "Local User" },
            body: command.body,
            createdAt: new Date().toISOString(),
            entryId,
            id: `comment-${comments.length + 1}`,
            reviewState: "approved",
            tenantId: "local",
          };
          comments.push(comment);
          return comment;
        },
      },
      feed: {
        async list(params = {}) {
          return filterCommunityEntries(entries, toFilterOptions(params));
        },
      },
      reactions: {
        async set(entryId, command) {
          const entry = findEntry(entryId);
          const key = `${entryId}:${command.reactionType}`;
          const activeUsers = reactions.get(key) ?? new Set<string>();
          if (command.active) {
            activeUsers.add(currentUserId);
          } else {
            activeUsers.delete(currentUserId);
          }
          reactions.set(key, activeUsers);
          entry.stats = {
            ...entry.stats,
            reactionCount: activeUsers.size,
          };
          return {
            accepted: true,
            reactionCount: activeUsers.size,
            resourceId: entryId,
            status: command.active ? "active" : "inactive",
          };
        },
      },
      entries: {
        async create(command) {
          const entry: SdkworkCommunityEntry = {
            author: { id: currentUserId, name: "Local User" },
            body: command.body,
            categoryId: command.categoryId,
            excerpt: command.excerpt,
            id: `entry-${entries.length + 1}`,
            kind: command.kind,
            reviewState: "draft",
            stats: {},
            tags: command.tags,
            title: command.title,
          };
          entries.push(entry);
          const category = categories.find((candidate) => candidate.id === command.categoryId);
          if (category) {
            category.postCount = (category.postCount ?? 0) + 1;
          }
          return entry;
        },
        async retrieve(entryId) {
          return findEntry(entryId);
        },
        async delete(entryId) {
          const index = entries.findIndex((candidate) => candidate.id === entryId);
          if (index < 0) {
            throw new Error(`community entry not found: ${entryId}`);
          }
          entries.splice(index, 1);
        },
        async update(entryId, command) {
          const entry = findEntry(entryId);
          Object.assign(entry, command);
          return entry;
        },
        publicationReadiness: {
          async retrieve(entryId) {
            return evaluateCommunityPublicationReadiness(findEntry(entryId));
          },
        },
        recommendations: {
          async list(entryId) {
            const current = findEntry(entryId);
            return buildCommunityRecommendations(current, entries).map((item) => item.entry);
          },
        },
      },
      members: {
        async current(communityId) {
          const userId = `${currentUserId}-membership`;
          return communityMembers(communityId).find((member) => member.id === userId);
        },
        async join(communityId) {
          const category = findCategory(communityId);
          const existing = await this.current(communityId);
          if (existing) {
            return existing;
          }
          assertMemberCapacity(category);
          const member: SdkworkCommunityMember = {
            bio: undefined,
            communityId,
            id: `${currentUserId}-membership`,
            joinedAt: new Date().toISOString(),
            role: "member",
            status: "active",
            user: { id: currentUserId, name: "Local User" },
          };
          communityMembers(communityId).push(member);
          category.memberCount = (category.memberCount ?? 0) + 1;
          return member;
        },
        async list(communityId) {
          return communityMembers(communityId);
        },
        async remove(communityId, memberId) {
          const list = communityMembers(communityId);
          const index = list.findIndex((member) => member.id === memberId);
          if (index < 0) {
            throw new Error(`community member not found: ${memberId}`);
          }
          list.splice(index, 1);
          const category = findCategory(communityId);
          category.memberCount = Math.max((category.memberCount ?? 1) - 1, 0);
        },
        async updateRole(communityId, memberId, role) {
          const member = findMember(communityId, memberId);
          member.role = role;
          return member;
        },
        async updateStatus(communityId, memberId, status) {
          const member = findMember(communityId, memberId);
          member.status = status;
          return member;
        },
        async activate(communityId, command) {
          findCategory(communityId);
          const tier = communityTiers(communityId).find(
            (candidate) => candidate.id === command.tierId && candidate.enabled,
          );
          if (!tier) {
            throw new Error(`community membership tier not found: ${command.tierId}`);
          }
          const category = findCategory(communityId);
          const userId = `${currentUserId}-membership`;
          const existing = communityMembers(communityId).find(
            (candidate) => candidate.id === userId,
          );
          if (existing?.lastOrderId === command.orderId) {
            return existing;
          }
          let member = existing;
          if (!member) {
            assertMemberCapacity(category);
            member = {
              bio: undefined,
              communityId,
              id: userId,
              joinedAt: new Date().toISOString(),
              role: "member",
              status: "active",
              user: { id: currentUserId, name: "Local User" },
            };
            communityMembers(communityId).push(member);
            category.memberCount = (category.memberCount ?? 0) + 1;
          }
          const expiresAt = new Date(
            Date.now() + tier.durationDays * 24 * 60 * 60 * 1000,
          ).toISOString();
          member.tierId = tier.id;
          member.tierName = tier.name;
          member.membershipExpiresAt = expiresAt;
          member.lastOrderId = command.orderId;
          return member;
        },
      },
      tiers: {
        async create(communityId, command) {
          findCategory(communityId);
          const tier: SdkworkCommunityMembershipTier = {
            benefits: command.benefits ?? [],
            categoryId: communityId,
            description: command.description,
            durationDays: command.durationDays ?? 365,
            enabled: false,
            id: `tier-${communityTiers(communityId).length + 1}`,
            name: command.name,
            price: command.price,
            sortOrder: command.sortOrder ?? 0,
            tenantId: "local",
          };
          communityTiers(communityId).push(tier);
          return tier;
        },
        async list(communityId) {
          return communityTiers(communityId).filter((tier) => tier.enabled);
        },
        async listAll(communityId) {
          return communityTiers(communityId);
        },
        async publish(communityId, tierId) {
          const tier = findTier(communityId, tierId);
          tier.enabled = true;
          tier.catalogPackageId = tier.catalogPackageId ?? `local-package-${tierId}`;
          return tier;
        },
        async unpublish(communityId, tierId) {
          const tier = findTier(communityId, tierId);
          tier.enabled = false;
          return tier;
        },
        async remove(communityId, tierId) {
          const list = communityTiers(communityId);
          const index = list.findIndex((tier) => tier.id === tierId);
          if (index < 0) {
            throw new Error(`community membership tier not found: ${tierId}`);
          }
          list.splice(index, 1);
        },
        async update(communityId, tierId, command) {
          const tier = findTier(communityId, tierId);
          if (command.name !== undefined) {
            tier.name = command.name;
          }
          if (command.description !== undefined) {
            tier.description = command.description;
          }
          if (command.price !== undefined) {
            tier.price = command.price;
          }
          if (command.durationDays !== undefined) {
            tier.durationDays = command.durationDays;
          }
          if (command.benefits !== undefined) {
            tier.benefits = [...command.benefits];
          }
          if (command.sortOrder !== undefined) {
            tier.sortOrder = command.sortOrder;
          }
          return tier;
        },
      },
      groups: {
        async create(communityId, command) {
          findCategory(communityId);
          const group: SdkworkCommunityGroup = {
            communityId,
            createdAt: new Date().toISOString(),
            description: command.description,
            id: `group-${communityGroups(communityId).length + 1}`,
            memberCount: command.memberCount ?? 0,
            name: command.name,
            platform: command.platform,
            qrCodes: command.qrCodes,
          };
          communityGroups(communityId).push(group);
          return group;
        },
        async list(communityId) {
          return communityGroups(communityId);
        },
        async remove(communityId, groupId) {
          const list = communityGroups(communityId);
          const index = list.findIndex((group) => group.id === groupId);
          if (index < 0) {
            throw new Error(`community group not found: ${groupId}`);
          }
          list.splice(index, 1);
        },
        async update(communityId, groupId, command) {
          const group = findGroup(communityId, groupId);
          Object.assign(group, command);
          return group;
        },
      },
    },
  };
}
