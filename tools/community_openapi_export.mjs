#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const HTTP_METHODS = new Set(["delete", "get", "patch", "post", "put"]);
const iamModuleManifest = JSON.parse(readFileSync(
  path.join(workspaceRoot, "specs", "iam.module.manifest.json"),
  "utf8",
));
const permissionCatalog = new Set(
  (iamModuleManifest.permissions?.catalog ?? []).map((entry) => entry.code),
);

const domainSchemas = {
  CommunityCategory: {
    type: "object",
    additionalProperties: false,
    required: ["id", "tenantId", "slug", "title", "memberCount", "postCount", "isPaid", "tags", "priority", "enabled"],
    properties: {
      id: { type: "string" },
      tenantId: { type: "string" },
      slug: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      coverImage: { type: "string" },
      avatar: { type: "string" },
      ownerId: { type: "string" },
      memberCount: { type: "integer", format: "int64" },
      postCount: { type: "integer", format: "int64" },
      isPaid: { type: "boolean" },
      price: { type: "number", format: "double" },
      tags: { type: "array", items: { type: "string" } },
      priority: { type: "integer" },
      enabled: { type: "boolean" },
    },
  },
  CommunityCircleCommand: {
    type: "object",
    additionalProperties: false,
    required: ["title"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      coverImage: { type: "string" },
      avatar: { type: "string" },
      isPaid: { type: "boolean" },
      price: { type: "number", format: "double" },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  CommunityMemberResponse: {
    type: "object",
    additionalProperties: false,
    required: ["id", "tenantId", "categoryId", "userId", "userName", "role", "status", "joinedAt"],
    properties: {
      id: { type: "string" },
      tenantId: { type: "string" },
      categoryId: { type: "string" },
      userId: { type: "string" },
      userName: { type: "string" },
      role: { type: "string" },
      status: { type: "string" },
      bio: { type: "string" },
      joinedAt: { type: "string" },
    },
  },
  CommunityMemberPatchCommand: {
    type: "object",
    additionalProperties: false,
    properties: {
      role: { type: "string" },
      status: { type: "string" },
    },
  },
  CommunityGroupQr: {
    type: "object",
    additionalProperties: false,
    required: ["url"],
    properties: {
      url: { type: "string" },
      description: { type: "string" },
    },
  },
  CommunityGroupResponse: {
    type: "object",
    additionalProperties: false,
    required: ["id", "tenantId", "categoryId", "name", "platform", "memberCount", "qrCodes", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      tenantId: { type: "string" },
      categoryId: { type: "string" },
      name: { type: "string" },
      platform: { type: "string" },
      description: { type: "string" },
      memberCount: { type: "integer", format: "int64" },
      qrCodes: { type: "array", items: { $ref: "#/components/schemas/CommunityGroupQr" } },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  },
  CommunityGroupCommand: {
    type: "object",
    additionalProperties: false,
    required: ["name", "platform"],
    properties: {
      name: { type: "string" },
      platform: { type: "string" },
      description: { type: "string" },
      memberCount: { type: "integer", format: "int64" },
      qrCodes: { type: "array", items: { $ref: "#/components/schemas/CommunityGroupQr" } },
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
  route("post", "/app/v3/api/community/categories", "categories.create", false, [], "CommunityCircleCommand"),
  route("patch", "/app/v3/api/community/categories/{categoryId}", "categories.update", false, [pathParam("categoryId")], "CommunityCircleCommand"),
  route("post", "/app/v3/api/community/categories/{categoryId}/join", "categories.join", false, [pathParam("categoryId")]),
  route("get", "/app/v3/api/community/categories/{categoryId}/members", "members.list", false, [pathParam("categoryId")]),
  route("get", "/app/v3/api/community/categories/{categoryId}/members/current", "members.current", false, [pathParam("categoryId")]),
  route("patch", "/app/v3/api/community/categories/{categoryId}/members/{memberId}", "members.update", false, [pathParam("categoryId"), pathParam("memberId")], "CommunityMemberPatchCommand"),
  route("delete", "/app/v3/api/community/categories/{categoryId}/members/{memberId}", "members.remove", false, [pathParam("categoryId"), pathParam("memberId")]),
  route("get", "/app/v3/api/community/categories/{categoryId}/groups", "groups.list", false, [pathParam("categoryId")]),
  route("post", "/app/v3/api/community/categories/{categoryId}/groups", "groups.create", false, [pathParam("categoryId")], "CommunityGroupCommand"),
  route("patch", "/app/v3/api/community/categories/{categoryId}/groups/{groupId}", "groups.update", false, [pathParam("categoryId"), pathParam("groupId")], "CommunityGroupCommand"),
  route("delete", "/app/v3/api/community/categories/{categoryId}/groups/{groupId}", "groups.remove", false, [pathParam("categoryId"), pathParam("groupId")]),
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
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string", minLength: 1 },
  };
}

function queryParam(name, schema = { type: "string" }) {
  return {
    name,
    in: "query",
    required: false,
    schema,
  };
}

function listParams() {
  return [
    queryParam("categoryId"),
    queryParam("kind"),
    queryParam("q"),
    queryParam("reviewState"),
    queryParam("tag"),
    queryParam("page", { type: "integer", minimum: 1, default: 1 }),
    queryParam("page_size", { type: "integer", minimum: 1, maximum: 200, default: 20 }),
  ];
}

function route(method, pathKey, operationId, isPublic, parameters = [], bodySchemaName = null) {
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
      security: isPublic ? [] : [{ AuthToken: [], AccessToken: [] }],
      "x-sdkwork-owner": OWNER,
      "x-sdkwork-api-authority": "",
      "x-sdkwork-domain": DOMAIN,
      "x-sdkwork-resource": operationId.split(".")[0],
      "x-sdkwork-public": isPublic,
      "x-sdkwork-auth-mode": isPublic ? "anonymous" : "dual-token",
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
      ...(routes.some((item) => !item.operation["x-sdkwork-public"])
        ? {
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
          },
        }
        : {
          securitySchemes: {
            ApiKey: {
              type: "apiKey",
              in: "header",
              name: "X-API-Key",
            },
          },
        }),
      schemas,
    },
    "x-sdkwork-owner": OWNER,
    "x-sdkwork-api-authority": authority,
    "x-sdkwork-domain": DOMAIN,
    "x-sdkwork-standard-profile": "sdkwork-v3",
  };
  return applyPermissionContract(
    alignOpenApiOperationPatterns(document).document,
    authority,
  );
}

function applyPermissionContract(document, authority) {
  const authorityContract = (iamModuleManifest.permissions?.openapiAuthorities ?? [])
    .find((entry) => entry.apiAuthority === authority);
  const permissionsByOperation = new Map();
  for (const mapping of authorityContract?.operationPermissions ?? []) {
    if (permissionsByOperation.has(mapping.operationId)) {
      throw new Error(`${authority} duplicates permission mapping for ${mapping.operationId}`);
    }
    if (!permissionCatalog.has(mapping.permission)) {
      throw new Error(`${authority} maps ${mapping.operationId} to unknown permission ${mapping.permission}`);
    }
    permissionsByOperation.set(mapping.operationId, mapping.permission);
  }

  const seenOperations = new Set();
  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method)) {
        continue;
      }
      const permission = permissionsByOperation.get(operation.operationId);
      if (operation["x-sdkwork-public"] === true) {
        if (permission) {
          throw new Error(`${authority} public operation ${operation.operationId} must not require ${permission}`);
        }
        continue;
      }
      if (!permission) {
        throw new Error(`${authority} protected operation ${operation.operationId} lacks an IAM permission mapping`);
      }
      operation["x-sdkwork-permission"] = permission;
      seenOperations.add(operation.operationId);
    }
  }

  for (const operationId of permissionsByOperation.keys()) {
    if (!seenOperations.has(operationId)) {
      throw new Error(`${authority} permission mapping references missing operation ${operationId}`);
    }
  }
  return document;
}

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
  };
}

const args = parseArgs(process.argv.slice(2));
const docs = [
  ["community-open-api.openapi.json", documentFor({ authority: "sdkwork-community-open-api", routes: openRoutes, serverUrl: "http://127.0.0.1:18082", title: "SDKWork Community Open API" })],
  ["community-app-api.openapi.json", documentFor({ authority: "sdkwork-community-app-api", routes: appRoutes, serverUrl: "http://127.0.0.1:18080", title: "SDKWork Community App API" })],
  ["community-backend-api.openapi.json", documentFor({ authority: "sdkwork-community-backend-api", routes: backendRoutes, serverUrl: "http://127.0.0.1:18080", title: "SDKWork Community Backend API" })],
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
