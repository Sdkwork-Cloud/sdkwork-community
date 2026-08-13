import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = JSON.parse(readFileSync("generated/openapi/community-app-api.openapi.json", "utf8"));
const backend = JSON.parse(readFileSync("generated/openapi/community-backend-api.openapi.json", "utf8"));
const open = JSON.parse(readFileSync("generated/openapi/community-open-api.openapi.json", "utf8"));

function operations(document) {
  return Object.entries(document.paths ?? {}).flatMap(([path, pathItem]) =>
    Object.entries(pathItem ?? {})
      .filter(([method]) => ["get", "post", "put", "patch", "delete"].includes(method))
      .map(([method, operation]) => ({ method, operation, path })),
  );
}

test("community OpenAPI documents are owner-only sdkwork-v3 compatible inputs", () => {
  for (const [surface, document, prefix, authority] of [
    ["app", app, "/app/v3/api/community", "sdkwork-community-app-api"],
    ["backend", backend, "/backend/v3/api/community", "sdkwork-community-backend-api"],
    ["open", open, "/community/v3/api", "sdkwork-community-open-api"],
  ]) {
    assert.equal(document.openapi, "3.1.2", surface);
    assert.equal(document["x-sdkwork-owner"], "sdkwork-community", surface);
    assert.equal(document["x-sdkwork-api-authority"], authority, surface);
    assert.equal(document["x-sdkwork-domain"], "community", surface);

    if (surface === "app" || surface === "backend") {
      assert.deepEqual(document.components.securitySchemes.AuthToken, {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      });
      assert.deepEqual(document.components.securitySchemes.AccessToken, {
        type: "apiKey",
        in: "header",
        name: "Access-Token",
      });
    }

    if (surface === "open") {
      assert.deepEqual(document.components.securitySchemes.ApiKey, {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      });
    }

    for (const { path, operation } of operations(document)) {
      assert.ok(path.startsWith(prefix), `${surface} path prefix ${path}`);
      assert.equal(operation["x-sdkwork-owner"], "sdkwork-community", `${surface} owner ${path}`);
      assert.equal(operation["x-sdkwork-api-authority"], authority, `${surface} authority ${path}`);
      assert.equal(operation["x-sdkwork-domain"], "community", `${surface} domain ${path}`);
      assert.deepEqual(operation.tags, ["community"], `${surface} tag ${path}`);
      assert.match(operation.operationId, /^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)+$/u);

      // Public operations (x-sdkwork-public: true) are anonymous on every
      // surface; protected app/backend operations use dual-token security.
      const isPublic = operation["x-sdkwork-public"] === true;
      if (surface === "app" || surface === "backend") {
        assert.deepEqual(
          operation.security,
          isPublic ? [] : [{ AuthToken: [], AccessToken: [] }],
          `${surface} security ${path}`,
        );
        assert.equal(
          operation["x-sdkwork-auth-mode"],
          isPublic ? "anonymous" : "dual-token",
          `${surface} auth mode ${path}`,
        );
      }
      if (surface === "open") {
        assert.deepEqual(operation.security, [], `${surface} public security ${path}`);
        assert.equal(operation["x-sdkwork-auth-mode"], "anonymous", `${surface} auth mode ${path}`);
      }
      const parameters = operation.parameters ?? [];
      assert.ok(parameters.every((parameter) => parameter !== null), `${surface} parameters ${path}`);
      for (const match of path.matchAll(/\{([^}]+)\}/gu)) {
        assert.ok(
          parameters.some((parameter) =>
            parameter.name === match[1]
              && parameter.in === "path"
              && parameter.required === true),
          `${surface} path parameter ${match[1]} ${path}`,
        );
      }
    }
  }

  assert.equal(operations(app).length, 31);
  assert.equal(operations(backend).length, 25);
  assert.equal(operations(open).length, 4);
});
