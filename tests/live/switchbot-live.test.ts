import { describe, expect, it } from "vitest";

import { createLogger } from "../../src/logger.js";
import { SwitchBotClient } from "../../src/switchbot/client.js";

const token = process.env.SWITCHBOT_TOKEN;
const secret = process.env.SWITCHBOT_SECRET;
const baseURL = process.env.SWITCHBOT_BASE_URL;
const hasLiveCredentials = Boolean(token && secret);

describe("SwitchBot live API (optional)", () => {
  if (!hasLiveCredentials) {
    it.skip("requires SWITCHBOT_TOKEN and SWITCHBOT_SECRET", () => {});
    return;
  }

  const client = new SwitchBotClient({
    token: token!,
    secret: secret!,
    timeoutMs: 10_000,
    logger: createLogger("info"),
    baseURL,
  });

  it("can list devices against real SwitchBot API", { timeout: 30_000 }, async () => {
    const devices = await client.listDevices(false);

    expect(Array.isArray(devices)).toBe(true);
    for (const device of devices) {
      expect(typeof device.deviceId).toBe("string");
      expect(typeof device.deviceName).toBe("string");
      expect(typeof device.deviceType).toBe("string");
      expect(typeof device.enableCloudService).toBe("boolean");
    }
  });

  it("can list scenes against real SwitchBot API", { timeout: 30_000 }, async () => {
    const scenes = await client.listScenes();

    expect(Array.isArray(scenes)).toBe(true);
    for (const scene of scenes) {
      expect(typeof scene.sceneId).toBe("string");
      expect(typeof scene.sceneName).toBe("string");
    }
  });
});
