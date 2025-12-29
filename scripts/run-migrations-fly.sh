#!/bin/bash
# Run migrations on Fly.io production database
# This script runs on the Fly.io instance

cd /app 2>/dev/null || cd / 2>/dev/null || true

# Use DATABASE_URL which Fly.io sets automatically
export DATABASE_URL="${DATABASE_URL}"
export FLOOT_DATABASE_URL="${DATABASE_URL}"

# Run migrations
node --loader tsx/esm scripts/setup-db.js || \
npx tsx scripts/setup-db.js || \
node scripts/setup-db.js

echo "Migrations complete!"
