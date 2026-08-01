# Community Production Gateway Runbook

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-31

## Preconditions

- Select `standalone.production` through `sdkwork-app`; cloud hosting consumes the assembly from the
  platform gateway and does not start this binary from the Community repository.
- Provide a reachable PostgreSQL profile through `SDKWORK_DATABASE_*`.
- Provide Redis through structured `SDKWORK_COMMUNITY_REDIS_*` values or the managed URL override.
- Mount database and Redis password files with service-account-only permissions.
- Provide production IAM signing, issuer, application registration, and CORS configuration.

## Start And Verify

```powershell
pnpm gateway:validate:standalone
pnpm gateway:run:standalone
```

Verify `GET /healthz` returns `200`, then verify `GET /readyz` returns `200`. A `503` readiness
response means PostgreSQL or Redis is unavailable; dependency details remain only in redacted server
logs. Confirm `GET /metrics` is reachable only according to deployment network policy.

## Runtime Parity Evidence

Validate the tracked standalone evidence on every merge:

```powershell
pnpm check:api-runtime-parity
```

Regenerate it only against an already initialized PostgreSQL integration profile supplied through
protected `SDKWORK_DATABASE_*` process environment. The probe disables automatic migration and
seeding, executes every assembled handler under a reserved nonexistent tenant, reads the mounted
`/openapi.json`, and compares executable, bound-manifest, served-OpenAPI, and SDK-authority
inventories:

```powershell
pnpm api:runtime-parity:generate
pnpm api:runtime-parity:generate:check
```

Do not point the generator at an uninitialized database: lifecycle initialization is not a release
or migration substitute, and database structural changes still require explicit human approval.

## Failure Signals

- Startup exits before bind: invalid profile identity, bind, Redis configuration, IAM hardening, or
  missing secret file.
- `/healthz` succeeds and `/readyz` returns `503`: PostgreSQL or Redis connectivity failure.
- Protected operations return `401`: token signature, issuer, audience, session, or revocation check
  failed.
- Protected operations return `429`: Redis-backed rate-limit or concurrent-admission policy rejected
  the request.
- Requests fail after business handling: inspect IAM audit persistence errors; audit writes fail
  closed, while security-event write failures emit a redacted warning and remain fail-open.

## Recovery

1. Keep the instance out of service while `/readyz` is not `200`.
2. Validate secret mounts and structured PostgreSQL/Redis endpoints without printing credentials.
3. Restore dependency connectivity or roll back to the last verified application artifact and source
   profile as one unit.
4. Restart the process and require consecutive successful readiness probes before routing traffic.
5. Correlate framework logs, audit events, and security events using the server-owned trace id.

Never disable production Redis, substitute in-memory stores, relax IAM audience checks, or bypass
readiness to restore traffic.
