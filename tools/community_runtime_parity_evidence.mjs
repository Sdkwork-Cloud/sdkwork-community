#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const evidencePath = path.join(
  workspaceRoot,
  "specs",
  "api-runtime-parity.standalone.evidence.json",
);
const checkTool = path.join(
  workspaceRoot,
  "..",
  "sdkwork-specs",
  "tools",
  "check-api-runtime-parity.mjs",
);
const check = process.argv.includes("--check");
const tempRoot = mkdtempSync(path.join(os.tmpdir(), "sdkwork-community-runtime-parity-"));
const generatedPath = path.join(tempRoot, "evidence.json");

try {
  const cargo = process.env.CARGO || "cargo";
  run(cargo, [
    "test",
    "-p",
    "sdkwork-api-community-assembly",
    "--test",
    "runtime_parity_evidence",
    "runtime_parity_evidence",
    "--",
    "--ignored",
    "--exact",
  ], {
    ...process.env,
    SDKWORK_API_RUNTIME_PARITY_EVIDENCE_OUTPUT: generatedPath,
    SDKWORK_DATABASE_AUTO_MIGRATE: "false",
    SDKWORK_DATABASE_SEED_ON_BOOT: "false",
  });
  run(process.execPath, [checkTool, "--evidence", generatedPath]);

  const generated = canonicalJson(generatedPath);
  if (check) {
    const tracked = canonicalJson(evidencePath);
    if (tracked !== generated) {
      throw new Error(
        "runtime parity evidence is stale; run pnpm api:runtime-parity:generate",
      );
    }
    process.stdout.write("[community_runtime_parity_evidence] check passed\n");
  } else {
    writeFileSync(evidencePath, generated, "utf8");
    process.stdout.write(`[community_runtime_parity_evidence] wrote ${evidencePath}\n`);
  }
} finally {
  rmSync(tempRoot, { force: true, recursive: true });
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function canonicalJson(file) {
  return `${JSON.stringify(JSON.parse(readFileSync(file, "utf8")), null, 2)}\n`;
}
