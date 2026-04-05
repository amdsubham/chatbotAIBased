import "../loadEnv.js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD;

if (!databaseUrl) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrate() {
  console.log("Running device_tokens migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS device_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      platform TEXT DEFAULT 'ios' CHECK (platform IN ('ios', 'android')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token)`;

  // Check if trigger exists before creating
  const triggerExists = await sql`
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_tokens_updated_at'
  `;
  if (triggerExists.length === 0) {
    await sql`
      CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON device_tokens
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
  }

  console.log("Migration complete: device_tokens table created");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
