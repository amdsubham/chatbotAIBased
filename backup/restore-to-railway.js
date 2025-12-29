import postgres from 'postgres';
import fs from 'fs';

// Get DATABASE_URL from environment or Railway
const DATABASE_URL = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found!');
  console.error('Please set DATABASE_URL environment variable with your Railway PostgreSQL connection string');
  console.error('Example: DATABASE_URL=postgresql://postgres:password@host:port/database node restore-to-railway.js');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function restoreDatabase() {
  try {
    console.log('🔄 Starting database restoration...\n');

    // Read the backup file
    const backupFile = 'flyio_data_backup_1767006414002.json';
    console.log(`📂 Reading backup file: ${backupFile}`);
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`📅 Backup timestamp: ${backup.timestamp}`);
    console.log(`📊 Tables to restore: ${Object.keys(backup.tables).length}\n`);

    // First, create all tables if they don't exist (run schema first)
    console.log('📋 Ensure you have run the schema file first!');
    console.log('   Run: psql $DATABASE_URL < backup/flyio_schema_backup_1767006598159.sql\n');

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

    // Disable triggers temporarily for faster insertion
    await sql`SET session_replication_role = replica`;

    for (const tableName of tableOrder) {
      const data = backup.tables[tableName];

      if (!data || data.length === 0) {
        console.log(`⏭️  Skipping ${tableName} (no data)`);
        continue;
      }

      console.log(`🔄 Restoring ${tableName}... (${data.length} rows)`);

      try {
        // Clear existing data (optional - comment out if you want to keep existing data)
        await sql`DELETE FROM ${sql(tableName)}`;

        // Insert data
        for (const row of data) {
          await sql`INSERT INTO ${sql(tableName)} ${sql(row)}`;
        }

        totalRestored += data.length;
        console.log(`✅ ${tableName}: ${data.length} rows restored`);
      } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error.message);
        console.error(`   Continuing with next table...`);
      }
    }

    // Re-enable triggers
    await sql`SET session_replication_role = DEFAULT`;

    // Update sequences
    console.log('\n🔧 Updating sequences...');
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
        console.log(`✅ Updated sequence for ${tableName}`);
      } catch (error) {
        console.log(`⏭️  Skipped sequence for ${sequencename}`);
      }
    }

    console.log('\n✅ Database restoration completed successfully!');
    console.log(`📊 Total rows restored: ${totalRestored}`);
    console.log('\n🎉 Your data has been migrated to Railway!\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error during restoration:', error);
    await sql.end();
    process.exit(1);
  }
}

// Run the restoration
restoreDatabase();
