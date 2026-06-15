# SDKWork Community PC Application

PC browser/desktop application for SDKWork community features.

## Architecture

This application follows `APP_PC_ARCHITECTURE_SPEC.md` for PC browser, desktop, and tablet application architecture.

## Packages

| Package | Capability |
|---------|------------|
| `@sdkwork/community-pc-community` | Community posts, discussions, recommendations, and feed management |

## Development

```powershell
pnpm install
pnpm dev
```

## Build

```powershell
pnpm build
pnpm build:prod
```

## Test

```powershell
pnpm test
pnpm typecheck
```

## Standards

- `APP_PC_ARCHITECTURE_SPEC.md`: PC application root architecture
- `APP_PC_REACT_UI_SPEC.md`: PC React UI package rules
- `APP_SDK_INTEGRATION_SPEC.md`: SDK integration patterns