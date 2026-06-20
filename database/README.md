# COMMUNITY Database Module

Canonical lifecycle assets for `sdkwork-community` per `DATABASE_FRAMEWORK_SPEC.md`.

- moduleId: `community`
- serviceCode: `COMMUNITY`
- tablePrefix: `community_`

## Commands

```bash
pnpm run db:materialize:contract
pnpm run db:validate
```

Legacy SQL: `crates/sdkwork-community-storage-sqlx-rust/migrations/0001_community_foundation.sql` → `database/ddl/baseline/postgres/0001_community_legacy_baseline.sql`

Runtime bootstrap: `sdkwork-community-database-host` / `connect_and_bootstrap_community_database_from_env()`. SQLite tests continue to use `SqliteCommunityStore::migrate()`.
