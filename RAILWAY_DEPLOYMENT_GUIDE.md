# Railway Deployment Guide

## Migration Summary

✅ **Backup Complete:**
- Data backup: `backup/flyio_data_backup_1767006414002.json` (4.3MB)
- Schema backup: `backup/flyio_schema_backup_1767006598159.sql` (4KB)
- Total records: 752 rows across 11 tables

**Data Exported:**
- 373 chats
- 332 messages
- 15 knowledge base entries
- 2 users
- 6 availability slots
- And more...

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended for easy deployment)

---

## Step 2: Create New Project on Railway

### Via Railway Dashboard:

1. **Create New Project:**
   - Click "New Project"
   - Select "Empty Project"

2. **Add PostgreSQL Database:**
   - Click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Wait for provisioning (takes ~30 seconds)

3. **Get Database Connection Details:**
   - Click on the PostgreSQL service
   - Go to "Connect" tab
   - Copy the `DATABASE_URL` (it looks like: `postgresql://postgres:password@host:port/railway`)
   - Save this for later!

---

## Step 3: Deploy Application from GitHub

1. **Connect GitHub Repository:**
   - In your Railway project, click "+ New"
   - Select "GitHub Repo"
   - Authorize Railway to access your GitHub
   - Select repository: `amdsubham/chatbotAIBased`
   - Railway will automatically detect it's a Node.js app

2. **Configure Build Settings:**
   - Railway will auto-detect `package.json`
   - Build command: `npm run build` (auto-detected)
   - Start command: `npm start` (auto-detected)

---

## Step 4: Set Environment Variables

In Railway Dashboard, go to your app service → Variables tab, add these:

```bash
# Database (use the DATABASE_URL from Step 2)
FLOOT_DATABASE_URL_PROD=postgresql://postgres:password@host:port/railway

# Node Environment
NODE_ENV=production
PORT=8080

# JWT Secret (keep your existing one)
JWT_SECRET=0b69424974323116d10474322c5e3948c9d7bb85c033fad79322632842c654c9

# AI APIs
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1=your-gemini-api-key

# Email Services
EMAIL_SERVICE_API_KEY=your-email-service-key
MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0=your-email@example.com
BREVO_API_KEY=your-brevo-api-key
MAILERLITE_API_KEY=your-mailerlite-key

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

**Important:** Replace the placeholder values with your actual API keys from `env.json`.

---

## Step 5: Restore Database Backup

### Option A: Using Provided Restore Script (Recommended)

1. **Install Railway CLI** (on your local machine):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to Your Project:**
   ```bash
   railway link
   # Select your project from the list
   ```

4. **Run the Restore Script:**
   ```bash
   npm run restore-to-railway
   ```

### Option B: Manual Restore via Web Interface

1. **Access Railway PostgreSQL:**
   - In Railway dashboard, click on PostgreSQL service
   - Click "Data" tab
   - Use the built-in SQL editor

2. **Copy and execute** the restoration script from `backup/restore-to-railway.js`

### Option C: Direct Database Connection

1. **Get connection string** from Railway PostgreSQL service

2. **Run restore script:**
   ```bash
   node backup/restore-to-railway.js
   ```

---

## Step 6: Run Database Migrations

After restoring data, run migrations to ensure schema is up-to-date:

```bash
# Via Railway CLI
railway run npm run setup-db:prod

# Or manually execute the schema from:
# database/migrations/001_initial_schema.sql
```

---

## Step 7: Verify Deployment

1. **Check Deployment Status:**
   - Go to Railway dashboard
   - Check if deployment succeeded (green checkmark)

2. **Get Your App URL:**
   - Click on your app service
   - Go to "Settings" tab
   - Under "Domains", click "Generate Domain"
   - Your app will be available at: `https://your-app.up.railway.app`

3. **Test the Application:**
   - Visit the generated URL
   - Try logging in with your existing credentials
   - Verify that all data is present

---

## Step 8: Update Application Settings

Update any hardcoded URLs in your app:

1. **Frontend URL references** (if any)
2. **API endpoints**
3. **Webhook URLs** (Telegram, email services, etc.)

---

## Step 9: Clean Up Fly.io (After Verification)

**⚠️ Only do this after confirming Railway deployment works!**

```bash
# Stop Fly.io apps
flyctl apps destroy chatbot-auspost-ai-support --yes
flyctl apps destroy chatbot-auspost-db-prod --yes

# Verify deletion
flyctl apps list
```

---

## Cost Comparison

| Service | Fly.io (Current) | Railway (New) |
|---------|-----------------|---------------|
| **Application** | $5.98/month | $5/month |
| **Database** | $35.78/month (MPG) | $5/month (included in plan) |
| **Storage** | $2.62/month | Included |
| **Total** | **$45.49/month** | **$10-15/month** |

**Savings: ~$30-35/month (70% reduction)**

---

## Troubleshooting

### Database Connection Issues:

```javascript
// Verify connection in Railway logs
console.log('DB URL:', process.env.FLOOT_DATABASE_URL_PROD);
```

### Build Failures:

- Check Railway build logs
- Ensure all dependencies are in `package.json`
- Verify Node version (should be 20.x)

### Migration Issues:

- Check if schema was created correctly
- Verify all tables exist
- Check for constraint violations

---

## Rollback Plan

If something goes wrong:

1. Fly.io is still running (don't delete until verified)
2. All backups are in `backup/` directory
3. Can restore to Fly.io if needed
4. GitHub repo has all code

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Update DNS (if using custom domain)
3. ✅ Monitor Railway logs for 24-48 hours
4. ✅ Delete Fly.io resources to save costs
5. ✅ Update documentation with new URLs

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/amdsubham/chatbotAIBased/issues

---

## Quick Deploy Checklist

- [ ] Railway account created
- [ ] Project created with PostgreSQL
- [ ] GitHub repo connected
- [ ] Environment variables set
- [ ] Database backup restored
- [ ] Migrations run
- [ ] App deployed successfully
- [ ] Domain generated
- [ ] Application tested
- [ ] Fly.io cleaned up (after verification)

