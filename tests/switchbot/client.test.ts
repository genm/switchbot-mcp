import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createLogger } from "../../src/logger.js";
import { SwitchBotClient } from "../../src/switchbot/client.js";
import {
  SwitchBotApiError,
  SwitchBotHttpError,
  SwitchBotProtocolError,
} from "../../src/switchbot/errors.js";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("SwitchBotClient", () => {
  it("lists devices and optionally infrared remotes", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      respondJson(res, 200, {
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
              remoteType: "TV",
              hubDeviceId: "H",
              customInfraredField: true,
            },
          ],
        },
      });
    });
    const client = createClient(baseURL);

    await expect(client.listDevices(false)).resolves.toHaveLength(1);
    await expect(client.listDevices(true)).resolves.toEqual([
      expect.objectContaining({ deviceType: "Plug" }),
      expect.objectContaining({
        remoteType: "TV",
        customInfraredField: true,
      }),
    ]);
  });

  it("throws SwitchBotApiError when statusCode is not 100", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      respondJson(res, 200, {
        statusCode: 190,
        message: "device internal error",
        body: [],
      });
    });

    await expect(createClient(baseURL).listScenes()).rejects.toBeInstanceOf(SwitchBotApiError);
  });

  it("normalizes HTTP errors", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      respondJson(res, 401, { message: "Unauthorized" });
    });

    await expect(createClient(baseURL).getDeviceStatus("A")).rejects.toBeInstanceOf(
      SwitchBotHttpError,
    );
  });

  it("retries transient read failures within the request deadline", async () => {
    let attempts = 0;
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      attempts += 1;
      if (attempts === 1) {
        res.setHeader("Retry-After", "0");
        respondJson(res, 503, { message: "temporarily unavailable" });
        return;
      }

      respondJson(res, 200, {
        statusCode: 100,
        message: "success",
        body: [{ sceneId: "S1", sceneName: "Scene" }],
      });
    });

    await expect(createClient(baseURL).listScenes()).resolves.toHaveLength(1);
    expect(attempts).toBe(2);
  });

  it("stops after the bounded number of read retries", async () => {
    let attempts = 0;
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      attempts += 1;
      res.setHeader("Retry-After", "0");
      respondJson(res, 503, { message: "temporarily unavailable" });
    });

    await expect(createClient(baseURL).listScenes()).rejects.toMatchObject({
      name: "SwitchBotHttpError",
      status: 503,
    });
    expect(attempts).toBe(3);
  });

  it("never retries mutating commands after an upstream failure", async () => {
    let attempts = 0;
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      attempts += 1;
      res.setHeader("Retry-After", "0");
      respondJson(res, 503, { message: "temporarily unavailable" });
    });

    await expect(
      createClient(baseURL).sendCommand({ deviceId: "A", command: "turnOn" }),
    ).rejects.toBeInstanceOf(SwitchBotHttpError);
    expect(attempts).toBe(1);
  });

  it("normalizes timeout errors", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      setTimeout(() => {
        respondJson(res, 200, {
          statusCode: 100,
          message: "success",
          body: { deviceType: "Plug", power: "on" },
        });
      }, 100);
    });

    await expect(createClient(baseURL, 10).getDeviceStatus("A")).rejects.toMatchObject({
      name: "SwitchBotHttpError",
      code: "ETIMEDOUT",
    });
  });

  it("fails closed when the upstream response shape is invalid", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      respondJson(res, 200, {
        statusCode: 100,
        message: "success",
        body: { deviceList: "not-an-array" },
      });
    });

    await expect(createClient(baseURL).listDevices(false)).rejects.toBeInstanceOf(
      SwitchBotProtocolError,
    );
  });

  it("fails closed when a successful upstream response is not JSON", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      res.statusCode = 200;
      res.end("not-json");
    });

    await expect(createClient(baseURL).listScenes()).rejects.toBeInstanceOf(SwitchBotProtocolError);
  });

  it("rejects upstream redirects", async () => {
    const baseURL = await startMockSwitchBotServer((_req, res) => {
      res.statusCode = 302;
      res.setHeader("Location", "https://redirect-target.invalid/");
      res.end();
    });

    await expect(createClient(baseURL).listScenes()).rejects.toBeInstanceOf(SwitchBotHttpError);
  });

  it("encodes device identifiers before constructing request paths", async () => {
    const baseURL = await startMockSwitchBotServer((req, res) => {
      expect(req.url).toBe("/v1.1/devices/device%2F1/commands");
      respondJson(res, 200, {
        statusCode: 100,
        message: "success",
        body: {},
      });
    });

    await expect(
      createClient(baseURL).sendCommand({
        deviceId: "device/1",
        command: "turnOn",
      }),
    ).resolves.toBeUndefined();
  });
});

function createClient(baseURL: string, timeoutMs = 500): SwitchBotClient {
  return new SwitchBotClient({
    token: "token",
    secret: "secret",
    timeoutMs,
    logger: createLogger("error"),
    baseURL,
  });
}

async function startMockSwitchBotServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
): Promise<string> {
  const server = createServer(handler);
  servers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/v1.1`;
}

function respondJson(res: ServerResponse, statusCode: number, body: unknown): void {
  if (res.destroyed) {
    return;
  }

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
