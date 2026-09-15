import "dotenv/config";
import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../drizzle/schema";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          const val = trimmed
            .substring("DATABASE_URL=".length)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (val) return val;
        }
      }
    }
  } catch {
    // fallback
  }
  return "";
}

const connectionString = getDatabaseUrl();

// Add connection timeout so it doesn't hang if invalid host
export const pool = new pg.Pool({
  connectionString: connectionString || "postgresql://postgres:postgres@localhost:5432/postgres",
  connectionTimeoutMillis: 1500,
  idleTimeoutMillis: 10000,
});

// Suppress unhandled pool error events when Postgres is offline
pool.on("error", () => {
  // Gracefully handled by in-memory fallback
});

export const db = drizzle(pool, { schema });
export { schema };

let postgresAvailable: boolean | null = null;

export async function isPostgresAvailable(): Promise<boolean> {
  if (postgresAvailable !== null) return postgresAvailable;

  // If DATABASE_URL is not set or empty, immediately report unavailable
  if (!connectionString || connectionString.includes("localhost:5432")) {
    try {
      const client = await pool.connect();
      postgresAvailable = true;
      client.release();
      return true;
    } catch {
      postgresAvailable = false;
      return false;
    }
  }

  try {
    const client = await pool.connect();
    postgresAvailable = true;
    client.release();
    return true;
  } catch {
    postgresAvailable = false;
    return false;
  }
}
