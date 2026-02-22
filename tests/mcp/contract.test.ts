import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { TtlCache } from "../../src/cache/ttl-cache.js";
import { createLogger } from "../../src/logger.js";
import { createSwitchBotMcpServer } from "../../src/mcp/server.js";
import { SwitchBotClient } from "../../src/switchbot/client.js";

describe("MCP tools contract", () => {
  let client: Client;
  let server: ReturnType<typeof createSwitchBotMcpServer>;

  const listDevices = vi.fn(async () => [
    {
      deviceId: "A",
      deviceName: "Living Room Lamp",
      deviceType: "Plug",
      enableCloudService: true,
      master: true,
    },
  ]);

  const listScenes = vi.fn(async () => [
    { sceneId: "S1", sceneName: "Good Night" },
  ]);
  const sendCommand = vi.fn(async () => undefined);
  const executeScene = vi.fn(async () => undefined);

  beforeEach(async () => {
    const mockSwitchBotClient = {
      listDevices,
      getDeviceStatus: async (deviceId: string) => ({
        deviceId,
        deviceType: "Plug",
        power: "on",
      }),
      sendCommand,
      listScenes,
      executeScene,
    } as unknown as SwitchBotClient;

    server = createSwitchBotMcpServer({
      switchBotClient: mockSwitchBotClient,
      cache: new TtlCache(),
      listCacheTtlMs: 60_000,
      logger: createLogger("error"),
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterEach(async () => {
    await Promise.all([client.close(), server.close()]);
    vi.clearAllMocks();
  });

  it("registers all v2 tools", async () => {
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name).sort();

    expect(names).toEqual([
      "switchbot_execute_scene",
      "switchbot_get_device_status",
      "switchbot_list_devices",
      "switchbot_list_devices_raw",
      "switchbot_list_scenes",
      "switchbot_send_command",
      "switchbot_set_power",
    ]);
  });

  it("returns structured content from tool calls", async () => {
    const result = await client.callTool({
      name: "switchbot_list_devices",
      arguments: { nameQuery: "living", includeInfrared: false },
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      devices: [
        {
          deviceId: "A",
          deviceName: "Living Room Lamp",
          deviceType: "Plug",
          enableCloudService: true,
        },
      ],
    });
    const devices = (
      result.structuredContent as { devices: Array<Record<string, unknown>> }
    ).devices;
    expect(devices[0]).not.toHaveProperty("master");
  });

  it("returns raw device fields from raw tool", async () => {
    const result = await client.callTool({
      name: "switchbot_list_devices_raw",
      arguments: { includeInfrared: false },
    });

    expect(result.isError).not.toBe(true);
    const devices = (
      result.structuredContent as { devices: Array<Record<string, unknown>> }
    ).devices;
    expect(devices[0]).toHaveProperty("master", true);
  });

  it("invalidates list caches when control tools run", async () => {
    await client.callTool({ name: "switchbot_list_devices", arguments: {} });
    await client.callTool({ name: "switchbot_list_devices", arguments: {} });

    expect(listDevices).toHaveBeenCalledTimes(1);

    await client.callTool({
      name: "switchbot_set_power",
      arguments: { deviceId: "A", power: "off" },
    });

    await client.callTool({ name: "switchbot_list_devices", arguments: {} });
    expect(listDevices).toHaveBeenCalledTimes(2);
  });

  it("returns isError for backend failures", async () => {
    executeScene.mockRejectedValueOnce(new Error("upstream failed"));

    const result = await client.callTool({
      name: "switchbot_execute_scene",
      arguments: { sceneId: "S1" },
    });

    expect(result.isError).toBe(true);
  });
});
