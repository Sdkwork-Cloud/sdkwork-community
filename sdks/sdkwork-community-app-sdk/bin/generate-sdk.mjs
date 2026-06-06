#!/usr/bin/env node
import {
  resolveFamilySdkRoot,
  runCommunitySdkGenerator,
} from "../../../tools/community_sdk_generator_runner.mjs";

runCommunitySdkGenerator(
  {
    apiAuthority: "sdkwork-community.app",
    apiPrefix: "/app/v3/api",
    defaultBaseUrl: "http://127.0.0.1:18080",
    defaultOpenapiFile: "community-app-api.openapi.json",
    sdkName: "sdkwork-community-app-sdk",
    sdkRoot: resolveFamilySdkRoot(import.meta.url),
    sdkType: "app",
  },
  process.argv.slice(2),
);
