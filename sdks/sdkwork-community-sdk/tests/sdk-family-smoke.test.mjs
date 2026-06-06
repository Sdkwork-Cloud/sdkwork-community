import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("community open SDK assembly points at sdkwork-community open authority", () => {
  const assembly = JSON.parse(readFileSync("sdks/sdkwork-community-sdk/.sdkwork-assembly.json", "utf8"));
  assert.equal(assembly.sdkOwner, "sdkwork-community");
  assert.equal(assembly.apiAuthority, "sdkwork-community.open");
  assert.equal(assembly.discoverySurface.apiPrefix, "/community/v3/api");
  assert.equal(assembly.discoverySurface.sdkTarget, "custom");
  assert.deepEqual(assembly.sdkDependencies, []);
});

test("community open SDK manifest uses custom profile and no dependencies", () => {
  const manifest = JSON.parse(readFileSync("sdks/sdkwork-community-sdk/sdk-manifest.json", "utf8"));
  assert.equal(manifest.sdkOwner, "sdkwork-community");
  assert.equal(manifest.sdkType, "custom");
  assert.equal(manifest.standardProfile, null);
  assert.equal(manifest.apiAuthority, "sdkwork-community.open");
  assert.deepEqual(manifest.sdkDependencies, []);
});
