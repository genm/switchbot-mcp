import { z } from "zod";

import type { Logger } from "../logger.js";
import { createSwitchBotAuthHeaders } from "./auth.js";
import {
  SwitchBotApiError,
  SwitchBotHttpError,
  SwitchBotProtocolError,
  normalizeSwitchBotError,
} from "./errors.js";
import type { SendCommandInput, SwitchBotDevice, SwitchBotScene } from "./types.js";

const switchBotDeviceSchema = z.looseObject({
  deviceId: z.string(),
  deviceName: z.string(),
  deviceType: z.string(),
  enableCloudService: z.boolean(),
  hubDeviceId: z.string().optional(),
});

const switchBotInfraredRemoteSchema = z.looseObject({
  deviceId: z.string(),
  deviceName: z.string(),
  remoteType: z.string(),
  hubDeviceId: z.string().optional(),
});

const deviceListBodySchema = z.object({
  deviceList: z.array(switchBotDeviceSchema),
  infraredRemoteList: z.array(switchBotInfraredRemoteSchema).optional(),
});

const switchBotSceneSchema = z.object({
  sceneId: z.string(),
  sceneName: z.string(),
});

const apiEnvelopeSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  body: z.unknown(),
});

const unknownRecordSchema = z.record(z.string(), z.unknown());

interface SwitchBotClientOptions {
  token: string;
  secret: string;
  timeoutMs: number;
  logger: Logger;
  baseURL?: string;
}

interface ApiCommandBody {
  command: string;
  parameter: string;
  commandType: "command" | "customize";
}

interface SwitchBotRequestInit {
  method: "GET" | "POST";
  body?: string;
}

export class SwitchBotClient {
  private readonly baseURL: string;

  constructor(private readonly options: SwitchBotClientOptions) {
    this.baseURL = (options.baseURL ?? "https://api.switch-bot.com/v1.1").replace(/\/+$/, "");
  }

  async listDevices(includeInfrared: boolean): Promise<SwitchBotDevice[]> {
    const body = await this.get("/devices", deviceListBodySchema);
    const devices: SwitchBotDevice[] = [...body.deviceList];

    if (includeInfrared && body.infraredRemoteList) {
      devices.push(...body.infraredRemoteList);
    }

    return devices;
  }

  async getDeviceStatus(deviceId: string): Promise<Record<string, unknown>> {
    return this.get(`/devices/${encodeURIComponent(deviceId)}/status`, unknownRecordSchema);
  }

  async sendCommand(input: SendCommandInput): Promise<void> {
    const payload: ApiCommandBody = {
      command: input.command,
      parameter: input.parameter ?? "default",
      commandType: input.commandType ?? "command",
    };

    await this.post(`/devices/${encodeURIComponent(input.deviceId)}/commands`, payload);
  }

  async listScenes(): Promise<SwitchBotScene[]> {
    return this.get("/scenes", z.array(switchBotSceneSchema));
  }

  async executeScene(sceneId: string): Promise<void> {
    await this.post(`/scenes/${encodeURIComponent(sceneId)}/execute`, {});
  }

  private async get<T>(path: string, bodySchema: z.ZodType<T>): Promise<T> {
    return this.request(path, { method: "GET" }, bodySchema);
  }

  private async post<TBody>(path: string, body: TBody): Promise<void> {
    await this.request(
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      unknownRecordSchema,
    );
  }

  private async request<T>(
    path: string,
    init: SwitchBotRequestInit,
    bodySchema: z.ZodType<T>,
  ): Promise<T> {
    try {
      const authHeaders = createSwitchBotAuthHeaders({
        token: this.options.token,
        secret: this.options.secret,
      });
      const response = await fetch(`${this.baseURL}${path}`, {
        ...init,
        headers: {
          Authorization: authHeaders.Authorization,
          sign: authHeaders.sign,
          nonce: authHeaders.nonce,
          t: authHeaders.t,
          "Content-Type": "application/json; charset=utf-8",
        },
        signal: AbortSignal.timeout(this.options.timeoutMs),
        // SwitchBot credentials are scoped to one origin and must never follow a redirect.
        redirect: "error",
      });
      const rawBody = await readJsonBody(response);

      if (!response.ok) {
        throw new SwitchBotHttpError(
          extractMessage(rawBody) ?? `HTTP ${response.status}`,
          response.status,
        );
      }

      return this.unwrap(path, rawBody, bodySchema);
    } catch (error) {
      throw normalizeSwitchBotError(error);
    }
  }

  private unwrap<T>(path: string, rawResponse: unknown, bodySchema: z.ZodType<T>): T {
    const response = apiEnvelopeSchema.safeParse(rawResponse);
    if (!response.success) {
      throw new SwitchBotProtocolError(`Invalid SwitchBot API response for ${path}`);
    }

    if (response.data.statusCode !== 100) {
      throw new SwitchBotApiError(
        response.data.message || "SwitchBot API request failed",
        response.data.statusCode,
      );
    }

    const body = bodySchema.safeParse(response.data.body);
    if (!body.success) {
      throw new SwitchBotProtocolError(`Invalid SwitchBot API response body for ${path}`);
    }

    this.options.logger.debug("SwitchBot API success", {
      path,
      statusCode: response.data.statusCode,
    });
    return body.data;
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) {
      return undefined;
    }
    throw new SwitchBotProtocolError("SwitchBot API returned invalid JSON");
  }
}

function extractMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const message = Reflect.get(data, "message");
  return typeof message === "string" ? message : undefined;
}
