import {
  createTokenManager,
  type AuthTokenManager,
} from "@sdkwork/sdk-common";
import {
  createIamRuntime,
} from "./iamRuntime";
import { getEnvironment, type Environment } from "./environment";
import { createSdkClients, type SdkClients } from "./sdkClients";

export interface CommunityRuntimeUser {
  avatar?: string;
  displayName?: string;
  id?: string;
  name?: string;
  nickname?: string;
}

export interface Runtime {
  environment: Environment;
  iam: ReturnType<typeof createIamRuntime>;
  initialize(): Promise<void>;
  getCurrentUser(): CommunityRuntimeUser | null;
  sdkClients: SdkClients;
  tokenManager: AuthTokenManager;
}

let activeRuntime: Runtime | null = null;

export function createRuntime(): Runtime {
  if (activeRuntime) {
    return activeRuntime;
  }

  const environment = getEnvironment();
  const tokenManager = createTokenManager();
  const sdkClients = createSdkClients(tokenManager);
  let currentUser: CommunityRuntimeUser | null = null;
  let iam: ReturnType<typeof createIamRuntime>;

  const refreshCurrentUser = async (): Promise<void> => {
    if (!tokenManager.getAuthToken() || !tokenManager.getAccessToken()) {
      currentUser = null;
      return;
    }

    try {
      const profile = await iam.runtime.service.iam.users.current.retrieve();
      currentUser = {
        ...(profile.displayName ? { displayName: profile.displayName, name: profile.displayName } : {}),
        ...(profile.id ? { id: profile.id } : {}),
        ...(profile.username ? { nickname: profile.username } : {}),
      };
    } catch {
      currentUser = null;
    }
  };

  iam = createIamRuntime({
    environment,
    onSessionChanged: refreshCurrentUser,
    sdkClients,
    tokenManager,
  });

  activeRuntime = {
    environment,
    iam,
    async initialize() {
      try {
        await iam.runtime.hydrateTokenManager();
        await refreshCurrentUser();
      } catch {
        await iam.runtime.clearSession();
        currentUser = null;
      }
    },
    getCurrentUser: () => currentUser,
    sdkClients,
    tokenManager,
  };
  return activeRuntime;
}

export function getRuntime(): Runtime {
  return createRuntime();
}

export function resetRuntimeForTests(): void {
  activeRuntime = null;
}
