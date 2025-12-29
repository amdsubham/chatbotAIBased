#!/bin/bash
# Run migrations on production using DATABASE_URL
# This script runs on Fly.io instance

cd /app 2>/dev/null || cd / 2>/dev/null || true

# Use DATABASE_URL which Fly.io sets automatically
export FLOOT_DATABASE_URL="${DATABASE_URL}"

echo "Running migrations on production database..."
echo "Database URL: ${DATABASE_URL:0:50}..." # Show first 50 chars for debugging

# Run the setup script
node --loader tsx/esm scripts/setup-db.js 2>&1 || \
npx tsx scripts/setup-db.js 2>&1 || \
node scripts/setup-db.js 2>&1

echo "Migration complete!"

