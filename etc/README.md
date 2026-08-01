# Source Configuration

`sdkwork.deployment.config.json` is the source profile index for the SDKWork Community application.
It selects safe, source-controlled profiles under `topology/`; `specs/topology.spec.json` defines the
allowed topology and `sdkwork.app.config.json` defines application and release identity.

Supported profiles are `standalone.development`, `standalone.production`, `cloud.development`, and
`cloud.production`. Local development defaults to `standalone.development`. Profile values are
materialized by `sdkwork-app`; generated runtime files and local overrides are not source authority.

Files matching `*.local.*`, `.sdkwork/local/`, and `.sdkwork/secrets/` are private and ignored. Keep
passwords, tokens, keys, and certificates out of this directory. PostgreSQL and Redis credentials
must be provided through referenced local files, mounted secret files, or protected process
environment values. `standalone.production` requires PostgreSQL and Redis before serving traffic.
`cloud.production` intentionally omits managed database and Redis hosts; the platform runtime must
inject the approved host or advanced URL, and missing values fail closed.

Validate after any change:

```powershell
node ..\sdkwork-specs\tools\check-source-config-standard.mjs --root . --enforce-profile-identity
pnpm topology:validate
pnpm deploy:validate
```
