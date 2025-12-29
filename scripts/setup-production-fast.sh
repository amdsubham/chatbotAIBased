#!/bin/bash
# Fast setup script for production database
# This uses fly proxy to create a local tunnel

set -e

echo "🚀 Fast Production Setup"
echo "========================"
echo ""

# Start fly proxy in background
echo "1️⃣ Starting database tunnel..."
fly proxy 5432:5432 -a chatbot-auspost-db-prod > /dev/null 2>&1 &
PROXY_PID=$!

# Wait for tunnel to be ready
sleep 2
echo "✅ Tunnel ready"
echo ""

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="QXRFgvxFAGSKD37"
DB_NAME="postgres"

# Run migrations
echo "2️⃣ Running database migrations..."
export PGPASSWORD="$DB_PASS"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/migrations/001_initial_schema.sql > /dev/null 2>&1
echo "✅ Migrations complete"
echo ""

# Create/update user
echo "3️⃣ Creating/updating user..."
PASSWORD_HASH='$2b$10$P3mcNUyfy8C0RfXSdDTrHOEB/mXkxsZCq7esrVCK8zMbaTJBE3VlS'

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
DO \$\$
DECLARE
    user_id_var INTEGER;
BEGIN
    SELECT id INTO user_id_var FROM users WHERE LOWER(email) = 'sub.subham9574@gmail.com';
    
    IF user_id_var IS NULL THEN
        INSERT INTO users (email, display_name, role, created_at)
        VALUES ('sub.subham9574@gmail.com', 'sub.subham9574', 'admin', NOW())
        RETURNING id INTO user_id_var;
        RAISE NOTICE 'User created with ID: %', user_id_var;
    ELSE
        RAISE NOTICE 'User found with ID: %', user_id_var;
    END IF;
    
    DELETE FROM user_passwords WHERE user_id = user_id_var;
    INSERT INTO user_passwords (user_id, password_hash)
    VALUES (user_id_var, '$PASSWORD_HASH');
    
    RAISE NOTICE 'Password updated successfully';
END \$\$;
EOF

echo "✅ User created/updated"
echo ""

# Kill proxy
kill $PROXY_PID 2>/dev/null || true

echo "🎉 Done! User credentials:"
echo "   Email: sub.subham9574@gmail.com"
echo "   Password: 12345678"
echo ""

