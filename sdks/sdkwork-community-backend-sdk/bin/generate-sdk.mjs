#!/usr/bin/env node
import {
  resolveFamilySdkRoot,
  runCommunitySdkGenerator,
} from "../../../tools/community_sdk_generator_runner.mjs";

runCommunitySdkGenerator(
  {
    apiAuthority: "sdkwork-community.backend",
    apiPrefix: "/backend/v3/api",
    defaultBaseUrl: "http://127.0.0.1:18080",
    defaultOpenapiFile: "community-backend-api.openapi.json",
    sdkName: "sdkwork-community-backend-sdk",
    sdkRoot: resolveFamilySdkRoot(import.meta.url),
    sdkType: "backend",
  },
  process.argv.slice(2),
);
