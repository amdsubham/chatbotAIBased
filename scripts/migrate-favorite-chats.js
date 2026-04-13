import "../loadEnv.js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD;

if (!databaseUrl) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrate() {
  console.log("Running favorite_chats migration...");

  await sql`
    CREATE TABLE IF NOT EXISTS favorite_chats (
      id SERIAL PRIMARY KEY,
      chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chat_id)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_favorite_chats_chat_id ON favorite_chats(chat_id)`;

  console.log("Migration complete: favorite_chats table created");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
