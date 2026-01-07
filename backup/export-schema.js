import postgres from 'postgres';
import fs from 'fs';

const sql = postgres({
  host: 'localhost',
  port: 15432,
  database: 'chatbot_auspost_ai_support',
  username: 'postgres',
  password: 'QXRFgvxFAGSKD37'
});

async function exportSchema() {
  try {
    console.log('Exporting database schema...');

    // Get CREATE statements for all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    let schema = `-- Database Schema Export
-- Date: ${new Date().toISOString()}
-- Database: chatbot_auspost_ai_support

`;

    for (const { table_name } of tables) {
      console.log(`Exporting schema for: ${table_name}`);

      // Get column definitions
      const columns = await sql`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = ${table_name}
        ORDER BY ordinal_position
      `;

      schema += `\n-- Table: ${table_name}\n`;
      schema += `CREATE TABLE IF NOT EXISTS ${table_name} (\n`;

      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });

      schema += columnDefs.join(',\n');
      schema += '\n);\n';
    }

    const filename = `flyio_schema_backup_${Date.now()}.sql`;
    fs.writeFileSync(filename, schema);
    console.log(`\nSchema export completed!`);
    console.log(`File saved to: ${filename}`);

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error during schema export:', error);
    process.exit(1);
  }
}

exportSchema();
