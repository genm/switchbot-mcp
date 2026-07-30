import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function successResult<T extends Record<string, unknown>>(
  summary: string,
  structuredContent: T,
): CallToolResult {
  return {
    content: [{ type: "text", text: summary }],
    structuredContent,
  };
}

export function errorResult(error: unknown): CallToolResult {
  const message = sanitizeErrorMessage(error);
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown error";
  return raw
    .replace(/SWITCHBOT_TOKEN=[^\s]+/gi, "SWITCHBOT_TOKEN=[REDACTED]")
    .replace(/SWITCHBOT_SECRET=[^\s]+/gi, "SWITCHBOT_SECRET=[REDACTED]");
}
