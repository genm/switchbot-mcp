export class SwitchBotHttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "SwitchBotHttpError";
  }
}

export class SwitchBotProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SwitchBotProtocolError";
  }
}

export class SwitchBotApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "SwitchBotApiError";
  }
}

export function normalizeSwitchBotError(error: unknown): Error {
  if (
    error instanceof SwitchBotApiError ||
    error instanceof SwitchBotHttpError ||
    error instanceof SwitchBotProtocolError
  ) {
    return error;
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new SwitchBotHttpError("SwitchBot API request timed out", undefined, "ETIMEDOUT");
  }

  if (error instanceof Error) {
    return new SwitchBotHttpError(error.message, undefined, error.name);
  }

  return new Error("Unknown SwitchBot error");
}
