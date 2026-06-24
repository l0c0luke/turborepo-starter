"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Global error boundary — catches errors in the root layout itself. Renders its
 * own <html>/<body> because the normal layout did not mount.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280" }}>
            An unexpected error occurred. Please reload the page.
          </p>
        </div>
      </body>
    </html>
  );
}
