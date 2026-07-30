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
    expect(error).toHaveBeenCalledWith('[WARN] warning {"deviceId":"device-1"}');
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
});
