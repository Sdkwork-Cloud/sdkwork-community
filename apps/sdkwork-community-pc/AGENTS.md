# PC Application Agent Instructions

## SDKWORK Soul

Read `../../sdkwork-specs/SOUL.md` before executing tasks in this root. Follow specs before memory, dictionary before context, stop on ambiguity, and evidence before completion.

## SDKWORK Standards

Canonical SDKWORK specs path from this root:

- `../../sdkwork-specs/README.md`
- `../../sdkwork-specs/SOUL.md`
- `../../sdkwork-specs/AGENTS_SPEC.md`
- `../../sdkwork-specs/CODE_STYLE_SPEC.md`
- `../../sdkwork-specs/NAMING_SPEC.md`

Do not copy root standard text into this repository. If these relative paths do not resolve, stop and report the broken workspace layout.

## Application Identity

This is a PC application root for the community product. It follows `APP_PC_ARCHITECTURE_SPEC.md` for application architecture.

## Local Dictionary Structure

- `AGENTS.md`: local agent entrypoint and relative SDKWORK spec index.
- `sdkwork.app.config.json`: application manifest for PC browser/desktop deployment.
- `.sdkwork/`: reserved local dictionary folder for local skills, plugins, manifests, or AI workspace metadata.
- `specs/`: local component/application specs that extend root standards.
- `sdks/`: SDK families, OpenAPI authorities, route manifests, and generated SDK artifacts.
- `package.json`, `pnpm-workspace.yaml`: language/build manifests.
- Local directories to inspect first when relevant: `packages/`, `src/`, `config/`, `scripts/`.

## Spec Resolution Order

1. Read this `AGENTS.md` and any nearer component-level `AGENTS.md`.
2. Read `sdkwork.app.config.json` when present.
3. Read local `specs/README.md` and `specs/component.spec.json` when present.
4. Read local `.sdkwork/README.md`, `.sdkwork/skills/`, and `.sdkwork/plugins/` when relevant.
5. Read `../../sdkwork-specs/README.md` and the task-specific root specs.
6. Inspect implementation files only after the relevant dictionary entries are clear.

## Required Specs By Task Type

- PC application changes: `../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`, `../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`
- Agent/workflow changes: `../../sdkwork-specs/SOUL.md`, `../../sdkwork-specs/AGENTS_SPEC.md`, `../../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`.
- Any code change: `../../sdkwork-specs/CODE_STYLE_SPEC.md`, `../../sdkwork-specs/NAMING_SPEC.md`, plus only the touched language/framework spec.
- TypeScript/Node code: `../../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`.
- Frontend/UI code: `../../sdkwork-specs/FRONTEND_CODE_SPEC.md`, `../../sdkwork-specs/FRONTEND_SPEC.md`, `../../sdkwork-specs/UI_ARCHITECTURE_SPEC.md`.

## Build, Test, and Verification

Run commands from this directory unless a command explicitly targets another path.

- `pnpm install`: install dependencies for this workspace or package.
- `pnpm run test`: run the configured test suite for this scope.
- `pnpm run typecheck`: run TypeScript type checks.
- `pnpm run verify`: run repository verification or architecture checks.

Run the narrowest relevant check first, then broader verification when API contracts, SDK generation, persistence, security, or cross-package boundaries change.

## Agent Execution Rules

Use the convention dictionary instead of broad context loading. Do not hand-edit generated SDK output unless the task is explicitly about generated artifacts and the source contract is verified. Do not replace generated SDK integration with raw HTTP. Keep changes scoped to the owning module, package, crate, or app root. Record the exact verification commands and important outputs before reporting completion.

## Human Review Rules

Request human review before breaking SDKWORK standards, changing public naming, altering security/auth behavior, changing database migrations or production deployment config, deleting data/files, or changing generated SDK ownership. Surface unresolved spec paths, app identity conflicts, component ownership conflicts, and API authority ambiguity instead of guessing.