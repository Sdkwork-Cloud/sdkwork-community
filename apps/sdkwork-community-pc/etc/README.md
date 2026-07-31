# PC Source Configuration

`sdkwork.deployment.config.json` delegates PC deployment selection to the repository-level
`../../../etc/sdkwork.deployment.config.json` and topology authority at
`../../../specs/topology.spec.json`. This component root does not duplicate parent profile values.

Local overrides and credentials belong under ignored `.sdkwork/local/` or `.sdkwork/secrets/`
storage. Validate with:

```powershell
node ..\..\..\sdkwork-specs\tools\check-source-config-standard.mjs --root .
```
