import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não lê .env.local sozinho (o Next lê; aqui não).
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
