# Source Configuration

`sdkwork.deployment.config.json` is the source profile index for the SDKWork Community application.
It selects safe, source-controlled profiles under `topology/`; `specs/topology.spec.json` defines the
allowed topology and `sdkwork.app.config.json` defines application and release identity.

Supported profiles are `standalone.development`, `standalone.production`, `cloud.development`, and
`cloud.production`. Local development defaults to `standalone.development`. Profile values are
materialized by `sdkwork-app`; generated runtime files and local overrides are not source authority.

Files matching `*.local.*`, `.sdkwork/local/`, and `.sdkwork/secrets/` are private and ignored. Keep
passwords, tokens, keys, and certificates out of this directory. PostgreSQL credentials must be
provided through the referenced local or mounted secret file.

Validate after any change:

```powershell
node ..\sdkwork-specs\tools\check-source-config-standard.mjs --root . --enforce-profile-identity
pnpm topology:validate
pnpm deploy:validate
```
