import { db } from "../helpers/db";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    // Create device_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        platform TEXT DEFAULT 'ios' CHECK (platform IN ('ios', 'android')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `.execute(db);

    await sql`CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id)`.execute(db);
    await sql`CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token)`.execute(db);

    return Response.json({ success: true, message: "device_tokens table created" });
  } catch (error) {
    console.error("Migration error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
