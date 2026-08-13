import { getEnvironment } from './environment';
import {
  createCommunityAppSdkClient,
  type CommunityAppSdkClient,
} from '@sdkwork/community-h5-core/sdk';
import { createGeneratedCommunityAppSdkPort } from '@sdkwork/community-runtime';
import type { SdkworkCommunityAppSdkPort } from '@sdkwork/community-sdk-ports';
import { createClient as createFeedsOpenClient, type SdkworkFeedsClient } from '@sdkwork/feeds-sdk';
import { createClient as createOrderAppSdkClient, type SdkworkAppClient } from '@sdkwork/order-app-sdk';
import { createClient as createIamAppSdkClient, type SdkworkAppClient as SdkworkIamAppClient } from '@sdkwork/iam-app-sdk';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

export interface SdkClients {
  appApiBaseUrl: string;
  openApiBaseUrl: string;
  communityAppSdk: CommunityAppSdkClient;
  communityAppSdkPort: SdkworkCommunityAppSdkPort;
  /** Standard feeds stream client (open surface, anonymous circle feeds). */
  feedsOpenSdkClient: SdkworkFeedsClient;
  iamAppSdkClient: SdkworkIamAppClient;
  orderAppSdkClient: SdkworkAppClient;
}

function resolveCommunityH5FeedsBaseUrl(): string {
  const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
  const explicit = meta.env?.VITE_SDKWORK_COMMUNITY_H5_FEEDS_OPEN_API_BASE_URL;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  // Cloud profiles serve the feeds open surface on the same origin as the
  // community gateway; standalone dev uses the explicit feeds gateway URL.
  return "/";
}

export function createSdkClients(tokenManager: AuthTokenManager): SdkClients {
  const env = getEnvironment();
  const communityAppSdk = createCommunityAppSdkClient({
    config: {
      appApiBaseUrl: env.appApiBaseUrl,
    },
    tokenManager,
  });

  const iamAppSdkClient = createIamAppSdkClient({
    baseUrl: env.sdkBaseUrls.dependencySdkBaseUrls['sdkwork-iam-app-sdk'].appApiBaseUrl,
    authMode: 'dual-token',
    platform: 'h5',
    tokenManager,
  });

  const orderAppSdkClient = createOrderAppSdkClient({
    baseUrl:
      env.sdkBaseUrls.dependencySdkBaseUrls['sdkwork-order-app-sdk']?.appApiBaseUrl
      ?? env.appApiBaseUrl,
    authMode: 'dual-token',
    platform: 'h5',
    tokenManager,
  });

  return {
    appApiBaseUrl: env.appApiBaseUrl,
    openApiBaseUrl: env.openApiBaseUrl,
    communityAppSdk,
    communityAppSdkPort: createGeneratedCommunityAppSdkPort(communityAppSdk.client),
    feedsOpenSdkClient: createFeedsOpenClient({
      baseUrl: resolveCommunityH5FeedsBaseUrl(),
      platform: "h5",
    }),
    iamAppSdkClient,
    orderAppSdkClient,
  };
}
