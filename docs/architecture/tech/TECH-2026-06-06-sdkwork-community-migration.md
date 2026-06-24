> Migrated from `docs/superpowers/plans/2026-06-06-sdkwork-community-migration.md` on 2026-06-24.
> Owner: SDKWork maintainers

> **For agentic workers:** REQUIRED SUB-SKILL: Use main-agent execution only for this task because the user explicitly requested no subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move community ownership out of `sdkwork-appbase` into `sdkwork-community` with complete TypeScript, Rust, OpenAPI, and SDK generation support.

**Architecture:** Create an independent SDKWork domain workspace modeled after existing migrated domains. Keep owner-only OpenAPI and generated SDK families inside `sdkwork-community`, while deleting active community package ownership from `sdkwork-appbase`.

**Tech Stack:** TypeScript, Vitest, Node test runner, Rust 2021, SQLx SQLite, OpenAPI 3.1.2, canonical SDKWork SDK generator.

---

### Task 1: Verification Baseline

**Files:**
- Create: `sdks/test/community-openapi-boundary.test.mjs`
- Create: `sdks/test/community-schema-quality-gate.test.mjs`
- Create: `scripts/community-workspace-boundary.test.mjs`
- Create: `<workspace-root>/sdkwork-appbase/scripts/appbase-community-extraction-boundary.test.mjs`

- [ ] Write failing tests for community OpenAPI, schema quality, workspace shape, and appbase cleanup.
- [ ] Run the tests and verify they fail because implementation is missing.

### Task 2: Workspace And Packages

**Files:**
- Create root workspace manifests and config.
- Create `packages/common/community/*`.
- Move `sdkwork-community-pc-react` from appbase to `apps/sdkwork-community-pc/packages/community/`.

- [ ] Implement TypeScript contracts, SDK ports, service, runtime, and PC React package.
- [ ] Run Vitest and typecheck.

### Task 3: Rust Core, Storage, And HTTP

**Files:**
- Create `crates/sdkwork-community-core-rust`.
- Create `crates/sdkwork-community-storage-sqlx-rust`.
- Create `crates/sdkwork-community-http-rust`.

- [ ] Implement Rust core publication/readiness and manifest logic.
- [ ] Implement SQLx migration and SQLite store behavior.
- [ ] Implement route metadata for app/backend/open surfaces.
- [ ] Run `cargo test --workspace`.

### Task 4: OpenAPI And SDK Generation

**Files:**
- Create `tools/community_openapi_export.mjs`.
- Create `tools/community_schema_quality_gate.mjs`.
- Create `tools/community_sdk_generator_runner.mjs`.
- Create `tools/community_sdk_generate.mjs`.
- Create `sdks/sdkwork-community-sdk`.
- Create `sdks/sdkwork-community-app-sdk`.
- Create `sdks/sdkwork-community-backend-sdk`.

- [ ] Generate owner-only OpenAPI documents.
- [ ] Add SDK manifests and generation wrappers.
- [ ] Generate TypeScript SDKs.
- [ ] Run SDK smoke tests and schema quality tests.

### Task 5: Appbase Cleanup

**Files:**
- Delete appbase `packages/pc-react/communication/sdkwork-community-pc-react`.
- Modify appbase `scripts/package-catalog.mjs`.
- Modify appbase `tsconfig.base.json`.
- Refresh appbase lockfile if needed.
- Add appbase cleanup governance test.

- [ ] Remove active appbase community package ownership.
- [ ] Run appbase governance tests.
- [ ] Search appbase for community active ownership residue and remove stale wiring.

### Task 6: Final Verification

- [ ] Run `pnpm install` in `sdkwork-community` if needed.
- [ ] Run `pnpm verify`.
- [ ] Run `cargo test --workspace`.
- [ ] Run `pnpm --dir <workspace-root>/sdkwork-appbase test:governance-node`.
- [ ] Re-run searches for community leftovers in appbase and missing generated community artifacts.

