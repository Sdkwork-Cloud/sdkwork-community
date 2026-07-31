import type { ComponentType } from "react";
import {
  configureCommunityPcHost,
  type CommunityPcAvatarProps,
} from "@sdkwork/community-pc-community";
import { getRuntime } from "./runtime";

function CommunityAvatar({ alt, className, fallback, src }: CommunityPcAvatarProps) {
  if (src) {
    return <img alt={alt} className={className} src={src} />;
  }
  return (
    <span aria-hidden={alt ? undefined : true} className={className}>
      {fallback ?? "?"}
    </span>
  );
}

export function bootstrapCommunityPcHost(): void {
  const runtime = getRuntime();
  void runtime.initialize();
  configureCommunityPcHost({
    Avatar: CommunityAvatar as ComponentType<CommunityPcAvatarProps>,
    toast(message, variant = "info") {
      if (variant === "error") {
        console.error(message);
        return;
      }
      console.info(message);
    },
    readSessionTokens() {
      const user = runtime.getCurrentUser();
      if (!user) {
        return null;
      }
      return { user };
    },
    createAppSdkPort: () => runtime.sdkClients.communityAppSdkPort,
  });
}
