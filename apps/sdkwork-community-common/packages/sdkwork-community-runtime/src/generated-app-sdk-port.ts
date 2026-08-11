import type {
  SdkworkCommunityActivateMembershipCommand,
  SdkworkCommunityCategory,
  SdkworkCommunityCircleCommand,
  SdkworkCommunityComment,
  SdkworkCommunityEntry,
  SdkworkCommunityEntryKind,
  SdkworkCommunityGroup,
  SdkworkCommunityGroupCommand,
  SdkworkCommunityMember,
  SdkworkCommunityMemberRole,
  SdkworkCommunityMemberStatus,
  SdkworkCommunityMembershipTier,
  SdkworkCommunityPublicationIssue,
  SdkworkCommunityPublicationReadiness,
  SdkworkCommunityReviewState,
  SdkworkCommunityTierCommand,
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
import type {
  CommunityCircleCommand,
  CommunityEntryCommand,
  CommunityGroupCommand,
  CommunityMemberPatchCommand,
  CommunityTierCommand,
} from "@sdkwork/community-app-sdk";

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
    media: command.media ? [...command.media] : undefined,
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
    body: record.body ? String(record.body) : undefined,
    categoryId: String(record.categoryId ?? ""),
    categoryLabel: record.categoryLabel ? String(record.categoryLabel) : undefined,
    excerpt: record.excerpt ? String(record.excerpt) : undefined,
    hasAcceptedAnswer: Boolean(record.hasAcceptedAnswer),
    id: String(record.id ?? ""),
    isFeatured: record.isFeatured === undefined ? undefined : Boolean(record.isFeatured),
    isPinned: record.isPinned === undefined ? undefined : Boolean(record.isPinned),
    kind: mapEntryKind(String(record.kind ?? "discussion")),
    lastActivityAt: record.lastActivityAt as SdkworkCommunityEntry["lastActivityAt"],
    media: Array.isArray(record.media)
      ? record.media.map((item) => String(item))
      : undefined,
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
    avatar: record.avatar ? String(record.avatar) : undefined,
    coverImage: record.coverImage ? String(record.coverImage) : undefined,
    description: record.description ? String(record.description) : undefined,
    enabled: record.enabled === undefined ? true : Boolean(record.enabled),
    id: String(record.id ?? ""),
    isJoined: record.isJoined === undefined ? undefined : Boolean(record.isJoined),
    isPaid: record.isPaid === undefined ? undefined : Boolean(record.isPaid),
    memberCount: record.memberCount === undefined ? undefined : Number(record.memberCount),
    memberLimit: record.memberLimit === undefined ? undefined : Number(record.memberLimit),
    ownerId: record.ownerId ? String(record.ownerId) : undefined,
    postCount: record.postCount === undefined ? undefined : Number(record.postCount),
    price: record.price === undefined ? undefined : Number(record.price),
    revenueRaised: record.revenueRaised === undefined ? undefined : Number(record.revenueRaised),
    revenueTarget: record.revenueTarget === undefined ? undefined : Number(record.revenueTarget),
    priority: Number(record.priority ?? 0),
    slug: String(record.slug ?? ""),
    tabs: Array.isArray(record.tabs) ? record.tabs.map((tab) => String(tab)) : undefined,
    tags: Array.isArray(record.tags) ? record.tags.map((tag) => String(tag)) : undefined,
    tenantId: String(record.tenantId ?? ""),
    title: String(record.title ?? ""),
  };
}

function mapMember(record: Record<string, unknown>): SdkworkCommunityMember {
  const nestedUser = (record.user ?? record.author) as Record<string, unknown> | undefined;
  const avatar = nestedUser?.avatar as Record<string, unknown> | undefined;
  const user = nestedUser ?? {
    id: record.userId ?? "",
    name: record.userName ?? "",
  };

  return {
    bio: record.bio ? String(record.bio) : undefined,
    communityId: String(record.communityId ?? ""),
    id: String(record.id ?? ""),
    joinedAt: String(record.joinedAt ?? record.createdAt ?? new Date().toISOString()),
    lastOrderId: record.lastOrderId ? String(record.lastOrderId) : undefined,
    membershipExpiresAt: record.membershipExpiresAt
      ? String(record.membershipExpiresAt)
      : undefined,
    role: String(record.role ?? "member") as SdkworkCommunityMemberRole,
    status: String(record.status ?? "active") as SdkworkCommunityMemberStatus,
    tierId: record.tierId ? String(record.tierId) : undefined,
    tierName: record.tierName ? String(record.tierName) : undefined,
    user: {
      avatar: avatar
        ? {
            id: String(avatar.id ?? ""),
            kind: "image",
            publicUrl: avatar.publicUrl ? String(avatar.publicUrl) : undefined,
          }
        : undefined,
      id: String(user.id ?? ""),
      name: String(user.name ?? ""),
    },
  };
}

function mapGroup(record: Record<string, unknown>): SdkworkCommunityGroup {
  const qrCodes = Array.isArray(record.qrCodes)
    ? record.qrCodes.map((item) => {
        const qr = item as Record<string, unknown>;
        return {
          description: qr.description ? String(qr.description) : undefined,
          url: String(qr.url ?? ""),
        };
      })
    : undefined;

  return {
    communityId: String(record.communityId ?? ""),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    description: record.description ? String(record.description) : undefined,
    id: String(record.id ?? ""),
    memberCount: Number(record.memberCount ?? 0),
    name: String(record.name ?? ""),
    platform: String(record.platform ?? "other") as SdkworkCommunityGroup["platform"],
    qrCodeUrl: record.qrCodeUrl ? String(record.qrCodeUrl) : undefined,
    qrCodes,
  };
}

function toCircleCommand(command: SdkworkCommunityCircleCommand): CommunityCircleCommand {
  return {
    title: command.title,
    ...(command.description !== undefined ? { description: command.description } : {}),
    ...(command.avatar !== undefined ? { avatar: command.avatar } : {}),
    ...(command.coverImage !== undefined ? { coverImage: command.coverImage } : {}),
    ...(command.isPaid !== undefined ? { isPaid: command.isPaid } : {}),
    ...(command.memberLimit !== undefined ? { memberLimit: String(command.memberLimit) } : {}),
    ...(command.price !== undefined ? { price: command.price } : {}),
    ...(command.revenueTarget !== undefined ? { revenueTarget: command.revenueTarget } : {}),
    ...(command.tabs !== undefined ? { tabs: [...command.tabs] } : {}),
    ...(command.tags !== undefined ? { tags: [...command.tags] } : {}),
  };
}

function toGroupCommand(command: SdkworkCommunityGroupCommand): CommunityGroupCommand {
  return {
    name: command.name,
    platform: command.platform,
    ...(command.description !== undefined ? { description: command.description } : {}),
    ...(command.memberCount !== undefined
      ? { memberCount: String(command.memberCount) }
      : {}),
    ...(command.qrCodes !== undefined
      ? { qrCodes: command.qrCodes.map((item) => ({ ...item })) }
      : {}),
  };
}

function toMemberPatchCommand(
  patch: { role?: SdkworkCommunityMemberRole; status?: SdkworkCommunityMemberStatus },
): CommunityMemberPatchCommand {
  return {
    ...(patch.role !== undefined ? { role: patch.role } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
  };
}

function mapTier(record: Record<string, unknown>): SdkworkCommunityMembershipTier {
  return {
    benefits: Array.isArray(record.benefits)
      ? record.benefits.map((item) => String(item))
      : [],
    catalogPackageId: record.catalogPackageId
      ? String(record.catalogPackageId)
      : undefined,
    categoryId: String(record.categoryId ?? ""),
    description: record.description ? String(record.description) : undefined,
    durationDays: Number(record.durationDays ?? 365),
    enabled: Boolean(record.enabled),
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    price: Number(record.price ?? 0),
    sortOrder: Number(record.sortOrder ?? 0),
    tenantId: String(record.tenantId ?? ""),
  };
}

function toTierCommand(command: SdkworkCommunityTierCommand): CommunityTierCommand {
  return {
    name: command.name,
    price: Number(command.price),
    ...(command.description !== undefined ? { description: command.description } : {}),
    ...(command.durationDays !== undefined
      ? { durationDays: String(command.durationDays) }
      : {}),
    ...(command.benefits !== undefined ? { benefits: [...command.benefits] } : {}),
    ...(command.sortOrder !== undefined ? { sortOrder: String(command.sortOrder) } : {}),
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
        async create(command: SdkworkCommunityCircleCommand) {
          const item = await client.community.categories.create(toCircleCommand(command));
          return mapCategory(item as Record<string, unknown>);
        },
        async list() {
          const page = await client.community.categories.list();
          return page.items.map((item) => mapCategory(item as Record<string, unknown>));
        },
        async retrieve(categoryId: string) {
          const item = await client.community.categories.retrieve(categoryId);
          return mapCategory(item as Record<string, unknown>);
        },
        async remove(categoryId: string) {
          await client.community.categories.delete(categoryId);
        },
        async update(categoryId: string, command: Partial<SdkworkCommunityCircleCommand>) {
          const body = toCircleCommand({
            title: command.title ?? "",
            ...(command.description !== undefined ? { description: command.description } : {}),
            ...(command.avatar !== undefined ? { avatar: command.avatar } : {}),
            ...(command.coverImage !== undefined ? { coverImage: command.coverImage } : {}),
            ...(command.isPaid !== undefined ? { isPaid: command.isPaid } : {}),
            ...(command.memberLimit !== undefined ? { memberLimit: command.memberLimit } : {}),
            ...(command.price !== undefined ? { price: command.price } : {}),
            ...(command.revenueTarget !== undefined
              ? { revenueTarget: command.revenueTarget }
              : {}),
            ...(command.tabs !== undefined ? { tabs: [...command.tabs] } : {}),
            ...(command.tags !== undefined ? { tags: [...command.tags] } : {}),
          });
          const item = await client.community.categories.update(categoryId, body);
          return mapCategory(item as Record<string, unknown>);
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
          const item = await client.community.reactions.create(entryId, {
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
      members: {
        async current(communityId: string) {
          try {
            const item = await client.community.members.retrieve(communityId);
            // The backend returns 200 with a null item when the current user
            // has not joined the circle — map that absence to undefined.
            if (!item) {
              return undefined;
            }
            return mapMember(item as unknown as Record<string, unknown>);
          } catch {
            return undefined;
          }
        },
        async join(communityId: string) {
          const item = await client.community.categories.join(communityId);
          return mapMember(item as Record<string, unknown>);
        },
        async list(communityId: string) {
          const page = await client.community.members.list(communityId);
          return page.items.map((item) => mapMember(item as Record<string, unknown>));
        },
        async remove(communityId: string, memberId: string) {
          await client.community.members.delete(communityId, memberId);
        },
        async updateRole(
          communityId: string,
          memberId: string,
          role: SdkworkCommunityMemberRole,
        ) {
          const item = await client.community.members.update(
            communityId,
            memberId,
            toMemberPatchCommand({ role }),
          );
          return mapMember(item as Record<string, unknown>);
        },
        async updateStatus(
          communityId: string,
          memberId: string,
          status: SdkworkCommunityMemberStatus,
        ) {
          const item = await client.community.members.update(
            communityId,
            memberId,
            toMemberPatchCommand({ status }),
          );
          return mapMember(item as Record<string, unknown>);
        },
        async activate(communityId: string, command: SdkworkCommunityActivateMembershipCommand) {
          const item = await client.community.members.activate(communityId, {
            orderId: command.orderId,
            tierId: command.tierId,
          });
          return mapMember(item as Record<string, unknown>);
        },
      },
      tiers: {
        async create(communityId: string, command: SdkworkCommunityTierCommand) {
          const item = await client.community.tiers.create(
            communityId,
            toTierCommand(command),
          );
          return mapTier(item as Record<string, unknown>);
        },
        async list(communityId: string) {
          const page = await client.community.tiers.list(communityId);
          return page.items.map((item) => mapTier(item as Record<string, unknown>));
        },
        async listAll(communityId: string) {
          const page = await client.community.tiers.list(communityId, {
            includeDisabled: true,
          });
          return page.items.map((item) => mapTier(item as Record<string, unknown>));
        },
        async publish(communityId: string, tierId: string) {
          const item = await client.community.tiers.publish(communityId, tierId);
          return mapTier(item as Record<string, unknown>);
        },
        async unpublish(communityId: string, tierId: string) {
          const item = await client.community.tiers.unpublish(communityId, tierId);
          return mapTier(item as Record<string, unknown>);
        },
        async remove(communityId: string, tierId: string) {
          await client.community.tiers.delete(communityId, tierId);
        },
        async update(
          communityId: string,
          tierId: string,
          command: Partial<SdkworkCommunityTierCommand>,
        ) {
          const item = await client.community.tiers.update(
            communityId,
            tierId,
            toTierCommand(command as SdkworkCommunityTierCommand),
          );
          return mapTier(item as Record<string, unknown>);
        },
      },
      groups: {
        async create(communityId: string, command: SdkworkCommunityGroupCommand) {
          const item = await client.community.groups.create(
            communityId,
            toGroupCommand(command),
          );
          return mapGroup(item as Record<string, unknown>);
        },
        async list(communityId: string) {
          const page = await client.community.groups.list(communityId);
          return page.items.map((item) => mapGroup(item as Record<string, unknown>));
        },
        async remove(communityId: string, groupId: string) {
          await client.community.groups.delete(communityId, groupId);
        },
        async update(
          communityId: string,
          groupId: string,
          command: Partial<SdkworkCommunityGroupCommand>,
        ) {
          const body: CommunityGroupCommand = {
            name: command.name ?? "",
            platform: command.platform ?? "other",
            ...(command.description !== undefined ? { description: command.description } : {}),
            ...(command.memberCount !== undefined
              ? { memberCount: String(command.memberCount) }
              : {}),
            ...(command.qrCodes !== undefined
              ? { qrCodes: command.qrCodes.map((item) => ({ ...item })) }
              : {}),
          };
          const item = await client.community.groups.update(communityId, groupId, body);
          return mapGroup(item as Record<string, unknown>);
        },
      },
    },
  };
}
