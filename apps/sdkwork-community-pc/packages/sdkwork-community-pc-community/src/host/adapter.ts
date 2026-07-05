import type { ComponentType, ReactNode } from "react";
import type { SdkworkCommunityAppSdkPort } from "@sdkwork/community-sdk-ports";

export type CommunityPcToastVariant = "error" | "success" | "info";

export interface CommunityPcToast {
  (message: string, variant?: CommunityPcToastVariant): void;
}

export interface CommunityPcAvatarProps {
  alt?: string;
  className?: string;
  fallback?: ReactNode;
  shape?: string;
  size?: string;
  src?: string;
}

export interface CommunityPcSessionUser {
  avatar?: string;
  displayName?: string;
  id?: string;
  name?: string;
  nickname?: string;
}

export interface CommunityPcLanguageBridge {
  onLanguageChange(listener: (language: string) => void): () => void;
  resolveInitialLanguage(): string;
}

export interface CommunityPcSessionTokens {
  user?: CommunityPcSessionUser;
}

export interface CommunityPcResourceUploadInput {
  communityId: string;
  file: Blob;
  name: string;
  size: string;
  type: string;
}

export interface CommunityPcResourceUploadResult {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadTime: string;
  uploader: string;
}

export interface CommunityPcHostAdapter {
  Avatar: ComponentType<CommunityPcAvatarProps>;
  createAppSdkPort(): SdkworkCommunityAppSdkPort;
  languageBridge?: CommunityPcLanguageBridge;
  readSessionTokens(): CommunityPcSessionTokens | null | undefined;
  toast: CommunityPcToast;
  uploadResource?(input: CommunityPcResourceUploadInput): Promise<CommunityPcResourceUploadResult>;
}

let activeHostAdapter: CommunityPcHostAdapter | null = null;
let languageBridgeBinder: ((bridge: CommunityPcLanguageBridge) => void) | null = null;

export function registerCommunityPcLanguageBridgeBinder(
  binder: (bridge: CommunityPcLanguageBridge) => void,
): void {
  languageBridgeBinder = binder;
  if (activeHostAdapter?.languageBridge) {
    binder(activeHostAdapter.languageBridge);
  }
}

export function configureCommunityPcHost(adapter: CommunityPcHostAdapter): void {
  activeHostAdapter = adapter;
  if (adapter.languageBridge && languageBridgeBinder) {
    languageBridgeBinder(adapter.languageBridge);
  }
}

export function getCommunityPcHost(): CommunityPcHostAdapter {
  if (!activeHostAdapter) {
    throw new Error("Community PC host adapter is not configured. Call configureCommunityPcHost() first.");
  }
  return activeHostAdapter;
}

export function resetCommunityPcHost(): void {
  activeHostAdapter = null;
}
