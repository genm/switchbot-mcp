import { serveStdio } from "@modelcontextprotocol/server/stdio";

import type { Logger } from "../logger.js";
import { createSwitchBotMcpServer } from "../mcp/server.js";

export async function startStdioServer(
  mcpServer: ReturnType<typeof createSwitchBotMcpServer>,
  logger: Logger,
): Promise<void> {
  // The v2 entrypoint classifies the opening exchange before pinning this
  // server instance, which is required for 2026 discovery and legacy initialize.
  serveStdio(() => mcpServer, {
    onerror: (error) => logger.error("stdio transport failed", { error: error.message }),
  });
  logger.info("SwitchBot MCP server running on stdio");
}
