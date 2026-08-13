import type { SdkworkCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";
import type { SdkworkFeedsClient } from "@sdkwork/feeds-sdk";

/**
 * Host-injectable runtime port for the community App SDK.
 *
 * Hosts (sdkwork-im h5, standalone sdkwork-community h5, sdkwork-community
 * pc) MUST configure the real generated SDK port through
 * `configureCommunityRuntimePort` before any community UI mounts. There is
 * deliberately no in-memory/demo fallback: production data and entity ids
 * come exclusively from the backend service, so an unconfigured runtime
 * fails closed with a clear error instead of serving mock circles.
 */

let runtimePort: SdkworkCommunityAppSdkPort | null = null;

export function configureCommunityRuntimePort(port: SdkworkCommunityAppSdkPort): void {
  runtimePort = port;
}

export function resetCommunityRuntimePort(): void {
  runtimePort = null;
}

export function getCommunityRuntimePort(): SdkworkCommunityAppSdkPort {
  if (!runtimePort) {
    throw new Error(
      "community App SDK port is not configured: the host must call " +
        "configureCommunityRuntimePort with the generated community App SDK port " +
        "before rendering community surfaces",
    );
  }
  return runtimePort;
}

let feedsPort: SdkworkFeedsClient | null = null;

/**
 * Binds the standard feeds stream client (open surface, anonymous reads).
 * Circle post/resource feeds are read through the standard feeds stream
 * system (`community-{circleId}` / `community-{circleId}-resources` streams);
 * content write operations keep the community App SDK port above.
 */
export function configureCommunityFeedsPort(port: SdkworkFeedsClient): void {
  feedsPort = port;
}

export function resetCommunityFeedsPort(): void {
  feedsPort = null;
}

export function isCommunityFeedsPortConfigured(): boolean {
  return feedsPort !== null;
}

export function getCommunityFeedsPort(): SdkworkFeedsClient {
  if (!feedsPort) {
    throw new Error(
      "community feeds stream client is not configured: the host must call " +
        "configureCommunityFeedsPort with the generated feeds open SDK client",
    );
  }
  return feedsPort;
}
