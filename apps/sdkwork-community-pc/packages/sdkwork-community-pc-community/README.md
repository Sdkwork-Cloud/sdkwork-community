# @sdkwork/community-pc-community

PC React community package for discussions, questions, recommendations, and community workspace route intents.

## Ownership

- Workspace: `sdkwork-community`
- Domain: `community`
- Capability: `community`

Pure domain contracts live in `@sdkwork/community-contracts`. This package owns PC React composition metadata and local community manifest integration.

## SDKWork Documentation Contract

Domain: communication
Capability: community
Package type: react-package
Status: ready

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- `@sdkwork/community-app-sdk`

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm --filter @sdkwork/community-pc-community typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
