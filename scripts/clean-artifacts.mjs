#!/usr/bin/env node
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const removable = ["dist", ".runtime", "node_modules/.vite", "target"];

for (const relative of removable) {
  const target = path.join(root, relative);
  try {
    rmSync(target, { recursive: true, force: true });
  } catch {
    // best-effort clean
  }
}

console.log("cleaned reproducible build artifacts");
