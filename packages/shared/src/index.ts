/**
 * @example-app/shared
 *
 * Shared types, constants, and utilities for the Example App web and mobile apps.
 */

export { parseError } from "./parse-error";
export { matchAllowedOrigin, parseOriginList } from "./origins";
export { captureException, log, setErrorReporter } from "./log";
export type { ErrorReporter, Logger } from "./log";
