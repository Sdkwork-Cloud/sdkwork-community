import { describe, expect, it } from "vitest";

import { createGeneratedCommunityAppSdkPort } from "../src/generated-app-sdk-port";
import type { SdkworkCommunityAppClient } from "@sdkwork/community-app-sdk";

function createFakeClient(overrides: Record<string, unknown> = {}): SdkworkCommunityAppClient {
  return {
    community: {
      categories: {
        list: async () => ({ items: [] }),
        create: async (body: unknown) => ({
          id: "category-circle-1",
          tenantId: "100001",
          slug: "circle",
          title: (body as { title: string }).title,
          description: (body as { description?: string }).description,
          memberCount: 1,
          postCount: 0,
          isPaid: false,
          tags: (body as { tags?: string[] }).tags ?? [],
          priority: 0,
          enabled: true,
        }),
        update: async (_id: string, body: unknown) => ({
          id: "category-circle-1",
          tenantId: "100001",
          slug: "circle",
          title: (body as { title: string }).title,
          description: (body as { description?: string }).description,
          memberCount: 1,
          postCount: 0,
          isPaid: false,
          tags: (body as { tags?: string[] }).tags ?? [],
          priority: 0,
          enabled: true,
        }),
        join: async () => ({
          id: "member-1",
          tenantId: "100001",
          categoryId: "category-circle-1",
          userId: "user-1",
          userName: "User 1",
          role: "member",
          status: "active",
          joinedAt: "2026-06-01T00:00:00Z",
        }),
      },
      members: {
        list: async () => ({
          items: [
            {
              id: "member-1",
              tenantId: "100001",
              categoryId: "category-circle-1",
              userId: "user-1",
              userName: "User 1",
              role: "owner",
              status: "active",
              joinedAt: "2026-06-01T00:00:00Z",
            },
          ],
        }),
        retrieve: async () => ({
          id: "member-1",
          tenantId: "100001",
          categoryId: "category-circle-1",
          userId: "user-1",
          userName: "User 1",
          role: "owner",
          status: "active",
          joinedAt: "2026-06-01T00:00:00Z",
        }),
        update: async (_categoryId: string, _memberId: string, body: unknown) => ({
          id: "member-1",
          tenantId: "100001",
          categoryId: "category-circle-1",
          userId: "user-1",
          userName: "User 1",
          role: (body as { role?: string }).role ?? "member",
          status: (body as { status?: string }).status ?? "active",
          joinedAt: "2026-06-01T00:00:00Z",
        }),
        delete: async () => undefined,
      },
      groups: {
        list: async () => ({ items: [] }),
        create: async (_categoryId: string, body: unknown) => ({
          id: "group-1",
          tenantId: "100001",
          categoryId: "category-circle-1",
          name: (body as { name: string }).name,
          platform: (body as { platform: string }).platform,
          memberCount: 0,
          qrCodes: [],
          createdAt: "2026-06-01T00:00:00Z",
          updatedAt: "2026-06-01T00:00:00Z",
        }),
        update: async (_categoryId: string, _groupId: string, body: unknown) => ({
          id: "group-1",
          tenantId: "100001",
          categoryId: "category-circle-1",
          name: (body as { name: string }).name,
          platform: (body as { platform: string }).platform,
          memberCount: 0,
          qrCodes: [],
          createdAt: "2026-06-01T00:00:00Z",
          updatedAt: "2026-06-01T00:00:00Z",
        }),
        delete: async () => undefined,
      },
      feed: {
        list: async () => ({ items: [] }),
      },
      entries: {
        create: async (body: unknown) => ({
          id: "entry-1",
          tenantId: "100001",
          categoryId: (body as { categoryId: string }).categoryId,
          author: { id: "user-1", name: "User 1" },
          slug: "entry",
          kind: "discussion",
          title: (body as { title: string }).title,
          reviewState: "draft",
          stats: {},
          tags: [],
        }),
        retrieve: async () => ({ id: "entry-1" }),
        delete: async () => undefined,
        update: async () => ({ id: "entry-1" }),
        publicationReadiness: {
          retrieve: async () => ({
            ready: true,
            degraded: false,
            issues: [],
            checklist: {
              hasBody: true,
              hasCategory: true,
              hasExcerpt: true,
              hasMinimumTags: true,
              hasTitle: true,
            },
          }),
        },
        recommendations: {
          list: async () => ({ items: [] }),
        },
      },
      reactions: {
        create: async () => ({ accepted: true, reactionCount: 1 }),
      },
      comments: {
        list: async () => ({ items: [] }),
        create: async () => ({ id: "comment-1" }),
      },
      ...overrides,
    },
  } as unknown as SdkworkCommunityAppClient;
}

describe("createGeneratedCommunityAppSdkPort circle surface", () => {
  it("maps category circle fields on create", async () => {
    const port = createGeneratedCommunityAppSdkPort(createFakeClient());
    const category = await port.community.categories.create({
      title: "AI 开发者联盟",
      description: "AI 交流",
      tags: ["AI"],
    });

    expect(category).toMatchObject({
      id: "category-circle-1",
      title: "AI 开发者联盟",
      description: "AI 交流",
      memberCount: 1,
      tags: ["AI"],
    });
  });

  it("maps members list and current member", async () => {
    const port = createGeneratedCommunityAppSdkPort(createFakeClient());
    const members = await port.community.members.list("category-circle-1");
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ role: "owner", user: { name: "User 1" } });

    const current = await port.community.members.current("category-circle-1");
    expect(current?.role).toBe("owner");
  });

  it("returns undefined when the current member is not found", async () => {
    const port = createGeneratedCommunityAppSdkPort(
      createFakeClient({
        members: {
          retrieve: async () => {
            throw new Error("not found");
          },
        },
      }),
    );
    await expect(port.community.members.current("category-circle-1")).resolves.toBeUndefined();
  });

  it("maps role and status member updates", async () => {
    const port = createGeneratedCommunityAppSdkPort(createFakeClient());
    const updated = await port.community.members.updateRole(
      "category-circle-1",
      "member-1",
      "admin",
    );
    expect(updated.role).toBe("admin");

    const muted = await port.community.members.updateStatus(
      "category-circle-1",
      "member-1",
      "muted",
    );
    expect(muted.status).toBe("muted");
  });

  it("maps groups create and update with QR codes", async () => {
    const port = createGeneratedCommunityAppSdkPort(createFakeClient());
    const group = await port.community.groups.create("category-circle-1", {
      name: "交流群",
      platform: "wechat",
      qrCodes: [{ url: "https://example.test/qr.png", description: "扫码加入" }],
    });
    expect(group).toMatchObject({ name: "交流群", platform: "wechat" });

    const updated = await port.community.groups.update("category-circle-1", "group-1", {
      name: "新群名",
    });
    expect(updated.name).toBe("新群名");
  });
});
