# @sdkwork/community-mobile-react-community

Community (圈子) mobile React UI for the `sdkwork-community` module: community
circles, posts, comments, members, groups, QR codes and payments.

## Pages

- `CommunityList` `/community` — circle discovery with search, tabs, join and
  payment flows
- `CommunityDetail` `/community/:id` — circle home with feeds/resources/groups
  tabs, comment composer and share
- `CommunityPostCreate` `/community/:id/post-create` — rich text post composer
- `CreateCommunity` `/community/create` — create a new circle
- `CommunityProfile` `/community/:id/profile` — circle profile settings
- `CommunityGroupManagement` `/community/:id/groups` — chat group management
- `CreateCommunityGroup` `/community/:id/groups/create` — create a chat group
- `CommunityGroupQRs` `/community/:id/groups/qrs` — group QR codes
- `CommunityMembers` `/community/:id/members` — member list and role/status
  management
- `CommunityQRCode` `/community/:id/qrcode` — circle QR code
- `CommunityEditField` / `CommunityEditImage` / `CommunityEditTabs` — edit flows
- `MyCommunities` `/community/mine` — joined circles

## Data flow

The package keeps the original service surface (`CommunityService`) and
delegates remote data to the injected community App SDK port:

- `configureCommunityRuntimePort(port)` — host injection point (see
  `services/communityRuntimePort.ts`).
- Without a host configuration the package falls back to an in-memory port
  seeded with the legacy sample circles, posts, comments and memberships, so
  demos and tests keep working.
- `configureCommunityAuthSessionPort(port)` — host injection point for the
  current-user lookup used by the payment sheet.

## i18n

Pages use the shared `translation` namespace with `community.` prefixed keys
(e.g. `t("community.auto_fn_afc180c")`). Importing the package root (or
`@sdkwork/community-mobile-react-community/i18n`) registers the `zh`/`en`
bundles on the global i18next instance. Resources are also exported as
`COMMUNITY_I18N_RESOURCES` for hosts that initialize their own instance.
