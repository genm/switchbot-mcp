import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { verifySbomFile } from "./verify-sbom.mjs";

const outputPath = process.argv[2] ?? "reports/sbom.cdx.json";
const executable = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "cyclonedx-npm.cmd" : "cyclonedx-npm",
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const result = spawnSync(
  executable,
  [
    "--omit",
    "dev",
    "--output-reproducible",
    "--validate",
    "--spec-version",
    "1.6",
    "--output-format",
    "JSON",
    "--output-file",
    outputPath,
  ],
  { stdio: "inherit" },
);

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  throw new Error(`CycloneDX generation failed with exit code ${result.status}`);
}

verifySbomFile(outputPath);
