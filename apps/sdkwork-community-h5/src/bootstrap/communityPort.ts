import {
  configureCommunityAuthSessionPort,
  configureCommunityRuntimePort,
  resetCommunityRuntimePort,
} from "@sdkwork/community-mobile-react-community";
import { getRuntime } from "./runtime";

/**
 * Community H5 runtime port wiring.
 *
 * Binds the mobile React community package to the standalone application
 * runtime:
 *
 * - `configureCommunityAuthSessionPort` serves the current IAM user to the
 *   payment sheet login check.
 * - `configureCommunityRuntimePort` switches the package to the generated
 *   Community App SDK port once a session exists; without a session the
 *   package keeps its seeded in-memory port so the UI stays explorable.
 */

let bootstrapped = false;

export function bootstrapCommunityPort(): void {
  if (bootstrapped) {
    return;
  }
  bootstrapped = true;

  const runtime = getRuntime();
  configureCommunityAuthSessionPort({
    getCurrentUser: () => runtime.getCurrentUser(),
  });

  const syncRuntimePort = (): void => {
    const user = runtime.getCurrentUser();
    if (user?.id) {
      configureCommunityRuntimePort(runtime.sdkClients.communityAppSdkPort);
    } else {
      resetCommunityRuntimePort();
    }
  };

  syncRuntimePort();
  void runtime
    .initialize()
    .then(syncRuntimePort)
    .catch((error: unknown) => {
      console.error("Community runtime initialization failed.", error);
    });
}
