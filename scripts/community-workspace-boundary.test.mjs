import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

function file(relativePath) {
  return path.join(root, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(file(relativePath), "utf8"));
}

function collectTextFiles(targetPath) {
  if (!existsSync(targetPath)) {
    return [];
  }

  const stat = statSync(targetPath);
  if (stat.isFile()) {
    return [targetPath];
  }

  return readdirSync(targetPath, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.name === "node_modules" ||
      entry.name === "target" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === "docs"
    ) {
      return [];
    }

    return collectTextFiles(path.join(targetPath, entry.name));
  });
}

test("community workspace owns complete source, rust, openapi, and sdk families", () => {
  for (const requiredPath of [
    "package.json",
    "pnpm-workspace.yaml",
    "Cargo.toml",
    "specs/topology.spec.json",
    "apps/sdkwork-community-common/packages/sdkwork-community-contracts/package.json",
    "apps/sdkwork-community-common/packages/sdkwork-community-sdk-ports/package.json",
    "apps/sdkwork-community-common/packages/sdkwork-community-service/package.json",
    "apps/sdkwork-community-common/packages/sdkwork-community-runtime/package.json",
    "apps/sdkwork-community-pc/packages/sdkwork-community-pc-community/package.json",
    "crates/sdkwork-community-core-rust/Cargo.toml",
    "crates/sdkwork-community-storage-sqlx-rust/Cargo.toml",
    "crates/sdkwork-community-http-rust/Cargo.toml",
    "crates/sdkwork-community-service/Cargo.toml",
    "crates/sdkwork-routes-community-app-api/Cargo.toml",
    "crates/sdkwork-community-service-host/Cargo.toml",
    "crates/sdkwork-api-community-standalone-gateway/Cargo.toml",
    "database/database.manifest.json",
    "database/ddl/baseline/postgres/0001_community_baseline.sql",
    "generated/openapi/community-open-api.openapi.json",
    "generated/openapi/community-app-api.openapi.json",
    "generated/openapi/community-backend-api.openapi.json",
    "sdks/sdkwork-community-sdk/specs/component.spec.json",
    "sdks/sdkwork-community-sdk/sdk-manifest.json",
    "sdks/sdkwork-community-app-sdk/specs/component.spec.json",
    "sdks/sdkwork-community-app-sdk/sdk-manifest.json",
    "sdks/sdkwork-community-app-sdk/sdkwork-community-app-sdk-typescript/package.json",
    "sdks/sdkwork-community-backend-sdk/specs/component.spec.json",
    "sdks/sdkwork-community-backend-sdk/sdk-manifest.json",
    "deployments/docker/README.md",
  ]) {
    assert.ok(existsSync(file(requiredPath)), `missing ${requiredPath}`);
  }

  const rootPackage = readJson("package.json");
  assert.equal(rootPackage.name, "sdkwork-community-workspace");
  assert.ok(rootPackage.scripts.verify);
  assert.ok(rootPackage.scripts["gateway:run"]);
  assert.ok(rootPackage.scripts["check:api-envelope"]);

  const pcPackage = readJson("apps/sdkwork-community-pc/packages/sdkwork-community-pc-community/package.json");
  assert.equal(pcPackage.name, "@sdkwork/community-pc-community");
  assert.equal(pcPackage.sdkwork.workspace, "sdkwork-community");

  for (const [family, authority] of [
    ["sdks/sdkwork-community-sdk", "sdkwork-community.open"],
    ["sdks/sdkwork-community-app-sdk", "sdkwork-community.app"],
    ["sdks/sdkwork-community-backend-sdk", "sdkwork-community.backend"],
  ]) {
    const manifest = readJson(`${family}/sdk-manifest.json`);
    const spec = readJson(`${family}/specs/component.spec.json`);
    assert.equal(manifest.sdkOwner, "sdkwork-community");
    assert.equal(manifest.apiAuthority, authority);
    assert.ok(manifest.ownerOnlyOperationCount > 0);
    assert.deepEqual(manifest.sdkDependencies, []);
    assert.deepEqual(spec.contracts.sdkDependencies, []);
  }
});

test("community workspace active files do not depend on sdkwork-appbase ownership", () => {
  const files = collectTextFiles(root).filter((fullPath) =>
    /\.(?:json|mjs|ts|tsx|yaml|yml|toml|rs|sql|md)$/u.test(fullPath),
  );

  const violations = files.flatMap((fullPath) => {
    const relativePath = path.relative(root, fullPath).replaceAll("\\", "/");
    const content = readFileSync(fullPath, "utf8");
    return [
      /legacy-java-plus-workspace\/apps\/sdkwork-appbase/u,
      /legacy-java-plus-workspace\\apps\\sdkwork-appbase/u,
      /@sdkwork\/appbase-pc-react/u,
      /packages\/pc-react\/communication\/sdkwork-community-pc-react/u,
      /"workspace":\s*"sdkwork-appbase"/u,
    ].flatMap((pattern) => {
      const match = content.match(pattern);
      return match ? [`${relativePath}: ${match[0].slice(0, 120)}`] : [];
    });
  });

  assert.deepEqual(violations, []);
});
