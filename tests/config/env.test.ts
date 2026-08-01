import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/env.js";

describe("loadConfig", () => {
  it("loads secure local defaults", () => {
    const config = loadConfig({
      SWITCHBOT_TOKEN: "token",
      SWITCHBOT_SECRET: "secret",
    });

    expect(config).toMatchObject({
      transport: {
        mode: "stdio",
        http: {
          host: "127.0.0.1",
          port: 8787,
          path: "/mcp",
          allowedHosts: ["127.0.0.1", "localhost", "[::1]"],
        },
      },
      switchbot: {
        timeoutMs: 10_000,
      },
    });
  });

  it("identifies missing credential names", () => {
    expect(() => loadConfig({})).toThrow(/SWITCHBOT_TOKEN:.*SWITCHBOT_SECRET:/);
  });

  it("rejects HTTP mode without an API key", () => {
    expect(() =>
      loadConfig({
        SWITCHBOT_TOKEN: "token",
        SWITCHBOT_SECRET: "secret",
        MCP_TRANSPORT: "http",
      }),
    ).toThrow("MCP_SERVER_API_KEY is required when MCP_TRANSPORT=http");
  });

  it("rejects a SwitchBot base URL override outside the test environment", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        SWITCHBOT_TOKEN: "token",
        SWITCHBOT_SECRET: "secret",
        SWITCHBOT_BASE_URL: "http://127.0.0.1:8787/v1.1",
      }),
    ).toThrow("SWITCHBOT_BASE_URL is only supported when NODE_ENV=test");
  });

  it("rejects a non-loopback SwitchBot base URL in the test environment", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "test",
        SWITCHBOT_TOKEN: "token",
        SWITCHBOT_SECRET: "secret",
        SWITCHBOT_BASE_URL: "https://switchbot-mock.example.test/v1.1",
      }),
    ).toThrow("SWITCHBOT_BASE_URL must use a loopback hostname");
  });

  it("accepts a loopback SwitchBot base URL in the test environment", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      SWITCHBOT_TOKEN: "token",
      SWITCHBOT_SECRET: "secret",
      SWITCHBOT_BASE_URL: "http://127.0.0.1:8787/v1.1",
    });

    expect(config.switchbot.baseURL).toBe("http://127.0.0.1:8787/v1.1");
  });

  it("rejects blank or padded HTTP API keys", () => {
    for (const apiKey of ["", "   ", " padded-key", "padded-key "]) {
      expect(() =>
        loadConfig({
          SWITCHBOT_TOKEN: "token",
          SWITCHBOT_SECRET: "secret",
          MCP_TRANSPORT: "http",
          MCP_SERVER_API_KEY: apiKey,
        }),
      ).toThrow("MCP_SERVER_API_KEY");
    }
  });

  it("adds explicitly allowed HTTP hostnames without removing secure local defaults", () => {
    const config = loadConfig({
      SWITCHBOT_TOKEN: "token",
      SWITCHBOT_SECRET: "secret",
      MCP_TRANSPORT: "http",
      MCP_SERVER_API_KEY: "api-key",
      MCP_HTTP_HOST: "0.0.0.0",
      MCP_HTTP_ALLOWED_HOSTS: "switchbot.example.test, proxy.localhost",
    });

    expect(config.transport.http.allowedHosts).toEqual([
      "0.0.0.0",
      "localhost",
      "127.0.0.1",
      "[::1]",
      "switchbot.example.test",
      "proxy.localhost",
    ]);
  });

  it("rejects an empty entry in the HTTP hostname allowlist", () => {
    expect(() =>
      loadConfig({
        SWITCHBOT_TOKEN: "token",
        SWITCHBOT_SECRET: "secret",
        MCP_TRANSPORT: "http",
        MCP_SERVER_API_KEY: "api-key",
        MCP_HTTP_ALLOWED_HOSTS: "switchbot.example.test,,proxy.localhost",
      }),
    ).toThrow("MCP_HTTP_ALLOWED_HOSTS");
  });

  it("preserves every configured hostname exactly once for varied valid lists", () => {
    const hostname = fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/).map((label) => `${label}.test`);

    fc.assert(
      fc.property(fc.array(hostname, { minLength: 1, maxLength: 30 }), (hostnames) => {
        const config = loadConfig({
          SWITCHBOT_TOKEN: "token",
          SWITCHBOT_SECRET: "secret",
          MCP_TRANSPORT: "http",
          MCP_SERVER_API_KEY: "api-key",
          MCP_HTTP_ALLOWED_HOSTS: hostnames.map((value) => ` ${value} `).join(","),
        });

        const allowedHosts = config.transport.http.allowedHosts;
        expect(new Set(allowedHosts).size).toBe(allowedHosts.length);
        for (const configured of new Set(hostnames)) {
          expect(allowedHosts).toContain(configured);
        }
      }),
      { numRuns: 200 },
    );
  });
});
