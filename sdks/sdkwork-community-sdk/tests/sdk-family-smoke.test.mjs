import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("community open SDK assembly points at sdkwork-community open authority", () => {
  const assembly = JSON.parse(readFileSync("sdks/sdkwork-community-sdk/sdk-manifest.json", "utf8"));
  assert.equal(assembly.sdkOwner, "sdkwork-community");
  assert.equal(assembly.apiAuthority, "sdkwork-community-open-api");
  assert.equal(assembly.discoverySurface.apiPrefix, "/community/v3/api");
  assert.equal(assembly.discoverySurface.sdkTarget, "custom");
  assert.deepEqual(assembly.sdkDependencies, []);
});

test("community open SDK manifest uses sdkwork-v3 profile and no dependencies", () => {
  const manifest = JSON.parse(readFileSync("sdks/sdkwork-community-sdk/sdk-manifest.json", "utf8"));
  assert.equal(manifest.sdkOwner, "sdkwork-community");
  assert.equal(manifest.sdkType, "custom");
  assert.equal(manifest.standardProfile, "sdkwork-v3");
  assert.equal(manifest.apiAuthority, "sdkwork-community-open-api");
  assert.deepEqual(manifest.sdkDependencies, []);
});
