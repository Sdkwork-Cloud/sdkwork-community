import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function runNode(args) {
  return spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("community schema quality gate uses generated OpenAPI defaults", () => {
  const exportResult = runNode(["tools/community_openapi_export.mjs"]);
  assert.equal(exportResult.status, 0, exportResult.stderr);

  const gateResult = runNode(["tools/community_schema_quality_gate.mjs"]);
  assert.equal(gateResult.status, 0, gateResult.stderr);
  assert.match(gateResult.stdout, /ok app=9 backend=11 open=4/u);
});
