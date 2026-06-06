import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("community app SDK assembly points at sdkwork-community app authority", () => {
  const assembly = JSON.parse(readFileSync("sdks/sdkwork-community-app-sdk/.sdkwork-assembly.json", "utf8"));
  assert.equal(assembly.sdkOwner, "sdkwork-community");
  assert.equal(assembly.apiAuthority, "sdkwork-community.app");
  assert.equal(assembly.discoverySurface.apiPrefix, "/app/v3/api");
  assert.equal(assembly.discoverySurface.sdkTarget, "app");
  assert.deepEqual(assembly.sdkDependencies, []);
});

test("community app SDK manifest uses sdkwork-v3 profile and no dependencies", () => {
  const manifest = JSON.parse(readFileSync("sdks/sdkwork-community-app-sdk/sdk-manifest.json", "utf8"));
  assert.equal(manifest.sdkOwner, "sdkwork-community");
  assert.equal(manifest.sdkType, "app");
  assert.equal(manifest.standardProfile, "sdkwork-v3");
  assert.equal(manifest.apiAuthority, "sdkwork-community.app");
  assert.equal(manifest.apiPrefix, "/app/v3/api");
  assert.deepEqual(manifest.sdkDependencies, []);
});
