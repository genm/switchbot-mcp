import { createServer } from "node:http";
import { AddressInfo } from "node:net";
import { createRequire } from "node:module";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

interface MockSwitchBotServer {
  port: number;
  close: () => Promise<void>;
  counters: {
    devices: number;
    deviceStatus: number;
    command: number;
    scenes: number;
    executeScene: number;
  };
}

describe("stdio e2e", () => {
  let client: Client;
  let transport: StdioClientTransport;
  let mock: MockSwitchBotServer;

  beforeEach(async () => {
    mock = await startMockSwitchBotServer();

    const env = normalizeEnv({
      ...process.env,
      SWITCHBOT_TOKEN: "test-token",
      SWITCHBOT_SECRET: "test-secret",
      SWITCHBOT_BASE_URL: `http://127.0.0.1:${mock.port}/v1.1`,
      MCP_TRANSPORT: "stdio",
      SWITCHBOT_LIST_CACHE_TTL_MS: "60000",
      LOG_LEVEL: "error",
    });

    transport = new StdioClientTransport({
      command: process.execPath,
      args: [require.resolve("tsx/cli"), "src/index.ts"],
      env,
      cwd: process.cwd(),
      stderr: "pipe",
    });

    client = new Client({ name: "e2e-client", version: "1.0.0" });
    await client.connect(transport);
  });

  afterEach(async () => {
    await client?.close();
    await transport?.close();
    await mock?.close();
  });

  it("executes all v2 tools through stdio process and enforces cache behavior", async () => {
    const listedTools = await client.listTools();
    const names = listedTools.tools.map((t) => t.name).sort();

    expect(names).toEqual([
      "switchbot_execute_scene",
      "switchbot_get_device_status",
      "switchbot_list_devices",
      "switchbot_list_scenes",
      "switchbot_send_command",
      "switchbot_set_power",
    ]);

    const firstDevices = await client.callTool({
      name: "switchbot_list_devices",
      arguments: { includeInfrared: true },
    });
    expect(firstDevices.isError).not.toBe(true);
    expect(mock.counters.devices).toBe(1);

    await client.callTool({
      name: "switchbot_list_devices",
      arguments: { includeInfrared: true },
    });
    expect(mock.counters.devices).toBe(1);

    const status = await client.callTool({
      name: "switchbot_get_device_status",
      arguments: { deviceId: "device-1" },
    });
    expect(status.isError).not.toBe(true);
    expect(mock.counters.deviceStatus).toBe(1);

    const setPower = await client.callTool({
      name: "switchbot_set_power",
      arguments: { deviceId: "device-1", power: "off" },
    });
    expect(setPower.isError).not.toBe(true);

    await client.callTool({
      name: "switchbot_list_devices",
      arguments: { includeInfrared: true },
    });
    expect(mock.counters.devices).toBe(2);

    const sendCommand = await client.callTool({
      name: "switchbot_send_command",
      arguments: {
        deviceId: "device-1",
        command: "setBrightness",
        parameter: "50",
        commandType: "command",
      },
    });
    expect(sendCommand.isError).not.toBe(true);

    const firstScenes = await client.callTool({
      name: "switchbot_list_scenes",
      arguments: {},
    });
    expect(firstScenes.isError).not.toBe(true);
    expect(mock.counters.scenes).toBe(1);

    await client.callTool({ name: "switchbot_list_scenes", arguments: {} });
    expect(mock.counters.scenes).toBe(1);

    const executeScene = await client.callTool({
      name: "switchbot_execute_scene",
      arguments: { sceneId: "scene-1" },
    });
    expect(executeScene.isError).not.toBe(true);
    expect(mock.counters.executeScene).toBe(1);

    expect(mock.counters.command).toBe(2);
  });
});

function normalizeEnv(input: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

async function startMockSwitchBotServer(): Promise<MockSwitchBotServer> {
  const counters = {
    devices: 0,
    deviceStatus: 0,
    command: 0,
    scenes: 0,
    executeScene: 0,
  };

  const server = createServer((req, res) => {
    const { method = "GET", url = "" } = req;

    if (method === "GET" && url === "/v1.1/devices") {
      counters.devices += 1;
      json(res, {
        statusCode: 100,
        message: "success",
        body: {
          deviceList: [
            {
              deviceId: "device-1",
              deviceName: "Living Room Lamp",
              deviceType: "Plug",
              enableCloudService: true,
            },
          ],
          infraredRemoteList: [
            {
              deviceId: "remote-1",
              deviceName: "TV Remote",
              deviceType: "TV",
              enableCloudService: true,
            },
          ],
        },
      });
      return;
    }

    if (method === "GET" && url === "/v1.1/devices/device-1/status") {
      counters.deviceStatus += 1;
      json(res, {
        statusCode: 100,
        message: "success",
        body: {
          deviceId: "device-1",
          deviceType: "Plug",
          power: "on",
        },
      });
      return;
    }

    if (method === "POST" && url === "/v1.1/devices/device-1/commands") {
      counters.command += 1;
      json(res, { statusCode: 100, message: "success", body: {} });
      return;
    }

    if (method === "GET" && url === "/v1.1/scenes") {
      counters.scenes += 1;
      json(res, {
        statusCode: 100,
        message: "success",
        body: [{ sceneId: "scene-1", sceneName: "Good Night" }],
      });
      return;
    }

    if (method === "POST" && url === "/v1.1/scenes/scene-1/execute") {
      counters.executeScene += 1;
      json(res, { statusCode: 100, message: "success", body: {} });
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

function json(res: import("node:http").ServerResponse, payload: unknown): void {
  const text = JSON.stringify(payload);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(text));
  res.end(text);
}
