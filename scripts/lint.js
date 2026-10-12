"use strict";

// Lightweight lint: syntax-check every JavaScript file and validate every JSON file.
// No dependencies needed. Exits with code 1 if anything is wrong.

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const jsDirs = ["api", "lib", "public", "scripts", "tests"];
const jsonFiles = ["package.json", "vercel.json", path.join("data", "places.json")];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let problems = 0;

for (const dir of jsDirs) {
  for (const file of walk(path.join(root, dir)).filter((f) => f.endsWith(".js"))) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    const rel = path.relative(root, file);
    if (result.status !== 0) {
      problems++;
      console.error(`FAIL  ${rel}\n${result.stderr}`);
    } else {
      console.log(`ok    ${rel}`);
    }
  }
}

for (const rel of jsonFiles) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
    console.log(`ok    ${rel}`);
  } catch (err) {
    problems++;
    console.error(`FAIL  ${rel}: ${err.message}`);
  }
}

if (problems > 0) {
  console.error(`\nLint failed with ${problems} problem(s).`);
  process.exit(1);
}
console.log("\nLint passed.");
