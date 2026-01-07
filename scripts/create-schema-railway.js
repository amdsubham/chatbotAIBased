import postgres from 'postgres';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found!');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function createSchema() {
  try {
    console.log('🔄 Creating database schema...\n');

    // Read schema from the migration file
    const schemaPath = 'database/migrations/001_initial_schema.sql';

    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Executing schema SQL...');

    // Execute the schema
    await sql.unsafe(schema);

    console.log('✅ Schema created successfully!');

    // Verify tables were created
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`\n✅ Created ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    await sql.end();
    console.log('\n🎉 Database schema is ready!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating schema:', error);
    await sql.end();
    process.exit(1);
  }
}

createSchema();
