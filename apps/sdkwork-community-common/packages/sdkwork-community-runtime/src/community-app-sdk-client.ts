import {
  createCommunityAppClient,
  type SdkworkCommunityAppClient,
  type SdkworkAppConfig,
} from "@sdkwork/community-app-sdk";
import type { AuthTokenManager } from "@sdkwork/sdk-common";

const APP_API_PREFIX = "/app/v3/api";
const COMMUNITY_APP_SDK_FAMILY_ID = "sdkwork-community-app-sdk";

export interface CommunityRuntimeConfig {
  appApiBaseUrl: string;
  backendApiBaseUrl?: string;
  openApiBaseUrl?: string;
  dependencySdkBaseUrls?: Record<string, { appApiBaseUrl?: string }>;
}

export interface CommunityAppSdkClient {
  client: SdkworkCommunityAppClient;
  setTokenManager(manager: AuthTokenManager): void;
}

export interface CommunityAppSdkClientOptions {
  config: CommunityRuntimeConfig;
  sdkClient?: SdkworkCommunityAppClient;
  tokenManager: AuthTokenManager;
}

function normalizeGeneratedSdkBaseUrl(baseUrl: string, apiPrefix: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedApiPrefix = apiPrefix.replace(/\/+$/, "");
  if (normalizedBaseUrl.endsWith(normalizedApiPrefix)) {
    return normalizedBaseUrl.slice(0, -normalizedApiPrefix.length) || normalizedBaseUrl;
  }
  return normalizedBaseUrl;
}

function resolveCommunityAppApiBaseUrl(config: CommunityRuntimeConfig): string {
  return config.dependencySdkBaseUrls?.[COMMUNITY_APP_SDK_FAMILY_ID]?.appApiBaseUrl
    ?? config.appApiBaseUrl;
}

export function createCommunityAppSdkClient({
  config,
  sdkClient,
  tokenManager,
}: CommunityAppSdkClientOptions): CommunityAppSdkClient {
  const clientConfig: SdkworkAppConfig = {
    authMode: "dual-token",
    baseUrl: normalizeGeneratedSdkBaseUrl(resolveCommunityAppApiBaseUrl(config), APP_API_PREFIX),
    tokenManager: tokenManager as never,
  };
  const generatedClient = sdkClient ?? createCommunityAppClient(clientConfig);
  generatedClient.setTokenManager(tokenManager as never);

  return {
    client: generatedClient,
    setTokenManager(manager) {
      generatedClient.setTokenManager(manager as never);
    },
  };
}

export { COMMUNITY_APP_SDK_FAMILY_ID };
