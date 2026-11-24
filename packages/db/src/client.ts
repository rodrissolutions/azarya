import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

export function createDb(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  const db = drizzle({ client: pool, casing: "snake_case", schema });
  return { db, pool };
}

export type Database = ReturnType<typeof createDb>["db"];
