import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Falta TEST_DATABASE_URL en el .env");

// Salvaguarda: este script nunca debe tocar la base de desarrollo.
if (!new URL(url).pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL debe apuntar a una base cuyo nombre termine en _test");
}

const pool = new pg.Pool({ connectionString: url });
try {
  await migrate(drizzle({ client: pool }), {
    migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)),
  });
  console.log("Base de pruebas migrada.");
} finally {
  await pool.end();
}
