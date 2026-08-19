import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { URL } from "node:url";

import {
  hostHeaderValidation,
  NodeStreamableHTTPServerTransport,
  originValidation,
} from "@modelcontextprotocol/node";

import type { Logger } from "../logger.js";
import { createSwitchBotMcpServer } from "../mcp/server.js";

export interface HttpServerOptions {
  host: string;
  port: number;
  path: string;
  apiKey: string;
  allowedHosts: string[];
  logger: Logger;
}

export async function startHttpServer(
  mcpServer: ReturnType<typeof createSwitchBotMcpServer>,
  options: HttpServerOptions,
): Promise<void> {
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await mcpServer.connect(transport);
  const validateHost = hostHeaderValidation(options.allowedHosts);
  // Origin validation is a protocol requirement; non-browser clients without Origin still pass.
  const validateOrigin = originValidation(options.allowedHosts);

  const server = createServer(async (req, res) => {
    try {
      if (!validateHost(req, res) || !validateOrigin(req, res)) {
        return;
      }

      if (!requestPathMatches(req, options.path)) {
        respondJson(res, 404, { error: "Not Found" });
        return;
      }

      if (!isAuthorized(req, options.apiKey)) {
        respondJson(res, 401, { error: "Unauthorized" });
        return;
      }

      await transport.handleRequest(req, res);
    } catch (error) {
      options.logger.error("HTTP transport request failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.headersSent) {
        respondJson(res, 500, { error: "Internal Server Error" });
      }
    }
  });

  await listenHttpServer(mcpServer, server, options.port, options.host);

  options.logger.info("SwitchBot MCP server running on HTTP", {
    host: options.host,
    port: options.port,
    path: options.path,
  });

  let shutdownPromise: Promise<void> | undefined;
  const shutdown = () => {
    shutdownPromise ??= closeHttpServer(mcpServer, server);
    return shutdownPromise;
  };
  const handleSignal = (signal: NodeJS.Signals) => {
    void shutdown().then(
      () => process.exit(0),
      (error: unknown) => {
        options.logger.error("HTTP transport shutdown failed", {
          signal,
          error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
      },
    );
  };

  process.once("SIGINT", () => handleSignal("SIGINT"));
  process.once("SIGTERM", () => handleSignal("SIGTERM"));
}

interface ClosableMcpServer {
  close(): Promise<void>;
}

interface ListenableHttpServer {
  once(event: "error", listener: (error: Error) => void): unknown;
  off(event: "error", listener: (error: Error) => void): unknown;
  listen(port: number, host: string, callback: () => void): unknown;
}

interface ClosableHttpServer {
  close(callback: (error?: Error) => void): void;
}

export async function listenHttpServer(
  mcpServer: ClosableMcpServer,
  server: ListenableHttpServer,
  port: number,
  host: string,
): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        server.off("error", onError);
        reject(error);
      };
      server.once("error", onError);
      server.listen(port, host, () => {
        server.off("error", onError);
        resolve();
      });
    });
  } catch (listenError) {
    try {
      // connect() has already succeeded, so a bind failure must unwind the MCP transport too.
      await mcpServer.close();
    } catch (closeError) {
      throw new AggregateError(
        [listenError, closeError],
        "HTTP transport startup and cleanup failed",
      );
    }
    throw listenError;
  }
}

export async function closeHttpServer(
  mcpServer: ClosableMcpServer,
  server: ClosableHttpServer,
): Promise<void> {
  let mcpError: unknown;
  try {
    await mcpServer.close();
  } catch (error) {
    mcpError = error;
  }

  let serverError: unknown;
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  } catch (error) {
    serverError = error;
  }

  if (mcpError && serverError) {
    throw new AggregateError([mcpError, serverError], "HTTP transport shutdown failed");
  }
  if (mcpError) {
    throw mcpError;
  }
  if (serverError) {
    throw serverError;
  }
}

export function requestPathMatches(req: IncomingMessage, expectedPath: string): boolean {
  const url = new URL(req.url ?? "/", "http://localhost");
  return url.pathname === expectedPath;
}

export function isAuthorized(req: IncomingMessage, apiKey: string): boolean {
  const prefix = "Bearer ";
  const auth = req.headers.authorization;
  if (!auth?.startsWith(prefix)) {
    return false;
  }

  const actual = Buffer.from(auth.slice(prefix.length));
  const expected = Buffer.from(apiKey);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function respondJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(text));
  res.end(text);
}
