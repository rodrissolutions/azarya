import { sql } from "drizzle-orm";
import { createDb } from "./client.js";
import { loadEnv } from "./envs.js";

const env = loadEnv();
const { db, pool } = createDb(env.DATABASE_URL);

try {
  const result = await db.execute(
    sql`select current_user as usuario, current_database() as base, uuidv7() as id_de_prueba`,
  );
  console.log(result.rows[0]);
} finally {
  await pool.end();
}
