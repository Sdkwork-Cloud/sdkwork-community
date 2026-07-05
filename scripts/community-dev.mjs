#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function cargoCommand() {
  return process.platform === "win32" ? "cargo.exe" : "cargo";
}

function pnpmCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function parseArgs(argv) {
  const settings = {
    database: "postgres",
    deploymentProfile: "standalone",
    serviceLayout: "unified-process",
    target: "browser",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") {
      settings.target = argv[index + 1] ?? settings.target;
      index += 1;
      continue;
    }
    if (arg === "--database") {
      settings.database = argv[index + 1] ?? settings.database;
      index += 1;
      continue;
    }
    if (arg === "--service-layout") {
      settings.serviceLayout = argv[index + 1] ?? settings.serviceLayout;
      index += 1;
      continue;
    }
    if (arg === "--deployment-profile") {
      settings.deploymentProfile = argv[index + 1] ?? settings.deploymentProfile;
      index += 1;
    }
  }

  return settings;
}

function spawnLogged(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? REPO_ROOT,
    env: { ...process.env, ...(options.env ?? {}) },
    shell: options.shell ?? process.platform === "win32",
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      process.exitCode = code;
    }
    if (signal) {
      process.exitCode = 1;
    }
  });
  return child;
}

function resolveFrontendFilter(target) {
  if (target === "desktop") {
    return "sdkwork-community-pc-workspace";
  }
  return "sdkwork-community-h5-workspace";
}

function main() {
  const settings = parseArgs(process.argv.slice(2));
  const apiBind = process.env.COMMUNITY_API_BIND ?? "0.0.0.0:18094";
  const gatewayEnv = {
    COMMUNITY_API_BIND: apiBind,
    SDKWORK_DATABASE_ENGINE: settings.database,
    SDKWORK_DEPLOYMENT_PROFILE: settings.deploymentProfile,
    SDKWORK_SERVICE_LAYOUT: settings.serviceLayout,
  };

  const gateway = spawnLogged(
    cargoCommand(),
    ["run", "-p", "sdkwork-community-standalone-gateway"],
    { env: gatewayEnv },
  );

  const shutdown = () => {
    if (!gateway.killed) {
      gateway.kill("SIGTERM");
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  setTimeout(() => {
    spawnLogged(
      pnpmCommand(),
      ["--filter", resolveFrontendFilter(settings.target), "dev"],
      {
        env: {
          VITE_COMMUNITY_APP_API_BASE_URL: `http://localhost:${apiBind.split(":").at(-1)}/app/v3/api`,
          VITE_COMMUNITY_OPEN_API_BASE_URL: `http://localhost:${apiBind.split(":").at(-1)}/community/v3/api`,
        },
      },
    );
  }, 1500);
}

main();
