#!/usr/bin/env node
// Simple script to run migrations on Fly.io production
// Uses DATABASE_URL which Fly.io sets automatically

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use DATABASE_URL directly (set by Fly.io)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

console.log('📦 Running migrations on production database...');
console.log(`📊 Database: ${databaseUrl.split('@')[1] || 'connected'}`);

const sql = postgres(databaseUrl);

try {
  // Read migration file
  const migrationPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📝 Executing migration SQL...');
  
  // Execute migration
  await sql.unsafe(migrationSQL);
  
  console.log('✅ Migrations completed successfully!');
  
  // Verify tables exist
  const tables = await sql`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `;
  
  console.log('\n📊 Tables in database:');
  tables.forEach(row => {
    console.log(`   ✓ ${row.tablename}`);
  });
  
} catch (error) {
  console.error('❌ Error running migrations:', error.message);
  if (error.message.includes('already exists')) {
    console.log('ℹ️  Some objects already exist. This is okay.');
  } else {
    process.exit(1);
  }
} finally {
  await sql.end();
}

