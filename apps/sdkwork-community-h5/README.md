# SDKWork Community H5 Application

Phone-first H5/Capacitor application for SDKWork community features.

## Architecture

This application follows `APP_H5_ARCHITECTURE_SPEC.md` and consumes community APIs through `@sdkwork/community-runtime` and the generated `sdkwork-community-app-sdk`.

## Packages

| Package | Capability |
| --- | --- |
| `@sdkwork/community-h5-core` | Composition, SDK inventory, bootstrap wiring |
| `@sdkwork/community-h5-community` | Community screens and route contributions |

## Development

From the repository root (starts API gateway and H5 Vite dev server):

```powershell
pnpm dev:browser
```

From this application root (frontend only):

```powershell
pnpm install
pnpm dev
```

## Build

```powershell
pnpm build
pnpm build:prod
```

From the repository root:

```powershell
pnpm build:browser
```

## Test

```powershell
pnpm test
pnpm typecheck
```

## Standards

- `APP_H5_ARCHITECTURE_SPEC.md`
- `APP_MOBILE_REACT_UI_SPEC.md`
- `APP_SDK_INTEGRATION_SPEC.md`
