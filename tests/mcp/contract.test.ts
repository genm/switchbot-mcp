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
    {
      deviceId: "B",
      deviceName: "Kitchen Fan",
      deviceType: "Fan",
      enableCloudService: true,
    },
  ]);

  const listScenes = vi.fn(async () => [{ sceneId: "S1", sceneName: "Good Night" }]);
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

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterEach(async () => {
    await Promise.all([client.close(), server.close()]);
    vi.clearAllMocks();
  });

  it("registers all v3 tools", async () => {
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
    const devices = (result.structuredContent as { devices: Array<Record<string, unknown>> })
      .devices;
    expect(devices[0]).not.toHaveProperty("master");
  });

  it("returns raw device fields from raw tool", async () => {
    const result = await client.callTool({
      name: "switchbot_list_devices_raw",
      arguments: { includeInfrared: false },
    });

    expect(result.isError).not.toBe(true);
    const devices = (result.structuredContent as { devices: Array<Record<string, unknown>> })
      .devices;
    expect(devices[0]).toHaveProperty("master", true);
  });

  it("applies each filter independently to the cached device list", async () => {
    await client.callTool({
      name: "switchbot_list_devices",
      arguments: { nameQuery: "living" },
    });
    const second = await client.callTool({
      name: "switchbot_list_devices",
      arguments: { nameQuery: "kitchen" },
    });

    expect(second.structuredContent).toMatchObject({
      devices: [{ deviceId: "B", deviceName: "Kitchen Fan" }],
    });
    expect(listDevices).toHaveBeenCalledTimes(1);
  });

  it("applies each filter independently to the cached raw device list", async () => {
    await client.callTool({
      name: "switchbot_list_devices_raw",
      arguments: { deviceType: "Plug" },
    });
    const second = await client.callTool({
      name: "switchbot_list_devices_raw",
      arguments: { deviceType: "Fan" },
    });

    expect(second.structuredContent).toMatchObject({
      devices: [{ deviceId: "B", deviceType: "Fan" }],
    });
    expect(listDevices).toHaveBeenCalledTimes(1);
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

  it("returns status and scene data with structured output", async () => {
    const status = await client.callTool({
      name: "switchbot_get_device_status",
      arguments: { deviceId: "A" },
    });
    const firstScenes = await client.callTool({
      name: "switchbot_list_scenes",
      arguments: {},
    });
    const cachedScenes = await client.callTool({
      name: "switchbot_list_scenes",
      arguments: {},
    });

    expect(status.structuredContent).toMatchObject({
      deviceId: "A",
      deviceType: "Plug",
      rawStatus: { power: "on" },
    });
    expect(firstScenes.structuredContent).toEqual({
      scenes: [{ sceneId: "S1", sceneName: "Good Night" }],
    });
    expect(cachedScenes.content).toEqual([{ type: "text", text: "Found 1 scenes (cached)." }]);
    expect(listScenes).toHaveBeenCalledTimes(1);
  });

  it("applies command defaults and executes scenes", async () => {
    const command = await client.callTool({
      name: "switchbot_send_command",
      arguments: { deviceId: "A", command: "press" },
    });
    const scene = await client.callTool({
      name: "switchbot_execute_scene",
      arguments: { sceneId: "S1" },
    });

    expect(command.structuredContent).toMatchObject({
      deviceId: "A",
      command: "press",
      parameter: "default",
      commandType: "command",
      accepted: true,
    });
    expect(sendCommand).toHaveBeenCalledWith({
      deviceId: "A",
      command: "press",
      parameter: "default",
      commandType: "command",
    });
    expect(scene.structuredContent).toEqual({ sceneId: "S1", accepted: true });
    expect(executeScene).toHaveBeenCalledWith("S1");
  });

  it("rejects invalid tool input at the MCP schema boundary", async () => {
    const result = await client.callTool({
      name: "switchbot_set_power",
      arguments: { deviceId: "", power: "invalid" },
    });

    expect(result.isError).toBe(true);
    expect(sendCommand).not.toHaveBeenCalled();
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
