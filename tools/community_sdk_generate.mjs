#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const openPath = path.join(workspaceRoot, "generated", "openapi", "community-open-api.openapi.json");
const appPath = path.join(workspaceRoot, "generated", "openapi", "community-app-api.openapi.json");
const backendPath = path.join(workspaceRoot, "generated", "openapi", "community-backend-api.openapi.json");

function run(script, args) {
  const result = spawnSync("node", [path.join(workspaceRoot, script), ...args], {
    cwd: workspaceRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const check = process.argv.includes("--check");
run("tools/community_openapi_export.mjs", []);
run("tools/community_schema_quality_gate.mjs", [
  "--open-openapi",
  openPath,
  "--app-openapi",
  appPath,
  "--backend-openapi",
  backendPath,
]);

if (!check) {
  run("sdks/sdkwork-community-sdk/bin/generate-sdk.mjs", ["--input", openPath]);
  run("sdks/sdkwork-community-app-sdk/bin/generate-sdk.mjs", ["--input", appPath]);
  run("sdks/sdkwork-community-backend-sdk/bin/generate-sdk.mjs", ["--input", backendPath]);
}

process.stdout.write(`[community_sdk_generate] ${check ? "check passed" : "generation completed"}\n`);
