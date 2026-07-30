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
});
