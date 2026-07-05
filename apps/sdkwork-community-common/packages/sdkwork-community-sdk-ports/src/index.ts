import {
  buildCommunityRecommendations,
  filterCommunityEntries,
  type FilterCommunityEntriesOptions,
  type SdkworkCommunityCategory,
  type SdkworkCommunityComment,
  type SdkworkCommunityEntry,
  type SdkworkCommunityEntryKind,
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
      list(): Promise<readonly SdkworkCommunityCategory[]>;
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
  };
}

export interface CreateInMemoryCommunityAppSdkPortOptions {
  entries?: readonly SdkworkCommunityEntry[];
}

export function createInMemoryCommunityAppSdkPort(
  options: CreateInMemoryCommunityAppSdkPortOptions = {},
): SdkworkCommunityAppSdkPort {
  const entries = [...(options.entries ?? [])];
  const comments: SdkworkCommunityComment[] = [];
  const reactions = new Map<string, Set<string>>();

  function findEntry(entryId: string): SdkworkCommunityEntry {
    const entry = entries.find((candidate) => candidate.id === entryId);
    if (!entry) {
      throw new Error(`community entry not found: ${entryId}`);
    }
    return entry;
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
        async list() {
          return [];
        },
      },
      comments: {
        async list(entryId) {
          return comments.filter((comment) => comment.entryId === entryId);
        },
        async create(entryId, command) {
          findEntry(entryId);
          const comment: SdkworkCommunityComment = {
            author: { id: "local-user", name: "Local User" },
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
            activeUsers.add("local-user");
          } else {
            activeUsers.delete("local-user");
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
            author: { id: "local-user", name: "Local User" },
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
    },
  };
}
