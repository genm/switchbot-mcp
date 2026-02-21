import axios, { AxiosInstance } from "axios";

import { Logger } from "../logger.js";
import { createSwitchBotAuthHeaders } from "./auth.js";
import { SwitchBotApiError, normalizeSwitchBotError } from "./errors.js";
import {
  SendCommandInput,
  SwitchBotApiResponse,
  SwitchBotDevice,
  SwitchBotScene,
} from "./types.js";

interface DeviceListBody {
  deviceList: SwitchBotDevice[];
  infraredRemoteList?: SwitchBotDevice[];
}

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

export class SwitchBotClient {
  private readonly axios: AxiosInstance;

  constructor(private readonly options: SwitchBotClientOptions) {
    this.axios = axios.create({
      baseURL: options.baseURL ?? "https://api.switch-bot.com/v1.1",
      timeout: options.timeoutMs,
    });

    this.axios.interceptors.request.use((config) => {
      const authHeaders = createSwitchBotAuthHeaders({
        token: this.options.token,
        secret: this.options.secret,
      });

      config.headers.set("Authorization", authHeaders.Authorization);
      config.headers.set("sign", authHeaders.sign);
      config.headers.set("nonce", authHeaders.nonce);
      config.headers.set("t", authHeaders.t);
      config.headers.set("Content-Type", "application/json; charset=utf8");
      return config;
    });
  }

  async listDevices(includeInfrared: boolean): Promise<SwitchBotDevice[]> {
    const body = await this.get<DeviceListBody>("/devices");
    const devices = [...body.deviceList];

    if (includeInfrared && body.infraredRemoteList) {
      devices.push(...body.infraredRemoteList);
    }

    return devices;
  }

  async getDeviceStatus(deviceId: string): Promise<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(`/devices/${deviceId}/status`);
  }

  async sendCommand(input: SendCommandInput): Promise<void> {
    const payload: ApiCommandBody = {
      command: input.command,
      parameter: input.parameter ?? "default",
      commandType: input.commandType ?? "command",
    };

    await this.post(`/devices/${input.deviceId}/commands`, payload);
  }

  async listScenes(): Promise<SwitchBotScene[]> {
    return this.get<SwitchBotScene[]>("/scenes");
  }

  async executeScene(sceneId: string): Promise<void> {
    await this.post(`/scenes/${sceneId}/execute`, {});
  }

  private async get<T>(path: string): Promise<T> {
    try {
      const response = await this.axios.get<SwitchBotApiResponse<T>>(path);
      return this.unwrap(path, response.data);
    } catch (error) {
      throw normalizeSwitchBotError(error);
    }
  }

  private async post<TBody>(path: string, body: TBody): Promise<void> {
    try {
      const response = await this.axios.post<
        SwitchBotApiResponse<Record<string, unknown>>
      >(path, body);
      this.unwrap(path, response.data);
    } catch (error) {
      throw normalizeSwitchBotError(error);
    }
  }

  private unwrap<T>(path: string, response: SwitchBotApiResponse<T>): T {
    if (response.statusCode !== 100) {
      throw new SwitchBotApiError(
        response.message || "SwitchBot API request failed",
        response.statusCode,
      );
    }

    this.options.logger.debug("SwitchBot API success", {
      path,
      statusCode: response.statusCode,
    });
    return response.body;
  }
}
