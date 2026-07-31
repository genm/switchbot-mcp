import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  calculateIntegrity,
  isNotFound,
  parsePublishedIntegrity,
} from "../../scripts/release/publish-npm.mjs";
import { assertMatching } from "../../scripts/release/publish-registry.mjs";

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("resumable npm publication", () => {
  it("calculates the registry integrity from the exact archive bytes", () => {
    const directory = mkdtempSync(join(tmpdir(), "switchbot-mcp-integrity-"));
    temporaryDirectories.push(directory);
    const archive = join(directory, "package.tgz");
    writeFileSync(archive, "deterministic package bytes");

    const expected = `sha512-${createHash("sha512")
      .update("deterministic package bytes")
      .digest("base64")}`;
    expect(calculateIntegrity(archive)).toBe(expected);
  });

  it("treats only npm not-found responses as an unpublished version", () => {
    const notFound = { status: 1, stdout: "", stderr: "npm error code E404" };
    const outage = { status: 1, stdout: "", stderr: "npm error code E500" };

    expect(isNotFound(notFound)).toBe(true);
    expect(parsePublishedIntegrity(notFound)).toBeUndefined();
    expect(isNotFound(outage)).toBe(false);
    expect(() => parsePublishedIntegrity(outage)).toThrow("npm view failed");
  });

  it("rejects malformed registry integrity instead of assuming success", () => {
    expect(() =>
      parsePublishedIntegrity({ status: 0, stdout: '"sha256-invalid"', stderr: "" }),
    ).toThrow("invalid dist.integrity");
  });
});

describe("resumable MCP Registry publication", () => {
  const expected = {
    name: "io.github.example/switchbot",
    version: "3.0.0",
    packages: [
      {
        registryType: "npm",
        identifier: "@example/switchbot",
        version: "3.0.0",
      },
    ],
  };

  it("accepts an existing immutable version with matching package identity", () => {
    expect(() =>
      assertMatching(
        {
          server: expected,
          _meta: { "io.modelcontextprotocol.registry/official": { status: "active" } },
        },
        expected,
      ),
    ).not.toThrow();
  });

  it("rejects a version whose package identity differs", () => {
    const mismatched = structuredClone(expected);
    mismatched.packages[0].version = "2.9.0";

    expect(() => assertMatching({ server: mismatched }, expected)).toThrow(
      "does not match server.json",
    );
  });
});
