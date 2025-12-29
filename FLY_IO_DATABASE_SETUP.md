# Fly.io Database Setup (100% on Fly.io - FREE)

This guide will help you set up a PostgreSQL database **directly on Fly.io** using their free unmanaged Postgres option.

---

## ✅ Fly.io Free Database Option

**Unmanaged Postgres** - FREE but you manage it yourself
- ✅ **Cost: $0/month**
- ✅ Runs on Fly.io infrastructure
- ⚠️ No automatic backups (you manage)
- ⚠️ No support from Fly.io team

---

## Step-by-Step Setup

### Step 1: Create Unmanaged Postgres Database

```bash
# Use a unique name (chatbot-db was taken, so use a different name)
fly postgres create --name chatbot-auspost-db-prod --region syd
```

**When prompted:**
1. **Select region**: Choose `syd` (Sydney) to match your app region
2. **Select configuration**: Choose **"Development (1 node)"** - This is FREE
   - NOT "Production (High Availability)" - that costs money
   - Choose the simplest/free option

**Wait for database to be created** (takes 2-3 minutes)

---

### Step 2: Attach Database to Your App

```bash
fly postgres attach chatbot-auspost-db-prod --app chatbot-auspost-ai-support
```

This will:
- Create a `DATABASE_URL` secret automatically
- But we need `FLOOT_DATABASE_URL` instead

---

### Step 3: Get Connection String

```bash
# Connect to see the connection string
fly postgres connect -a chatbot-auspost-db-prod

# Or get it from secrets
fly secrets list -a chatbot-auspost-db-prod
```

**You'll see something like:**
```
DATABASE_URL=postgresql://postgres:password@chatbot-auspost-db-prod.internal:5432
```

---

### Step 4: Set FLOOT_DATABASE_URL Secret

```bash
# Get the connection string from above, then set it
fly secrets set FLOOT_DATABASE_URL="postgresql://postgres:password@chatbot-auspost-db-prod.internal:5432" -a chatbot-auspost-ai-support
```

**Important:** 
- Replace `password` with actual password from Step 3
- Use `.internal` hostname for internal Fly.io network (faster, free)
- Or use public hostname if needed

**To get the full connection string:**
```bash
# SSH into database app to get connection details
fly ssh console -a chatbot-auspost-db-prod
# Then check environment variables or connection info
```

---

### Step 5: Run Database Migrations

```bash
# Backup local env.json
cp env.json env.json.backup

# Edit env.json: Replace FLOOT_DATABASE_URL with Fly.io database connection string
# Then run:
npm run setup-db

# Restore local env.json
mv env.json.backup env.json
```

---

### Step 6: Create Admin User

```bash
# Edit env.json: Set FLOOT_DATABASE_URL to Fly.io database connection string
npm run create-user sub.subham9574@gmail.com 12345678 admin
# Restore env.json after
```

---

### Step 7: Set All Other Secrets

```bash
# Generate JWT secret
npm run generate-jwt

# Set all secrets
fly secrets set \
  JWT_SECRET="generated-secret" \
  GEMINI_API_KEY="your-gemini-api-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-gemini-api-key" \
  EMAIL_SERVICE_API_KEY="your-email-service-key" \
  MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0="your-email@example.com" \
  BREVO_API_KEY="your-brevo-api-key" \
  MAILERLITE_API_KEY="your-mailerlite-key" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_CHAT_ID="your-telegram-chat-id" \
  -a chatbot-auspost-ai-support
```

---

### Step 8: Deploy App

```bash
fly deploy -a chatbot-auspost-ai-support
```

---

## ✅ Cost Breakdown (100% Fly.io)

| Service | Cost |
|---------|------|
| App Hosting (1 VM) | **$0/month** ✅ |
| Unmanaged Postgres (1 node) | **$0/month** ✅ |
| HTTPS/SSL | **$0/month** ✅ |
| **TOTAL** | **$0/month** ✅ |

---

## 🔍 Getting Connection String Details

If you need to find the exact connection string:

```bash
# Method 1: Check database app secrets
fly secrets list -a chatbot-auspost-db-prod

# Method 2: SSH into database
fly ssh console -a chatbot-auspost-db-prod
# Then check: echo $DATABASE_URL

# Method 3: Check attached app secrets
fly secrets list -a chatbot-auspost-ai-support
# Look for DATABASE_URL (created by attach command)
```

**The connection string format is usually:**
```
postgresql://postgres:PASSWORD@chatbot-auspost-db-prod.internal:5432
```

Or for public access:
```
postgresql://postgres:PASSWORD@chatbot-auspost-db-prod.fly.dev:5432
```

---

## ⚠️ Important Notes

1. **Choose "Development" option** - This is FREE
2. **Don't choose "Production (High Availability)"** - That costs $38/month
3. **Unmanaged means** - You're responsible for backups
4. **Internal network** - Use `.internal` hostname for faster, free connections

---

## 🎯 Quick Command Sequence

```bash
# 1. Create database (choose Development/Free option)
fly postgres create --name chatbot-auspost-db-prod --region syd

# 2. Attach to app
fly postgres attach chatbot-auspost-db-prod --app chatbot-auspost-ai-support

# 3. Get connection string
fly secrets list -a chatbot-auspost-db-prod

# 4. Set FLOOT_DATABASE_URL (replace with actual connection string)
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a chatbot-auspost-ai-support

# 5. Run migrations (update env.json temporarily)
npm run setup-db

# 6. Create admin user (update env.json temporarily)
npm run create-user sub.subham9574@gmail.com 12345678 admin

# 7. Set all other secrets
fly secrets set JWT_SECRET="..." ... -a chatbot-auspost-ai-support

# 8. Deploy
fly deploy -a chatbot-auspost-ai-support
```

---

## ✅ Success Checklist

- [ ] Database created on Fly.io
- [ ] Database attached to app
- [ ] FLOOT_DATABASE_URL secret set
- [ ] Migrations run successfully
- [ ] Admin user created
- [ ] All secrets set
- [ ] App deployed
- [ ] App accessible and working
- [ ] Cost shows $0 in dashboard

---

**🎉 Everything runs on Fly.io - 100% FREE!**

