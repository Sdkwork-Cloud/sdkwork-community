# SDKWork Community

`sdkwork-community` is the owner workspace for SDKWork community capabilities. It contains the community domain contracts, OpenAPI authority documents, generated SDK families, TypeScript runtime layers, PC React integration helpers, Rust domain/http/storage crates, and SQLx-backed database schema.

The workspace is intentionally independent from `sdkwork-appbase`: community source, database logic, API definitions, and SDK generation are owned here.

## Application Capabilities

### Community Domain

The community domain supports:

- Community entry kinds: announcements, discussions, questions, resources, and services.
- Review states: draft, pending review, approved, flagged, and rejected.
- Category-aware and tag-aware community entries.
- Public community feed listing and entry retrieval.
- Feed sorting modes: latest, top, trending, and unanswered.
- Feed filtering by category, kind, tag, review state, featured status, and query text.
- Entry digests and digest summaries for compact UI lists.
- Recommendation scoring based on shared category, kind, tags, author, featured state, accepted answers, and activity.
- Publication readiness checks for title, category, body, excerpt, tags, and moderation state.
- Moderation state transitions and moderation event persistence in the Rust storage layer.

### API Surfaces

The repository defines three owner-only API authority documents.

| Surface | Prefix | Authority | Operations |
| --- | --- | --- | --- |
| Open API | `/community/v3/api` | `sdkwork-community.open` | 4 |
| App API | `/app/v3/api/community` | `sdkwork-community.app` | 9 |
| Backend API | `/backend/v3/api/community` | `sdkwork-community.backend` | 11 |

Open API operations:

- `GET /community/v3/api/categories`
- `GET /community/v3/api/feed`
- `GET /community/v3/api/entries/{entryId}`
- `GET /community/v3/api/entries/by_slug/{slug}`

App API operations:

- `GET /app/v3/api/community/categories`
- `GET /app/v3/api/community/feed`
- `GET /app/v3/api/community/entries/{entryId}`
- `GET /app/v3/api/community/entries/{entryId}/recommendations`
- `POST /app/v3/api/community/entries`
- `PATCH /app/v3/api/community/entries/{entryId}`
- `GET /app/v3/api/community/entries/{entryId}/publication_readiness`
- `GET /app/v3/api/community/entries/{entryId}/comments`
- `POST /app/v3/api/community/entries/{entryId}/comments`

Backend API operations:

- `GET /backend/v3/api/community/categories`
- `POST /backend/v3/api/community/categories`
- `PATCH /backend/v3/api/community/categories/{categoryId}`
- `DELETE /backend/v3/api/community/categories/{categoryId}`
- `GET /backend/v3/api/community/entries`
- `POST /backend/v3/api/community/entries/{entryId}/moderation`
- `POST /backend/v3/api/community/entries/{entryId}/feature`
- `POST /backend/v3/api/community/entries/{entryId}/pin`
- `DELETE /backend/v3/api/community/entries/{entryId}`
- `GET /backend/v3/api/community/moderation/queue`
- `POST /backend/v3/api/community/recommendations/rebuild`

Generated OpenAPI files are stored in:

- `generated/openapi/community-open-api.openapi.json`
- `generated/openapi/community-app-api.openapi.json`
- `generated/openapi/community-backend-api.openapi.json`

### SDK Generation

The workspace owns three generated SDK families.

| SDK family | API authority | Operation count | Dependencies |
| --- | --- | --- | --- |
| `sdks/sdkwork-community-sdk` | `sdkwork-community.open` | 4 | none |
| `sdks/sdkwork-community-app-sdk` | `sdkwork-community.app` | 9 | none |
| `sdks/sdkwork-community-backend-sdk` | `sdkwork-community.backend` | 11 | none |

Generated TypeScript SDK output lives under each SDK family's `*-typescript/generated/server-openapi` directory.

### TypeScript Packages

| Package | Capability |
| --- | --- |
| `@sdkwork/community-contracts` | Community domain types, route catalogs, filtering, sorting, feed summaries, recommendations, entry digests, review-state normalization, and publication readiness. |
| `@sdkwork/community-sdk-ports` | Typed app SDK port interfaces plus an in-memory community app SDK port for local tests and lightweight runtime wiring. |
| `@sdkwork/community-service` | Service facade over the community app SDK port for feed listing and entry retrieval. |
| `@sdkwork/community-runtime` | Runtime composition for app client, runtime configuration, and service facade. |
| `@sdkwork/community-pc-react` | PC React community package metadata, workspace manifest helpers, standard theme preset, and post route intent helpers. |

### Rust Crates

| Crate | Capability |
| --- | --- |
| `sdkwork_community_core` | Rust community domain model, capability manifest, and publication readiness evaluation. |
| `sdkwork_community_http` | Canonical route catalogs for open, app, and backend API prefixes, plus required auth header declarations. |
| `sdkwork_community_storage_sqlx` | SQLx SQLite storage implementation, schema manifest, migration plan, repository bindings, category creation, entry creation, approval, feed listing, and slug retrieval. |

The storage crate owns the initial SQL migration:

- `crates/sdkwork-community-storage-sqlx-rust/migrations/0001_community_foundation.sql`

The migration creates community tables for categories, entries, entry bodies, tags, entry tags, comments, reactions, moderation events, recommendation snapshots, schema versioning, and migration locking.

### PC React Integration

The PC React package provides integration helpers instead of coupling to appbase.

It can create:

- A community app capability manifest.
- A community workspace manifest with route path, composer path, and detail route pattern.
- A community post route intent for opening a specific entry and optional comment.
- Standard SDKWork theme metadata for community surfaces.

## Repository Layout

```text
apps/
  sdkwork-community-pc/packages/community/sdkwork-community-pc-react/
crates/
  sdkwork-community-core-rust/
  sdkwork-community-http-rust/
  sdkwork-community-storage-sqlx-rust/
generated/openapi/
packages/common/community/
  sdkwork-community-contracts/
  sdkwork-community-sdk-ports/
  sdkwork-community-service/
  sdkwork-community-runtime/
sdks/
  sdkwork-community-sdk/
  sdkwork-community-app-sdk/
  sdkwork-community-backend-sdk/
tools/
  community_openapi_export.mjs
  community_schema_quality_gate.mjs
  community_sdk_generate.mjs
  community_sdk_generator_runner.mjs
```

## Prerequisites

- Node.js with `pnpm`.
- Rust toolchain with `cargo`.
- PowerShell on Windows for the command examples below.

The workspace is configured for `pnpm@10.33.0`.

## Install

```powershell
pnpm install
```

## Common Commands

Export OpenAPI documents:

```powershell
pnpm openapi:export
```

Check generated SDKs without changing files:

```powershell
pnpm sdk:check
```

Regenerate SDKs:

```powershell
pnpm sdk:generate
```

Run Node test suites:

```powershell
pnpm test:node
```

Run Vitest suites:

```powershell
pnpm test:vitest
```

Run TypeScript type checking:

```powershell
pnpm typecheck
```

Run Rust tests:

```powershell
cargo test --workspace
```

Run the full verification gate:

```powershell
pnpm verify
```

`pnpm verify` runs SDK generation checks, Node tests, Vitest tests, and Rust workspace tests.

## Boundary Governance

The repository includes governance tests that assert community ownership stays inside `sdkwork-community` and does not depend on `sdkwork-appbase` ownership paths.

Key governance coverage includes:

- Required source, Rust, OpenAPI, and SDK families exist in this workspace.
- Active community files do not reference appbase package ownership.
- OpenAPI documents use the expected SDKWork v3 prefixes.
- SDK manifests are owner-only and dependency-free.
- Schema quality gates validate generated OpenAPI defaults.

## License

This repository currently declares `SEE LICENSE IN LICENSE` in `package.json`.

## SDKWork Documentation Contract

Domain: communication
Capability: community-workspace
Package type: rust-crate
Status: standard

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
