import { getEnvironment } from './environment';

export interface SdkClients {
  appApiBaseUrl: string;
  openApiBaseUrl: string;
}

export function createSdkClients(): SdkClients {
  const env = getEnvironment();
  return {
    appApiBaseUrl: env.appApiBaseUrl,
    openApiBaseUrl: env.openApiBaseUrl,
  };
}