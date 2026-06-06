import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@sdkwork/community-contracts": fileURLToPath(
        new URL("./packages/common/community/sdkwork-community-contracts/src/index.ts", import.meta.url),
      ),
      "@sdkwork/community-sdk-ports": fileURLToPath(
        new URL("./packages/common/community/sdkwork-community-sdk-ports/src/index.ts", import.meta.url),
      ),
      "@sdkwork/community-service": fileURLToPath(
        new URL("./packages/common/community/sdkwork-community-service/src/index.ts", import.meta.url),
      ),
      "@sdkwork/community-runtime": fileURLToPath(
        new URL("./packages/common/community/sdkwork-community-runtime/src/index.ts", import.meta.url),
      ),
      "@sdkwork/community-pc-react": fileURLToPath(
        new URL(
          "./apps/sdkwork-community-pc/packages/community/sdkwork-community-pc-react/src/index.ts",
          import.meta.url,
        ),
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
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "sdks/**/*.test.ts",
    ],
  },
});
