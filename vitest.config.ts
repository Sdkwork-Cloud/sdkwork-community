import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@sdkwork/community-contracts": fileURLToPath(
        new URL(
          "./apps/sdkwork-community-common/packages/sdkwork-community-contracts/src/index.ts",
          import.meta.url,
        ),
      ),
      "@sdkwork/community-sdk-ports": fileURLToPath(
        new URL(
          "./apps/sdkwork-community-common/packages/sdkwork-community-sdk-ports/src/index.ts",
          import.meta.url,
        ),
      ),
      "@sdkwork/community-service": fileURLToPath(
        new URL(
          "./apps/sdkwork-community-common/packages/sdkwork-community-service/src/index.ts",
          import.meta.url,
        ),
      ),
      "@sdkwork/community-runtime": fileURLToPath(
        new URL(
          "./apps/sdkwork-community-common/packages/sdkwork-community-runtime/src/index.ts",
          import.meta.url,
        ),
      ),
      "@sdkwork/community-app-sdk": fileURLToPath(
        new URL(
          "./sdks/sdkwork-community-app-sdk/sdkwork-community-app-sdk-typescript/src/index.ts",
          import.meta.url,
        ),
      ),
      "@sdkwork/community-pc-community": fileURLToPath(
        new URL(
          "./apps/sdkwork-community-pc/packages/sdkwork-community-pc-community/src/index.ts",
          import.meta.url,
        ),
      ),
      "@sdkwork/utils": fileURLToPath(
        new URL("../sdkwork-utils/packages/sdkwork-utils-typescript/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
      "sdks/**/*.test.ts",
    ],
  },
});
