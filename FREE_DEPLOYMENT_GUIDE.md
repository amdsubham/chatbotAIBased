# Complete FREE Deployment Guide - Fly.io (Zero Cost)

This guide will help you deploy your chatbot to Fly.io **completely FREE** - $0/month.

---

## ✅ What You'll Get (100% FREE)

- ✅ App hosting on Fly.io (free tier)
- ✅ Database on Supabase (free tier)
- ✅ HTTPS/SSL (automatic, free)
- ✅ **Total Cost: $0/month**

---

## Step-by-Step FREE Deployment

### Step 1: Set Up FREE Database (Supabase)

#### 1.1 Create Supabase Account
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub/Google/Email (FREE)
4. Verify your email

#### 1.2 Create New Project
1. Click **"New Project"**
2. **Organization**: Create new or use existing
3. **Name**: `chatbot-auspost-db` (or any name)
4. **Database Password**: Create a strong password (save it!)
5. **Region**: Choose closest to you (e.g., Southeast Asia)
6. **Pricing Plan**: Free (default)
7. Click **"Create new project"**

Wait 2-3 minutes for project to be ready.

#### 1.3 Get Connection String
1. Go to **Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Find **URI** tab
4. Copy the connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
5. **Replace `[YOUR-PASSWORD]`** with your actual database password

**Example:**
```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

### Step 2: Set Database Secret on Fly.io

```bash
# Replace with your actual Supabase connection string
fly secrets set FLOOT_DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.xxxxx.supabase.co:5432/postgres" -a chatbot-auspost-ai-support
```

**Important:** Replace:
- `YOUR-PASSWORD` with your Supabase database password
- `xxxxx` with your actual Supabase project reference

**Verify it's set:**
```bash
fly secrets list -a chatbot-auspost-ai-support
# You should see FLOOT_DATABASE_URL listed
```

---

### Step 3: Run Database Migrations

```bash
# Backup your local env.json
cp env.json env.json.backup

# Edit env.json - Replace FLOOT_DATABASE_URL with Supabase connection string
# Open env.json and update FLOOT_DATABASE_URL

# Run migrations
npm run setup-db

# Restore your local env.json
mv env.json.backup env.json
```

**What this does:**
- Creates all database tables
- Sets up indexes
- Creates default settings

---

### Step 4: Create Admin User in Production Database

```bash
# Backup local env.json again
cp env.json env.json.backup

# Edit env.json - Set FLOOT_DATABASE_URL to Supabase connection string

# Create admin user
npm run create-user sub.subham9574@gmail.com 12345678 admin

# Restore local env.json
mv env.json.backup env.json
```

---

### Step 5: Set All Other Secrets on Fly.io

```bash
# Generate production JWT secret
npm run generate-jwt
# Copy the output - you'll use it below

# Set all secrets (replace values with your actual keys)
fly secrets set \
  JWT_SECRET="paste-generated-secret-here" \
  GEMINI_API_KEY="your-gemini-api-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-gemini-api-key" \
  EMAIL_SERVICE_API_KEY="your-resend-api-key" \
  MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0="your-email@example.com" \
  BREVO_API_KEY="your-brevo-api-key" \
  MAILERLITE_API_KEY="your-mailerlite-key" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_CHAT_ID="your-telegram-chat-id" \
  -a chatbot-auspost-ai-support
```

**Verify secrets:**
```bash
fly secrets list -a chatbot-auspost-ai-support
```

---

### Step 6: Verify fly.toml Configuration (Already Correct!)

Your `fly.toml` is already configured for free tier:
- ✅ 1 VM (free tier allows 3)
- ✅ 512MB RAM (free tier allows 256MB × 3 = 768MB)
- ✅ Shared CPU (free)
- ✅ Auto-stop enabled (saves resources)

**No changes needed!**

---

### Step 7: Deploy to Fly.io

```bash
# Deploy your app
fly deploy -a chatbot-auspost-ai-support
```

**This will:**
1. Build Docker image
2. Upload to Fly.io
3. Deploy your app
4. Start the application

**Wait 3-5 minutes** for deployment to complete.

---

### Step 8: Monitor Deployment

```bash
# Watch logs in real-time
fly logs -a chatbot-auspost-ai-support

# Check app status
fly status -a chatbot-auspost-ai-support

# Open app in browser
fly open -a chatbot-auspost-ai-support
```

**Your app URL will be:**
```
https://chatbot-auspost-ai-support.fly.dev
```

---

### Step 9: Verify Everything Works

1. **Homepage**: Visit `https://chatbot-auspost-ai-support.fly.dev`
2. **Login**: Visit `https://chatbot-auspost-ai-support.fly.dev/login`
   - Email: `sub.subham9574@gmail.com`
   - Password: `12345678`
3. **Admin Dashboard**: Should redirect after login
4. **API**: Test `https://chatbot-auspost-ai-support.fly.dev/_api/auth/session`

---

## ✅ Cost Breakdown

| Service | Provider | Cost |
|---------|----------|------|
| App Hosting | Fly.io | **$0/month** ✅ |
| Database | Supabase | **$0/month** ✅ |
| HTTPS/SSL | Fly.io | **$0/month** ✅ |
| **TOTAL** | | **$0/month** ✅ |

---

## 🎯 Staying Within Free Tier

### Fly.io Free Tier Limits:
- ✅ **3 VMs** (you're using 1) - Safe!
- ✅ **160GB data transfer/month** - Plenty for a chatbot
- ✅ **3GB storage** - More than enough
- ✅ **Shared CPU** - Free

### Supabase Free Tier Limits:
- ✅ **500MB database** - Enough for thousands of chats
- ✅ **2GB bandwidth/month** - Plenty
- ✅ **Unlimited API requests** - Perfect!

**You'll stay FREE as long as you:**
- Don't exceed 3 VMs (you're using 1)
- Don't exceed 160GB transfer (unlikely)
- Don't exceed 500MB database (manageable)

---

## 🔍 Monitoring Usage (Stay FREE)

### Check Fly.io Usage:
```bash
# View dashboard
fly dashboard
# Or visit: https://fly.io/dashboard
```

### Check Supabase Usage:
1. Go to Supabase dashboard
2. Check **Usage** tab
3. Monitor database size and bandwidth

---

## 🚨 Important: Avoid These (They Cost Money)

### ❌ DON'T:
1. **Managed Postgres (fly mpg)** - $38/month
2. **Scale beyond 3 VMs** - Costs money
3. **Increase RAM beyond free tier** - Costs money
4. **Exceed 160GB transfer** - Costs money

### ✅ DO:
1. **Use external database** (Supabase) - FREE
2. **Keep 1 VM** - FREE
3. **Use auto-stop** - Already configured ✅
4. **Monitor usage** - Stay within limits

---

## 📋 Quick Command Reference

```bash
# Set database secret
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a chatbot-auspost-ai-support

# Set all secrets
fly secrets set JWT_SECRET="..." GEMINI_API_KEY="..." ... -a chatbot-auspost-ai-support

# Deploy
fly deploy -a chatbot-auspost-ai-support

# View logs
fly logs -a chatbot-auspost-ai-support

# Check status
fly status -a chatbot-auspost-ai-support

# Open app
fly open -a chatbot-auspost-ai-support

# View secrets
fly secrets list -a chatbot-auspost-ai-support
```

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] App is accessible at `https://chatbot-auspost-ai-support.fly.dev`
- [ ] Login page works
- [ ] Can log in with admin credentials
- [ ] Admin dashboard loads
- [ ] Database connections work
- [ ] No errors in logs
- [ ] Cost shows $0 in Fly.io dashboard

---

## 💡 Troubleshooting

### Issue: Deployment fails
```bash
# Check logs
fly logs -a chatbot-auspost-ai-support

# Check status
fly status -a chatbot-auspost-ai-support

# Redeploy
fly deploy -a chatbot-auspost-ai-support
```

### Issue: Database connection fails
- Verify `FLOOT_DATABASE_URL` secret is set correctly
- Check Supabase connection string format
- Ensure database password is correct

### Issue: Can't log in
- Verify admin user was created in production database
- Check database migrations ran successfully
- Verify JWT_SECRET is set

---

## ✅ Final Summary

**To deploy FREE on Fly.io:**

1. ✅ Use Supabase for database (FREE)
2. ✅ Set `FLOOT_DATABASE_URL` secret
3. ✅ Run migrations
4. ✅ Create admin user
5. ✅ Set all secrets
6. ✅ Deploy app
7. ✅ **Total Cost: $0/month**

**Your app will be live at:**
```
https://chatbot-auspost-ai-support.fly.dev
```

---

**🎉 You're all set! Follow these steps and you'll have a FREE production deployment!**

