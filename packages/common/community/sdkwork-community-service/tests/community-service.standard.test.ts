import { describe, expect, it } from "vitest";
import { createInMemoryCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import { createSdkworkCommunityService } from "../src";

describe("@sdkwork/community-service", () => {
  it("uses injected generated SDK port instead of raw HTTP", async () => {
    const service = createSdkworkCommunityService(
      createInMemoryCommunityAppSdkPort({
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
        ],
      }),
    );

    await expect(service.listFeed({ q: "sdk" })).resolves.toHaveLength(1);
    await expect(service.retrieveEntry("entry-1")).resolves.toMatchObject({ id: "entry-1" });
  });
});
