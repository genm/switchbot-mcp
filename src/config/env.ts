import { z } from "zod";

const TransportSchema = z.enum(["stdio", "http"]);
const HttpApiKeySchema = z
  .string()
  .refine(
    (value) => value.length > 0 && value === value.trim(),
    "MCP_SERVER_API_KEY must be non-empty and must not have surrounding whitespace",
  );
const CommaSeparatedHostnamesSchema = z
  .string()
  .refine(
    (value) => value.split(",").every((hostname) => hostname.trim().length > 0),
    "MCP_HTTP_ALLOWED_HOSTS must be a comma-separated list of non-empty hostnames",
  )
  .transform((value) => value.split(",").map((hostname) => hostname.trim()));

const EnvSchema = z.object({
  SWITCHBOT_TOKEN: z.string().min(1, "SWITCHBOT_TOKEN is required"),
  SWITCHBOT_SECRET: z.string().min(1, "SWITCHBOT_SECRET is required"),
  SWITCHBOT_BASE_URL: z.url().optional(),
  MCP_TRANSPORT: TransportSchema.default("stdio"),
  MCP_SERVER_API_KEY: HttpApiKeySchema.optional(),
  MCP_HTTP_HOST: z.string().default("127.0.0.1"),
  MCP_HTTP_PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  MCP_HTTP_ALLOWED_HOSTS: CommaSeparatedHostnamesSchema.optional(),
  MCP_HTTP_PATH: z
    .string()
    .default("/mcp")
    .transform((v) => (v.startsWith("/") ? v : `/${v}`)),
  SWITCHBOT_TIMEOUT_MS: z.coerce.number().int().min(100).default(10000),
  SWITCHBOT_LIST_CACHE_TTL_MS: z.coerce.number().int().min(0).default(30000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type TransportMode = z.infer<typeof TransportSchema>;

export interface AppConfig {
  switchbot: {
    token: string;
    secret: string;
    timeoutMs: number;
    baseURL?: string;
  };
  transport: {
    mode: TransportMode;
    http: {
      host: string;
      port: number;
      path: string;
      apiKey?: string;
      allowedHosts: string[];
    };
  };
  cache: {
    listTtlMs: number;
  };
  logLevel: "debug" | "info" | "warn" | "error";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join(".") || "environment";
        return `${path}: ${issue.message}`;
      })
      .join(", ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  const value = parsed.data;

  if (value.SWITCHBOT_BASE_URL) {
    validateTestBaseURL(value.SWITCHBOT_BASE_URL, env.NODE_ENV);
  }

  if (value.MCP_TRANSPORT === "http" && !value.MCP_SERVER_API_KEY) {
    throw new Error("MCP_SERVER_API_KEY is required when MCP_TRANSPORT=http");
  }

  return {
    switchbot: {
      token: value.SWITCHBOT_TOKEN,
      secret: value.SWITCHBOT_SECRET,
      timeoutMs: value.SWITCHBOT_TIMEOUT_MS,
      baseURL: value.SWITCHBOT_BASE_URL,
    },
    transport: {
      mode: value.MCP_TRANSPORT,
      http: {
        host: value.MCP_HTTP_HOST,
        port: value.MCP_HTTP_PORT,
        path: value.MCP_HTTP_PATH,
        apiKey: value.MCP_SERVER_API_KEY,
        allowedHosts: buildAllowedHostnames(
          value.MCP_HTTP_HOST,
          value.MCP_HTTP_ALLOWED_HOSTS ?? [],
        ),
      },
    },
    cache: {
      listTtlMs: value.SWITCHBOT_LIST_CACHE_TTL_MS,
    },
    logLevel: value.LOG_LEVEL,
  };
}

function validateTestBaseURL(baseURL: string, nodeEnv: string | undefined): void {
  if (nodeEnv !== "test") {
    throw new Error("SWITCHBOT_BASE_URL is only supported when NODE_ENV=test");
  }

  const url = new URL(baseURL);
  const isLoopback =
    url.hostname === "localhost" ||
    url.hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(url.hostname);
  if (!isLoopback) {
    // The override changes where SwitchBot credentials are sent, so test traffic stays local.
    throw new Error("SWITCHBOT_BASE_URL must use a loopback hostname");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SWITCHBOT_BASE_URL must use http or https");
  }
}

function buildAllowedHostnames(host: string, configured: string[]): string[] {
  const normalizedHost = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
  return [...new Set([normalizedHost, "localhost", "127.0.0.1", "[::1]", ...configured])];
}
