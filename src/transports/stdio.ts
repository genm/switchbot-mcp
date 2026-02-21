import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { Logger } from "../logger.js";
import { createSwitchBotMcpServer } from "../mcp/server.js";

export async function startStdioServer(
  mcpServer: ReturnType<typeof createSwitchBotMcpServer>,
  logger: Logger,
): Promise<void> {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("SwitchBot MCP server running on stdio");
}
