import {
  createClient as createGeneratedCommunityClient,
  SdkworkCustomClient,
} from "../generated/server-openapi/src/index";
import type { SdkworkCustomConfig } from "../generated/server-openapi/src/types/common";

export { createGeneratedCommunityClient, SdkworkCustomClient };
export type { SdkworkCustomConfig };
export * from "../generated/server-openapi/src/types";
export * from "../generated/server-openapi/src/api";
export * from "../generated/server-openapi/src/http";
export * from "../generated/server-openapi/src/auth";

export type SdkworkCommunityClient = SdkworkCustomClient;

export function createCommunityClient(config: SdkworkCustomConfig): SdkworkCommunityClient {
  return createGeneratedCommunityClient(config);
}

export function createClient(config: SdkworkCustomConfig): SdkworkCommunityClient {
  return createCommunityClient(config);
}
