export interface SwitchBotDevice {
  deviceId: string;
  deviceName: string;
  deviceType?: string;
  remoteType?: string;
  enableCloudService?: boolean;
  hubDeviceId?: string;
  [key: string]: unknown;
}

export interface SwitchBotScene {
  sceneId: string;
  sceneName: string;
}

export interface SwitchBotApiResponse<T> {
  statusCode: number;
  message: string;
  body: T;
}

export interface SendCommandInput {
  deviceId: string;
  command: string;
  parameter?: string;
  commandType?: "command" | "customize";
}
