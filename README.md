# SDKWork Community

repository-kind: application

`sdkwork-community` is the owner workspace for SDKWork community capabilities: domain contracts, OpenAPI authorities, generated SDK families, TypeScript runtime layers, multi-client application roots, Rust HTTP services, and PostgreSQL/SQLite persistence through `sdkwork-database`.

The workspace is independent from `sdkwork-appbase`. Community source, database assets, API definitions, and SDK generation are owned here.

## Application Capabilities

### Community Domain

- Entry kinds: announcements, discussions, questions, resources, and services
- Review states: draft, pending review, approved, flagged, and rejected
- Category-aware and tag-aware entries with feed sorting and filtering
- Publication readiness, recommendations, moderation, and comment threads

### API Surfaces

| Surface | Prefix | Authority | Operations |
| --- | --- | --- | --- |
| Open API | `/community/v3/api` | `sdkwork-community.open` | 4 |
| App API | `/app/v3/api/community` | `sdkwork-community.app` | 9 |
| Backend API | `/backend/v3/api/community` | `sdkwork-community.backend` | 11 |

All HTTP surfaces use the SDKWork v3 envelope (`SdkWorkApiResponse` + numeric `ProblemDetail`) and are served through `sdkwork-web-framework` route crates.

Generated OpenAPI artifacts:

- `generated/openapi/community-open-api.openapi.json`
- `generated/openapi/community-app-api.openapi.json`
- `generated/openapi/community-backend-api.openapi.json`

Authority copies live under `apis/{open-api,app-api,backend-api}/community/openapi.json`.

### SDK Families

| SDK family | API authority | Operations |
| --- | --- | --- |
| `sdks/sdkwork-community-sdk` | `sdkwork-community.open` | 4 |
| `sdks/sdkwork-community-app-sdk` | `sdkwork-community.app` | 9 |
| `sdks/sdkwork-community-backend-sdk` | `sdkwork-community.backend` | 11 |

PC and H5 application roots consume `sdkwork-community-app-sdk` through `@sdkwork/community-runtime`.

### TypeScript Packages

Shared packages live under `apps/sdkwork-community-common/packages/`:

| Package | Capability |
| --- | --- |
| `@sdkwork/community-contracts` | Domain types, route catalogs, filtering, recommendations, publication readiness |
| `@sdkwork/community-sdk-ports` | Typed app SDK port; in-memory port for tests |
| `@sdkwork/community-service` | Service facade over the app SDK port (feed, entries, comments) |
| `@sdkwork/community-runtime` | Generated SDK client wiring and runtime composition |

PC application package:

| Package | Capability |
| --- | --- |
| `@sdkwork/community-pc-community` | PC community UI, host adapter, and SDK-backed `CommunityService` |
| `@sdkwork/community-pc-core` | PC app SDK client bootstrap and composition helpers |

### Rust Crates

| Crate | Capability |
| --- | --- |
| `sdkwork-community-core-rust` | Domain model and publication readiness |
| `sdkwork-community-http-rust` | Canonical route catalog metadata |
| `sdkwork-community-storage-sqlx-rust` | SQLx repositories (PostgreSQL + SQLite) |
| `sdkwork-community-database-host` | `sdkwork-database` lifecycle bootstrap |
| `sdkwork-community-service` | Business use-cases |
| `sdkwork-routes-community-{open,app,backend}-api` | Axum routers on `sdkwork-web-framework` |
| `sdkwork-community-service-host` | Service host and database pool wiring |
| `sdkwork-community-gateway-assembly` | Application router assembly |
| `sdkwork-community-standalone-gateway` | Standalone HTTP server binary |

Database schema authority is `database/` (baseline DDL, contract registry, seeds, drift policy). Crate-local SQL migrations are deprecated.

## Repository Layout

```text
apis/                         # OpenAPI authority documents
apps/
  sdkwork-community-common/   # Shared TypeScript packages
  sdkwork-community-pc/       # PC React application root
  sdkwork-community-h5/       # H5 React application root
  sdkwork-community-flutter-mobile/
crates/                       # Rust domain, routes, service host, gateway
database/                     # sdkwork-database module assets
deployments/                  # Docker and deployment handoff
generated/openapi/            # Materialized OpenAPI exports
scripts/                      # Dev runner, verification, clean helpers
sdks/                         # Generated SDK families
specs/                        # Repository topology and component contracts
tools/                        # OpenAPI export and SDK generation
```

## Prerequisites

- Node.js with `pnpm@10.33.0`
- Rust toolchain with `cargo`
- PostgreSQL for production-style local development (SQLite supported for tests)

## Install

```powershell
pnpm install
```

## Common Commands

Materialize OpenAPI authorities:

```powershell
pnpm api:materialize
```

Regenerate or check SDKs:

```powershell
pnpm sdk:generate
pnpm sdk:check
```

Start local development (community API gateway + frontend):

```powershell
pnpm dev:desktop
pnpm dev:browser
```

Build client surfaces:

```powershell
pnpm build:desktop
pnpm build:browser
```

Run the standalone community API server only:

```powershell
pnpm gateway:run
```

Database lifecycle:

```powershell
pnpm db:bootstrap
pnpm db:status
pnpm db:postgres:migrate
```

Run verification (standards, envelope, SDK, database, deploy, composition):

```powershell
pnpm verify
```

Deployment planning and validation:

```powershell
pnpm deploy:plan
pnpm deploy:validate
```

CI uses `.github/workflows/governance.yml` with `pnpm workflow:prepare-ci-dependencies` for sibling SDKWork repositories.

Flutter mobile:

```powershell
pnpm dev:flutter-android
pnpm test:flutter
pnpm build:flutter-android
pnpm build:flutter-ios
```

## Platform Integration

| Framework | Status |
| --- | --- |
| `sdkwork-web-framework` | Integrated in route crates and standalone gateway |
| `sdkwork-database` | Integrated via `database/` module and lifecycle CLI |
| `sdkwork-utils` | Used in Rust storage/service/route layers |
| `sdkwork-iam-web-adapter` | Integrated for app/backend request context |
| `sdkwork-discovery` | Not required (no RPC services yet) |
| `sdkwork-drive` | Not required until file upload features ship |

File uploads, when added, must use `sdkwork-drive-app-sdk` on clients and Drive uploader services on the Rust backend per `DRIVE_SPEC.md`.

## Boundary Governance

Governance tests assert community ownership stays inside this repository and does not depend on `sdkwork-appbase` ownership paths.

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)

## Application Roots

- [apps directory index](apps/README.md)
