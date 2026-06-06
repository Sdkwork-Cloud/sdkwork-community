#!/usr/bin/env node
import {
  resolveFamilySdkRoot,
  runCommunitySdkGenerator,
} from "../../../tools/community_sdk_generator_runner.mjs";

runCommunitySdkGenerator(
  {
    apiAuthority: "sdkwork-community.open",
    apiPrefix: "/community/v3/api",
    defaultBaseUrl: "http://127.0.0.1:18082",
    defaultOpenapiFile: "community-open-api.openapi.json",
    sdkName: "sdkwork-community-sdk",
    sdkRoot: resolveFamilySdkRoot(import.meta.url),
    sdkType: "custom",
  },
  process.argv.slice(2),
);
