# SDKWork Community Migration Design

## Purpose

`sdkwork-community` owns SDKWork community posts, discussions, questions, resources, public feeds, moderation state, recommendations, and community route composition. `sdkwork-appbase` should remain a foundation/runtime/IAM assembly workspace and must not own community product logic.

## Scope

- Move the existing `@sdkwork/community-pc-react` package out of `sdkwork-appbase`.
- Add framework-independent TypeScript contracts, SDK ports, service, and runtime packages.
- Add Rust core, SQLx storage implementation, SQL migrations, and HTTP route metadata.
- Add owner-only OpenAPI 3.1.2 app/backend/open API documents and SDK generation wrappers.
- Remove appbase community package, TypeScript alias, catalog entry, and workspace references after the new owner is present.

## Architecture

The workspace follows the independent application shape already used by neighboring SDKWork domains:

- `packages/common/community/*` contains TypeScript contracts and service boundaries.
- `apps/sdkwork-community-pc/packages/community/sdkwork-community-pc-react` contains PC React reusable community logic.
- `crates/sdkwork-community-core-rust` contains Rust domain contracts and publication/moderation logic.
- `crates/sdkwork-community-storage-sqlx-rust` owns SQLx migrations, repository contracts, and SQLite behavior.
- `crates/sdkwork-community-http-rust` owns HTTP route metadata for SDKWork v3 API surfaces.
- `generated/openapi` stores generated owner-only OpenAPI inputs.
- `sdks/sdkwork-community-{sdk,app-sdk,backend-sdk}` stores SDK assembly metadata, generation wrappers, and smoke tests.

## API Surface

App API routes expose reader and authenticated contribution behavior under `/app/v3/api/community/*`:

- category list
- feed list
- entry retrieve
- recommendation list
- entry create/update
- comment list/create
- reaction set
- publication readiness retrieve

Backend API routes expose moderation and management behavior under `/backend/v3/api/community/*`:

- category management
- entry management
- moderation state updates
- feature/pin commands
- recommendation snapshot rebuild
- moderation queue

Open API routes expose public integration behavior under `/community/v3/api/*`.

All operations use owner `sdkwork-community`, authorities `sdkwork-community.app`, `sdkwork-community.backend`, or `sdkwork-community.open`, tag `community`, dotted operationIds, SDKWork v3 path prefixes, RFC 9457 problem responses, and owner-only generated SDK inputs.

## Storage

The initial SQLx schema creates:

- `community_category`
- `community_entry`
- `community_entry_body`
- `community_tag`
- `community_entry_tag`
- `community_comment`
- `community_reaction`
- `community_moderation_event`
- `community_recommendation_snapshot`
- `community_schema_version`
- `community_migration_lock`

Indexes cover tenant/category/kind/state/feed ordering, slug uniqueness, featured and pinned ordering, tag lookup, comments, reactions, moderation queue, recommendation lookup, and schema bookkeeping.

## Appbase Cleanup

After the new workspace exists, appbase must no longer declare:

- `packages/pc-react/communication/sdkwork-community-pc-react`
- `@sdkwork/community-pc-react` alias in `tsconfig.base.json`
- `sdkwork-community-pc-react` in `scripts/package-catalog.mjs`
- community workspace references in `pnpm-lock.yaml`

Appbase may still mention `sdkwork-community` as an extraction source in historical docs only if it does not wire active package ownership. Active source, SDKs, OpenAPI documents, and Rust implementation belong to `sdkwork-community`.
