import { createSdkworkCommunityService, type SdkworkCommunityService } from "@sdkwork/community-service";
import type { SdkworkCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import type { CommunityRuntimeConfig } from "./community-app-sdk-client";

export { createGeneratedCommunityAppSdkPort } from "./generated-app-sdk-port";
export {
  COMMUNITY_APP_SDK_FAMILY_ID,
  createCommunityAppSdkClient,
  type CommunityAppSdkClient,
  type CommunityAppSdkClientOptions,
  type CommunityRuntimeConfig,
} from "./community-app-sdk-client";

export interface CommunityRuntime {
  appClient: SdkworkCommunityAppSdkPort;
  config: CommunityRuntimeConfig;
  service: SdkworkCommunityService;
}

export interface CreateCommunityRuntimeOptions {
  appClient: SdkworkCommunityAppSdkPort;
  config: CommunityRuntimeConfig;
}

export function createCommunityRuntime(options: CreateCommunityRuntimeOptions): CommunityRuntime {
  return {
    appClient: options.appClient,
    config: options.config,
    service: createSdkworkCommunityService(options.appClient),
  };
}
