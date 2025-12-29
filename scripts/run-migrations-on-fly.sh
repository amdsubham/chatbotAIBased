#!/bin/bash
# Run database migrations directly on Fly.io
# This script runs migrations after deployment

echo "📦 Running database migrations on Fly.io..."

# Copy migration file to Fly.io instance
fly ssh sftp shell -a chatbot-auspost-ai-support << 'EOF'
put database/migrations/001_initial_schema.sql /tmp/001_initial_schema.sql
EOF

# Run migration via SSH
fly ssh console -a chatbot-auspost-ai-support << 'EOF'
export FLOOT_DATABASE_URL="${FLOOT_DATABASE_URL}"
psql "$FLOOT_DATABASE_URL" -f /tmp/001_initial_schema.sql
EOF

echo "✅ Migrations completed!"

