import type { ComponentType } from "react";
import {
  configureCommunityPcHost,
  type CommunityPcAvatarProps,
} from "@sdkwork/community-pc-community";
import { createIamRuntime } from "./iamRuntime";
import { createSdkClients } from "./sdkClients";

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

let sdkClients: ReturnType<typeof createSdkClients> | null = null;

function getSdkClients() {
  sdkClients ??= createSdkClients();
  return sdkClients;
}

export function bootstrapCommunityPcHost(): void {
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
      const token = createIamRuntime().tokenManager.getToken();
      if (!token) {
        return null;
      }
      return { user: { name: "Community User" } };
    },
    createAppSdkPort: () => getSdkClients().communityAppSdkPort,
  });
}
