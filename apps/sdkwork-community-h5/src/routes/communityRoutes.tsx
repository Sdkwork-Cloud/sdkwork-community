import React from "react";
import { Navigate } from "react-router";

type CommunityPageName =
  | "CommunityList"
  | "MyCommunities"
  | "CreateCommunity"
  | "CommunityDetail"
  | "CommunityProfile"
  | "CommunityGroupManagement"
  | "CreateCommunityGroup"
  | "CommunityEditField"
  | "CommunityEditImage"
  | "CommunityEditTabs"
  | "CommunityMembers"
  | "CommunityQRCode"
  | "CommunityPostCreate"
  | "CommunityGroupQRs";

function lazyPage(name: CommunityPageName) {
  return React.lazy(async () => {
    const mod = await import("@sdkwork/community-mobile-react-community");
    return { default: mod[name] };
  });
}

const CommunityList = lazyPage("CommunityList");
const MyCommunities = lazyPage("MyCommunities");
const CreateCommunity = lazyPage("CreateCommunity");
const CommunityDetail = lazyPage("CommunityDetail");
const CommunityProfile = lazyPage("CommunityProfile");
const CommunityGroupManagement = lazyPage("CommunityGroupManagement");
const CreateCommunityGroup = lazyPage("CreateCommunityGroup");
const CommunityEditField = lazyPage("CommunityEditField");
const CommunityEditImage = lazyPage("CommunityEditImage");
const CommunityEditTabs = lazyPage("CommunityEditTabs");
const CommunityMembers = lazyPage("CommunityMembers");
const CommunityQRCode = lazyPage("CommunityQRCode");
const CommunityPostCreate = lazyPage("CommunityPostCreate");
const CommunityGroupQRs = lazyPage("CommunityGroupQRs");

/**
 * Community (圈子) route catalog.
 *
 * Paths mirror the consuming application route catalog (sdkwork-im h5) so the
 * same module renders identically in both hosts.
 */
export const communityRouteDefinitions = [
  { path: "/community", element: <CommunityList /> },
  { path: "/community/create", element: <CreateCommunity /> },
  { path: "/community/mine", element: <MyCommunities /> },
  { path: "/community/:id", element: <CommunityDetail /> },
  { path: "/community/:id/profile", element: <CommunityProfile /> },
  { path: "/community/:id/profile/groups", element: <CommunityGroupManagement /> },
  { path: "/community/:id/profile/groups/edit/:groupId", element: <CreateCommunityGroup /> },
  { path: "/community/:id/profile/edit", element: <CommunityEditField /> },
  { path: "/community/:id/profile/image", element: <CommunityEditImage /> },
  { path: "/community/:id/profile/tabs", element: <CommunityEditTabs /> },
  { path: "/community/:id/profile/members", element: <CommunityMembers /> },
  { path: "/community/:id/profile/qrcode", element: <CommunityQRCode /> },
  { path: "/community/:id/post", element: <CommunityPostCreate /> },
  { path: "/community/:id/groups/create", element: <CreateCommunityGroup /> },
  { path: "/community/:id/group/:groupId", element: <CommunityGroupQRs /> },
  { path: "/login", element: <Navigate to="/community" replace /> },
] as const;

export const COMMUNITY_H5_NAV_ITEMS = [
  { labelKey: "community.title", path: "/community" },
  { labelKey: "community.auto_2e5be31b", path: "/community/mine" },
  { labelKey: "community.auto_26c221c7", path: "/community/create" },
] as const;
