#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sdkWorkEnvelopeComponentSchemas,
  successResponseSchemaRef,
} from "../../sdkwork-specs/tools/lib/openapi-envelope-schemas.mjs";
import { alignOpenApiOperationPatterns } from "../../sdkwork-specs/tools/lib/align-api-operation-patterns.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(workspaceRoot, "generated", "openapi");
const apiAuthorityTargets = [
  ["community-app-api.openapi.json", "apis/app-api/community/openapi.json"],
  ["community-backend-api.openapi.json", "apis/backend-api/community/openapi.json"],
  ["community-open-api.openapi.json", "apis/open-api/community/openapi.json"],
];
const OWNER = "sdkwork-community";
const DOMAIN = "community";

const domainSchemas = {
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
  CommunityReactionCommand: {
    type: "object",
    additionalProperties: false,
    required: ["reactionType", "active"],
    properties: {
      reactionType: { type: "string" },
      active: { type: "boolean" },
    },
  },
  CommunityReactionSetAccepted: {
    type: "object",
    additionalProperties: false,
    required: ["accepted", "reactionCount"],
    properties: {
      accepted: { type: "boolean" },
      resourceId: { type: "string" },
      status: { type: "string" },
      reactionCount: { type: "integer" },
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
};

const schemas = {
  ...sdkWorkEnvelopeComponentSchemas,
  ...domainSchemas,
};

const appRoutes = [
  route("get", "/app/v3/api/community/categories", "categories.list", false),
  route("get", "/app/v3/api/community/feed", "feed.list", false, listParams()),
  route("get", "/app/v3/api/community/entries/{entryId}", "entries.retrieve", false, [pathParam("entryId")]),
  route("get", "/app/v3/api/community/entries/{entryId}/recommendations", "entries.recommendations.list", false, [pathParam("entryId")]),
  route("post", "/app/v3/api/community/entries", "entries.create", false, [], "CommunityEntryCommand"),
  route("patch", "/app/v3/api/community/entries/{entryId}", "entries.update", false, [pathParam("entryId")], "CommunityEntryCommand"),
  route("delete", "/app/v3/api/community/entries/{entryId}", "entries.delete", false, [pathParam("entryId")]),
  route("get", "/app/v3/api/community/entries/{entryId}/publication_readiness", "entries.publicationReadiness.retrieve", false, [pathParam("entryId")]),
  route("post", "/app/v3/api/community/entries/{entryId}/reactions", "reactions.set", false, [pathParam("entryId")], "CommunityReactionCommand"),
  route("get", "/app/v3/api/community/entries/{entryId}/comments", "comments.list", false, [pathParam("entryId")]),
  route("post", "/app/v3/api/community/entries/{entryId}/comments", "comments.create", false, [pathParam("entryId")], "CommunityCommentCommand"),
];

const backendRoutes = [
  route("get", "/backend/v3/api/community/categories", "categories.management.list", false),
  route("post", "/backend/v3/api/community/categories", "categories.create", false, [], "CommunityCategoryCommand"),
  route("patch", "/backend/v3/api/community/categories/{categoryId}", "categories.update", false, [pathParam("categoryId")], "CommunityCategoryCommand"),
  route("delete", "/backend/v3/api/community/categories/{categoryId}", "categories.delete", false, [pathParam("categoryId")]),
  route("get", "/backend/v3/api/community/entries", "entries.management.list", false, listParams()),
  route("post", "/backend/v3/api/community/entries/{entryId}/moderation", "entries.moderation.update", false, [pathParam("entryId")], "CommunityModerationCommand"),
  route("post", "/backend/v3/api/community/entries/{entryId}/feature", "entries.feature", false, [pathParam("entryId")]),
  route("post", "/backend/v3/api/community/entries/{entryId}/pin", "entries.pin", false, [pathParam("entryId")]),
  route("delete", "/backend/v3/api/community/entries/{entryId}", "entries.delete", false, [pathParam("entryId")]),
  route("get", "/backend/v3/api/community/moderation/queue", "moderation.queue.list", false),
  route("post", "/backend/v3/api/community/recommendations/rebuild", "recommendations.rebuild", false),
];

const openRoutes = [
  route("get", "/community/v3/api/categories", "categories.public.list", true),
  route("get", "/community/v3/api/feed", "feed.public.list", true, listParams()),
  route("get", "/community/v3/api/entries/{entryId}", "entries.public.retrieve", true, [pathParam("entryId")]),
  route("get", "/community/v3/api/entries/by_slug/{slug}", "entries.publicBySlug.retrieve", true, [pathParam("slug")]),
];

function ref(name) {
  return { $ref: `#/components/schemas/${name}` };
}

function envelopeSchemaRef(method, operationId) {
  if (method === "delete") {
    return "#/components/schemas/SdkWorkCommandResponse";
  }
  return successResponseSchemaRef({ method, operationId });
}

function pathParam(name) {
  const document = {
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

function route(method, pathKey, operationId, usesApiKey, parameters = [], bodySchemaName = null) {
  const apiSurface = pathKey.startsWith("/community/v3/api")
    ? "open-api"
    : pathKey.startsWith("/backend/v3/api")
      ? "backend-api"
      : "app-api";
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
            "application/json": {
              schema: { $ref: envelopeSchemaRef(method, operationId) },
            },
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
      "x-sdkwork-request-context": "WebRequestContext",
      "x-sdkwork-api-surface": apiSurface,
      "x-sdkwork-standard-profile": "sdkwork-v3",
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
  const document = {
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
  return alignOpenApiOperationPatterns(document).document;
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
    const payload = `${JSON.stringify(document, null, 2)}\n`;
    writeFileSync(path.join(outputDir, fileName), payload, "utf8");
    const authorityTarget = apiAuthorityTargets.find(([source]) => source === fileName);
    if (authorityTarget) {
      const authorityPath = path.join(workspaceRoot, authorityTarget[1]);
      mkdirSync(path.dirname(authorityPath), { recursive: true });
      writeFileSync(authorityPath, payload, "utf8");
    }
  }
}

process.stdout.write(`[community_openapi_export] ok app=${appRoutes.length} backend=${backendRoutes.length} open=${openRoutes.length}\n`);
