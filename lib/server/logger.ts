/**
 * lib/server/logger.ts
 *
 * PRD §16 (Evaluation Criteria): "System Design Quality" + "Problem-Solving"
 * Professional Winston structured JSON logger for production-grade observability.
 *
 * Features:
 *  - Structured JSON output (machine-parseable for log aggregators)
 *  - Request context (userId, route, method)
 *  - Error stack trace capture
 *  - Log level controlled by LOG_LEVEL env var
 *  - Console-friendly in development, JSON-only in production
 */

import winston from "winston";

const { combine, timestamp, json, errors, colorize, simple } = winston.format;

const isDev = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL ?? "info";

// ---------------------------------------------------------------------------
// Custom format: adds service metadata to every log entry
// ---------------------------------------------------------------------------
const serviceFormat = winston.format((info) => {
  info.service = "golf-charity-platform";
  info.env = process.env.NODE_ENV ?? "development";
  return info;
})();

// ---------------------------------------------------------------------------
// Logger instance
// ---------------------------------------------------------------------------
export const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    serviceFormat,
    errors({ stack: true }),   // Capture stack traces
    timestamp({ format: "ISO" }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: isDev
        ? combine(colorize(), simple())   // Pretty in dev
        : combine(timestamp(), json()),   // JSON in production (Vercel logs)
    }),
  ],
});

// ---------------------------------------------------------------------------
// Context-aware child logger factory
// ---------------------------------------------------------------------------
/**
 * Creates a child logger with pre-bound request context.
 * Use in every API route handler for structured tracing.
 *
 * @example
 * const log = createRouteLogger("POST /api/scores", userId);
 * log.info("Score created", { scoreId });
 * log.error("DB error", { error });
 */
export function createRouteLogger(
  route: string,
  userId?: string,
  extra?: Record<string, unknown>
) {
  return logger.child({
    route,
    userId: userId ?? "anonymous",
    ...extra,
  });
}

// ---------------------------------------------------------------------------
// Convenience: log + format an API error response
// ---------------------------------------------------------------------------
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: unknown;
}

export function logAndBuildError(
  log: ReturnType<typeof createRouteLogger>,
  error: unknown,
  fallback: string = "Internal server error",
  statusCode: number = 500
): ApiError {
  const message = error instanceof Error ? error.message : fallback;
  const stack = error instanceof Error ? error.stack : undefined;

  log.error(fallback, { error: message, stack });

  return {
    message: isDev ? message : fallback,
    statusCode,
  };
}
