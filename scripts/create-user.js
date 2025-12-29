#!/usr/bin/env node
/**
 * Create User Script
 * Creates a new user with email and password
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
const role = process.argv[4] || 'admin'; // Default to admin role

if (!email || !password) {
  console.error('Usage: npm run create-user <email> <password> [role]');
  console.error('Example: npm run create-user user@example.com password123 admin');
  process.exit(1);
}

async function createUser() {
  console.log('📦 Creating user...');
  
  const sql = postgres(databaseUrl);
  
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE LOWER(email) = ${normalizedEmail}
    `;
    
    if (existingUser.length > 0) {
      console.error(`❌ User with email ${email} already exists!`);
      console.log('💡 To update the password, delete the user first or use a different email.');
      process.exit(1);
    }
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user in a transaction
    await sql.begin(async (sql) => {
      // Insert user
      const [user] = await sql`
        INSERT INTO users (email, display_name, role, created_at)
        VALUES (${normalizedEmail}, ${normalizedEmail.split('@')[0]}, ${role}, NOW())
        RETURNING id, email, display_name, role
      `;
      
      console.log('✅ User created:', {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role
      });
      
      // Insert password
      await sql`
        INSERT INTO user_passwords (user_id, password_hash)
        VALUES (${user.id}, ${passwordHash})
      `;
      
      console.log('✅ Password set successfully');
    });
    
    console.log('\n🎉 User created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${role}`);
    console.log('\n💡 You can now log in with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createUser();

