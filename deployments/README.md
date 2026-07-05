# Deployments Directory

Deployment handoff for the community standalone gateway and client surfaces.

## Structure

```text
deployments/
  docker/        # Gateway container notes and run guidance
  k8s/           # Reserved for Kubernetes manifests
  systemd/       # Reserved for systemd unit files
  nginx/         # Reserved for reverse-proxy examples
  runbooks/      # Reserved for operator runbooks
```

## Quick Start

Run the standalone community API gateway locally:

```powershell
pnpm gateway:run
```

Start gateway plus a client dev surface:

```powershell
pnpm dev:desktop
pnpm dev:browser
```

Default API bind: `0.0.0.0:18094` (`COMMUNITY_API_BIND`).

See [docker/README.md](docker/README.md) for environment variables and health probes.

## Standards

- `DEPLOYMENT_SPEC.md`
- `APPLICATION_GATEWAY_SPEC.md`
- `SDKWORK_DEPLOY_SPEC.md`

Deploy manifest: `deployments/deploy.yaml` (default profile `standalone.unified-process.development`).

Plan a deployment handoff:

```powershell
pnpm deploy:plan
```

Validate deploy topology alignment:

```powershell
pnpm deploy:validate
```
