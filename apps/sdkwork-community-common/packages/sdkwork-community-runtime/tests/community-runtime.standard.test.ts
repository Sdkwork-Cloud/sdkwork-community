import { describe, expect, it } from "vitest";
import { createInMemoryCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import { createCommunityRuntime } from "../src";

describe("@sdkwork/community-runtime", () => {
  it("creates a runtime with injected SDK clients and stable config", async () => {
    const runtime = createCommunityRuntime({
      appClient: createInMemoryCommunityAppSdkPort({ entries: [] }),
      config: {
        appApiBaseUrl: "https://api.example.test/app/v3/api",
        openApiBaseUrl: "https://api.example.test/community/v3/api",
      },
    });

    expect(runtime.config.appApiBaseUrl).toBe("https://api.example.test/app/v3/api");
    await expect(runtime.service.listFeed()).resolves.toEqual([]);
    await expect(runtime.service.listComments("entry-1")).resolves.toEqual([]);
  });

  it("maps generated app SDK comments through the runtime port", async () => {
    const runtime = createCommunityRuntime({
      appClient: createInMemoryCommunityAppSdkPort({
        entries: [
          {
            author: { id: "author-1", name: "Sdkwork Team" },
            categoryId: "product",
            id: "entry-1",
            kind: "discussion",
            reviewState: "approved",
            stats: {},
            title: "Discussion",
          },
        ],
      }),
      config: {
        appApiBaseUrl: "https://api.example.test/app/v3/api",
        openApiBaseUrl: "https://api.example.test/community/v3/api",
      },
    });

    await runtime.service.createComment("entry-1", "hello");
    await expect(runtime.service.listComments("entry-1")).resolves.toHaveLength(1);
  });
});
