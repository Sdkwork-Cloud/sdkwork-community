import { describe, expect, it } from "vitest";
import { createInMemoryCommunityAppSdkPort, type SdkworkCommunityAppSdkPort } from "../src";

describe("@sdkwork/community-sdk-ports", () => {
  it("exposes semantic app SDK method tree for feed and entries", async () => {
    const client: SdkworkCommunityAppSdkPort = createInMemoryCommunityAppSdkPort({
      entries: [
        {
          author: { id: "author-1", name: "Sdkwork Team" },
          categoryId: "product",
          id: "entry-1",
          kind: "announcement",
          reviewState: "approved",
          stats: {},
          tags: ["sdk"],
          title: "SDK release",
        },
        {
          author: { id: "author-2", name: "Community Team" },
          categoryId: "support",
          id: "entry-2",
          kind: "discussion",
          reviewState: "approved",
          stats: {},
          tags: ["community"],
          title: "Community moderation guide",
        },
      ],
    });

    await expect(client.community.feed.list({ q: "sdk" })).resolves.toEqual([
      expect.objectContaining({ id: "entry-1", title: "SDK release" }),
    ]);
    await expect(client.community.entries.retrieve("entry-1")).resolves.toMatchObject({
      title: "SDK release",
    });
    await expect(client.community.comments.create("entry-1", { body: "Looks good" })).resolves.toMatchObject({
      body: "Looks good",
      entryId: "entry-1",
    });
    await expect(client.community.comments.list("entry-1")).resolves.toHaveLength(1);
  });

  it("manages membership tiers and activates memberships", async () => {
    const client: SdkworkCommunityAppSdkPort = createInMemoryCommunityAppSdkPort({
      categories: [
        {
          enabled: true,
          id: "comm-paid",
          priority: 0,
          slug: "paid",
          tenantId: "local",
          title: "付费圈",
        },
      ],
    });

    // Unpublished tiers are not listed for purchase.
    const created = await client.community.tiers.create("comm-paid", {
      benefits: ["圈子内容", "官方群"],
      durationDays: 365,
      name: "高级会员",
      price: 199,
    });
    expect(created.enabled).toBe(false);
    await expect(client.community.tiers.list("comm-paid")).resolves.toEqual([]);

    // Publish registers the catalog package and makes the tier purchasable.
    const published = await client.community.tiers.publish("comm-paid", created.id);
    expect(published.enabled).toBe(true);
    expect(published.catalogPackageId).toBeTruthy();
    await expect(client.community.tiers.list("comm-paid")).resolves.toHaveLength(1);

    // Update tier fields.
    const updated = await client.community.tiers.update("comm-paid", created.id, {
      price: 299,
    });
    expect(updated.price).toBe(299);

    // Activation creates the member with the tier and expiry.
    const member = await client.community.members.activate("comm-paid", {
      orderId: "order-1",
      tierId: created.id,
    });
    expect(member).toMatchObject({
      role: "member",
      tierId: created.id,
      tierName: "高级会员",
    });
    expect(member.membershipExpiresAt).toBeTruthy();

    // Replaying the same paid order is idempotent (no double expiry/raise).
    const memberAfterReplay = await client.community.members.activate("comm-paid", {
      orderId: "order-1",
      tierId: created.id,
    });
    expect(memberAfterReplay.membershipExpiresAt).toBe(member.membershipExpiresAt);

    // Unpublish hides the tier again; removing deletes it.
    await client.community.tiers.unpublish("comm-paid", created.id);
    await expect(client.community.tiers.list("comm-paid")).resolves.toEqual([]);
    await client.community.tiers.remove("comm-paid", created.id);
    await expect(
      client.community.members.activate("comm-paid", {
        orderId: "order-2",
        tierId: created.id,
      }),
    ).rejects.toThrow("tier not found");
  });
});
