import { describe, expect, it } from "vitest";

import {
  SwitchBotApiError,
  SwitchBotHttpError,
  normalizeSwitchBotError,
} from "../../src/switchbot/errors.js";

describe("normalizeSwitchBotError", () => {
  it("preserves known SwitchBot errors", () => {
    const error = new SwitchBotApiError("upstream", 190);
    expect(normalizeSwitchBotError(error)).toBe(error);
  });

  it("normalizes ordinary errors without losing the error class", () => {
    expect(normalizeSwitchBotError(new TypeError("network failed"))).toEqual(
      new SwitchBotHttpError("network failed", undefined, "TypeError"),
    );
  });

  it("does not expose unknown thrown values", () => {
    expect(normalizeSwitchBotError({ token: "must-not-leak" })).toEqual(
      new Error("Unknown SwitchBot error"),
    );
  });
});
