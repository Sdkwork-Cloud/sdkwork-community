/**
 * Community (圈子) H5 route constants.
 *
 * Paths mirror the consuming application route catalog (sdkwork-im h5) so the
 * same capability renders identically in both hosts.
 */
export const CommunityH5Routes = {
  list: "/community",
  create: "/community/create",
  mine: "/community/mine",
  detail: "/community/:id",
  profile: "/community/:id/profile",
  profileGroups: "/community/:id/profile/groups",
  profileGroupsEdit: "/community/:id/profile/groups/edit/:groupId",
  profileEdit: "/community/:id/profile/edit",
  profileImage: "/community/:id/profile/image",
  profileTabs: "/community/:id/profile/tabs",
  profileMembers: "/community/:id/profile/members",
  profileQrCode: "/community/:id/profile/qrcode",
  postCreate: "/community/:id/post",
  groupsCreate: "/community/:id/groups/create",
  groupQrs: "/community/:id/group/:groupId",
} as const;
