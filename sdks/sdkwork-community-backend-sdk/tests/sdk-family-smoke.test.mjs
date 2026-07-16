import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("community backend SDK assembly points at sdkwork-community backend authority", () => {
  const assembly = JSON.parse(readFileSync("sdks/sdkwork-community-backend-sdk/sdk-manifest.json", "utf8"));
  assert.equal(assembly.sdkOwner, "sdkwork-community");
  assert.equal(assembly.apiAuthority, "sdkwork-community.backend");
  assert.equal(assembly.discoverySurface.apiPrefix, "/backend/v3/api");
  assert.equal(assembly.discoverySurface.sdkTarget, "backend");
  assert.deepEqual(assembly.sdkDependencies, []);
});

test("community backend SDK manifest uses sdkwork-v3 profile and no dependencies", () => {
  const manifest = JSON.parse(readFileSync("sdks/sdkwork-community-backend-sdk/sdk-manifest.json", "utf8"));
  assert.equal(manifest.sdkOwner, "sdkwork-community");
  assert.equal(manifest.sdkType, "backend");
  assert.equal(manifest.standardProfile, "sdkwork-v3");
  assert.equal(manifest.apiAuthority, "sdkwork-community.backend");
  assert.equal(manifest.apiPrefix, "/backend/v3/api");
  assert.deepEqual(manifest.sdkDependencies, []);
});
