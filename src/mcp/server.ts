import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { TtlCache } from "../cache/ttl-cache.js";
import { Logger } from "../logger.js";
import { SwitchBotClient } from "../switchbot/client.js";
import { registerTools } from "./tools/register-tools.js";

export interface CreateServerOptions {
  switchBotClient: SwitchBotClient;
  cache: TtlCache<unknown>;
  listCacheTtlMs: number;
  logger: Logger;
}

export function createSwitchBotMcpServer(
  options: CreateServerOptions,
): McpServer {
  const server = new McpServer(
    {
      name: "switchbot-mcp",
      version: "2.0.0",
    },
    {
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

  options.logger.info("SwitchBot MCP server initialized", { version: "2.0.0" });
  return server;
}
