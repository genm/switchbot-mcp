import { describe, expect, it } from "vitest";

import { errorResult, successResult } from "../../src/mcp/result.js";

describe("MCP results", () => {
  it("returns text and structured content together", () => {
    expect(successResult("ok", { accepted: true })).toEqual({
      content: [{ type: "text", text: "ok" }],
      structuredContent: { accepted: true },
    });
  });

  it("redacts SwitchBot credentials from errors", () => {
    const result = errorResult(
      new Error("SWITCHBOT_TOKEN=token-value SWITCHBOT_SECRET=secret-value failed"),
    );

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: "text",
          text: "SWITCHBOT_TOKEN=[REDACTED] SWITCHBOT_SECRET=[REDACTED] failed",
        },
      ],
    });
  });

  it("does not stringify unknown error values", () => {
    expect(errorResult({ secret: "must-not-leak" })).toMatchObject({
      isError: true,
      content: [{ type: "text", text: "Unknown error" }],
    });
  });
});
