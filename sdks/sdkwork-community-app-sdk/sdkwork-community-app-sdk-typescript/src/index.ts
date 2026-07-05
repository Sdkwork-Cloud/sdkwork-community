import {
  createClient as createGeneratedCommunityAppClient,
  SdkworkAppClient,
} from "../generated/server-openapi/src/index";
import type { SdkworkAppConfig } from "../generated/server-openapi/src/types/common";

export { SdkworkAppClient, createGeneratedCommunityAppClient };
export type { SdkworkAppConfig };
export * from "../generated/server-openapi/src/types";
export * from "../generated/server-openapi/src/api";
export * from "../generated/server-openapi/src/http";
export * from "../generated/server-openapi/src/auth";

export type SdkworkCommunityAppClient = SdkworkAppClient;

export function createCommunityAppClient(config: SdkworkAppConfig): SdkworkCommunityAppClient {
  return createGeneratedCommunityAppClient(config);
}

export function createClient(config: SdkworkAppConfig): SdkworkCommunityAppClient {
  return createCommunityAppClient(config);
}
