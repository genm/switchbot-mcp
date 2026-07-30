import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
