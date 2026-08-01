# Community Standalone Gateway (Docker)

Local development and standalone deployment use the Rust gateway binary:

```powershell
pnpm gateway:run:standalone
```

The selected source profile owns the bind through `SDKWORK_COMMUNITY_SERVER_BIND`.

## Environment

| Variable | Purpose |
| --- | --- |
| `SDKWORK_COMMUNITY_SERVER_BIND` | HTTP listen address from the resolved runtime plan |
| `SDKWORK_DATABASE_*` | Structured PostgreSQL connection and pool configuration |
| `SDKWORK_COMMUNITY_REDIS_ENABLED` | Must be `true` for production server/container runtimes |
| `SDKWORK_COMMUNITY_REDIS_HOST` / `SDKWORK_COMMUNITY_REDIS_URL` | Structured Redis host or managed endpoint override |
| `SDKWORK_COMMUNITY_REDIS_PASSWORD_FILE` | Preferred mounted Redis credential source |
| `SDKWORK_COMMUNITY_REDIS_KEY_PREFIX` | Application-owned Redis namespace |

## Health

- Liveness: `GET /healthz`
- Readiness: `GET /readyz` checks the process-shared PostgreSQL pool and production Redis
- Metrics: `GET /metrics`

Authority: `DEPLOYMENT_SPEC.md`, `APPLICATION_GATEWAY_SPEC.md`.
