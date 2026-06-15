export * from "@sdkwork/community-contracts";
export type { SdkworkMediaResource } from "@sdkwork/community-contracts";

export type SdkworkShellThemeColor = "lobster" | "zinc" | "green-tech" | "violet" | "rose";
export type SdkworkShellThemeSelection = "light" | "dark" | "system";
export type SdkworkPcReactHost = "browser" | "electron" | "tauri";

export interface SdkworkCommunityAppThemePreset {
  color: SdkworkShellThemeColor;
  preset: "sdkwork";
  selection: SdkworkShellThemeSelection;
}

export interface SdkworkCommunityAppCapabilityManifest {
  architecture: "pc-react";
  description?: string;
  host: SdkworkPcReactHost;
  id: string;
  packageNames: string[];
  theme: SdkworkCommunityAppThemePreset;
  title: string;
}

export interface CreateCommunityAppCapabilityManifestOptions {
  description?: string;
  host?: SdkworkPcReactHost;
  id: string;
  packageNames?: string[];
  theme?: Partial<SdkworkCommunityAppThemePreset>;
  title: string;
}

export const SDKWORK_COMMUNITY_STANDARD_THEME_PRESET: SdkworkCommunityAppThemePreset = {
  color: "lobster",
  preset: "sdkwork",
  selection: "system",
};

export interface SdkworkCommunityWorkspaceManifest extends SdkworkCommunityAppCapabilityManifest {
  capability: "community";
  composerRoutePath: string;
  detailRoutePattern: string;
  routePath: string;
}

export interface CreateCommunityWorkspaceManifestOptions
  extends Partial<
    Pick<CreateCommunityAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  composerRoutePath?: string;
  routePath?: string;
}

export interface SdkworkCommunityPostRouteIntent {
  commentId?: string;
  entryId: string;
  focusWindow: boolean;
  route: string;
  source: "community-feed";
  type: "community-post-route-intent";
}

export interface CreateCommunityPostRouteIntentOptions {
  basePath?: string;
  commentId?: string;
  focusWindow?: boolean;
}

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

export function createCommunityAppCapabilityManifest({
  description,
  host = "tauri",
  id,
  packageNames = ["@sdkwork/community-pc-community"],
  theme,
  title,
}: CreateCommunityAppCapabilityManifestOptions): SdkworkCommunityAppCapabilityManifest {
  return {
    architecture: "pc-react",
    description,
    host,
    id,
    packageNames: toUniquePackages(packageNames),
    theme: {
      ...SDKWORK_COMMUNITY_STANDARD_THEME_PRESET,
      ...theme,
      preset: "sdkwork",
    },
    title,
  };
}

export function createCommunityWorkspaceManifest({
  composerRoutePath = "/community/new",
  description = "Community workspace for discussions, recommendations, and public post routing.",
  host,
  id = "sdkwork-community",
  packageNames = ["@sdkwork/community-pc-community"],
  routePath = "/community",
  theme,
  title = "Community",
}: CreateCommunityWorkspaceManifestOptions = {}): SdkworkCommunityWorkspaceManifest {
  return {
    ...createCommunityAppCapabilityManifest({
      description,
      host,
      id,
      packageNames: toUniquePackages(packageNames),
      theme,
      title,
    }),
    capability: "community",
    composerRoutePath,
    detailRoutePattern: `${routePath}/:entryId`,
    routePath,
  };
}

export function createCommunityPostRouteIntent(
  entryId: string,
  options: CreateCommunityPostRouteIntentOptions = {},
): SdkworkCommunityPostRouteIntent {
  const query = options.commentId ? `?comment=${encodeURIComponent(options.commentId)}` : "";

  return {
    commentId: options.commentId,
    entryId,
    focusWindow: options.focusWindow !== false,
    route: `${options.basePath ?? "/community"}/${entryId}${query}`,
    source: "community-feed",
    type: "community-post-route-intent",
  };
}

export const communityPackageMeta = {
  architecture: "pc-react",
  domain: "community",
  package: "@sdkwork/community-pc-community",
  status: "ready",
  workspace: "sdkwork-community",
} as const;

export type CommunityPackageMeta = typeof communityPackageMeta;
