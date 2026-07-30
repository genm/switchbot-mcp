import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import { createSwitchBotAuthHeaders } from "../../src/switchbot/auth.js";

describe("createSwitchBotAuthHeaders", () => {
  it("generates deterministic signature for fixed inputs", () => {
    const headers = createSwitchBotAuthHeaders({
      token: "token123",
      secret: "secret123",
      now: () => 1700000000000,
      nonceFactory: () => "nonce-abc",
    });

    const expected = crypto
      .createHmac("sha256", "secret123")
      .update("token1231700000000000nonce-abc", "utf8")
      .digest("base64");

    expect(headers).toEqual({
      Authorization: "token123",
      sign: expected,
      nonce: "nonce-abc",
      t: "1700000000000",
    });
  });

  it("changes timestamp and nonce between calls", () => {
    let now = 1700000000000;
    let nonceCounter = 0;

    const first = createSwitchBotAuthHeaders({
      token: "t",
      secret: "s",
      now: () => now,
      nonceFactory: () => `nonce-${nonceCounter++}`,
    });

    now += 1;

    const second = createSwitchBotAuthHeaders({
      token: "t",
      secret: "s",
      now: () => now,
      nonceFactory: () => `nonce-${nonceCounter++}`,
    });

    expect(first.t).not.toBe(second.t);
    expect(first.nonce).not.toBe(second.nonce);
    expect(first.sign).not.toBe(second.sign);
  });
});
