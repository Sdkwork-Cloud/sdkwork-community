import { getEnvironment } from './environment';
import {
  createCommunityAppSdkClient,
  type CommunityAppSdkClient,
} from '@sdkwork/community-h5-core/sdk';
import { createGeneratedCommunityAppSdkPort } from '@sdkwork/community-runtime';
import type { SdkworkCommunityAppSdkPort } from '@sdkwork/community-sdk-ports';
import { createClient as createOrderAppSdkClient, type SdkworkAppClient } from '@sdkwork/order-app-sdk';
import { createClient as createIamAppSdkClient, type SdkworkAppClient as SdkworkIamAppClient } from '@sdkwork/iam-app-sdk';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

export interface SdkClients {
  appApiBaseUrl: string;
  openApiBaseUrl: string;
  communityAppSdk: CommunityAppSdkClient;
  communityAppSdkPort: SdkworkCommunityAppSdkPort;
  iamAppSdkClient: SdkworkIamAppClient;
  orderAppSdkClient: SdkworkAppClient;
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
    iamAppSdkClient,
    orderAppSdkClient,
  };
}
