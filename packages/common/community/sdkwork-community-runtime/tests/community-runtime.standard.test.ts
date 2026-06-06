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
  });
});
