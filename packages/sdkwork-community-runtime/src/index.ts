import { createSdkworkCommunityService, type SdkworkCommunityService } from "@sdkwork/community-service";
import type { SdkworkCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";

export interface CommunityRuntimeConfig {
  appApiBaseUrl: string;
  backendApiBaseUrl?: string;
  openApiBaseUrl: string;
}

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
