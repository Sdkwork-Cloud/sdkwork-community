# Deployments Directory

This directory contains deployment descriptors, environment topology, packaging handoff files, infrastructure examples, and release deployment documentation.

## Structure

```
deployments/
  docker/        # Docker configurations
  k8s/           # Kubernetes manifests
  systemd/       # systemd service files
  nginx/         # nginx configurations
  runbooks/      # Deployment runbooks
```

## Standards

- `DEPLOYMENT_SPEC.md`: SaaS/private/local deployment parity
- `GITHUB_WORKFLOW_SPEC.md`: GitHub Actions packaging and deployment