export interface CommunityAuthSessionPort {
  getCurrentUser(): unknown;
}

let authSessionPort: CommunityAuthSessionPort = {
  getCurrentUser: () => null,
};

export function configureCommunityAuthSessionPort(port: CommunityAuthSessionPort): void {
  authSessionPort = port;
}

export function getCommunityCurrentUser(): unknown {
  return authSessionPort.getCurrentUser();
}
