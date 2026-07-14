import pg from "pg";
import { DatabaseState } from "./dbMock.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL not set — running without PostgreSQL");
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}

export async function ensureSchema(): Promise<void> {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) return;
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function loadState(): Promise<DatabaseState | null> {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) return null;
  try {
    const p = getPool();
    const result = await p.query("SELECT state FROM app_state WHERE id = 1");
    if (result.rows.length === 0) return null;
    return result.rows[0].state as DatabaseState;
  } catch (err) {
    console.error("Failed to load state from PostgreSQL:", err);
    return null;
  }
}

export async function saveState(state: DatabaseState): Promise<void> {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) return;
  try {
    const p = getPool();
    await p.query(
      `INSERT INTO app_state (id, state, updated_at) VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET state = $1, updated_at = NOW()`,
      [JSON.stringify(state)]
    );
  } catch (err) {
    console.error("Failed to save state to PostgreSQL:", err);
  }
}
