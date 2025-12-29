# Railway Environment Variables Setup

## Quick Reference - Copy These to Railway

Once you have your Railway PostgreSQL DATABASE_URL, set these environment variables in your **app service** (not the database service):

### Navigate to:
Railway Dashboard → Your App Service → Variables Tab → Raw Editor

---

## Copy and Paste This (Update the values):

```bash
# ============================================
# DATABASE CONNECTION
# ============================================
# IMPORTANT: Use the DATABASE_URL from your PostgreSQL service
# Go to PostgreSQL service → Variables tab → Copy DATABASE_URL
FLOOT_DATABASE_URL_PROD=postgresql://postgres:PASSWORD@HOST:PORT/railway

# Alternative: If above doesn't work, use this format:
# DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway

# ============================================
# APPLICATION SETTINGS
# ============================================
NODE_ENV=production
PORT=8080

# ============================================
# AUTHENTICATION
# ============================================
# Keep your existing JWT secret (DO NOT CHANGE THIS!)
JWT_SECRET=0b69424974323116d10474322c5e3948c9d7bb85c033fad79322632842c654c9

# ============================================
# AI API KEYS
# ============================================
# Copy from your env.json file
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1=your-gemini-api-key

# ============================================
# EMAIL SERVICES
# ============================================
# Copy from your env.json file
EMAIL_SERVICE_API_KEY=your-email-service-key
MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0=your-email@example.com
BREVO_API_KEY=your-brevo-api-key

# ============================================
# MAILERLITE
# ============================================
# Copy from your env.json file
MAILERLITE_API_KEY=your-mailerlite-api-key

# ============================================
# TELEGRAM NOTIFICATIONS
# ============================================
# Copy from your env.json file
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

---

## Important Notes:

1. **DATABASE_URL Priority:**
   - MUST use the exact DATABASE_URL from your Railway PostgreSQL service
   - Replace the placeholder: `postgresql://postgres:PASSWORD@HOST:PORT/railway`
   - This is the MOST IMPORTANT variable!

2. **JWT_SECRET:**
   - DO NOT CHANGE THIS! It must match Fly.io's secret
   - Changing it will invalidate all existing sessions

3. **API Keys:**
   - These are copied from your local `env.json`
   - If you've rotated any keys, update them here

4. **After Adding Variables:**
   - Click "Save"
   - Railway will automatically redeploy your app
   - Wait 2-3 minutes for deployment to complete

---

## Verification Checklist:

After setting variables:
- [ ] DATABASE_URL is set correctly
- [ ] JWT_SECRET matches your original (don't change!)
- [ ] All API keys are present
- [ ] Click "Save" button
- [ ] Wait for automatic redeployment
- [ ] Check logs for any errors

---

## Next Step After This:

Once environment variables are set and app is deployed, you'll need to:
1. Restore the database backup
2. Generate a domain for your app
3. Test the application

See `RAILWAY_DEPLOYMENT_GUIDE.md` for complete instructions.
