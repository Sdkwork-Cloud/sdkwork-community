export const COMMUNITY_OWNER = "sdkwork-community" as const;
export const COMMUNITY_DOMAIN = "community" as const;
export const COMMUNITY_TAG = "community" as const;

export const COMMUNITY_ENTRY_KIND_VALUES = ["announcement", "discussion", "question", "resource", "service"] as const;
export const COMMUNITY_REVIEW_STATE_VALUES = ["approved", "draft", "flagged", "pending-review", "rejected"] as const;

export type SdkworkCommunityEntryKind = (typeof COMMUNITY_ENTRY_KIND_VALUES)[number];
export type SdkworkCommunityFeedMode = "latest" | "top" | "trending" | "unanswered";
export type SdkworkCommunityReviewState = (typeof COMMUNITY_REVIEW_STATE_VALUES)[number];

export interface SdkworkMediaResource {
  bucketId?: string;
  fileName?: string;
  id: string;
  kind: "audio" | "document" | "image" | "video" | "other";
  mimeType?: string;
  objectKey?: string;
  publicUrl?: string;
  sizeBytes?: number | string;
  source?: string;
}

export interface SdkworkCommunityAuthor {
  avatar?: SdkworkMediaResource;
  id: string;
  name: string;
}

export interface SdkworkCommunityStats {
  commentCount?: number;
  reactionCount?: number;
  shareCount?: number;
  viewCount?: number;
}

export interface SdkworkCommunityEntry {
  author: SdkworkCommunityAuthor;
  categoryId: string;
  categoryLabel?: string;
  excerpt?: string;
  hasAcceptedAnswer?: boolean;
  id: string;
  isFeatured?: boolean;
  isPinned?: boolean;
  kind: SdkworkCommunityEntryKind;
  lastActivityAt?: Date | number | string | null;
  publishedAt?: Date | number | string | null;
  reviewState: SdkworkCommunityReviewState;
  stats: SdkworkCommunityStats;
  tags?: readonly string[];
  title: string;
}

export interface SdkworkCommunityApiRoute {
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  operationId: string;
  path: string;
  public: boolean;
  tag: typeof COMMUNITY_TAG;
}

export interface SortCommunityEntriesOptions {
  mode?: SdkworkCommunityFeedMode;
}

export interface FilterCommunityEntriesOptions extends SortCommunityEntriesOptions {
  categories?: readonly string[];
  featuredOnly?: boolean;
  kinds?: readonly SdkworkCommunityEntryKind[];
  query?: string;
  reviewStates?: readonly SdkworkCommunityReviewState[];
  tags?: readonly string[];
}

export interface SdkworkCommunityFeedSummary {
  featuredEntries: number;
  flaggedEntries: number;
  pendingReviewEntries: number;
  totalEntries: number;
  unansweredQuestions: number;
}

export type SdkworkCommunityRecommendationReason =
  | "answered"
  | "featured"
  | "same-author"
  | "shared-category"
  | "shared-kind"
  | "shared-tag"
  | "trending";

export interface SdkworkCommunityRecommendation {
  entry: SdkworkCommunityEntry;
  reasons: SdkworkCommunityRecommendationReason[];
  score: number;
}

export interface BuildCommunityRecommendationsOptions {
  limit?: number;
}

export type SdkworkCommunityEntryDigestStatus = "attention" | "draft" | "featured" | "live" | "rejected";

export interface CreateCommunityEntryDigestOptions {
  activeEntryId?: string;
}

export interface SdkworkCommunityEntryDigest {
  authorAvatar?: SdkworkMediaResource;
  authorName: string;
  categoryId: string;
  categoryLabel?: string;
  commentCount: number;
  digestStatus: SdkworkCommunityEntryDigestStatus;
  id: string;
  isActive: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  isTrending: boolean;
  isUnanswered: boolean;
  kind: SdkworkCommunityEntryKind;
  lastActivityAt?: Date | number | string | null;
  publishedAt?: Date | number | string | null;
  reactionCount: number;
  reviewState: SdkworkCommunityReviewState;
  shareCount: number;
  tagCount: number;
  title: string;
  viewCount: number;
}

export interface SdkworkCommunityEntryDigestSummary {
  attentionEntries: number;
  draftEntries: number;
  featuredEntries: number;
  liveEntries: number;
  rejectedEntries: number;
  totalEntries: number;
  trendingEntries: number;
  unansweredQuestions: number;
}

export type SdkworkCommunityPublicationIssue =
  | "flagged"
  | "missing-body"
  | "missing-category"
  | "missing-excerpt"
  | "missing-tags"
  | "missing-title"
  | "pending-review"
  | "rejected";

export interface SdkworkCommunityPublicationChecklist {
  hasBody: boolean;
  hasCategory: boolean;
  hasExcerpt: boolean;
  hasMinimumTags: boolean;
  hasTitle: boolean;
}

export interface EvaluateCommunityPublicationReadinessOptions {
  allowPendingReview?: boolean;
  hasBody?: boolean;
  minimumTags?: number;
}

export interface SdkworkCommunityPublicationReadiness {
  checklist: SdkworkCommunityPublicationChecklist;
  degraded: boolean;
  issues: SdkworkCommunityPublicationIssue[];
  ready: boolean;
}

export const COMMUNITY_APP_API_ROUTES: readonly SdkworkCommunityApiRoute[] = [
  route("GET", "/app/v3/api/community/categories", "categories.list", false),
  route("GET", "/app/v3/api/community/feed", "feed.list", false),
  route("GET", "/app/v3/api/community/entries/{entryId}", "entries.retrieve", false),
  route("GET", "/app/v3/api/community/entries/{entryId}/recommendations", "entries.recommendations.list", false),
  route("POST", "/app/v3/api/community/entries", "entries.create", false),
  route("PATCH", "/app/v3/api/community/entries/{entryId}", "entries.update", false),
  route("GET", "/app/v3/api/community/entries/{entryId}/publication_readiness", "entries.publicationReadiness.retrieve", false),
  route("GET", "/app/v3/api/community/entries/{entryId}/comments", "comments.list", false),
  route("POST", "/app/v3/api/community/entries/{entryId}/comments", "comments.create", false),
];

export const COMMUNITY_BACKEND_API_ROUTES: readonly SdkworkCommunityApiRoute[] = [
  route("GET", "/backend/v3/api/community/categories", "categories.management.list", false),
  route("POST", "/backend/v3/api/community/categories", "categories.create", false),
  route("PATCH", "/backend/v3/api/community/categories/{categoryId}", "categories.update", false),
  route("DELETE", "/backend/v3/api/community/categories/{categoryId}", "categories.delete", false),
  route("GET", "/backend/v3/api/community/entries", "entries.management.list", false),
  route("POST", "/backend/v3/api/community/entries/{entryId}/moderation", "entries.moderation.update", false),
  route("POST", "/backend/v3/api/community/entries/{entryId}/feature", "entries.feature", false),
  route("POST", "/backend/v3/api/community/entries/{entryId}/pin", "entries.pin", false),
  route("DELETE", "/backend/v3/api/community/entries/{entryId}", "entries.delete", false),
  route("GET", "/backend/v3/api/community/moderation/queue", "moderation.queue.list", false),
  route("POST", "/backend/v3/api/community/recommendations/rebuild", "recommendations.rebuild", false),
];

export const COMMUNITY_OPEN_API_ROUTES: readonly SdkworkCommunityApiRoute[] = [
  route("GET", "/community/v3/api/categories", "categories.public.list", true),
  route("GET", "/community/v3/api/feed", "feed.public.list", true),
  route("GET", "/community/v3/api/entries/{entryId}", "entries.public.retrieve", true),
  route("GET", "/community/v3/api/entries/by_slug/{slug}", "entries.publicBySlug.retrieve", true),
];

function route(
  method: SdkworkCommunityApiRoute["method"],
  path: string,
  operationId: string,
  isPublic: boolean,
): SdkworkCommunityApiRoute {
  return {
    method,
    operationId,
    path,
    public: isPublic,
    tag: COMMUNITY_TAG,
  };
}

function toTimestamp(value: Date | number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeQuery(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function includesNormalized(value: string | undefined, query: string): boolean {
  return Boolean(value?.toLowerCase().includes(query));
}

function activityTimestamp(entry: SdkworkCommunityEntry): number {
  return toTimestamp(entry.lastActivityAt ?? entry.publishedAt);
}

function topScore(entry: SdkworkCommunityEntry): number {
  return (
    (entry.stats.reactionCount ?? 0) * 10 +
    (entry.stats.commentCount ?? 0) * 12 +
    (entry.stats.shareCount ?? 0) * 14 +
    (entry.stats.viewCount ?? 0)
  );
}

function trendingScore(entry: SdkworkCommunityEntry): number {
  return (
    (entry.stats.reactionCount ?? 0) * 8 +
    (entry.stats.commentCount ?? 0) * 10 +
    (entry.stats.shareCount ?? 0) * 12 +
    Math.floor((entry.stats.viewCount ?? 0) / 25)
  );
}

function isUnansweredQuestion(entry: SdkworkCommunityEntry): boolean {
  return entry.kind === "question" && !entry.hasAcceptedAnswer;
}

function isTrendingEntry(entry: SdkworkCommunityEntry): boolean {
  return Boolean(entry.isFeatured) || trendingScore(entry) >= 200;
}

function hasMatchingTag(entry: SdkworkCommunityEntry, tags: Set<string>): boolean {
  return Boolean(entry.tags?.some((tag) => tags.has(tag.toLowerCase())));
}

function resolveCommunityEntryDigestStatus(entry: SdkworkCommunityEntry): SdkworkCommunityEntryDigestStatus {
  if (entry.reviewState === "flagged" || entry.reviewState === "pending-review") {
    return "attention";
  }
  if (entry.reviewState === "draft") {
    return "draft";
  }
  if (entry.reviewState === "rejected") {
    return "rejected";
  }
  if (entry.isFeatured || entry.isPinned) {
    return "featured";
  }
  return "live";
}

function sharedTagCount(left: SdkworkCommunityEntry, right: SdkworkCommunityEntry): number {
  const leftTags = new Set((left.tags ?? []).map((tag) => tag.toLowerCase()));
  let count = 0;
  for (const tag of right.tags ?? []) {
    if (leftTags.has(tag.toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

function matchesQuery(entry: SdkworkCommunityEntry, query: string): boolean {
  if (!query) {
    return true;
  }
  return (
    includesNormalized(entry.title, query) ||
    includesNormalized(entry.excerpt, query) ||
    includesNormalized(entry.author.name, query) ||
    Boolean(entry.tags?.some((tag) => tag.toLowerCase().includes(query)))
  );
}

function compareAlphabetically(left: SdkworkCommunityEntry, right: SdkworkCommunityEntry): number {
  return left.title.localeCompare(right.title);
}

export function normalizeCommunityReviewState(value: string | null | undefined): SdkworkCommunityReviewState {
  const normalized = value?.trim().toLowerCase();
  switch (normalized) {
    case "active":
    case "approved":
    case "online":
    case "published":
    case "visible":
      return "approved";
    case "flagged":
    case "needs-attention":
    case "reported":
      return "flagged";
    case "in-review":
    case "moderation":
    case "pending":
    case "pending-review":
    case "pending_review":
    case "queued":
    case "review":
    case "under-review":
      return "pending-review";
    case "hidden":
    case "removed":
    case "rejected":
      return "rejected";
    case "draft":
    default:
      return "draft";
  }
}

export function sortCommunityEntries(
  entries: readonly SdkworkCommunityEntry[],
  options: SortCommunityEntriesOptions = {},
): SdkworkCommunityEntry[] {
  const mode = options.mode ?? "latest";
  return [...entries].sort((left, right) => {
    if (mode === "unanswered") {
      const unansweredDifference = Number(isUnansweredQuestion(right)) - Number(isUnansweredQuestion(left));
      if (unansweredDifference !== 0) {
        return unansweredDifference;
      }
    }

    const pinnedDifference = Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned));
    if (pinnedDifference !== 0) {
      return pinnedDifference;
    }

    if (mode === "trending") {
      const featuredDifference = Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
      if (featuredDifference !== 0) {
        return featuredDifference;
      }
      const scoreDifference = trendingScore(right) - trendingScore(left);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
    }

    if (mode === "top") {
      const scoreDifference = topScore(right) - topScore(left);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
    }

    const activityDifference = activityTimestamp(right) - activityTimestamp(left);
    if (activityDifference !== 0) {
      return activityDifference;
    }

    if (mode === "latest" || mode === "unanswered") {
      const scoreDifference = topScore(right) - topScore(left);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
    }

    return compareAlphabetically(left, right);
  });
}

export function filterCommunityEntries(
  entries: readonly SdkworkCommunityEntry[],
  options: FilterCommunityEntriesOptions = {},
): SdkworkCommunityEntry[] {
  const categories = options.categories ? new Set(options.categories.map((category) => category.toLowerCase())) : null;
  const kinds = options.kinds ? new Set(options.kinds) : null;
  const reviewStates = options.reviewStates ? new Set(options.reviewStates) : null;
  const tags = options.tags ? new Set(options.tags.map((tag) => tag.toLowerCase())) : null;
  const query = normalizeQuery(options.query);

  return sortCommunityEntries(entries, { mode: options.mode }).filter((entry) => {
    if (categories && !categories.has(entry.categoryId.toLowerCase())) {
      return false;
    }
    if (options.featuredOnly && !entry.isFeatured) {
      return false;
    }
    if (kinds && !kinds.has(entry.kind)) {
      return false;
    }
    if (reviewStates && !reviewStates.has(entry.reviewState)) {
      return false;
    }
    if (tags && !hasMatchingTag(entry, tags)) {
      return false;
    }
    return matchesQuery(entry, query);
  });
}

export function summarizeCommunityFeed(entries: readonly SdkworkCommunityEntry[]): SdkworkCommunityFeedSummary {
  return {
    featuredEntries: entries.filter((entry) => entry.isFeatured).length,
    flaggedEntries: entries.filter((entry) => entry.reviewState === "flagged").length,
    pendingReviewEntries: entries.filter((entry) => entry.reviewState === "pending-review").length,
    totalEntries: entries.length,
    unansweredQuestions: entries.filter((entry) => isUnansweredQuestion(entry)).length,
  };
}

export function buildCommunityRecommendations(
  currentEntry: SdkworkCommunityEntry,
  entries: readonly SdkworkCommunityEntry[],
  options: BuildCommunityRecommendationsOptions = {},
): SdkworkCommunityRecommendation[] {
  return entries
    .filter((entry) => entry.id !== currentEntry.id && entry.reviewState === "approved")
    .map((entry) => {
      const reasons: SdkworkCommunityRecommendationReason[] = [];
      let score = 0;
      if (entry.author.id === currentEntry.author.id) {
        reasons.push("same-author");
        score += 18;
      }
      if (entry.categoryId === currentEntry.categoryId) {
        reasons.push("shared-category");
        score += 40;
      }
      if (entry.kind === currentEntry.kind) {
        reasons.push("shared-kind");
        score += 10;
      }
      const tagsInCommon = sharedTagCount(currentEntry, entry);
      if (tagsInCommon > 0) {
        reasons.push("shared-tag");
        score += tagsInCommon * 12;
      }
      if (entry.isFeatured) {
        reasons.push("featured");
        score += 6;
      }
      if (entry.hasAcceptedAnswer) {
        reasons.push("answered");
        score += 8;
      }
      if (isTrendingEntry(entry)) {
        reasons.push("trending");
        score += 5;
      }
      return { entry, reasons, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return activityTimestamp(right.entry) - activityTimestamp(left.entry);
    })
    .slice(0, options.limit ?? 3);
}

export function createCommunityEntryDigest(
  entry: SdkworkCommunityEntry,
  options: CreateCommunityEntryDigestOptions = {},
): SdkworkCommunityEntryDigest {
  return {
    ...(entry.author.avatar ? { authorAvatar: entry.author.avatar } : {}),
    authorName: entry.author.name,
    categoryId: entry.categoryId,
    ...(entry.categoryLabel ? { categoryLabel: entry.categoryLabel } : {}),
    commentCount: entry.stats.commentCount ?? 0,
    digestStatus: resolveCommunityEntryDigestStatus(entry),
    id: entry.id,
    isActive: entry.id === options.activeEntryId,
    isFeatured: Boolean(entry.isFeatured),
    isPinned: Boolean(entry.isPinned),
    isTrending: isTrendingEntry(entry),
    isUnanswered: isUnansweredQuestion(entry),
    kind: entry.kind,
    ...(entry.lastActivityAt !== undefined ? { lastActivityAt: entry.lastActivityAt } : {}),
    ...(entry.publishedAt !== undefined ? { publishedAt: entry.publishedAt } : {}),
    reactionCount: entry.stats.reactionCount ?? 0,
    reviewState: entry.reviewState,
    shareCount: entry.stats.shareCount ?? 0,
    tagCount: entry.tags?.length ?? 0,
    title: entry.title,
    viewCount: entry.stats.viewCount ?? 0,
  };
}

export function summarizeCommunityEntryDigests(
  digests: readonly SdkworkCommunityEntryDigest[],
): SdkworkCommunityEntryDigestSummary {
  let attentionEntries = 0;
  let draftEntries = 0;
  let featuredEntries = 0;
  let liveEntries = 0;
  let rejectedEntries = 0;
  let trendingEntries = 0;
  let unansweredQuestions = 0;

  for (const digest of digests) {
    if (digest.digestStatus === "attention") {
      attentionEntries += 1;
    }
    if (digest.digestStatus === "draft") {
      draftEntries += 1;
    }
    if (digest.digestStatus === "featured") {
      featuredEntries += 1;
    }
    if (digest.digestStatus === "live") {
      liveEntries += 1;
    }
    if (digest.digestStatus === "rejected") {
      rejectedEntries += 1;
    }
    if (digest.isTrending) {
      trendingEntries += 1;
    }
    if (digest.isUnanswered) {
      unansweredQuestions += 1;
    }
  }

  return {
    attentionEntries,
    draftEntries,
    featuredEntries,
    liveEntries,
    rejectedEntries,
    totalEntries: digests.length,
    trendingEntries,
    unansweredQuestions,
  };
}

export function evaluateCommunityPublicationReadiness(
  entry: SdkworkCommunityEntry,
  options: EvaluateCommunityPublicationReadinessOptions = {},
): SdkworkCommunityPublicationReadiness {
  const excerptRequired = entry.kind === "resource" || entry.kind === "service";
  const checklist: SdkworkCommunityPublicationChecklist = {
    hasBody: options.hasBody ?? Boolean(entry.excerpt?.trim()),
    hasCategory: entry.categoryId.trim().length > 0,
    hasExcerpt: excerptRequired ? Boolean(entry.excerpt?.trim()) : true,
    hasMinimumTags: (entry.tags?.length ?? 0) >= (options.minimumTags ?? 1),
    hasTitle: entry.title.trim().length > 0,
  };
  const issues = Array.from(
    new Set<SdkworkCommunityPublicationIssue>([
      ...(entry.reviewState === "flagged" ? ["flagged" as const] : []),
      ...(entry.reviewState === "pending-review" ? ["pending-review" as const] : []),
      ...(entry.reviewState === "rejected" ? ["rejected" as const] : []),
      ...(checklist.hasTitle ? [] : ["missing-title" as const]),
      ...(checklist.hasCategory ? [] : ["missing-category" as const]),
      ...(checklist.hasBody ? [] : ["missing-body" as const]),
      ...(checklist.hasExcerpt ? [] : ["missing-excerpt" as const]),
      ...(checklist.hasMinimumTags ? [] : ["missing-tags" as const]),
    ]),
  );
  const blockedIssues = new Set<SdkworkCommunityPublicationIssue>([
    "flagged",
    "missing-body",
    "missing-category",
    "missing-excerpt",
    "missing-tags",
    "missing-title",
    "rejected",
    ...(options.allowPendingReview ? [] : ["pending-review" as const]),
  ]);
  const ready = issues.every((issue) => !blockedIssues.has(issue));

  return {
    checklist,
    degraded: ready && issues.length > 0,
    issues,
    ready,
  };
}
