import { NextResponse } from "next/server";

import { ping } from "@example-app/db/client";

// Health/liveness endpoint for deploy platforms and uptime monitors.
export const dynamic = "force-dynamic";

export async function GET() {
  const dbUp = await ping();

  return NextResponse.json(
    {
      status: dbUp ? "ok" : "degraded",
      db: dbUp ? "up" : "down",
      timestamp: new Date().toISOString(),
    },
    { status: dbUp ? 200 : 503 },
  );
}
