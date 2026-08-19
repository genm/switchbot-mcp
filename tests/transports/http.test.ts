import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";

import {
  closeHttpServer,
  isAuthorized,
  listenHttpServer,
  requestPathMatches,
} from "../../src/transports/http.js";

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

  it("closes the HTTP listener even when MCP shutdown fails", async () => {
    const calls: string[] = [];
    const mcpServer = {
      close: async () => {
        calls.push("mcp");
        throw new Error("MCP close failed");
      },
    };
    const httpServer = {
      close: (callback: (error?: Error) => void) => {
        calls.push("http");
        callback();
      },
    };

    await expect(closeHttpServer(mcpServer, httpServer)).rejects.toThrow("MCP close failed");
    expect(calls).toEqual(["mcp", "http"]);
  });

  it("closes the connected MCP server when the HTTP listener cannot bind", async () => {
    const occupiedServer = createServer();
    await new Promise<void>((resolve, reject) => {
      occupiedServer.once("error", reject);
      occupiedServer.listen(0, "127.0.0.1", resolve);
    });
    const port = (occupiedServer.address() as AddressInfo).port;
    let closed = false;
    const mcpServer = {
      close: async () => {
        closed = true;
      },
    };
    const conflictingServer = createServer();

    try {
      await expect(
        listenHttpServer(mcpServer, conflictingServer, port, "127.0.0.1"),
      ).rejects.toMatchObject({ code: "EADDRINUSE" });
      expect(closed).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        occupiedServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("preserves bind and MCP cleanup failures from HTTP startup", async () => {
    const bindError = new Error("address already in use");
    const closeError = new Error("MCP close failed");
    const mcpServer = {
      close: async () => {
        throw closeError;
      },
    };
    const httpServer = {
      once: (_event: "error", listener: (error: Error) => void) => {
        listener(bindError);
      },
      off: () => undefined,
      listen: (_port: number, _host: string, _callback: () => void) => undefined,
    };

    const error = await listenHttpServer(mcpServer, httpServer, 8787, "127.0.0.1").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toEqual([bindError, closeError]);
  });
});
