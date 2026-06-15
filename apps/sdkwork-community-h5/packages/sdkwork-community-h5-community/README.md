# SDKWork Community H5 Community Package

Community screens, services, and route contributions for H5 mobile application.

## Exports

- `CommunityH5Routes`: Route definitions for community screens

## Structure

```
src/
  screens/      # Route-level mobile UI
  components/   # Reusable UI components
  hooks/        # React hooks for services and state
  services/     # SDK orchestration and business logic
  state/        # View/cache state
  i18n/         # Package-local locale fragments
  routes/       # Route contributions
  navigation/   # Navigation metadata
  host/         # Host adapter contracts
  types/        # View models and route params
```

## Standards

- `APP_H5_ARCHITECTURE_SPEC.md`: H5 application root architecture
- `APP_MOBILE_REACT_UI_SPEC.md`: Mobile React UI package rules