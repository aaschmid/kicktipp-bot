// TODO: license-checker-rseidelsohn v5 dropped pnpm support; switch back if upstream re-adds it.
import { execFileSync } from "node:child_process";

const ALLOWED = new Set(["Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "MIT"]);

const json = execFileSync("pnpm", ["licenses", "list", "--prod", "--json"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

const byLicense = JSON.parse(json);
const violations = [];
let count = 0;

for (const [license, packages] of Object.entries(byLicense)) {
  count += packages.length;
  if (!ALLOWED.has(license)) {
    violations.push(`${license}: ${packages.map((p) => `${p.name}@${p.versions}`).join(", ")}`);
  }
}

for (const violation of violations) {
  console.error(violation);
}
console.log(`Checked ${count} production packages; ${violations.length} license violation(s).`);

if (violations.length > 0) {
  process.exit(1);
}
