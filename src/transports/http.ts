import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { Logger } from "../logger.js";
import { createSwitchBotMcpServer } from "../mcp/server.js";

export interface HttpServerOptions {
  host: string;
  port: number;
  path: string;
  apiKey: string;
  logger: Logger;
}

export async function startHttpServer(
  mcpServer: ReturnType<typeof createSwitchBotMcpServer>,
  options: HttpServerOptions,
): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await mcpServer.connect(transport);

  const server = createServer(async (req, res) => {
    try {
      if (!requestPathMatches(req, options.path)) {
        respondJson(res, 404, { error: "Not Found" });
        return;
      }

      if (!isAllowedHost(req, options.host, options.port)) {
        respondJson(res, 403, { error: "Forbidden host header" });
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

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host, () => {
      resolve();
    });
  });

  options.logger.info("SwitchBot MCP server running on HTTP", {
    host: options.host,
    port: options.port,
    path: options.path,
  });

  const shutdown = async () => {
    await mcpServer.close();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  };

  process.once("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void shutdown().finally(() => process.exit(0));
  });
}

export function requestPathMatches(
  req: IncomingMessage,
  expectedPath: string,
): boolean {
  const url = new URL(req.url ?? "/", "http://localhost");
  return url.pathname === expectedPath;
}

export function isAuthorized(req: IncomingMessage, apiKey: string): boolean {
  const auth = req.headers.authorization;
  return auth === `Bearer ${apiKey}`;
}

export function isAllowedHost(
  req: IncomingMessage,
  host: string,
  port: number,
): boolean {
  const header = req.headers.host;
  if (!header) {
    return false;
  }

  const hostOnly = header.split(":")[0];
  const allowed = new Set<string>();
  allowed.add(host);
  allowed.add("localhost");
  allowed.add("127.0.0.1");
  allowed.add("[::1]");

  if (host === "0.0.0.0") {
    allowed.add("0.0.0.0");
  }

  if (!allowed.has(hostOnly)) {
    return false;
  }

  const parsedPort = Number(header.split(":")[1] ?? port);
  return Number.isInteger(parsedPort) && parsedPort === port;
}

export function respondJson(
  res: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  const text = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(text));
  res.end(text);
}
