# Community Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-03
Specs: `ARCHITECTURE_DECISION_SPEC.md`, `WEB_FRAMEWORK_SPEC.md`, `DATABASE_FRAMEWORK_SPEC.md`, `APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`

## 1. Architecture Overview

`sdkwork-community` is a standalone SDKWork application repository that owns the community domain end-to-end:

```text
OpenAPI authorities (apis/)
  -> sdkgen SDK families (sdks/)
  -> Client runtimes (PC / H5 / Flutter)
  -> sdkwork-web-framework route crates (Rust)
  -> Community service + SQLx repositories
  -> sdkwork-database module (database/)
```

HTTP traffic enters through `sdkwork-community-standalone-gateway`, which mounts open, app, and backend community routers assembled by `sdkwork-community-gateway-assembly`.

## 2. Technology Choices

| Layer | Choice |
| --- | --- |
| HTTP runtime | Rust + Axum + `sdkwork-web-framework` |
| Persistence | PostgreSQL (production), SQLite (tests) via `sdkwork-database` + SQLx |
| Clients | PC React, H5 React, Flutter mobile |
| SDK contract | OpenAPI 3.1.2, `sdkwork-v3` envelope profile |
| Shared utilities | `sdkwork-utils-rust` / `@sdkwork/utils` where applicable |

## 3. System Boundaries And Modules

- **Contracts:** `@sdkwork/community-contracts` — pure domain types and helpers
- **Ports:** `@sdkwork/community-sdk-ports` — app SDK port abstraction
- **Runtime:** `@sdkwork/community-runtime` — generated SDK client wiring
- **Service (TS):** `@sdkwork/community-service` — UI-facing facade
- **Service (Rust):** `sdkwork-community-service` — business use-cases
- **Repositories:** `sdkwork-community-storage-sqlx-rust` — tenant-scoped SQL access
- **Routes:** `sdkwork-routes-community-*` — HTTP handlers and envelope mapping

Community does not own IAM, Drive, or RPC. It integrates IAM through `sdkwork-iam-web-adapter` for authenticated app/backend surfaces.

## 4. Directory And Package Layout

See repository [README.md](../../../README.md) for the current directory dictionary. Shared TypeScript packages are under `apps/sdkwork-community-common/packages/`, not a root-level `packages/` directory.

## 5. API, SDK, And Data Ownership

- OpenAPI authorities are owner-only and dependency-free
- Generated SDK families mirror the three API surfaces
- Database tables use the `community_` prefix and are declared in `database/database.manifest.json`
- Legacy crate-local migrations are removed; `database/ddl/baseline/` is authoritative

## 6. Security, Privacy, And Observability

- App and backend routes require IAM-resolved request context
- Success responses use `SdkWorkApiResponse`; errors use numeric `ProblemDetail`
- Gateway exposes standard health/readiness through `sdkwork-web-bootstrap`
- No secrets or manual auth headers in client packages; TokenManager owns credentials

## 7. Deployment And Runtime Topology

`specs/topology.spec.json` (schema v2) declares standalone and cloud deployment profiles with `configs/topology/*.env` profile files. Local development uses:

- `pnpm dev:desktop` — gateway on `:18094` + PC Vite
- `pnpm dev:browser` — gateway on `:18094` + H5 Vite

Deployment handoff:

- `deployments/deploy.yaml` — standalone API profile for local and binary-package production
- `pnpm deploy:plan` / `pnpm deploy:validate` — deployctl alignment checks
- `sdkwork.workflow.json` — CI/release lifecycle and sibling dependency materialization
- `.github/workflows/governance.yml` — runs `pnpm verify` on push/PR

Docker handoff examples live under `deployments/docker/`.

## 8. HTTP Contract Tests

Rust integration tests cover all three API surfaces:

| Crate | Tests |
| --- | --- |
| `sdkwork-routes-community-open-api` | OpenAPI route mount + SdkWork v3 envelope |
| `sdkwork-routes-community-app-api` | IAM 401 guard, categories envelope, route mount |
| `sdkwork-routes-community-backend-api` | IAM 401 guard, categories envelope, route mount |

Storage uses `CommunitySqlxStore` with `sdkwork-database` lifecycle bootstrap.

## 9. Architecture Decision Index

- Community ownership and IM integration: [TECH-2026-06-06-sdkwork-community-migration-design.md](./TECH-2026-06-06-sdkwork-community-migration-design.md)

## 10. Verification

```powershell
pnpm verify
cargo clippy --workspace --tests -- -D warnings
```
