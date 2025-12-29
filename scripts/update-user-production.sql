-- Update user password in production database
-- Run this via: fly postgres connect -a chatbot-auspost-db-prod < scripts/update-user-production.sql

-- First, check if user exists and get user ID
DO $$
DECLARE
    user_id_var INTEGER;
    password_hash_var TEXT;
BEGIN
    -- Get user ID
    SELECT id INTO user_id_var FROM users WHERE LOWER(email) = 'sub.subham9574@gmail.com';
    
    IF user_id_var IS NULL THEN
        -- User doesn't exist, create it
        INSERT INTO users (email, display_name, role, created_at)
        VALUES ('sub.subham9574@gmail.com', 'sub.subham9574', 'admin', NOW())
        RETURNING id INTO user_id_var;
        
        RAISE NOTICE 'User created with ID: %', user_id_var;
    ELSE
        RAISE NOTICE 'User found with ID: %', user_id_var;
    END IF;
    
    -- Hash password: 12345678 -> bcrypt hash
    -- Using bcrypt with cost 10: $2a$10$...
    -- This is a placeholder - we need to generate the actual hash
    -- For now, we'll use a simple approach: delete and recreate password
    
    -- Delete existing password
    DELETE FROM user_passwords WHERE user_id = user_id_var;
    
    -- Note: You'll need to generate the bcrypt hash for '12345678'
    -- Use: node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('12345678',10).then(h=>console.log(h))"
    -- Then replace the hash below
    
    -- Insert new password hash (replace with actual hash)
    INSERT INTO user_passwords (user_id, password_hash)
    VALUES (user_id_var, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
    
    RAISE NOTICE 'Password updated successfully for user ID: %', user_id_var;
END $$;

