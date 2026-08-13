import { getEnvironment } from './environment';
import {
  createCommunityAppSdkClient,
  type CommunityAppSdkClient,
} from '@sdkwork/community-pc-core/sdk';
import { createGeneratedCommunityAppSdkPort } from '@sdkwork/community-runtime';
import type { SdkworkCommunityAppSdkPort } from '@sdkwork/community-sdk-ports';
import { createClient as createFeedsOpenClient, type SdkworkFeedsClient } from '@sdkwork/feeds-sdk';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

function resolvePcFeedsBaseUrl(): string {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  const explicit = meta.env?.VITE_SDKWORK_COMMUNITY_PC_FEEDS_OPEN_API_BASE_URL;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return "/";
}

export interface SdkClients {
  appApiBaseUrl: string;
  openApiBaseUrl: string;
  communityAppSdk: CommunityAppSdkClient;
  communityAppSdkPort: SdkworkCommunityAppSdkPort;
  /** Standard feeds stream client (open surface, anonymous circle feeds). */
  feedsOpenSdkClient: SdkworkFeedsClient;
}

export function createSdkClients(tokenManager: AuthTokenManager): SdkClients {
  const env = getEnvironment();
  const communityAppSdk = createCommunityAppSdkClient({
    config: {
      appApiBaseUrl: env.appApiBaseUrl,
    },
    tokenManager,
  });

  return {
    appApiBaseUrl: env.appApiBaseUrl,
    openApiBaseUrl: env.openApiBaseUrl,
    communityAppSdk,
    communityAppSdkPort: createGeneratedCommunityAppSdkPort(communityAppSdk.client),
    feedsOpenSdkClient: createFeedsOpenClient({ baseUrl: resolvePcFeedsBaseUrl(), platform: "pc" }),
  };
}
