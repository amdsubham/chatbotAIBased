#!/usr/bin/env node
/**
 * Update User Password Script
 * Updates password for an existing user
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables using the same logic as loadEnv.js
import '../loadEnv.js';

const databaseUrl = process.env.FLOOT_DATABASE_URL;

if (!databaseUrl || databaseUrl.includes('... fill this') || databaseUrl.trim() === '') {
  const envType = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  console.error(`❌ FLOOT_DATABASE_URL is not configured for ${envType} environment`);
  if (envType === 'production') {
    console.error('Please set FLOOT_DATABASE_URL_PROD in env.json or FLOOT_DATABASE_URL as environment variable');
  } else {
    console.error('Please set FLOOT_DATABASE_URL_LOCAL in env.json or FLOOT_DATABASE_URL as environment variable');
  }
  process.exit(1);
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npm run update-user-password <email> <password>');
  console.error('Example: npm run update-user-password user@example.com newpassword123');
  process.exit(1);
}

async function updatePassword() {
  console.log('📦 Updating user password...');
  
  const sql = postgres(databaseUrl);
  
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE LOWER(email) = ${normalizedEmail}
    `;
    
    if (existingUser.length === 0) {
      console.error(`❌ User with email ${email} does not exist!`);
      console.log('💡 Use "npm run create-user" to create a new user.');
      process.exit(1);
    }
    
    const userId = existingUser[0].id;
    
    // Hash the new password
    console.log('🔐 Hashing new password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update password in a transaction
    await sql.begin(async (sql) => {
      // Update password (or insert if doesn't exist)
      await sql`
        INSERT INTO user_passwords (user_id, password_hash)
        VALUES (${userId}, ${passwordHash})
        ON CONFLICT (user_id) 
        DO UPDATE SET password_hash = ${passwordHash}
      `;
      
      console.log('✅ Password updated successfully');
    });
    
    console.log('\n🎉 Password updated successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${password}`);
    console.log('\n💡 You can now log in with the new password.');
    
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

updatePassword();

