import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function calculateIntegrity(archivePath) {
  return `sha512-${createHash("sha512").update(readFileSync(archivePath)).digest("base64")}`;
}

export function isNotFound(result) {
  return (
    result.status !== 0 && /\bE404\b|404 Not Found/i.test(`${result.stdout}\n${result.stderr}`)
  );
}

export function parsePublishedIntegrity(result) {
  if (result.status !== 0) {
    if (isNotFound(result)) {
      return undefined;
    }
    throw new Error(`npm view failed:\n${result.stderr || result.stdout}`);
  }

  const integrity = JSON.parse(result.stdout);
  if (typeof integrity !== "string" || !integrity.startsWith("sha512-")) {
    throw new Error("npm returned an invalid dist.integrity value");
  }
  return integrity;
}

function runNpm(args, stdio = "pipe") {
  const corepack = process.platform === "win32" ? "corepack.cmd" : "corepack";
  return spawnSync(corepack, ["npm", ...args], {
    encoding: "utf8",
    stdio,
  });
}

function readPublishedIntegrity(specifier) {
  return parsePublishedIntegrity(runNpm(["view", specifier, "dist.integrity", "--json"]));
}

async function main() {
  const archivePath = process.argv[2];
  if (!archivePath) {
    throw new Error("Usage: publish-npm.mjs <package.tgz>");
  }

  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url)));
  const specifier = `${packageJson.name}@${packageJson.version}`;
  const expectedIntegrity = calculateIntegrity(archivePath);
  const publishedIntegrity = readPublishedIntegrity(specifier);

  if (publishedIntegrity !== undefined) {
    if (publishedIntegrity !== expectedIntegrity) {
      throw new Error(
        `${specifier} already exists with integrity ${publishedIntegrity}, expected ${expectedIntegrity}`,
      );
    }
    process.stdout.write(`${JSON.stringify({ package: specifier, state: "already-published" })}\n`);
    return;
  }

  const publishResult = runNpm(
    ["publish", archivePath, "--access", "public", "--provenance"],
    "inherit",
  );
  if (publishResult.status !== 0) {
    throw new Error(`npm publish failed with exit code ${publishResult.status}`);
  }

  // npm reads can lag briefly behind a successful publish.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const verifiedIntegrity = readPublishedIntegrity(specifier);
    if (verifiedIntegrity !== undefined) {
      if (verifiedIntegrity !== expectedIntegrity) {
        throw new Error(
          `Published ${specifier} integrity ${verifiedIntegrity} does not match ${expectedIntegrity}`,
        );
      }
      process.stdout.write(`${JSON.stringify({ package: specifier, state: "published" })}\n`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Published ${specifier} was not readable after verification retries`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
