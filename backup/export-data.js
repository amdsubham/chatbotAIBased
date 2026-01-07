import postgres from 'postgres';
import fs from 'fs';

const sql = postgres({
  host: 'localhost',
  port: 15432,
  database: 'chatbot_auspost_ai_support',
  username: 'postgres',
  password: 'QXRFgvxFAGSKD37'
});

async function exportData() {
  try {
    console.log('Connecting to database...');

    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    console.log(`Found ${tables.length} tables to export`);

    const backup = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // Export each table
    for (const { table_name } of tables) {
      console.log(`Exporting table: ${table_name}`);
      const data = await sql`SELECT * FROM ${sql(table_name)}`;
      backup.tables[table_name] = data;
      console.log(`  - Exported ${data.length} rows`);
    }

    // Save to file
    const filename = `flyio_data_backup_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    console.log(`\nBackup completed successfully!`);
    console.log(`File saved to: ${filename}`);
    console.log(`Total tables: ${tables.length}`);

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error during backup:', error);
    process.exit(1);
  }
}

exportData();
