#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const generatedOpenapiDir = path.join(workspaceRoot, "generated", "openapi");

function fail(message) {
  process.stderr.write(`[community_schema_quality_gate] ${message}\n`);
  process.exit(1);
}

function readJson(filePath) {
  if (!existsSync(filePath)) {
    fail(`missing OpenAPI file: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function operations(document) {
  return Object.entries(document.paths ?? {}).flatMap(([pathKey, pathItem]) =>
    Object.entries(pathItem ?? {})
      .filter(([method]) => HTTP_METHODS.has(method))
      .map(([method, operation]) => ({ method, operation, pathKey })),
  );
}

function checkDocument(filePath, authority, prefix, expectedSecurity) {
  const document = readJson(filePath);
  if (document.openapi !== "3.1.2") {
    fail(`${filePath} must use OpenAPI 3.1.2`);
  }
  if (document["x-sdkwork-owner"] !== "sdkwork-community") {
    fail(`${filePath} owner drift`);
  }
  if (document["x-sdkwork-api-authority"] !== authority) {
    fail(`${filePath} authority drift`);
  }
  if (document["x-sdkwork-domain"] !== "community") {
    fail(`${filePath} domain drift`);
  }
  for (const { operation, pathKey } of operations(document)) {
    if (!pathKey.startsWith(prefix)) {
      fail(`${filePath} has invalid path prefix ${pathKey}`);
    }
    if (operation["x-sdkwork-owner"] !== "sdkwork-community") {
      fail(`${filePath} operation owner drift ${pathKey}`);
    }
    if (operation["x-sdkwork-api-authority"] !== authority) {
      fail(`${filePath} operation authority drift ${pathKey}`);
    }
    if (operation["x-sdkwork-domain"] !== "community") {
      fail(`${filePath} operation domain drift ${pathKey}`);
    }
    if (JSON.stringify(operation.tags) !== JSON.stringify(["community"])) {
      fail(`${filePath} operation tag drift ${pathKey}`);
    }
    if (!/^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)+$/u.test(operation.operationId ?? "")) {
      fail(`${filePath} invalid operationId ${operation.operationId}`);
    }
    if (JSON.stringify(operation.security) !== JSON.stringify(expectedSecurity)) {
      fail(`${filePath} invalid security ${pathKey}`);
    }
  }
  return operations(document).length;
}

function getArg(args, name, defaultValue) {
  const index = args.indexOf(name);
  if (index === -1) {
    return defaultValue;
  }
  return args[index + 1] || "";
}

const args = process.argv.slice(2);
const app = getArg(args, "--app-openapi", path.join(generatedOpenapiDir, "community-app-api.openapi.json"));
const backend = getArg(args, "--backend-openapi", path.join(generatedOpenapiDir, "community-backend-api.openapi.json"));
const open = getArg(args, "--open-openapi", path.join(generatedOpenapiDir, "community-open-api.openapi.json"));

const counts = {
  app: checkDocument(app, "sdkwork-community.app", "/app/v3/api/community", [{ AuthToken: [], AccessToken: [] }]),
  backend: checkDocument(backend, "sdkwork-community.backend", "/backend/v3/api/community", [{ AuthToken: [], AccessToken: [] }]),
  open: checkDocument(open, "sdkwork-community.open", "/community/v3/api", [{ ApiKey: [] }]),
};

if (counts.app !== 9 || counts.backend !== 11 || counts.open !== 4) {
  fail(`unexpected route counts ${JSON.stringify(counts)}`);
}

process.stdout.write(`[community_schema_quality_gate] ok app=${counts.app} backend=${counts.backend} open=${counts.open}\n`);
