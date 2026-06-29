import {
  buildCommunityRecommendations,
  filterCommunityEntries,
  type FilterCommunityEntriesOptions,
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
  categoryId: string;
  excerpt?: string;
  kind: SdkworkCommunityEntry["kind"];
  tags?: readonly string[];
  title: string;
}

export interface SdkworkCommunityAppSdkPort {
  community: {
    feed: {
      list(params?: SdkworkCommunityListParams): Promise<SdkworkCommunityEntry[]>;
    };
    entries: {
      create(command: SdkworkCommunityEntryCommand): Promise<SdkworkCommunityEntry>;
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
      feed: {
        async list(params = {}) {
          return filterCommunityEntries(entries, toFilterOptions(params));
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
