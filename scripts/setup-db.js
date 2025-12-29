#!/usr/bin/env node
/**
 * Database Setup Script
 * This script creates the database schema and initializes the database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables using the same logic as loadEnv.js
import '../loadEnv.js';

const databaseUrl = process.env.FLOOT_DATABASE_URL;

if (!databaseUrl || databaseUrl.includes('... fill this') || databaseUrl.trim() === '') {
  const envType = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.error(`❌ FLOOT_DATABASE_URL is not configured for ${envType} environment`);
  console.error('');
  if (envType === 'production') {
    console.error('Please set FLOOT_DATABASE_URL_PROD in env.json or FLOOT_DATABASE_URL as environment variable');
  } else {
    console.error('Please set FLOOT_DATABASE_URL_LOCAL in env.json or FLOOT_DATABASE_URL as environment variable');
  }
  console.error('');
  console.error('Options:');
  console.error('  1. Local PostgreSQL:');
  console.error('     - Install PostgreSQL: https://www.postgresql.org/download/');
  console.error('     - Create database: createdb chatbot_db');
  console.error('     - Set URL: postgresql://username:password@localhost:5432/chatbot_db');
  console.error('');
  console.error('  2. Cloud PostgreSQL (Recommended):');
  console.error('     - Supabase: https://supabase.com (Free tier available)');
  console.error('     - Railway: https://railway.app (Free tier available)');
  console.error('     - Neon: https://neon.tech (Free tier available)');
  console.error('     - Get connection string from your provider');
  console.error('');
  console.error('Example connection string format:');
  console.error('  postgresql://user:password@host:5432/database_name');
  console.error('');
  process.exit(1);
}

async function setupDatabase() {
  console.log('📦 Setting up database...');
  
  const sql = postgres(databaseUrl);
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running database migrations...');
    
    // Execute migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - user_passwords');
    console.log('   - sessions');
    console.log('   - chats');
    console.log('   - messages');
    console.log('   - knowledge_base');
    console.log('   - shortcut_messages');
    console.log('   - availability_slots');
    console.log('   - typing_status');
    console.log('   - settings');
    console.log('   - login_attempts');
    console.log('\n💡 Default settings row has been created.');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some tables already exist. This is okay if you\'re re-running the setup.');
    } else {
      process.exit(1);
    }
  } finally {
    await sql.end();
  }
}

setupDatabase();

