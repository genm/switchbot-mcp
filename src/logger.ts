export type LogLevel = "debug" | "info" | "warn" | "error";

const rank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};
const SENSITIVE_LOG_KEY = /authorization|api[-_]?key|secret|token/i;

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export function createLogger(level: LogLevel): Logger {
  const log = (target: LogLevel, message: string, meta?: unknown) => {
    if (rank[target] < rank[level]) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error(serializeLogEntry(target, message, meta));
  };

  return {
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
  };
}

function serializeLogEntry(level: LogLevel, message: string, meta?: unknown): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta === undefined ? {} : { meta }),
  };

  try {
    return JSON.stringify(entry, (key, value) =>
      SENSITIVE_LOG_KEY.test(key) ? "[REDACTED]" : value,
    );
  } catch {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level,
      message,
      meta: "[unserializable]",
    });
  }
}
