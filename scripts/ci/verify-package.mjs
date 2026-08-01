#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "switchbot-mcp-package-"));
const archiveDirectory = join(temporaryRoot, "archive");
const installDirectory = join(temporaryRoot, "install");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const sourcePackageJson = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8"));
const registryMetadata = JSON.parse(readFileSync(join(repositoryRoot, "server.json"), "utf8"));

try {
  verifyRegistryMetadata(sourcePackageJson, registryMetadata);
  verifyInstallLinks(sourcePackageJson);
  mkdirSync(archiveDirectory);
  mkdirSync(installDirectory);
  writeFileSync(
    join(installDirectory, "package.json"),
    JSON.stringify({ name: "switchbot-mcp-package-smoke", private: true }),
  );

  const packOutput = execFileSync(
    npmCommand,
    ["pack", repositoryRoot, "--pack-destination", archiveDirectory, "--json", "--ignore-scripts"],
    { encoding: "utf8" },
  );
  const [packResult] = JSON.parse(packOutput);
  assert(packResult, "npm pack returned no result");

  const shippedFiles = new Map(packResult.files.map((file) => [file.path, file]));
  assert(shippedFiles.has("package.json"), "tarball is missing package.json");
  assert(shippedFiles.has("build/index.js"), "tarball is missing build/index.js");
  assert(shippedFiles.has("server.json"), "tarball is missing MCP Registry metadata");
  assert(shippedFiles.has("LICENSE"), "tarball is missing the project license");
  assert(shippedFiles.has("README.md"), "tarball is missing user documentation");
  assert(shippedFiles.has("SECURITY.md"), "tarball is missing the security reporting policy");
  assert(shippedFiles.has("SUPPORT.md"), "tarball is missing the support policy");
  assert(
    shippedFiles.has("docs/migration-v2-to-v3.md"),
    "tarball is missing the v3 migration guide",
  );
  assert(shippedFiles.has("docs/security-model.md"), "tarball is missing the security model");
  assert(
    shippedFiles.get("build/index.js").mode === 0o755,
    "packaged CLI entrypoint is not executable",
  );
  assert(
    !packResult.files.some((file) => /^(src|tests)\//.test(file.path)),
    "tarball contains source or test files",
  );

  const archivePath = join(archiveDirectory, packResult.filename);
  execFileSync(
    npmCommand,
    ["install", archivePath, "--ignore-scripts", "--no-audit", "--no-fund"],
    {
      cwd: installDirectory,
      stdio: "pipe",
    },
  );

  const packageJson = JSON.parse(
    readFileSync(join(installDirectory, "node_modules/@genm-dev/switchbot-mcp/package.json")),
  );
  assert(
    packageJson.version === packResult.version,
    "installed package version differs from packed version",
  );

  const binaryName = process.platform === "win32" ? "switchbot-mcp.cmd" : "switchbot-mcp";
  const binaryPath = join(installDirectory, "node_modules/.bin", binaryName);
  const childEnvironment = { ...process.env };
  for (const name of [
    "SWITCHBOT_TOKEN",
    "SWITCHBOT_SECRET",
    "MCP_TRANSPORT",
    "MCP_SERVER_API_KEY",
  ]) {
    delete childEnvironment[name];
  }

  const result = spawnSync(binaryPath, [], {
    cwd: installDirectory,
    encoding: "utf8",
    env: childEnvironment,
    timeout: 5_000,
  });
  assert(result.status === 1, `packaged CLI should fail closed, received ${result.status}`);
  assert(
    result.stderr.includes("SWITCHBOT_TOKEN") && result.stderr.includes("SWITCHBOT_SECRET"),
    "packaged CLI did not identify missing credentials",
  );

  process.stdout.write(
    `${JSON.stringify({
      package: packResult.id,
      mcpName: sourcePackageJson.mcpName,
      entryCount: packResult.entryCount,
      packedBytes: packResult.size,
      smokeExitCode: result.status,
    })}\n`,
  );
} finally {
  // This path always comes from mkdtempSync and is scoped to this smoke test.
  rmSync(temporaryRoot, { force: true, recursive: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyRegistryMetadata(packageJson, serverMetadata) {
  assert(
    packageJson.mcpName === serverMetadata.name,
    "package.json mcpName differs from server.json name",
  );
  assert(
    packageJson.version === serverMetadata.version,
    "package.json version differs from server.json version",
  );

  const npmPackage = serverMetadata.packages?.find((entry) => entry.registryType === "npm");
  assert(npmPackage, "server.json does not define an npm package");
  assert(
    npmPackage.identifier === packageJson.name,
    "server.json npm identifier differs from package.json name",
  );
  assert(
    npmPackage.version === packageJson.version,
    "server.json npm version differs from package.json version",
  );
  assert(npmPackage.transport?.type === "stdio", "server.json npm transport must be stdio");

  const requiredSecrets = new Set(
    npmPackage.environmentVariables
      ?.filter((entry) => entry.isRequired && entry.isSecret)
      .map((entry) => entry.name),
  );
  assert(
    requiredSecrets.has("SWITCHBOT_TOKEN") && requiredSecrets.has("SWITCHBOT_SECRET"),
    "server.json must declare both SwitchBot credentials as required secrets",
  );
}

function verifyInstallLinks(packageJson) {
  const readmes = ["README.md", "README.ja.md"].map((filename) =>
    readFileSync(join(repositoryRoot, filename), "utf8"),
  );
  const expectedEnvironment = {
    SWITCHBOT_TOKEN: "YOUR_SWITCHBOT_TOKEN",
    SWITCHBOT_SECRET: "YOUR_SWITCHBOT_SECRET",
    MCP_TRANSPORT: "stdio",
  };

  for (const readme of readmes) {
    const cursorLink = readme.match(/\]\((cursor:\/\/[^)]+)\)/)?.[1];
    const vsCodeLink = readme.match(/\]\((vscode:mcp\/install\?[^)]+)\)/)?.[1];
    assert(cursorLink, "README is missing the Cursor install link");
    assert(vsCodeLink, "README is missing the VS Code install link");

    const cursorUrl = new URL(cursorLink);
    const cursorPayload = cursorUrl.searchParams.get("config");
    assert(cursorPayload, "Cursor install link is missing its configuration");
    const cursorConfiguration = JSON.parse(
      Buffer.from(cursorPayload, "base64").toString("utf8"),
    ).switchbot;

    const vsCodeUrl = new URL(vsCodeLink);
    const vsCodeConfiguration = JSON.parse(decodeURIComponent(vsCodeUrl.search.slice(1)));

    verifyInstallConfiguration(
      cursorConfiguration,
      expectedEnvironment,
      packageJson.name,
      "Cursor",
    );
    verifyInstallConfiguration(
      vsCodeConfiguration,
      expectedEnvironment,
      packageJson.name,
      "VS Code",
    );
    assert(
      vsCodeConfiguration.name === "switchbot",
      "VS Code install link has an unexpected server name",
    );
  }
}

function verifyInstallConfiguration(configuration, expectedEnvironment, packageName, client) {
  assert(configuration?.command === "npx", `${client} install link must use npx`);
  assert(
    JSON.stringify(configuration.args) === JSON.stringify(["-y", packageName]),
    `${client} install link targets an unexpected package`,
  );
  assert(
    JSON.stringify(configuration.env) === JSON.stringify(expectedEnvironment),
    `${client} install link has unexpected environment configuration`,
  );
}
