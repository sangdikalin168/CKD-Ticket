import fs from "fs";
import path from "path";

/**
 * What /version.json reports. build-info.json is written next to package.json
 * by scripts/install-service.ps1 at deploy time (version = deploy timestamp,
 * commit = git short sha). Without it — e.g. `npm run dev` — the package.json
 * version is used and commit is null, so a kiosk or deploy script can always
 * tell which build it is talking to.
 */
export interface BuildInfo {
  name: string;
  version: string;
  commit: string | null;
  buildTime: string | null;
  startedAt: string;
  node: string;
  env: string;
}

// src/Utils -> backend, and dist/Utils -> backend: two levels either way.
const BACKEND_ROOT = path.resolve(__dirname, "../..");

function readJson(file: string): any {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

let cached: BuildInfo | null = null;

export function buildInfo(): BuildInfo {
  if (cached) return cached;
  const pkg = readJson(path.join(BACKEND_ROOT, "package.json")) || {};
  const bi = readJson(path.join(BACKEND_ROOT, "build-info.json")) || {};
  cached = {
    name: "ckd-ticket-api",
    version: bi.version || pkg.version || "0.0.0",
    commit: bi.commit || null,
    buildTime: bi.buildTime || null,
    startedAt: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV || "development",
  };
  return cached;
}
