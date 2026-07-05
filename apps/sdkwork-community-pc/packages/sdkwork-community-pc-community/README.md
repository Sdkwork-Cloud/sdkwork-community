# @sdkwork/community-pc-community

PC React community package for category browsing, feed posts, comments, and workspace route intents.

## Ownership

- Workspace: `sdkwork-community`
- Domain: `community`
- Capability: `community`

Domain contracts live in `@sdkwork/community-contracts`. SDK consumption flows through `@sdkwork/community-sdk-ports` and `@sdkwork/community-runtime` via the host adapter (`configureCommunityPcHost`).

## Shipped UI Surface

| Component | Responsibility |
| --- | --- |
| `CommunityView` | Category list and navigation |
| `CommunityDetail` | Feed posts and comments |
| `CommunitySettings` | Read-only category information |
| `CommunityService` | App API subset (categories, feed, entries, comments) |

Host applications must call `configureCommunityPcHost()` before rendering community UI.

## Verification

```powershell
pnpm --filter @sdkwork/community-pc-community typecheck
pnpm --filter @sdkwork/community-pc-community test
```

Machine-readable contract: `specs/component.spec.json`.
