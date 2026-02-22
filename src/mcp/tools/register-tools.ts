import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { TtlCache } from "../../cache/ttl-cache.js";
import { SwitchBotClient } from "../../switchbot/client.js";
import { errorResult, successResult } from "../result.js";

const DEVICE_LIST_CACHE_KEY = "devices";
const SCENE_LIST_CACHE_KEY = "scenes";

const listDevicesOutputSchema = z.object({
  devices: z.array(
    z.object({
      deviceId: z.string(),
      deviceName: z.string(),
      deviceType: z.string(),
      hubDeviceId: z.string().optional(),
      enableCloudService: z.boolean(),
    }),
  ),
});

const listDevicesRawOutputSchema = z.object({
  devices: z.array(z.record(z.unknown())),
});

const getDeviceStatusOutputSchema = z.object({
  deviceId: z.string(),
  deviceType: z.string(),
  rawStatus: z.record(z.unknown()),
});

const setPowerOutputSchema = z.object({
  deviceId: z.string(),
  command: z.enum(["turnOn", "turnOff"]),
  accepted: z.boolean(),
});

const sendCommandOutputSchema = z.object({
  deviceId: z.string(),
  command: z.string(),
  parameter: z.string(),
  commandType: z.enum(["command", "customize"]),
  accepted: z.boolean(),
});

const listScenesOutputSchema = z.object({
  scenes: z.array(
    z.object({
      sceneId: z.string(),
      sceneName: z.string(),
    }),
  ),
});

const executeSceneOutputSchema = z.object({
  sceneId: z.string(),
  accepted: z.boolean(),
});

export interface ToolRegistrationOptions {
  server: McpServer;
  switchBotClient: SwitchBotClient;
  cache: TtlCache<unknown>;
  listCacheTtlMs: number;
}

export function registerTools(options: ToolRegistrationOptions): void {
  const { server, switchBotClient, cache, listCacheTtlMs } = options;

  server.registerTool(
    "switchbot_list_devices",
    {
      description: "List SwitchBot devices",
      inputSchema: {
        includeInfrared: z.boolean().optional(),
        nameQuery: z.string().optional(),
        deviceType: z.string().optional(),
      },
      outputSchema: listDevicesOutputSchema,
    },
    async (args) => {
      try {
        const includeInfrared = args.includeInfrared ?? false;
        const cacheKey = `${DEVICE_LIST_CACHE_KEY}:${includeInfrared}`;
        const cached = cache.get(cacheKey) as
          | z.infer<typeof listDevicesOutputSchema>
          | undefined;
        if (cached) {
          return successResult(
            `Found ${cached.devices.length} devices (cached).`,
            cached,
          );
        }

        const devices = await switchBotClient.listDevices(includeInfrared);
        const normalized = devices
          .map((device) =>
            normalizeDevice(device as unknown as Record<string, unknown>),
          )
          .filter(
            (
              device,
            ): device is z.infer<typeof listDevicesOutputSchema>["devices"][number] =>
              device !== null,
          );
        const filtered = normalized.filter((device) => {
          if (args.deviceType && device.deviceType !== args.deviceType) {
            return false;
          }

          if (
            args.nameQuery &&
            !device.deviceName
              .toLowerCase()
              .includes(args.nameQuery.toLowerCase())
          ) {
            return false;
          }

          return true;
        });

        const output = { devices: filtered };
        cache.set(cacheKey, output, listCacheTtlMs);
        return successResult(`Found ${filtered.length} devices.`, output);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "switchbot_list_devices_raw",
    {
      description:
        "List SwitchBot devices with raw upstream fields (advanced/unstable)",
      inputSchema: {
        includeInfrared: z.boolean().optional(),
        nameQuery: z.string().optional(),
        deviceType: z.string().optional(),
      },
      outputSchema: listDevicesRawOutputSchema,
    },
    async (args) => {
      try {
        const includeInfrared = args.includeInfrared ?? false;
        const cacheKey = `${DEVICE_LIST_CACHE_KEY}:raw:${includeInfrared}`;
        const cached = cache.get(cacheKey) as
          | z.infer<typeof listDevicesRawOutputSchema>
          | undefined;
        if (cached) {
          return successResult(
            `Found ${cached.devices.length} raw devices (cached).`,
            cached,
          );
        }

        const devices = await switchBotClient.listDevices(includeInfrared).then(
          (items) => items as unknown as Array<Record<string, unknown>>,
        );

        const filtered = devices.filter((device) => {
          if (args.deviceType) {
            const currentType =
              typeof device.deviceType === "string"
                ? device.deviceType
                : typeof device.remoteType === "string"
                  ? device.remoteType
                  : undefined;
            if (currentType !== args.deviceType) {
              return false;
            }
          }

          if (args.nameQuery) {
            const currentName =
              typeof device.deviceName === "string" ? device.deviceName : "";
            if (!currentName.toLowerCase().includes(args.nameQuery.toLowerCase())) {
              return false;
            }
          }

          return true;
        });

        const output = { devices: filtered };
        cache.set(cacheKey, output, listCacheTtlMs);
        return successResult(`Found ${filtered.length} raw devices.`, output);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "switchbot_get_device_status",
    {
      description: "Get status for a specific SwitchBot device",
      inputSchema: {
        deviceId: z.string().min(1),
      },
      outputSchema: getDeviceStatusOutputSchema,
    },
    async (args) => {
      try {
        const rawStatus = await switchBotClient.getDeviceStatus(args.deviceId);
        const output = {
          deviceId: args.deviceId,
          deviceType:
            typeof rawStatus.deviceType === "string"
              ? rawStatus.deviceType
              : "unknown",
          rawStatus,
        };
        return successResult(`Fetched status for ${args.deviceId}.`, output);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "switchbot_set_power",
    {
      description: "Turn a SwitchBot device on or off",
      inputSchema: {
        deviceId: z.string().min(1),
        power: z.enum(["on", "off"]),
      },
      outputSchema: setPowerOutputSchema,
    },
    async (args) => {
      try {
        const command = args.power === "on" ? "turnOn" : "turnOff";
        await switchBotClient.sendCommand({ deviceId: args.deviceId, command });
        invalidateListCaches(cache);
        const output = { deviceId: args.deviceId, command, accepted: true };
        return successResult(
          `Power ${args.power} accepted for ${args.deviceId}.`,
          output,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "switchbot_send_command",
    {
      description: "Send a raw command to a SwitchBot device",
      inputSchema: {
        deviceId: z.string().min(1),
        command: z.string().min(1),
        parameter: z.string().optional(),
        commandType: z.enum(["command", "customize"]).optional(),
      },
      outputSchema: sendCommandOutputSchema,
    },
    async (args) => {
      try {
        const parameter = args.parameter ?? "default";
        const commandType = args.commandType ?? "command";
        await switchBotClient.sendCommand({
          deviceId: args.deviceId,
          command: args.command,
          parameter,
          commandType,
        });
        invalidateListCaches(cache);
        const output = {
          deviceId: args.deviceId,
          command: args.command,
          parameter,
          commandType,
          accepted: true,
        };
        return successResult(
          `Command ${args.command} accepted for ${args.deviceId}.`,
          output,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "switchbot_list_scenes",
    {
      description: "List manual scenes in SwitchBot",
      inputSchema: {},
      outputSchema: listScenesOutputSchema,
    },
    async () => {
      try {
        const cached = cache.get(SCENE_LIST_CACHE_KEY) as
          | z.infer<typeof listScenesOutputSchema>
          | undefined;
        if (cached) {
          return successResult(
            `Found ${cached.scenes.length} scenes (cached).`,
            cached,
          );
        }

        const scenes = await switchBotClient.listScenes();
        const output = { scenes };
        cache.set(SCENE_LIST_CACHE_KEY, output, listCacheTtlMs);
        return successResult(`Found ${scenes.length} scenes.`, output);
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "switchbot_execute_scene",
    {
      description: "Execute a manual SwitchBot scene",
      inputSchema: {
        sceneId: z.string().min(1),
      },
      outputSchema: executeSceneOutputSchema,
    },
    async (args) => {
      try {
        await switchBotClient.executeScene(args.sceneId);
        invalidateListCaches(cache);
        const output = { sceneId: args.sceneId, accepted: true };
        return successResult(
          `Scene ${args.sceneId} execution accepted.`,
          output,
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

function invalidateListCaches(cache: TtlCache<unknown>): void {
  cache.clear();
}

function normalizeDevice(
  device: Record<string, unknown>,
): z.infer<typeof listDevicesOutputSchema>["devices"][number] | null {
  if (typeof device.deviceId !== "string" || typeof device.deviceName !== "string") {
    return null;
  }

  const output: z.infer<typeof listDevicesOutputSchema>["devices"][number] = {
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    deviceType:
      typeof device.deviceType === "string"
        ? device.deviceType
        : typeof device.remoteType === "string"
          ? device.remoteType
          : "unknown",
    enableCloudService:
      typeof device.enableCloudService === "boolean"
        ? device.enableCloudService
        : false,
  };

  if (typeof device.hubDeviceId === "string") {
    output.hubDeviceId = device.hubDeviceId;
  }

  return output;
}
