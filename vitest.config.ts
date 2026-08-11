import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Sibling workspaces (sdkwork-im / sdkwork-community / sdkwork-ui)
      // share one pnpm workspace, and React can resolve from several virtual
      // stores; component tests then hit the classic "Invalid hook call".
      // Pin every import to the single copy in this workspace root.
      react: path.join(rootDir, "node_modules", "react"),
      "react-dom": path.join(rootDir, "node_modules", "react-dom"),
      "react-dom/client": path.join(rootDir, "node_modules", "react-dom", "client.js"),
      "react-dom/server": path.join(rootDir, "node_modules", "react-dom", "server.js"),
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
    server: {
      deps: {
        // Externalized deps resolve React through their own pnpm peer links
        // (a second copy in the shared workspace store), which breaks hooks
        // in component tests. Inline them so the resolve.alias React copy is
        // used everywhere.
        inline: [/react-i18next/, /lucide-react/, /@sdkwork\/ui-mobile-react/],
      },
    },
  },
});
