#!/bin/bash
# Script to create/update user in production database on Fly.io
# Usage: fly ssh console -a chatbot-auspost-ai-support < scripts/create-user-production.sh

set -e

EMAIL="sub.subham9574@gmail.com"
PASSWORD="12345678"

echo "📦 Creating/updating user in production database..."

# The script will run on Fly.io where FLOOT_DATABASE_URL is already set
cd /app 2>/dev/null || cd / 2>/dev/null || true

# Run the update script (it will use FLOOT_DATABASE_URL from environment)
node --loader tsx/esm scripts/update-user-password.js "$EMAIL" "$PASSWORD" || \
node --loader tsx scripts/update-user-password.js "$EMAIL" "$PASSWORD" || \
npx tsx scripts/update-user-password.js "$EMAIL" "$PASSWORD"

echo "✅ Done!"

