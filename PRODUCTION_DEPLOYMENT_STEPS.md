# Production Deployment Steps - Complete Guide

This is a comprehensive, step-by-step guide to deploy your chatbot application to Fly.io production environment.

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 20.x installed locally
- [ ] Git installed and your code committed
- [ ] Fly.io account (sign up at https://fly.io if needed)
- [ ] All API keys ready (Gemini, Email services, Telegram, etc.)
- [ ] Database connection string (if using external database)

---

## Step 1: Install Fly CLI

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Add to PATH (if not automatically added)
export FLYCTL_INSTALL="/home/$USER/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Verify installation
fly version
```

**For macOS users:** The installer usually adds it to your PATH automatically. If not, add it to your `~/.zshrc` or `~/.bash_profile`.

---

## Step 2: Login to Fly.io

```bash
# Login to Fly.io
fly auth login

# This will open a browser window for authentication
# Follow the prompts to complete login

# Verify you're logged in
fly auth whoami
```

---

## Step 3: Initialize Fly.io App

```bash
# Navigate to your project directory
cd "/Users/subhamroutray/Documents/Projects/Chatbot AusPost AI Support System"

# Initialize Fly.io app
fly launch
```

**When prompted, answer:**

1. **App name:** `chatbot-auspost-ai-support` (or your preferred name)
   - Must be globally unique
   - Use lowercase letters, numbers, and hyphens only

2. **Region:** Choose closest to your users
   - Examples: `iad` (Washington, DC), `ord` (Chicago), `sjc` (San Jose)
   - Type the region code when prompted

3. **PostgreSQL:** Choose **"No"** (we'll set it up separately)
   - We'll create the database in the next step

4. **Redis:** Choose **"No"**

5. **Deploy now?** Choose **"No"** (we need to configure secrets first)

This creates/updates `fly.toml` configuration file.

---

## Step 4: Set Up PostgreSQL Database

You have two options:

### Option A: Fly.io PostgreSQL (Recommended for Simplicity)

```bash
# Create a PostgreSQL database
fly postgres create --name chatbot-db

# When prompted:
# - Region: Choose same region as your app (e.g., iad)
# - VM size: shared-cpu-1x (free tier) or shared-cpu-2x (paid)
# - Volume size: 3GB (minimum, can upgrade later)

# Attach database to your app
fly postgres attach chatbot-db --app chatbot-auspost-ai-support

# This automatically sets DATABASE_URL, but we need FLOOT_DATABASE_URL
# Get the connection string
fly postgres connect -a chatbot-db

# Copy the connection string from the output, then set it as a secret:
fly secrets set FLOOT_DATABASE_URL="postgresql://postgres:password@host:5432/database" -a chatbot-auspost-ai-support
```

**To get the connection string:**
```bash
# List all secrets to see DATABASE_URL
fly secrets list -a chatbot-db

# Or get it from the postgres app
fly postgres connect -a chatbot-db
# The connection string will be shown in the output
```

### Option B: External PostgreSQL (Supabase, Railway, Neon, etc.)

If using an external provider:

1. **Get connection string** from your provider's dashboard
2. **Set it as a secret:**
```bash
fly secrets set FLOOT_DATABASE_URL="postgresql://user:password@host:5432/dbname" -a chatbot-auspost-ai-support
```

**Recommended Providers:**
- **Supabase:** https://supabase.com (Free tier: 500MB database)
- **Railway:** https://railway.app (Free tier: $5 credit/month)
- **Neon:** https://neon.tech (Free tier: 3GB database)

---

## Step 5: Run Database Migrations

You need to run the database migrations on your production database.

### Method 1: From Local Machine (Easier)

```bash
# Temporarily backup your local env.json
cp env.json env.json.backup

# Update FLOOT_DATABASE_URL in env.json with production database URL
# (Edit env.json and replace FLOOT_DATABASE_URL with production connection string)

# Run migrations
npm run setup-db

# Restore your local env.json
mv env.json.backup env.json
```

### Method 2: From Fly.io Instance (Alternative)

```bash
# SSH into your Fly.io app
fly ssh console -a chatbot-auspost-ai-support

# Once inside, you can run commands
# But you'll need to upload the migration file first
# This method is more complex, so Method 1 is recommended
```

---

## Step 6: Set All Environment Variables (Secrets)

Set all required secrets on Fly.io. **Replace the placeholder values with your actual keys:**

```bash
fly secrets set \
  JWT_SECRET="your-jwt-secret-here-generate-with-npm-run-generate-jwt" \
  GEMINI_API_KEY="your-gemini-api-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-gemini-api-key" \
  EMAIL_SERVICE_API_KEY="your-resend-api-key" \
  MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0="subham@primecaves.com" \
  BREVO_API_KEY="your-brevo-api-key" \
  MAILERLITE_API_KEY="your-mailerlite-api-key" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_CHAT_ID="your-telegram-chat-id" \
  -a chatbot-auspost-ai-support
```

**Important Notes:**
- Generate a new JWT_SECRET for production (don't use the development one):
  ```bash
  npm run generate-jwt
  # Copy the output and use it in the secrets command above
  ```

- Replace all placeholder values with your actual API keys
- Secrets are encrypted and stored securely by Fly.io
- You can set them one at a time if preferred:
  ```bash
  fly secrets set JWT_SECRET="your-secret" -a chatbot-auspost-ai-support
  fly secrets set GEMINI_API_KEY="your-key" -a chatbot-auspost-ai-support
  # ... etc
  ```

**Verify secrets are set:**
```bash
fly secrets list -a chatbot-auspost-ai-support
```

---

## Step 7: Create Admin User in Production Database

You need to create an admin user in your production database:

```bash
# Temporarily update env.json with production database URL
cp env.json env.json.backup

# Edit env.json and set FLOOT_DATABASE_URL to production database

# Create admin user
npm run create-user sub.subham9574@gmail.com 12345678 admin

# Restore local env.json
mv env.json.backup env.json
```

**Or manually via SQL:**
```bash
# Connect to production database
fly postgres connect -a chatbot-db

# Then run SQL:
# INSERT INTO users (email, display_name, role) VALUES ('sub.subham9574@gmail.com', 'Admin', 'admin');
# INSERT INTO user_passwords (user_id, password_hash) 
# VALUES ((SELECT id FROM users WHERE email = 'sub.subham9574@gmail.com'), '$2a$10$hashedpassword...');
```

---

## Step 8: Review fly.toml Configuration

Check that `fly.toml` is correctly configured:

```bash
# View the configuration
cat fly.toml
```

**Key things to verify:**
- `app = "chatbot-auspost-ai-support"` (matches your app name)
- `primary_region = "iad"` (or your chosen region)
- `[http_service]` section is present
- Port is set to 8080

If you need to edit it:
```bash
# Edit fly.toml
nano fly.toml
# or
code fly.toml
```

---

## Step 9: Deploy the Application

```bash
# Deploy to Fly.io
fly deploy -a chatbot-auspost-ai-support

# This will:
# 1. Build the Docker image
# 2. Push it to Fly.io
# 3. Deploy to your app
# 4. Start the application
```

**During deployment, you'll see:**
- Building Docker image
- Uploading to Fly.io
- Deploying application
- Health checks

**If deployment fails:**
- Check the error messages
- Verify all secrets are set
- Check `fly.toml` configuration
- Review logs: `fly logs -a chatbot-auspost-ai-support`

---

## Step 10: Monitor Deployment

```bash
# Watch deployment logs in real-time
fly logs -a chatbot-auspost-ai-support

# Check app status
fly status -a chatbot-auspost-ai-support

# View app info
fly info -a chatbot-auspost-ai-support
```

**Look for:**
- ✅ "Deployed successfully"
- ✅ Health checks passing
- ✅ No error messages
- ✅ App is running

---

## Step 11: Verify Deployment

```bash
# Open your app in browser
fly open -a chatbot-auspost-ai-support

# Or visit: https://chatbot-auspost-ai-support.fly.dev
```

**Test the following:**
1. ✅ Homepage loads
2. ✅ Login page works (`/login`)
3. ✅ Can log in with admin credentials
4. ✅ Admin dashboard loads (`/admin`)
5. ✅ API endpoints respond (`/_api/auth/session`)

**Test API endpoint:**
```bash
curl https://chatbot-auspost-ai-support.fly.dev/_api/auth/session
# Should return: {"error":"Not authenticated"} (which is correct)
```

---

## Step 12: Set Up Custom Domain (Optional)

If you want a custom domain:

```bash
# Add your domain
fly certs add yourdomain.com -a chatbot-auspost-ai-support

# Follow DNS instructions shown
# Add the CNAME record to your DNS provider

# Verify certificate
fly certs show -a chatbot-auspost-ai-support
```

---

## Step 13: Configure Scaling (Optional)

```bash
# Scale to 2 instances for high availability
fly scale count 2 -a chatbot-auspost-ai-support

# Scale memory if needed
fly scale vm shared-cpu-1x --memory 1024 -a chatbot-auspost-ai-support

# View current scale
fly scale show -a chatbot-auspost-ai-support
```

---

## Step 14: Set Up Monitoring (Optional)

```bash
# View metrics
fly metrics -a chatbot-auspost-ai-support

# View logs
fly logs -a chatbot-auspost-ai-support

# SSH into instance for debugging
fly ssh console -a chatbot-auspost-ai-support
```

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Application is accessible via Fly.io URL
- [ ] Login works with production credentials
- [ ] Admin dashboard loads and functions
- [ ] Database connections work
- [ ] API endpoints respond correctly
- [ ] No errors in logs
- [ ] Health checks are passing
- [ ] SSL/HTTPS is working (automatic on Fly.io)

---

## Troubleshooting Common Issues

### Issue: Deployment fails with "Build failed"
**Solution:**
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check build logs: `fly logs -a chatbot-auspost-ai-support`

### Issue: "Database connection failed"
**Solution:**
- Verify `FLOOT_DATABASE_URL` secret is set correctly
- Check database is accessible from Fly.io
- Verify database migrations ran successfully

### Issue: "Invalid JWT secret"
**Solution:**
- Generate new JWT secret: `npm run generate-jwt`
- Update secret: `fly secrets set JWT_SECRET="new-secret" -a chatbot-auspost-ai-support`
- Redeploy: `fly deploy -a chatbot-auspost-ai-support`

### Issue: "Port already in use"
**Solution:**
- Check `fly.toml` port configuration
- Verify no conflicts with other services

### Issue: "Cannot connect to database"
**Solution:**
- For Fly.io PostgreSQL: Check database is running: `fly status -a chatbot-db`
- For external: Verify firewall allows Fly.io IPs
- Check connection string format

---

## Useful Commands Reference

```bash
# View app status
fly status -a chatbot-auspost-ai-support

# View logs
fly logs -a chatbot-auspost-ai-support

# SSH into instance
fly ssh console -a chatbot-auspost-ai-support

# View secrets (values hidden)
fly secrets list -a chatbot-auspost-ai-support

# Update a secret
fly secrets set KEY=value -a chatbot-auspost-ai-support

# Restart app
fly apps restart chatbot-auspost-ai-support

# Scale app
fly scale count 2 -a chatbot-auspost-ai-support

# View metrics
fly metrics -a chatbot-auspost-ai-support

# Open app in browser
fly open -a chatbot-auspost-ai-support

# Redeploy
fly deploy -a chatbot-auspost-ai-support

# Rollback to previous version
fly releases -a chatbot-auspost-ai-support
fly releases rollback <release-id> -a chatbot-auspost-ai-support
```

---

## Cost Estimation

**Fly.io Free Tier:**
- 3 shared-cpu-1x VMs with 256MB RAM each
- 3GB persistent volume storage
- 160GB outbound data transfer

**Typical Monthly Cost (if exceeding free tier):**
- App: ~$5-10/month (1 shared-cpu-1x VM, 512MB RAM)
- PostgreSQL: ~$5-15/month (if using Fly.io PostgreSQL)
- **Total: ~$10-25/month**

**To minimize costs:**
- Use external free PostgreSQL (Supabase, Neon)
- Use shared-cpu-1x VMs
- Enable auto-stop machines (already configured in fly.toml)

---

## Security Checklist

- [ ] JWT_SECRET is strong and unique (not the dev secret)
- [ ] All API keys are valid and have correct permissions
- [ ] Database uses SSL connections
- [ ] HTTPS is enabled (automatic on Fly.io)
- [ ] Secrets are stored in Fly.io (not in code)
- [ ] Admin credentials are secure
- [ ] Database is not publicly accessible (Firewall rules)

---

## Next Steps After Deployment

1. **Test all features:**
   - Create a chat
   - Send messages
   - Test AI responses
   - Test admin functions

2. **Set up backups:**
   ```bash
   # For Fly.io PostgreSQL
   fly postgres backup create -a chatbot-db
   ```

3. **Monitor performance:**
   - Check metrics regularly
   - Review logs for errors
   - Monitor database usage

4. **Update documentation:**
   - Note production URL
   - Document any custom configurations

---

## Quick Reference: Complete Deployment Command Sequence

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Initialize app
fly launch

# 4. Create database (if using Fly.io PostgreSQL)
fly postgres create --name chatbot-db
fly postgres attach chatbot-db --app chatbot-auspost-ai-support

# 5. Set database URL secret
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a chatbot-auspost-ai-support

# 6. Run migrations (update env.json temporarily, then run)
npm run setup-db

# 7. Set all secrets
fly secrets set JWT_SECRET="..." GEMINI_API_KEY="..." ... -a chatbot-auspost-ai-support

# 8. Create admin user (update env.json temporarily, then run)
npm run create-user email@example.com password admin

# 9. Deploy
fly deploy -a chatbot-auspost-ai-support

# 10. Verify
fly open -a chatbot-auspost-ai-support
fly logs -a chatbot-auspost-ai-support
```

---

**🎉 Congratulations! Your application is now deployed to production!**

For detailed information, refer to:
- [README_DEPLOYMENT.md](./README_DEPLOYMENT.md) - Detailed deployment guide
- [SETUP.md](./SETUP.md) - General setup information
- [Fly.io Docs](https://fly.io/docs) - Official Fly.io documentation

