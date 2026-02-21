import nock from "nock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLogger } from "../../src/logger.js";
import { SwitchBotClient } from "../../src/switchbot/client.js";
import {
  SwitchBotApiError,
  SwitchBotHttpError,
} from "../../src/switchbot/errors.js";

const baseURL = "https://api.switch-bot.com";

describe("SwitchBotClient", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("lists devices and optionally infrared remotes", async () => {
    nock(baseURL)
      .get("/v1.1/devices")
      .times(2)
      .reply(200, {
        statusCode: 100,
        message: "success",
        body: {
          deviceList: [
            {
              deviceId: "A",
              deviceName: "Lamp",
              deviceType: "Plug",
              enableCloudService: true,
            },
          ],
          infraredRemoteList: [
            {
              deviceId: "R",
              deviceName: "TV",
              deviceType: "TV",
              enableCloudService: true,
            },
          ],
        },
      });

    const client = new SwitchBotClient({
      token: "token",
      secret: "secret",
      timeoutMs: 500,
      logger: createLogger("error"),
      baseURL: `${baseURL}/v1.1`,
    });

    await expect(client.listDevices(false)).resolves.toHaveLength(1);
    await expect(client.listDevices(true)).resolves.toHaveLength(2);
  });

  it("throws SwitchBotApiError when statusCode is not 100", async () => {
    nock(baseURL).get("/v1.1/scenes").reply(200, {
      statusCode: 190,
      message: "device internal error",
      body: [],
    });

    const client = new SwitchBotClient({
      token: "token",
      secret: "secret",
      timeoutMs: 500,
      logger: createLogger("error"),
      baseURL: `${baseURL}/v1.1`,
    });

    await expect(client.listScenes()).rejects.toBeInstanceOf(SwitchBotApiError);
  });

  it("normalizes HTTP errors", async () => {
    nock(baseURL)
      .get("/v1.1/devices/A/status")
      .reply(401, { message: "Unauthorized" });

    const client = new SwitchBotClient({
      token: "token",
      secret: "secret",
      timeoutMs: 500,
      logger: createLogger("error"),
      baseURL: `${baseURL}/v1.1`,
    });

    await expect(client.getDeviceStatus("A")).rejects.toBeInstanceOf(
      SwitchBotHttpError,
    );
  });

  it("normalizes timeout errors", async () => {
    nock(baseURL)
      .get("/v1.1/devices/A/status")
      .delay(100)
      .reply(200, {
        statusCode: 100,
        message: "success",
        body: { deviceType: "Plug", power: "on" },
      });

    const client = new SwitchBotClient({
      token: "token",
      secret: "secret",
      timeoutMs: 10,
      logger: createLogger("error"),
      baseURL: `${baseURL}/v1.1`,
    });

    await expect(client.getDeviceStatus("A")).rejects.toBeInstanceOf(
      SwitchBotHttpError,
    );
  });
});
