#!/usr/bin/env node

import { TtlCache } from "./cache/ttl-cache.js";
import { loadConfig } from "./config/env.js";
import { createLogger } from "./logger.js";
import { createSwitchBotMcpServer } from "./mcp/server.js";
import { SwitchBotClient } from "./switchbot/client.js";
import { startHttpServer } from "./transports/http.js";
import { startStdioServer } from "./transports/stdio.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);

  const switchBotClient = new SwitchBotClient({
    token: config.switchbot.token,
    secret: config.switchbot.secret,
    timeoutMs: config.switchbot.timeoutMs,
    logger,
  });

  const cache = new TtlCache<unknown>();

  const mcpServer = createSwitchBotMcpServer({
    switchBotClient,
    cache,
    listCacheTtlMs: config.cache.listTtlMs,
    logger,
  });

  if (config.transport.mode === "http") {
    if (!config.transport.http.apiKey) {
      throw new Error("MCP_SERVER_API_KEY is required in HTTP transport mode");
    }

    await startHttpServer(mcpServer, {
      host: config.transport.http.host,
      port: config.transport.http.port,
      path: config.transport.http.path,
      apiKey: config.transport.http.apiKey,
      logger,
    });
    return;
  }

  await startStdioServer(mcpServer, logger);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
