import axios, { AxiosError } from "axios";

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
    error instanceof SwitchBotHttpError
  ) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    return normalizeAxiosError(error);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown SwitchBot error");
}

function normalizeAxiosError(error: AxiosError): SwitchBotHttpError {
  if (error.response) {
    const message =
      extractMessage(error.response.data) ?? `HTTP ${error.response.status}`;
    return new SwitchBotHttpError(message, error.response.status, error.code);
  }

  return new SwitchBotHttpError(error.message, undefined, error.code);
}

function extractMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const candidate = data as Record<string, unknown>;
  if (typeof candidate.message === "string") {
    return candidate.message;
  }

  return undefined;
}
