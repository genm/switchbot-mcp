import { spawn, ChildProcess } from "node:child_process";
import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { once } from "node:events";
import { createRequire } from "node:module";
import http from "node:http";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

const API_KEY = "test-api-key";
const MCP_PATH = "/mcp";

interface MockSwitchBotServer {
  port: number;
  close: () => Promise<void>;
  counters: {
    devices: number;
  };
}

describe("http e2e", () => {
  let mcpPort = 0;
  let serverProcess: ChildProcess | undefined;
  let mockSwitchBot: MockSwitchBotServer;

  beforeEach(async () => {
    mockSwitchBot = await startMockSwitchBotServer();
    mcpPort = await findFreePort();

    serverProcess = spawn(process.execPath, [require.resolve("tsx/cli"), "src/index.ts"], {
      cwd: process.cwd(),
      env: normalizeEnv({
        ...process.env,
        SWITCHBOT_TOKEN: "test-token",
        SWITCHBOT_SECRET: "test-secret",
        SWITCHBOT_BASE_URL: `http://127.0.0.1:${mockSwitchBot.port}/v1.1`,
        MCP_TRANSPORT: "http",
        MCP_SERVER_API_KEY: API_KEY,
        MCP_HTTP_HOST: "127.0.0.1",
        MCP_HTTP_PORT: String(mcpPort),
        MCP_HTTP_PATH: MCP_PATH,
        MCP_HTTP_ALLOWED_HOSTS: "switchbot.example.test",
        LOG_LEVEL: "error",
      }),
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForHttpServer(mcpPort, MCP_PATH);
  });

  afterEach(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
      await once(serverProcess, "exit").catch(() => undefined);
    }

    await mockSwitchBot?.close();
  });

  it("returns 401 for missing/invalid bearer token", async () => {
    const withoutAuth = await postRaw({ path: MCP_PATH, port: mcpPort });
    expect(withoutAuth.statusCode).toBe(401);

    const wrongAuth = await postRaw({
      path: MCP_PATH,
      port: mcpPort,
      headers: { authorization: "Bearer wrong" },
    });
    expect(wrongAuth.statusCode).toBe(401);
  });

  it("returns 403 for invalid host header", async () => {
    const response = await postRaw({
      path: MCP_PATH,
      port: mcpPort,
      headers: {
        authorization: `Bearer ${API_KEY}`,
        host: "evil.example:9999",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns 403 for an untrusted browser origin", async () => {
    const response = await postRaw({
      path: MCP_PATH,
      port: mcpPort,
      headers: {
        authorization: `Bearer ${API_KEY}`,
        origin: "https://evil.example.test",
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it("accepts an explicitly allowed host and same-host origin", async () => {
    const response = await postRaw({
      path: MCP_PATH,
      port: mcpPort,
      headers: {
        authorization: `Bearer ${API_KEY}`,
        host: "switchbot.example.test:443",
        origin: "https://switchbot.example.test",
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("returns 404 for invalid path", async () => {
    const response = await postRaw({
      path: "/not-found",
      port: mcpPort,
      headers: { authorization: `Bearer ${API_KEY}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it("supports authenticated tool call over Streamable HTTP", async () => {
    const callTool = await postRaw({
      path: MCP_PATH,
      port: mcpPort,
      headers: { authorization: `Bearer ${API_KEY}` },
      payload: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "switchbot_list_devices",
          arguments: {
            includeInfrared: false,
          },
        },
      },
    });
    expect(callTool.statusCode).toBe(200);

    const body = JSON.parse(callTool.body);
    expect(body.result.structuredContent).toMatchObject({
      devices: [
        {
          deviceId: "device-1",
          deviceName: "HTTP Lamp",
        },
      ],
    });
    expect(mockSwitchBot.counters.devices).toBe(1);
  });
});

function normalizeEnv(input: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

async function waitForHttpServer(port: number, path: string): Promise<void> {
  const maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await postRaw({ path, port });
      if (result.statusCode > 0) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error("MCP HTTP server did not start in time");
}

async function findFreePort(): Promise<number> {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  const { port } = address;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  return port;
}

async function startMockSwitchBotServer(): Promise<MockSwitchBotServer> {
  const counters = {
    devices: 0,
  };

  const server = createServer((req, res) => {
    if (req.method === "GET" && req.url === "/v1.1/devices") {
      counters.devices += 1;
      const body = JSON.stringify({
        statusCode: 100,
        message: "success",
        body: {
          deviceList: [
            {
              deviceId: "device-1",
              deviceName: "HTTP Lamp",
              deviceType: "Plug",
              enableCloudService: true,
            },
          ],
          infraredRemoteList: [],
        },
      });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Length", Buffer.byteLength(body));
      res.end(body);
      return;
    }

    res.statusCode = 404;
    res.end("not found");
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;

  return {
    port: address.port,
    counters,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function postRaw(options: {
  path: string;
  port: number;
  headers?: Record<string, string>;
  payload?: unknown;
}): Promise<{ statusCode: number; body: string }> {
  const payload = JSON.stringify(
    options.payload ?? {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "raw-client", version: "1.0.0" },
      },
    },
  );

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: options.port,
        path: options.path,
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "mcp-protocol-version": "2025-03-26",
          "content-length": Buffer.byteLength(payload).toString(),
          ...options.headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}
