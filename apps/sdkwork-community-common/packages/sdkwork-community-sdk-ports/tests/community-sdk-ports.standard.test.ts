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
});
