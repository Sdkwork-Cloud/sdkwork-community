# Community Ownership And Integration

Status: completed
Owner: SDKWork maintainers
Updated: 2026-07-03

## Current Ownership

`sdkwork-community` owns community product logic end-to-end:

- OpenAPI authorities (`apis/`, `generated/openapi/`)
- Generated SDK families (`sdks/sdkwork-community-{sdk,app-sdk,backend-sdk}`)
- Rust domain, SQLx storage, HTTP route crates, standalone gateway
- Shared TypeScript contracts, SDK ports, runtime, and service packages
- Multi-client application roots (PC, H5, Flutter)
- PC UI package `@sdkwork/community-pc-community`

`sdkwork-appbase` remains a foundation/runtime/IAM workspace and must not own community product code.

## PC Client Architecture

| Layer | Package | Responsibility |
| --- | --- | --- |
| UI + host adapter | `@sdkwork/community-pc-community` | `CommunityView`, `CommunityDetail`, read-only settings, i18n, `configureCommunityPcHost()` |
| IM integration | `@sdkwork/im-pc-community` | Thin adapter: IM toast, Avatar, session, drive upload, language bridge |
| SDK consumption | `@sdkwork/community-runtime` | Generated app SDK port wiring |
| Domain facade | `@sdkwork/community-service` | Typed feed, entry, and comment operations |

Host applications must call `configureCommunityPcHost()` before rendering community UI. Standalone bootstrap lives in `apps/sdkwork-community-pc/src/bootstrap/communityHost.tsx`.

## App API Surface (Shipped)

App API operations under `/app/v3/api/community/*`:

- `categories.list`
- `feed.list`
- `entries.retrieve`, `entries.create`, `entries.update`, `entries.delete`
- `entries.recommendations.list`
- `entries.publicationReadiness.retrieve`
- `comments.list`, `comments.create`
- `reactions.set`

PC UI exposes the **feeds** tab only (`PC_COMMUNITY_SUPPORTED_TABS`). `CommunityService` implements the shipped App API subset: categories, feed, entry create/delete, comments, and reactions. Media upload remains a UI fail-closed constant until a matching App API operation ships.

## IM Integration

`sdkwork-im` integrates community through:

1. Gateway upstream proxy at `/app/v3/api/community/*`
2. `@sdkwork/im-pc-community` host adapter over `@sdkwork/community-pc-community`
3. Session-scoped community app SDK client in `@sdkwork/im-pc-core`

IM must not duplicate community UI, service logic, or OpenAPI ownership.

## Verification

```powershell
pnpm verify
pnpm --filter @sdkwork/community-pc-community typecheck
node ../sdkwork-im/scripts/dev/sdkwork-im-pc-sidebar-module-sdk-boundary.test.mjs
node ../sdkwork-im/apps/sdkwork-im-pc/scripts/community-app-sdk-integration-contract.test.mjs
```

Authority: `TECH_ARCHITECTURE.md`, `../sdkwork-specs/API_SPEC.md` sections 4.5 and 14–16.
