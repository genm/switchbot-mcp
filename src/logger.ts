export type LogLevel = "debug" | "info" | "warn" | "error";

const rank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

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
    const payload = meta === undefined ? "" : ` ${JSON.stringify(meta)}`;
    // eslint-disable-next-line no-console
    console.error(`[${target.toUpperCase()}] ${message}${payload}`);
  };

  return {
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
  };
}
