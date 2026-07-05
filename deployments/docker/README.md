# Community Standalone Gateway (Docker)

Local development and standalone deployment use the Rust gateway binary:

```powershell
pnpm gateway:run
```

Default bind address: `0.0.0.0:18094` (`COMMUNITY_API_BIND`).

## Environment

| Variable | Purpose |
| --- | --- |
| `COMMUNITY_API_BIND` | HTTP listen address |
| `SDKWORK_DATABASE_URL` | PostgreSQL connection (production) |
| `SDKWORK_DATABASE_ENGINE` | `postgres` or `sqlite` |

## Health

- Liveness/readiness: framework `service_router` health endpoints
- Database readiness probe executes `SELECT 1` against the active pool

Authority: `DEPLOYMENT_SPEC.md`, `APPLICATION_GATEWAY_SPEC.md`.
