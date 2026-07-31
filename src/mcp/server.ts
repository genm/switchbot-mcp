import { McpServer, SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/server";
import packageJson from "../../package.json" with { type: "json" };

import type { TtlCache } from "../cache/ttl-cache.js";
import type { Logger } from "../logger.js";
import type { SwitchBotClient } from "../switchbot/client.js";
import { registerTools } from "./tools/register-tools.js";

export interface CreateServerOptions {
  switchBotClient: SwitchBotClient;
  cache: TtlCache<unknown>;
  listCacheTtlMs: number;
  logger: Logger;
}

export function createSwitchBotMcpServer(options: CreateServerOptions): McpServer {
  const server = new McpServer(
    {
      name: "switchbot-mcp",
      version: packageJson.version,
    },
    {
      // SDK v2 keeps modern negotiation opt-in so established 2025 clients can
      // continue using initialize while modern clients discover 2026 explicitly.
      supportedProtocolVersions: ["2026-07-28", ...SUPPORTED_PROTOCOL_VERSIONS],
      capabilities: {
        tools: {},
      },
    },
  );

  registerTools({
    server,
    switchBotClient: options.switchBotClient,
    cache: options.cache,
    listCacheTtlMs: options.listCacheTtlMs,
  });

  options.logger.info("SwitchBot MCP server initialized", {
    version: packageJson.version,
  });
  return server;
}
