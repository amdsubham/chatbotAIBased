import { Hono } from 'hono';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const app = new Hono();

// Restoration endpoint - accessible via web
app.post('/restore-database', async (c) => {
  try {
    const DATABASE_URL = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD;

    if (!DATABASE_URL) {
      return c.json({ error: 'DATABASE_URL not configured' }, 500);
    }

    console.log('🔄 Starting database restoration...');

    const sql = postgres(DATABASE_URL);

    // Read the backup file
    const backupPath = path.join(process.cwd(), 'backup', 'flyio_data_backup_1767006414002.json');

    if (!fs.existsSync(backupPath)) {
      return c.json({ error: 'Backup file not found', path: backupPath }, 404);
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // First, run the schema
    const schemaPath = path.join(process.cwd(), 'backup', 'flyio_schema_backup_1767006598159.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Creating tables from schema...');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await sql.unsafe(schema);
    }

    // Order of table restoration (respecting foreign key constraints)
    const tableOrder = [
      'users',
      'user_passwords',
      'sessions',
      'settings',
      'chats',
      'messages',
      'shortcut_messages',
      'knowledge_base',
      'availability_slots',
      'typing_status',
      'login_attempts'
    ];

    let totalRestored = 0;
    const results: any = {};

    // Disable triggers temporarily for faster insertion
    await sql`SET session_replication_role = replica`;

    for (const tableName of tableOrder) {
      const data = backup.tables[tableName];

      if (!data || data.length === 0) {
        results[tableName] = { status: 'skipped', rows: 0 };
        continue;
      }

      try {
        // Clear existing data
        await sql`DELETE FROM ${sql(tableName)}`;

        // Insert data
        for (const row of data) {
          await sql`INSERT INTO ${sql(tableName)} ${sql(row)}`;
        }

        totalRestored += data.length;
        results[tableName] = { status: 'success', rows: data.length };
      } catch (error: any) {
        results[tableName] = { status: 'error', error: error.message };
      }
    }

    // Re-enable triggers
    await sql`SET session_replication_role = DEFAULT`;

    // Update sequences
    const sequences = await sql`
      SELECT sequencename
      FROM pg_sequences
      WHERE schemaname = 'public'
    `;

    for (const { sequencename } of sequences) {
      const tableName = sequencename.replace(/_id_seq$/, '');
      try {
        await sql`
          SELECT setval(
            pg_get_serial_sequence(${tableName}, 'id'),
            COALESCE((SELECT MAX(id) FROM ${sql(tableName)}), 1),
            true
          )
        `;
      } catch (error) {
        // Ignore sequence errors
      }
    }

    await sql.end();

    return c.json({
      success: true,
      message: 'Database restoration completed!',
      totalRestored,
      timestamp: backup.timestamp,
      tables: results
    });

  } catch (error: any) {
    console.error('Restoration error:', error);
    return c.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// Health check endpoint
app.get('/restore-status', (c) => {
  return c.json({
    status: 'ready',
    message: 'Restoration endpoint is available. POST to /restore-database to start restoration.'
  });
});

export default app;
