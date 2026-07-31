import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "../src/logger.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLogger", () => {
  it("suppresses messages below the configured level", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createLogger("warn");

    logger.debug("debug");
    logger.info("info");
    logger.warn("warning", { deviceId: "device-1" });

    expect(error).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(String(error.mock.calls[0]?.[0]));
    expect(entry).toMatchObject({
      level: "warn",
      message: "warning",
      meta: { deviceId: "device-1" },
    });
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("logs every supported level at debug", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createLogger("debug");

    logger.debug("debug");
    logger.info("info");
    logger.warn("warn");
    logger.error("error");

    expect(error).toHaveBeenCalledTimes(4);
  });

  it("redacts sensitive structured metadata", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createLogger("info");

    logger.info("configured", {
      token: "token-value",
      nested: { apiKey: "key-value", safe: "visible" },
    });

    expect(JSON.parse(String(error.mock.calls[0]?.[0])).meta).toEqual({
      token: "[REDACTED]",
      nested: { apiKey: "[REDACTED]", safe: "visible" },
    });
  });

  it("does not throw when metadata cannot be serialized", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logger = createLogger("info");
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => logger.info("circular", circular)).not.toThrow();
    expect(JSON.parse(String(error.mock.calls[0]?.[0])).meta).toBe("[unserializable]");
  });
});
