# Community Changelog

## Unreleased

- Standardized the standalone gateway bind as `SDKWORK_COMMUNITY_SERVER_BIND`.
- Added production IAM audience/session enforcement and IAM-backed framework audit/security events.
- Added Redis-backed production rate limiting, idempotency, concurrent admission, and readiness.
- Added a host-neutral assembly runtime bundle exposing the complete API contribution and shared
  PostgreSQL pool.
- Replaced duplicate gateway tracing with the Web Framework tracing initializer and added explicit
  process-level Rustls provider installation.
