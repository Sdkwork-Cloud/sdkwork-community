import { createContext, useContext, type PropsWithChildren } from "react";
import type { CommunityPcHostAdapter } from "./adapter";
import { getCommunityPcHost } from "./adapter";

const CommunityPcHostContext = createContext<CommunityPcHostAdapter | null>(null);

export function CommunityPcHostProvider({
  adapter,
  children,
}: PropsWithChildren<{ adapter: CommunityPcHostAdapter }>) {
  return (
    <CommunityPcHostContext.Provider value={adapter}>{children}</CommunityPcHostContext.Provider>
  );
}

export function useCommunityPcHost(): CommunityPcHostAdapter {
  return useContext(CommunityPcHostContext) ?? getCommunityPcHost();
}
