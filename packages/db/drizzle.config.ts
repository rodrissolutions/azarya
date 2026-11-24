import { defineConfig } from "drizzle-kit";

process.loadEnvFile("../../.env");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL en el .env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  casing: "snake_case",
  dbCredentials: { url },
});
