import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: process.env.POSTGRES_URL,
  },
  schema,
  casing: "snake_case",
});

export type DbClient = typeof db;

/** Lightweight connectivity check for health endpoints. */
export async function ping(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
