import {
  createSdkworkAppbasePcAuthRuntime,
  type SdkworkAppbasePcAuthRuntimeComposition,
} from "@sdkwork/auth-runtime-pc-react";
import type { AuthTokenManager } from "@sdkwork/sdk-common";
import type { Environment } from "./environment";
import type { SdkClients } from "./sdkClients";

export interface CreateCommunityIamRuntimeOptions {
  environment: Environment;
  onSessionChanged?: () => Promise<unknown> | unknown;
  sdkClients: SdkClients;
  tokenManager: AuthTokenManager;
}

export function createIamRuntime(
  options: CreateCommunityIamRuntimeOptions,
): SdkworkAppbasePcAuthRuntimeComposition {
  return createSdkworkAppbasePcAuthRuntime({
    app: {
      appId: options.environment.appKey,
      deploymentMode: options.environment.iamDeploymentMode,
      environment: options.environment.iamEnvironment,
      platform: "h5",
    },
    baseUrls: {
      appbaseAppApiBaseUrl:
        options.environment.sdkBaseUrls.dependencySdkBaseUrls["sdkwork-iam-app-sdk"]
          .appApiBaseUrl,
    },
    hooks: options.onSessionChanged
      ? { onSessionChanged: options.onSessionChanged }
      : undefined,
    sdkClients: [options.sdkClients.communityAppSdk.client],
    tokenManager: options.tokenManager,
  });
}
