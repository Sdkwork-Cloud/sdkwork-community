# SDKWork Community H5 Application

Phone-first H5/Capacitor application for SDKWork community features.

## Architecture

This application follows `APP_H5_ARCHITECTURE_SPEC.md` for H5/Capacitor application architecture.

## Packages

| Package | Capability |
|---------|------------|
| `@sdkwork/community-h5-community` | Community screens, services, and route contributions |

## Development

```powershell
pnpm install
pnpm dev
```

## Build

```powershell
pnpm h5:build
pnpm h5:build:prod
```

## Test

```powershell
pnpm test
pnpm typecheck
```

## Standards

- `APP_H5_ARCHITECTURE_SPEC.md`: H5 application root architecture
- `APP_MOBILE_REACT_UI_SPEC.md`: Mobile React UI package rules
- `APP_SDK_INTEGRATION_SPEC.md`: SDK integration patterns