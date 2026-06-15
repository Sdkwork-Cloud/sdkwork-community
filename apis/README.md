# APIs Directory

This directory contains API contracts and API source inputs for all API kinds.

## Structure

```
apis/
  open-api/       # OpenAPI HTTP contracts
  app-api/        # App API contracts
  backend-api/    # Backend API contracts
  rpc/            # RPC/proto contracts (if applicable)
  async/          # Async/event API manifests (if applicable)
```

## Community API Surfaces

| Surface | Prefix | Authority |
|---------|--------|-----------|
| Open API | `/community/v3/api` | `sdkwork-community.open` |
| App API | `/app/v3/api/community` | `sdkwork-community.app` |
| Backend API | `/backend/v3/api/community` | `sdkwork-community.backend` |

## Standards

- `API_SPEC.md`: HTTP API contract standard
- `SDK_WORKSPACE_GENERATION_SPEC.md`: SDK workspace generation