import { describe, expect, it } from "vitest";
import { createInMemoryCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import {
  createCommunityRuntime,
  resolveCommunityBrowserEnvironment,
} from "../src";

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

  it("resolves standalone development to canonical same-origin SDK surfaces", () => {
    const environment = resolveCommunityBrowserEnvironment({
      isProductionBuild: false,
      runtimeConfig: {
        appApiBaseUrl: "/app/v3/api",
        browserOriginMode: "same-origin",
        deploymentProfile: "standalone",
        environment: "development",
        openApiBaseUrl: "/community/v3/api",
        profileId: "standalone.development",
        runtimeTarget: "browser",
        sdkBaseUrls: {
          dependencySdkBaseUrls: {
            "sdkwork-iam-app-sdk": {
              appApiBaseUrl: "/app/v3/api",
            },
          },
        },
      },
    });

    expect(environment.profileId).toBe("standalone.development");
    expect(environment.iamDeploymentMode).toBe("local");
    expect(environment.sdkBaseUrls.dependencySdkBaseUrls["sdkwork-iam-app-sdk"])
      .toEqual({ appApiBaseUrl: "/app/v3/api" });
  });

  it("keeps application and platform SDK origins separate in cloud profiles", () => {
    const environment = resolveCommunityBrowserEnvironment({
      isProductionBuild: true,
      runtimeConfig: {
        appApiBaseUrl: "https://community.example.com/app/v3/api",
        deploymentProfile: "cloud",
        environment: "production",
        openApiBaseUrl: "https://community.example.com/community/v3/api",
        profileId: "cloud.production",
        runtimeTarget: "browser",
        sdkBaseUrls: {
          dependencySdkBaseUrls: {
            "sdkwork-iam-app-sdk": {
              appApiBaseUrl: "https://platform.example.com/app/v3/api",
            },
          },
        },
      },
    });

    expect(environment.appApiBaseUrl).toBe("https://community.example.com/app/v3/api");
    expect(environment.sdkBaseUrls.dependencySdkBaseUrls["sdkwork-iam-app-sdk"].appApiBaseUrl)
      .toBe("https://platform.example.com/app/v3/api");
    expect(environment.iamDeploymentMode).toBe("saas");
  });

  it("fails closed for incomplete or inconsistent production config", () => {
    expect(() => resolveCommunityBrowserEnvironment({ isProductionBuild: true }))
      .toThrow("Invalid Community environment: empty");
    expect(() => resolveCommunityBrowserEnvironment({
      isProductionBuild: true,
      runtimeConfig: {
        appApiBaseUrl: "https://api.example.com/app/v3/api?token=forbidden",
        deploymentProfile: "cloud",
        environment: "production",
        openApiBaseUrl: "https://api.example.com/community/v3/api",
        profileId: "standalone.production",
        runtimeTarget: "browser",
      },
    })).toThrow("profileId must be cloud.production");
  });
});
