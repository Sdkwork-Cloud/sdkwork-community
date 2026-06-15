# SDKWork Community Flutter Mobile Community Package

Community screens, services, and route contributions for Flutter mobile application.

## Exports

- `CommunityRoutes`: Route definitions for community screens

## Structure

```
lib/
  src/
    screens/        # Route-level UI
    widgets/        # Reusable Flutter widgets
    controllers/    # Presentation logic
    services/       # Use-case orchestration
    repositories/   # SDK adapter calls
    state/          # View/cache state
    i18n/           # Package-local locale fragments
    routes/         # Route contributions
    navigation/     # Navigation metadata
    platform/       # Platform adapter interfaces
    models/         # View models and route params
```

## Standards

- `FLUTTER_APP_MOBILE_ARCHITECTURE_SPEC.md`: Flutter mobile application root architecture
- `APP_FLUTTER_UI_SPEC.md`: Flutter UI package rules