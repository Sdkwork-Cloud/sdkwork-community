import type {
  SdkworkCommunityCategory,
  SdkworkCommunityComment,
  SdkworkCommunityEntry,
  SdkworkCommunityEntryKind,
  SdkworkCommunityPublicationIssue,
  SdkworkCommunityPublicationReadiness,
  SdkworkCommunityReviewState,
} from "@sdkwork/community-contracts";
import type {
  SdkworkCommunityAppSdkPort,
  SdkworkCommunityCommentCommand,
  SdkworkCommunityEntryCommand,
  SdkworkCommunityListParams,
  SdkworkCommunityReactionCommand,
  SdkworkCommunityReactionSetResult,
} from "@sdkwork/community-sdk-ports";
import type { SdkworkCommunityAppClient } from "@sdkwork/community-app-sdk";
import type { CommunityEntryCommand } from "@sdkwork/community-app-sdk";

const PUBLICATION_ISSUES = new Set<SdkworkCommunityPublicationIssue>([
  "flagged",
  "missing-body",
  "missing-category",
  "missing-excerpt",
  "missing-tags",
  "missing-title",
  "pending-review",
  "rejected",
]);

function toCommunityEntryCommand(command: SdkworkCommunityEntryCommand): CommunityEntryCommand {
  return {
    categoryId: command.categoryId,
    kind: command.kind,
    title: command.title,
    excerpt: command.excerpt,
    body: command.body,
    tags: command.tags ? [...command.tags] : undefined,
  };
}

async function toMergedCommunityEntryCommand(
  client: SdkworkCommunityAppClient,
  entryId: string,
  command: Partial<SdkworkCommunityEntryCommand>,
): Promise<CommunityEntryCommand> {
  const existing = await client.community.entries.retrieve(entryId);
  const record = existing as Record<string, unknown>;
  return {
    categoryId: command.categoryId ?? String(record.categoryId ?? ""),
    kind: (command.kind ?? String(record.kind ?? "discussion")) as CommunityEntryCommand["kind"],
    title: command.title ?? String(record.title ?? ""),
    excerpt: command.excerpt ?? (record.excerpt ? String(record.excerpt) : undefined),
    body: command.body ?? (record.body ? String(record.body) : undefined),
    tags: command.tags
      ? [...command.tags]
      : Array.isArray(record.tags)
        ? record.tags.map((tag) => String(tag))
        : undefined,
  };
}

function mapReviewState(value: string): SdkworkCommunityReviewState {
  return value as SdkworkCommunityReviewState;
}

function mapEntryKind(value: string): SdkworkCommunityEntryKind {
  return value as SdkworkCommunityEntryKind;
}

function mapEntry(record: Record<string, unknown>): SdkworkCommunityEntry {
  const author = record.author as Record<string, unknown> | undefined;
  const stats = (record.stats as Record<string, unknown> | undefined) ?? {};

  return {
    author: {
      id: String(author?.id ?? ""),
      name: String(author?.name ?? ""),
    },
    categoryId: String(record.categoryId ?? ""),
    categoryLabel: record.categoryLabel ? String(record.categoryLabel) : undefined,
    excerpt: record.excerpt ? String(record.excerpt) : undefined,
    hasAcceptedAnswer: Boolean(record.hasAcceptedAnswer),
    id: String(record.id ?? ""),
    isFeatured: record.isFeatured === undefined ? undefined : Boolean(record.isFeatured),
    isPinned: record.isPinned === undefined ? undefined : Boolean(record.isPinned),
    kind: mapEntryKind(String(record.kind ?? "discussion")),
    lastActivityAt: record.lastActivityAt as SdkworkCommunityEntry["lastActivityAt"],
    publishedAt: record.publishedAt as SdkworkCommunityEntry["publishedAt"],
    reviewState: mapReviewState(String(record.reviewState ?? "draft")),
    stats: {
      commentCount: stats.commentCount === undefined ? undefined : Number(stats.commentCount),
      reactionCount: stats.reactionCount === undefined ? undefined : Number(stats.reactionCount),
      shareCount: stats.shareCount === undefined ? undefined : Number(stats.shareCount),
      viewCount: stats.viewCount === undefined ? undefined : Number(stats.viewCount),
    },
    tags: Array.isArray(record.tags) ? record.tags.map((tag) => String(tag)) : undefined,
    title: String(record.title ?? ""),
  };
}

function mapPublicationReadiness(record: Record<string, unknown>): SdkworkCommunityPublicationReadiness {
  const checklist = (record.checklist as Record<string, unknown> | undefined) ?? {};
  return {
    checklist: {
      hasBody: Boolean(checklist.hasBody),
      hasCategory: Boolean(checklist.hasCategory),
      hasExcerpt: Boolean(checklist.hasExcerpt),
      hasMinimumTags: Boolean(checklist.hasMinimumTags),
      hasTitle: Boolean(checklist.hasTitle),
    },
    degraded: Boolean(record.degraded),
    issues: Array.isArray(record.issues)
      ? record.issues
          .map((issue) => String(issue))
          .filter((issue): issue is SdkworkCommunityPublicationIssue =>
            PUBLICATION_ISSUES.has(issue as SdkworkCommunityPublicationIssue),
          )
      : [],
    ready: Boolean(record.ready),
  };
}

function mapCategory(record: Record<string, unknown>): SdkworkCommunityCategory {
  return {
    description: record.description ? String(record.description) : undefined,
    enabled: record.enabled === undefined ? true : Boolean(record.enabled),
    id: String(record.id ?? ""),
    priority: Number(record.priority ?? 0),
    slug: String(record.slug ?? ""),
    tenantId: String(record.tenantId ?? ""),
    title: String(record.title ?? ""),
  };
}

function mapComment(record: Record<string, unknown>): SdkworkCommunityComment {
  const author = record.author as Record<string, unknown> | undefined;
  const avatar = author?.avatar as Record<string, unknown> | undefined;

  return {
    author: {
      avatar: avatar
        ? {
            id: String(avatar.id ?? ""),
            kind: "image",
            publicUrl: avatar.publicUrl ? String(avatar.publicUrl) : undefined,
          }
        : undefined,
      id: String(author?.id ?? ""),
      name: String(author?.name ?? ""),
    },
    body: String(record.body ?? ""),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    entryId: String(record.entryId ?? ""),
    id: String(record.id ?? ""),
    isAcceptedAnswer:
      record.isAcceptedAnswer === undefined ? undefined : Boolean(record.isAcceptedAnswer),
    reviewState: mapReviewState(String(record.reviewState ?? "approved")),
    tenantId: String(record.tenantId ?? ""),
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
  };
}

function mapPageItems(page: { items: Record<string, unknown>[] }): SdkworkCommunityEntry[] {
  return page.items.map((item) => mapEntry(item));
}

function mapReactionSet(record: Record<string, unknown>): SdkworkCommunityReactionSetResult {
  return {
    accepted: Boolean(record.accepted),
    reactionCount: Number(record.reactionCount ?? 0),
    resourceId: record.resourceId ? String(record.resourceId) : undefined,
    status: record.status ? String(record.status) : undefined,
  };
}

export function createGeneratedCommunityAppSdkPort(
  client: SdkworkCommunityAppClient,
): SdkworkCommunityAppSdkPort {
  return {
    community: {
      categories: {
        async list() {
          const page = await client.community.categories.list();
          return page.items.map((item) => mapCategory(item as Record<string, unknown>));
        },
      },
      comments: {
        async list(entryId: string) {
          const page = await client.community.comments.list(entryId);
          return page.items.map((item) => mapComment(item as Record<string, unknown>));
        },
        async create(entryId: string, command: SdkworkCommunityCommentCommand) {
          const item = await client.community.comments.create(entryId, { body: command.body });
          return mapComment(item as Record<string, unknown>);
        },
      },
      feed: {
        async list(params: SdkworkCommunityListParams = {}) {
          const page = await client.community.feed.list(params);
          return mapPageItems(page);
        },
      },
      reactions: {
        async set(entryId: string, command: SdkworkCommunityReactionCommand) {
          const item = await client.community.reactions.set(entryId, {
            reactionType: command.reactionType,
            active: command.active,
          });
          return mapReactionSet(item as Record<string, unknown>);
        },
      },
      entries: {
        async create(command: SdkworkCommunityEntryCommand) {
          const item = await client.community.entries.create(toCommunityEntryCommand(command));
          return mapEntry(item as Record<string, unknown>);
        },
        async retrieve(entryId: string) {
          const item = await client.community.entries.retrieve(entryId);
          return mapEntry(item as Record<string, unknown>);
        },
        async delete(entryId: string) {
          await client.community.entries.delete(entryId);
        },
        async update(entryId: string, command: Partial<SdkworkCommunityEntryCommand>) {
          const body = await toMergedCommunityEntryCommand(client, entryId, command);
          const item = await client.community.entries.update(entryId, body);
          return mapEntry(item as Record<string, unknown>);
        },
        publicationReadiness: {
          async retrieve(entryId: string) {
            const item = await client.community.entries.publicationReadiness.retrieve(entryId);
            return mapPublicationReadiness(item as Record<string, unknown>);
          },
        },
        recommendations: {
          async list(entryId: string) {
            const page = await client.community.entries.recommendations.list(entryId);
            return mapPageItems(page);
          },
        },
      },
    },
  };
}
