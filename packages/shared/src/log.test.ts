import { afterEach, describe, expect, it, vi } from "vitest";

import type { Logger } from "./log";
import { captureException, log, setErrorReporter } from "./log";

// This package has no DOM/Node types (it must stay framework-agnostic), so
// declare the console shape the logger relies on — as log.ts does.
declare const console: Logger;

describe("log + error reporting", () => {
  afterEach(() => {
    setErrorReporter(undefined);
    vi.restoreAllMocks();
  });

  it("captureException is a no-op until a reporter is registered", () => {
    expect(() => captureException(new Error("boom"))).not.toThrow();
  });

  it("captureException forwards the error and context to the reporter", () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const error = new Error("boom");

    captureException(error, { route: "/admin" });

    expect(reporter).toHaveBeenCalledWith(error, { route: "/admin" });
  });

  it("log.error forwards the first Error argument to the reporter", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const error = new Error("boom");

    log.error("Something failed:", error);

    expect(reporter).toHaveBeenCalledWith(error);
  });

  it("log.error falls back to the first argument when no Error is passed", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reporter = vi.fn();
    setErrorReporter(reporter);

    log.error("plain message");

    expect(reporter).toHaveBeenCalledWith("plain message");
  });

  it("info/warn/debug write to the console without reporting", () => {
    const reporter = vi.fn();
    setErrorReporter(reporter);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const debug = vi
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);

    log.info("i");
    log.warn("w");
    log.debug("d");

    expect(info).toHaveBeenCalledWith("i");
    expect(warn).toHaveBeenCalledWith("w");
    expect(debug).toHaveBeenCalledWith("d");
    expect(reporter).not.toHaveBeenCalled();
  });
});
