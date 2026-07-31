import {
  resolveCommunityBrowserEnvironment,
  type CommunityBrowserEnvironment,
  type CommunityBrowserRuntimeConfigInput,
} from "@sdkwork/community-runtime";

declare global {
  interface Window {
    __SDKWORK_RUNTIME_ENV__?: CommunityBrowserRuntimeConfigInput | null;
  }
}

export type Environment = CommunityBrowserEnvironment;

export function getEnvironment(): Environment {
  return resolveCommunityBrowserEnvironment({
    isProductionBuild: import.meta.env.PROD,
    runtimeConfig: window.__SDKWORK_RUNTIME_ENV__,
    vite: import.meta.env,
  });
}
