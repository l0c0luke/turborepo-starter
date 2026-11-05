/**
 * Structured logger that can be swapped for a production logging service.
 *
 * In development, delegates to console. In production, register an error
 * reporter (e.g. Sentry) via `setErrorReporter` so `log.error` / `captureException`
 * forward to it. This keeps `@example-app/shared` framework-agnostic — the web
 * and mobile apps each register their own Sentry SDK.
 */

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
}

declare const console: Logger | undefined;

const noop: LogFn = () => undefined;
const c: Logger =
  typeof console !== "undefined"
    ? console
    : { info: noop, warn: noop, error: noop, debug: noop };

export type ErrorReporter = (
  error: unknown,
  context?: Record<string, unknown>,
) => void;

let errorReporter: ErrorReporter | undefined;

/** Register (or clear) the sink that `captureException` forwards to. */
export function setErrorReporter(reporter: ErrorReporter | undefined): void {
  errorReporter = reporter;
}

/** Report an error to the registered reporter (no-op until one is set). */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  errorReporter?.(error, context);
}

export const log: Logger = {
  info: (...args: unknown[]) => c.info(...args),
  warn: (...args: unknown[]) => c.warn(...args),
  error: (...args: unknown[]) => {
    c.error(...args);
    // Forward the first Error-like argument to the reporter, if registered.
    const err = args.find((a) => a instanceof Error) ?? args[0];
    if (err !== undefined) errorReporter?.(err);
  },
  debug: (...args: unknown[]) => c.debug(...args),
};

/**
 * Options shared by every Sentry SDK init in the repo (web client, server,
 * edge, mobile). Errors go to Bugsink by default, which is Sentry-compatible
 * but ignores performance data — so tracing is off rather than sending 100%
 * of transactions nowhere. Raise `tracesSampleRate` here (once) if you point
 * the DSNs at Sentry and want tracing.
 */
export const errorTrackingOptions = {
  tracesSampleRate: 0,
  /** Never attach IPs, cookies or request bodies to events by default. */
  sendDefaultPii: false,
} as const;
