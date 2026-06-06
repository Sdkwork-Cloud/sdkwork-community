#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(workspaceRoot, "generated", "openapi");
const OWNER = "sdkwork-community";
const DOMAIN = "community";

const schemas = {
  CommunityApiResult: {
    type: "object",
    additionalProperties: false,
    required: ["code", "message", "requestId", "data"],
    properties: {
      code: { type: "string" },
      message: { type: "string" },
      requestId: { type: "string", format: "uuid" },
      data: {},
    },
  },
  CommunityCategory: {
    type: "object",
    additionalProperties: false,
    required: ["id", "tenantId", "slug", "title", "priority", "enabled"],
    properties: {
      id: { type: "string" },
      tenantId: { type: "string" },
      slug: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      priority: { type: "integer" },
      enabled: { type: "boolean" },
    },
  },
  CommunityAuthor: {
    type: "object",
    additionalProperties: false,
    required: ["id", "name"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      avatarUrl: { type: "string", format: "uri" },
    },
  },
  CommunityEntryKind: {
    type: "string",
    enum: ["announcement", "discussion", "question", "resource", "service"],
  },
  CommunityReviewState: {
    type: "string",
    enum: ["approved", "draft", "flagged", "pending-review", "rejected"],
  },
  CommunityStats: {
    type: "object",
    additionalProperties: false,
    properties: {
      commentCount: { type: "integer" },
      reactionCount: { type: "integer" },
      shareCount: { type: "integer" },
      viewCount: { type: "integer" },
    },
  },
  CommunityEntry: {
    type: "object",
    additionalProperties: false,
    required: [
      "id",
      "tenantId",
      "categoryId",
      "author",
      "slug",
      "kind",
      "title",
      "reviewState",
      "stats",
    ],
    properties: {
      id: { type: "string" },
      tenantId: { type: "string" },
      categoryId: { type: "string" },
      categoryLabel: { type: "string" },
      author: { $ref: "#/components/schemas/CommunityAuthor" },
      slug: { type: "string" },
      kind: { $ref: "#/components/schemas/CommunityEntryKind" },
      title: { type: "string" },
      excerpt: { type: "string" },
      body: { type: "string" },
      reviewState: { $ref: "#/components/schemas/CommunityReviewState" },
      isFeatured: { type: "boolean" },
      isPinned: { type: "boolean" },
      hasAcceptedAnswer: { type: "boolean" },
      stats: { $ref: "#/components/schemas/CommunityStats" },
      tags: { type: "array", items: { type: "string" } },
      publishedAt: { type: "string", format: "date-time" },
      lastActivityAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CommunityComment: {
    type: "object",
    additionalProperties: false,
    required: ["id", "tenantId", "entryId", "author", "body", "reviewState", "createdAt"],
    properties: {
      id: { type: "string" },
      tenantId: { type: "string" },
      entryId: { type: "string" },
      author: { $ref: "#/components/schemas/CommunityAuthor" },
      body: { type: "string" },
      reviewState: { $ref: "#/components/schemas/CommunityReviewState" },
      isAcceptedAnswer: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CommunityEntryCommand: {
    type: "object",
    additionalProperties: false,
    required: ["categoryId", "kind", "title"],
    properties: {
      categoryId: { type: "string" },
      kind: { $ref: "#/components/schemas/CommunityEntryKind" },
      title: { type: "string" },
      excerpt: { type: "string" },
      body: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  CommunityCategoryCommand: {
    type: "object",
    additionalProperties: false,
    required: ["slug", "title"],
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      priority: { type: "integer" },
      enabled: { type: "boolean" },
    },
  },
  CommunityCommentCommand: {
    type: "object",
    additionalProperties: false,
    required: ["body"],
    properties: {
      body: { type: "string" },
    },
  },
  CommunityModerationCommand: {
    type: "object",
    additionalProperties: false,
    required: ["reviewState"],
    properties: {
      reviewState: { $ref: "#/components/schemas/CommunityReviewState" },
      reason: { type: "string" },
    },
  },
  CommunityPublicationReadiness: {
    type: "object",
    additionalProperties: false,
    required: ["ready", "degraded", "issues"],
    properties: {
      ready: { type: "boolean" },
      degraded: { type: "boolean" },
      issues: { type: "array", items: { type: "string" } },
    },
  },
  ProblemDetail: {
    type: "object",
    additionalProperties: true,
    required: ["type", "title", "status"],
    properties: {
      type: { type: "string", format: "uri-reference" },
      title: { type: "string" },
      status: { type: "integer", minimum: 100, maximum: 599 },
      detail: { type: "string" },
      requestId: { type: "string", format: "uuid" },
    },
  },
};

const appRoutes = [
  route("get", "/app/v3/api/community/categories", "categories.list", { schema: arrayOf("CommunityCategory") }, false),
  route("get", "/app/v3/api/community/feed", "feed.list", { schema: arrayOf("CommunityEntry") }, false, listParams()),
  route("get", "/app/v3/api/community/entries/{entryId}", "entries.retrieve", { schema: ref("CommunityEntry") }, false, [pathParam("entryId")]),
  route("get", "/app/v3/api/community/entries/{entryId}/recommendations", "entries.recommendations.list", { schema: arrayOf("CommunityEntry") }, false, [pathParam("entryId")]),
  route("post", "/app/v3/api/community/entries", "entries.create", { schema: ref("CommunityEntry") }, false, [], "CommunityEntryCommand"),
  route("patch", "/app/v3/api/community/entries/{entryId}", "entries.update", { schema: ref("CommunityEntry") }, false, [pathParam("entryId")], "CommunityEntryCommand"),
  route("get", "/app/v3/api/community/entries/{entryId}/publication_readiness", "entries.publicationReadiness.retrieve", { schema: ref("CommunityPublicationReadiness") }, false, [pathParam("entryId")]),
  route("get", "/app/v3/api/community/entries/{entryId}/comments", "comments.list", { schema: arrayOf("CommunityComment") }, false, [pathParam("entryId")]),
  route("post", "/app/v3/api/community/entries/{entryId}/comments", "comments.create", { schema: ref("CommunityComment") }, false, [pathParam("entryId")], "CommunityCommentCommand"),
];

const backendRoutes = [
  route("get", "/backend/v3/api/community/categories", "categories.management.list", { schema: arrayOf("CommunityCategory") }, false),
  route("post", "/backend/v3/api/community/categories", "categories.create", { schema: ref("CommunityCategory") }, false, [], "CommunityCategoryCommand"),
  route("patch", "/backend/v3/api/community/categories/{categoryId}", "categories.update", { schema: ref("CommunityCategory") }, false, [pathParam("categoryId")], "CommunityCategoryCommand"),
  route("delete", "/backend/v3/api/community/categories/{categoryId}", "categories.delete", { schema: ref("CommunityApiResult") }, false, [pathParam("categoryId")]),
  route("get", "/backend/v3/api/community/entries", "entries.management.list", { schema: arrayOf("CommunityEntry") }, false, listParams()),
  route("post", "/backend/v3/api/community/entries/{entryId}/moderation", "entries.moderation.update", { schema: ref("CommunityEntry") }, false, [pathParam("entryId")], "CommunityModerationCommand"),
  route("post", "/backend/v3/api/community/entries/{entryId}/feature", "entries.feature", { schema: ref("CommunityEntry") }, false, [pathParam("entryId")]),
  route("post", "/backend/v3/api/community/entries/{entryId}/pin", "entries.pin", { schema: ref("CommunityEntry") }, false, [pathParam("entryId")]),
  route("delete", "/backend/v3/api/community/entries/{entryId}", "entries.delete", { schema: ref("CommunityApiResult") }, false, [pathParam("entryId")]),
  route("get", "/backend/v3/api/community/moderation/queue", "moderation.queue.list", { schema: arrayOf("CommunityEntry") }, false),
  route("post", "/backend/v3/api/community/recommendations/rebuild", "recommendations.rebuild", { schema: ref("CommunityApiResult") }, false),
];

const openRoutes = [
  route("get", "/community/v3/api/categories", "categories.public.list", { schema: arrayOf("CommunityCategory") }, true),
  route("get", "/community/v3/api/feed", "feed.public.list", { schema: arrayOf("CommunityEntry") }, true, listParams()),
  route("get", "/community/v3/api/entries/{entryId}", "entries.public.retrieve", { schema: ref("CommunityEntry") }, true, [pathParam("entryId")]),
  route("get", "/community/v3/api/entries/by_slug/{slug}", "entries.publicBySlug.retrieve", { schema: ref("CommunityEntry") }, true, [pathParam("slug")]),
];

function ref(name) {
  return { $ref: `#/components/schemas/${name}` };
}

function arrayOf(name) {
  return { type: "array", items: ref(name) };
}

function pathParam(name) {
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  };
}

function queryParam(name) {
  return {
    name,
    in: "query",
    required: false,
    schema: { type: "string" },
  };
}

function listParams() {
  return [queryParam("categoryId"), queryParam("kind"), queryParam("q"), queryParam("reviewState"), queryParam("tag")];
}

function route(method, pathKey, operationId, response, usesApiKey, parameters = [], bodySchemaName = null) {
  return {
    method,
    path: pathKey,
    operation: {
      tags: ["community"],
      summary: `Community ${operationId}`,
      operationId,
      parameters,
      ...(bodySchemaName ? {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ref(bodySchemaName),
            },
          },
        },
      } : {}),
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": response,
          },
        },
        400: problemResponse(),
        401: problemResponse(),
      },
      security: usesApiKey ? [{ ApiKey: [] }] : [{ AuthToken: [], AccessToken: [] }],
      "x-sdkwork-owner": OWNER,
      "x-sdkwork-api-authority": "",
      "x-sdkwork-domain": DOMAIN,
      "x-sdkwork-resource": operationId.split(".")[0],
      "x-sdkwork-public": usesApiKey,
    },
  };
}

function problemResponse() {
  return {
    description: "Problem detail",
    content: {
      "application/problem+json": {
        schema: ref("ProblemDetail"),
      },
    },
  };
}

function documentFor({ authority, routes, serverUrl, title }) {
  const paths = {};
  for (const item of routes) {
    paths[item.path] ??= {};
    item.operation["x-sdkwork-api-authority"] = authority;
    paths[item.path][item.method] = item.operation;
  }
  return {
    openapi: "3.1.2",
    info: {
      title,
      version: "1.0.0",
      "x-sdkwork-owner": OWNER,
      "x-sdkwork-api-authority": authority,
    },
    servers: [{ url: serverUrl }],
    tags: [{ name: "community", description: "Community API resources.", "x-sdk-nested-resource-surface": true }],
    paths,
    components: {
      securitySchemes: {
        AuthToken: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        AccessToken: {
          type: "apiKey",
          in: "header",
          name: "Access-Token",
        },
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
      schemas,
    },
    "x-sdkwork-owner": OWNER,
    "x-sdkwork-api-authority": authority,
    "x-sdkwork-domain": DOMAIN,
    "x-sdkwork-standard-profile": "sdkwork-v3",
  };
}

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
  };
}

const args = parseArgs(process.argv.slice(2));
const docs = [
  ["community-open-api.openapi.json", documentFor({ authority: "sdkwork-community.open", routes: openRoutes, serverUrl: "http://127.0.0.1:18082", title: "SDKWork Community Open API" })],
  ["community-app-api.openapi.json", documentFor({ authority: "sdkwork-community.app", routes: appRoutes, serverUrl: "http://127.0.0.1:18080", title: "SDKWork Community App API" })],
  ["community-backend-api.openapi.json", documentFor({ authority: "sdkwork-community.backend", routes: backendRoutes, serverUrl: "http://127.0.0.1:18080", title: "SDKWork Community Backend API" })],
];

if (!args.check) {
  mkdirSync(outputDir, { recursive: true });
  for (const [fileName, document] of docs) {
    writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(document, null, 2)}\n`, "utf8");
  }
}

process.stdout.write(`[community_openapi_export] ok app=${appRoutes.length} backend=${backendRoutes.length} open=${openRoutes.length}\n`);
