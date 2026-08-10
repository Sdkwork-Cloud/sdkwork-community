import {
  buildCommunityRecommendations,
  filterCommunityEntries,
  type FilterCommunityEntriesOptions,
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
  type SdkworkCommunityPublicationReadiness,
  type SdkworkCommunityReviewState,
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
  for (const membership of options.memberships ?? []) {
    const list = members.get(membership.communityId) ?? [];
    list.push(membership);
    members.set(membership.communityId, list);
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
          findCategory(communityId);
          const existing = await this.current(communityId);
          if (existing) {
            return existing;
          }
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
          const category = findCategory(communityId);
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
