import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../drizzle/schema";

const connectionString = process.env.DATABASE_URL || "";

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
