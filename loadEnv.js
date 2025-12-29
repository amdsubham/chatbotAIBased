import fs from 'fs'

// Determine environment
// Development: NODE_ENV is not 'production' or undefined
// Production: NODE_ENV is 'production' (set by fly.toml or npm scripts)
const isProduction = process.env.NODE_ENV === 'production';

// Load from env.json if it exists (for local development)
// Otherwise, use environment variables (for production/Fly.io)
try {
  if (fs.existsSync('env.json')) {
    const envConfig = JSON.parse(fs.readFileSync('env.json', 'utf8'));
    Object.keys(envConfig).forEach(key => {
      // Only set if not already set (allows env vars to override)
      if (!process.env[key]) {
        process.env[key] = envConfig[key];
      }
    });
  }
} catch (error) {
  console.warn('Warning: Could not load env.json, using environment variables only:', error.message);
}

// Set FLOOT_DATABASE_URL based on environment
// Priority: FLOOT_DATABASE_URL > DATABASE_URL (Fly.io) > FLOOT_DATABASE_URL_PROD > Fallback
if (!process.env.FLOOT_DATABASE_URL || process.env.FLOOT_DATABASE_URL.includes('... fill this')) {
  if (isProduction) {
    // Production: Prioritize DATABASE_URL (set automatically by Fly.io when database is attached)
    // Then fallback to FLOOT_DATABASE_URL_PROD if DATABASE_URL is not available
    process.env.FLOOT_DATABASE_URL = process.env.DATABASE_URL || process.env.FLOOT_DATABASE_URL_PROD || process.env.FLOOT_DATABASE_URL;
    if (process.env.DATABASE_URL) {
      console.log('✅ Using DATABASE_URL from Fly.io');
    } else if (process.env.FLOOT_DATABASE_URL_PROD && !process.env.FLOOT_DATABASE_URL_PROD.includes('... fill this')) {
      console.log('✅ Using FLOOT_DATABASE_URL_PROD');
    }
  } else {
    // Development: Use FLOOT_DATABASE_URL_LOCAL or fallback to FLOOT_DATABASE_URL
    process.env.FLOOT_DATABASE_URL = process.env.FLOOT_DATABASE_URL_LOCAL || process.env.FLOOT_DATABASE_URL;
    if (process.env.FLOOT_DATABASE_URL_LOCAL) {
      console.log('✅ Using local database');
    }
  }
}

// Validate database URL is set
if (!process.env.FLOOT_DATABASE_URL ||
  process.env.FLOOT_DATABASE_URL.includes('... fill this') ||
  process.env.FLOOT_DATABASE_URL.trim() === '') {
  const envType = isProduction ? 'production' : 'development';
  console.error(`❌ FLOOT_DATABASE_URL is not configured for ${envType} environment`);
  if (isProduction) {
    console.error('   Set FLOOT_DATABASE_URL_PROD in env.json or FLOOT_DATABASE_URL as environment variable');
  } else {
    console.error('   Set FLOOT_DATABASE_URL_LOCAL in env.json or FLOOT_DATABASE_URL as environment variable');
  }
}