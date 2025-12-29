#!/bin/bash
# Quick production setup - Run this in TWO terminals
# Terminal 1: fly proxy 5432:5432 -a chatbot-auspost-db-prod
# Terminal 2: ./scripts/quick-prod-setup.sh

set -e

DB_URL="postgresql://postgres:QXRFgvxFAGSKD37@localhost:5432/postgres"

echo "🚀 Quick Production Setup"
echo "========================="
echo ""
echo "⚠️  Make sure 'fly proxy 5432:5432 -a chatbot-auspost-db-prod' is running in another terminal!"
echo "Press Enter to continue..."
read

echo "1️⃣ Running migrations..."
export FLOOT_DATABASE_URL="$DB_URL"
NODE_ENV=production npm run setup-db

echo ""
echo "2️⃣ Creating/updating user..."
NODE_ENV=production npm run update-user-password sub.subham9574@gmail.com 12345678

echo ""
echo "✅ Done!"

