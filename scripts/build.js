"use strict";

// Build step: validate the site, then copy it into dist/ with a build-info.json.
// dist/ is uploaded as a build artifact by GitHub Actions.

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const pkg = require("../package.json");
const places = require("../data/places.json");

function fail(message) {
  console.error(`Build failed: ${message}`);
  process.exit(1);
}

// 1. Basic checks
if (!fs.existsSync(path.join(publicDir, "index.html"))) fail("public/index.html is missing.");
if (!Array.isArray(places) || places.length === 0) fail("data/places.json has no places.");

// 2. Every local file referenced by index.html must exist
const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((ref) => !/^(https?:|mailto:|data:|#|\/\/)/.test(ref));

for (const ref of refs) {
  const target = path.join(publicDir, ref.split("?")[0].replace(/^\//, ""));
  if (!fs.existsSync(target)) fail(`index.html references a missing file: ${ref}`);
}

// 3. Copy into dist/
fs.rmSync(distDir, { recursive: true, force: true });
fs.cpSync(publicDir, distDir, { recursive: true });

const info = {
  name: pkg.name,
  version: pkg.version,
  commit: process.env.GITHUB_SHA || "local",
  branch: process.env.GITHUB_REF_NAME || "local",
  builtAt: new Date().toISOString(),
  places: places.length,
};
fs.writeFileSync(path.join(distDir, "build-info.json"), JSON.stringify(info, null, 2) + "\n");

// 4. Summary
const files = fs.readdirSync(distDir);
const bytes = files.reduce((sum, f) => sum + fs.statSync(path.join(distDir, f)).size, 0);
console.log(`Build OK: ${files.length} files, ${(bytes / 1024).toFixed(1)} KB -> dist/`);
console.log(JSON.stringify(info, null, 2));
