#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const registryBaseUrl = "https://registry.modelcontextprotocol.io/v0.1/servers";
const expected = JSON.parse(readFileSync(new URL("../../server.json", import.meta.url)));

export function comparable(metadata) {
  const server = metadata.server ?? metadata;
  return {
    name: server.name,
    version: server.version,
    packages: server.packages?.map((entry) => ({
      registryType: entry.registryType,
      identifier: entry.identifier,
      version: entry.version,
    })),
  };
}

export function assertMatching(metadata, expectedMetadata = expected) {
  if (JSON.stringify(comparable(metadata)) !== JSON.stringify(comparable(expectedMetadata))) {
    throw new Error("The existing MCP Registry version does not match server.json");
  }
}

async function readPublishedVersion() {
  const url = `${registryBaseUrl}/${encodeURIComponent(expected.name)}/versions/${encodeURIComponent(expected.version)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`MCP Registry lookup failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function main() {
  const existing = await readPublishedVersion();
  if (existing) {
    assertMatching(existing);
    process.stdout.write(
      `${JSON.stringify({ server: expected.name, version: expected.version, state: "already-published" })}\n`,
    );
    return;
  }

  execFileSync("mcp-publisher", ["login", "github-oidc"], { stdio: "inherit" });
  execFileSync("mcp-publisher", ["publish"], { stdio: "inherit" });

  // Registry reads may lag briefly behind a successful write.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const published = await readPublishedVersion();
    if (published) {
      assertMatching(published);
      process.stdout.write(
        `${JSON.stringify({ server: expected.name, version: expected.version, state: "published" })}\n`,
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("MCP Registry did not expose the published version after verification retries");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
