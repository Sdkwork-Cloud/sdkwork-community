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

export interface SdkworkCommunityApiResult<T> {
  code: string;
  data: T;
  message: string;
  requestId: string;
}

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
      list(params?: SdkworkCommunityListParams): Promise<SdkworkCommunityApiResult<SdkworkCommunityEntry[]>>;
    };
    entries: {
      create(command: SdkworkCommunityEntryCommand): Promise<SdkworkCommunityApiResult<SdkworkCommunityEntry>>;
      retrieve(entryId: string): Promise<SdkworkCommunityApiResult<SdkworkCommunityEntry>>;
      update(entryId: string, command: Partial<SdkworkCommunityEntryCommand>): Promise<SdkworkCommunityApiResult<SdkworkCommunityEntry>>;
      publicationReadiness: {
        retrieve(entryId: string): Promise<SdkworkCommunityApiResult<SdkworkCommunityPublicationReadiness>>;
      };
      recommendations: {
        list(entryId: string): Promise<SdkworkCommunityApiResult<SdkworkCommunityEntry[]>>;
      };
    };
  };
}

export interface CreateInMemoryCommunityAppSdkPortOptions {
  entries?: readonly SdkworkCommunityEntry[];
  requestId?: string;
}

export function createInMemoryCommunityAppSdkPort(
  options: CreateInMemoryCommunityAppSdkPortOptions = {},
): SdkworkCommunityAppSdkPort {
  const entries = [...(options.entries ?? [])];
  const requestId = options.requestId ?? "00000000-0000-4000-8000-000000000000";

  function result<T>(data: T): SdkworkCommunityApiResult<T> {
    return {
      code: "ok",
      data,
      message: "OK",
      requestId,
    };
  }

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
          return result(filterCommunityEntries(entries, toFilterOptions(params)));
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
          return result(entry);
        },
        async retrieve(entryId) {
          return result(findEntry(entryId));
        },
        async update(entryId, command) {
          const entry = findEntry(entryId);
          Object.assign(entry, command);
          return result(entry);
        },
        publicationReadiness: {
          async retrieve(entryId) {
            return result(evaluateCommunityPublicationReadiness(findEntry(entryId)));
          },
        },
        recommendations: {
          async list(entryId) {
            const current = findEntry(entryId);
            return result(buildCommunityRecommendations(current, entries).map((item) => item.entry));
          },
        },
      },
    },
  };
}
