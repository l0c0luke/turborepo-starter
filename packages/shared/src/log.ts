/**
 * Structured logger that can be swapped for a production logging service.
 *
 * In development, delegates to console. In production, you can replace this
 * with a service like Logtail, Axiom, or Datadog.
 */

type LogFn = (...args: unknown[]) => void;

export interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
}

/* eslint-disable no-restricted-globals */
declare const console: Logger | undefined;

const noop: LogFn = () => {};
const c: Logger =
  typeof console !== "undefined"
    ? console
    : { info: noop, warn: noop, error: noop, debug: noop };

export const log: Logger = {
  info: (...args: unknown[]) => c.info(...args),
  warn: (...args: unknown[]) => c.warn(...args),
  error: (...args: unknown[]) => c.error(...args),
  debug: (...args: unknown[]) => c.debug(...args),
};
