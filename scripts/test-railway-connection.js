import postgres from 'postgres';

console.log('🔍 Railway Database Connection Test\n');

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD;

if (!DATABASE_URL) {
  console.error('❌ ERROR: No DATABASE_URL found!');
  console.error('   Set it with: DATABASE_URL="your-railway-url" node scripts/test-railway-connection.js');
  process.exit(1);
}

// Hide password in logs
const urlObj = new URL(DATABASE_URL);
const safeUrl = `${urlObj.protocol}//${urlObj.username}:****@${urlObj.host}${urlObj.pathname}`;
console.log('📡 Connecting to:', safeUrl);

async function testConnection() {
  try {
    const sql = postgres(DATABASE_URL);

    console.log('\n🔄 Testing connection...');

    // Test query
    const result = await sql`SELECT version()`;

    console.log('✅ Connection successful!');
    console.log('📊 PostgreSQL version:', result[0].version.split(' ')[0], result[0].version.split(' ')[1]);

    // Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('\n⚠️  No tables found - database is empty');
      console.log('   This is normal for a new database');
      console.log('   Next step: Run the restoration script');
    } else {
      console.log(`\n✅ Found ${tables.length} tables:`);
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    await sql.end();
    console.log('\n✅ All tests passed! Railway database is ready.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('  - Wrong DATABASE_URL');
    console.error('  - Database not yet provisioned');
    console.error('  - Network/firewall issue');
    console.error('  - Check Railway dashboard for database status\n');
    process.exit(1);
  }
}

testConnection();
