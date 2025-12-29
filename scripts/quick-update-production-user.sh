#!/bin/bash
# Quick script to update user in production
# This uses fly proxy to tunnel to the database

echo "🔐 Generating password hash..."
PASSWORD_HASH=$(node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('12345678',10).then(h=>console.log(h))")

echo "📦 Updating user in production database..."

# Start fly proxy in background
fly proxy 5432:5432 -a chatbot-auspost-db-prod &
PROXY_PID=$!

# Wait for proxy to be ready
sleep 3

# Update user using local connection through proxy
PGPASSWORD=QXRFgvxFAGSKD37 psql -h localhost -p 5432 -U postgres -d postgres <<EOF
DO \$\$
DECLARE
    user_id_var INTEGER;
BEGIN
    SELECT id INTO user_id_var FROM users WHERE LOWER(email) = 'sub.subham9574@gmail.com';
    
    IF user_id_var IS NULL THEN
        INSERT INTO users (email, display_name, role, created_at)
        VALUES ('sub.subham9574@gmail.com', 'sub.subham9574', 'admin', NOW())
        RETURNING id INTO user_id_var;
    END IF;
    
    DELETE FROM user_passwords WHERE user_id = user_id_var;
    INSERT INTO user_passwords (user_id, password_hash)
    VALUES (user_id_var, '$PASSWORD_HASH');
    
    RAISE NOTICE 'User updated successfully';
END \$\$;
EOF

# Kill proxy
kill $PROXY_PID 2>/dev/null

echo "✅ Done!"

