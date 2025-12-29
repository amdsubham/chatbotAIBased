# Simplified Deployment - Run Migrations After Deploy

Instead of running migrations from your local machine (which is slow), we'll deploy first and then run migrations directly on Fly.io.

## ✅ Faster Approach

### Step 1: Deploy App First (Without Migrations)

```bash
# Set all secrets first
fly secrets set \
  JWT_SECRET="your-jwt-secret" \
  GEMINI_API_KEY="your-gemini-api-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-gemini-api-key" \
  EMAIL_SERVICE_API_KEY="your-email-service-key" \
  MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0="your-email@example.com" \
  BREVO_API_KEY="your-brevo-api-key" \
  MAILERLITE_API_KEY="your-mailerlite-key" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_CHAT_ID="your-telegram-chat-id" \
  -a chatbot-auspost-ai-support

# Deploy
fly deploy -a chatbot-auspost-ai-support
```

### Step 2: Run Migrations on Fly.io (Fast!)

After deployment, run migrations directly on Fly.io:

```bash
# Upload migration file
fly ssh sftp shell -a chatbot-auspost-ai-support
# Then type: put database/migrations/001_initial_schema.sql /tmp/migration.sql
# Then type: exit

# Run migration
fly ssh console -a chatbot-auspost-ai-support
# Then run:
# psql "$FLOOT_DATABASE_URL" -f /tmp/migration.sql
```

**OR use the simpler method:**

```bash
# Connect and run SQL directly
fly ssh console -a chatbot-auspost-ai-support

# Once connected, run:
cat > /tmp/migration.sql << 'SQL'
-- Paste the contents of database/migrations/001_initial_schema.sql here
SQL

psql "$FLOOT_DATABASE_URL" -f /tmp/migration.sql
```

### Step 3: Create Admin User

```bash
fly ssh console -a chatbot-auspost-ai-support

# Then run the create-user script or SQL directly
```

---

## 🚀 Even Simpler: Use Fly.io's Built-in Connection

The `DATABASE_URL` secret was automatically created when we attached the database. Your app can use that, but we need `FLOOT_DATABASE_URL`. 

**Best approach:** After deployment, the app will have access to the internal Fly.io network, so the connection will be fast and reliable.

---

## ⚡ Quick Deploy Now

Let's skip local migrations and deploy first:

1. **Set secrets** (if not done)
2. **Deploy app**
3. **Run migrations on Fly.io** (much faster!)
4. **Create admin user**

Want me to help you deploy now and run migrations after?

