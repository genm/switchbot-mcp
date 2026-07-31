import { describe, expect, it } from "vitest";

import { isAuthorized, requestPathMatches } from "../../src/transports/http.js";

function req(input: { host?: string; authorization?: string; url?: string }) {
  return {
    headers: {
      host: input.host,
      authorization: input.authorization,
    },
    url: input.url ?? "/mcp",
  } as never;
}

describe("HTTP transport guards", () => {
  it("validates path matching", () => {
    expect(requestPathMatches(req({ url: "/mcp?x=1" }), "/mcp")).toBe(true);
    expect(requestPathMatches(req({ url: "/other" }), "/mcp")).toBe(false);
  });

  it("validates bearer auth", () => {
    expect(isAuthorized(req({ authorization: "Bearer abc" }), "abc")).toBe(true);
    expect(isAuthorized(req({ authorization: "Bearer def" }), "abc")).toBe(false);
  });
});
