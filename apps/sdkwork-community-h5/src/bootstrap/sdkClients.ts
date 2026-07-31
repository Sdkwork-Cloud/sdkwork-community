import { getEnvironment } from './environment';
import {
  createCommunityAppSdkClient,
  type CommunityAppSdkClient,
} from '@sdkwork/community-h5-core/sdk';
import { createGeneratedCommunityAppSdkPort } from '@sdkwork/community-runtime';
import type { SdkworkCommunityAppSdkPort } from '@sdkwork/community-sdk-ports';
import type { AuthTokenManager } from '@sdkwork/sdk-common';

export interface SdkClients {
  appApiBaseUrl: string;
  openApiBaseUrl: string;
  communityAppSdk: CommunityAppSdkClient;
  communityAppSdkPort: SdkworkCommunityAppSdkPort;
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
  };
}
