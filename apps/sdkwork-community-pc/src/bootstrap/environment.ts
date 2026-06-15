export interface Environment {
  sdkBaseUrl: string;
  appApiBaseUrl: string;
  openApiBaseUrl: string;
  featureFlags: Record<string, boolean>;
}

export function getEnvironment(): Environment {
  return {
    sdkBaseUrl: import.meta.env.VITE_SDK_BASE_URL || 'http://localhost:8080',
    appApiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8080/app/v3/api',
    openApiBaseUrl: import.meta.env.VITE_OPEN_API_BASE_URL || 'http://localhost:8080/community/v3/api',
    featureFlags: {
      community: true,
    },
  };
}