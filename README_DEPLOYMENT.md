# Deployment Guide

This document provides detailed instructions for deploying the Universal AI Support Chatbot System.

## Overview

The application can be deployed in two ways:

1. **Development**: Local development with hot reload
2. **Production**: Deployed to Fly.io cloud platform

## Architecture

- **Frontend**: React 19 with Vite
- **Backend**: Hono.js server with serverless-style endpoints
- **Database**: PostgreSQL
- **Deployment**: Single monolithic application (frontend + backend)

## Development Environment

See [SETUP.md](./SETUP.md) for detailed development setup instructions.

Quick start:

```bash
npm install
npm run setup-db
npm run dev
```

## Production Deployment (Fly.io)

### Prerequisites

1. **Fly.io Account**: Sign up at https://fly.io
2. **Fly CLI**: Install with `curl -L https://fly.io/install.sh | sh`
3. **PostgreSQL Database**: Can be created on Fly.io or use external provider

### Step-by-Step Deployment

#### 1. Initialize Fly.io App

```bash
# Login to Fly.io
fly auth login

# Initialize app (creates/updates fly.toml)
fly launch
```

When prompted:

- **App name**: Choose a unique name (e.g., `chatbot-auspost-ai-support`)
- **Region**: Select closest to your users
- **PostgreSQL**: Choose "Yes" to create a new database, or "No" if using external
- **Redis**: Choose "No" (not required)

#### 2. Set Up Database

**Option A: Fly.io PostgreSQL (Recommended)**

```bash
# Create PostgreSQL database
fly postgres create --name chatbot-db

# Attach to your app (this sets DATABASE_URL, but we need FLOOT_DATABASE_URL)
fly postgres attach chatbot-db --app your-app-name

# Get the connection string
fly postgres connect -a chatbot-db

# Set as secret (replace with actual connection string)
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a your-app-name
```

**Option B: External PostgreSQL**

If using Supabase, Railway, Neon, or another provider:

```bash
fly secrets set FLOOT_DATABASE_URL="postgresql://user:pass@host:5432/db" -a your-app-name
```

#### 3. Run Database Migrations

**Option A: From Local Machine**

```bash
# Temporarily update local env.json with Fly.io database URL
# Then run:
npm run setup-db
```

**Option B: From Fly.io Instance**

```bash
# SSH into instance
fly ssh console -a your-app-name

# Upload migration file (use fly sftp or copy-paste)
# Then run migration
psql $FLOOT_DATABASE_URL -f database/migrations/001_initial_schema.sql
```

#### 4. Set Environment Variables (Secrets)

Set all required secrets on Fly.io:

```bash
fly secrets set \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  GEMINI_API_KEY="your-gemini-api-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-gemini-api-key" \
  EMAIL_SERVICE_API_KEY="your-resend-api-key" \
  MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0="from@example.com" \
  BREVO_API_KEY="your-brevo-api-key" \
  MAILERLITE_API_KEY="your-mailerlite-api-key" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_CHAT_ID="your-telegram-chat-id" \
  -a your-app-name
```

**Note**: Replace `your-app-name` with your actual Fly.io app name.

#### 5. Deploy Application

```bash
# Deploy to Fly.io
fly deploy -a your-app-name

# Monitor deployment logs
fly logs -a your-app-name
```

#### 6. Verify Deployment

```bash
# Check app status
fly status -a your-app-name

# Open app in browser
fly open -a your-app-name

# Check logs for errors
fly logs -a your-app-name
```

### Configuration Files

#### fly.toml

The `fly.toml` file configures:

- App name and region
- Port (8080)
- HTTP service settings
- VM resources (1 CPU, 512MB RAM)
- Health checks

#### Dockerfile

The `Dockerfile`:

- Uses Node.js 20 Alpine
- Multi-stage build for optimization
- Copies necessary files for runtime
- Runs with `tsx server.ts`

### Scaling

To scale your application:

```bash
# Scale to 2 instances
fly scale count 2 -a your-app-name

# Scale memory
fly scale vm shared-cpu-1x --memory 1024 -a your-app-name

# Scale CPU
fly scale vm shared-cpu-2x -a your-app-name
```

### Monitoring

```bash
# View logs
fly logs -a your-app-name

# View metrics
fly metrics -a your-app-name

# SSH into instance
fly ssh console -a your-app-name
```

### Updating Secrets

```bash
# Update a single secret
fly secrets set JWT_SECRET="new-secret" -a your-app-name

# View all secrets (values hidden)
fly secrets list -a your-app-name
```

### Troubleshooting

#### Deployment Fails

```bash
# Check build logs
fly logs -a your-app-name

# Check app status
fly status -a your-app-name

# Restart app
fly apps restart your-app-name
```

#### Database Connection Issues

```bash
# Verify database is attached
fly postgres list

# Check database connection
fly postgres connect -a chatbot-db

# Verify FLOOT_DATABASE_URL is set
fly ssh console -a your-app-name
echo $FLOOT_DATABASE_URL
```

#### Port Issues

The app listens on port 8080 internally. Fly.io handles port mapping automatically. If you need to change it:

1. Update `fly.toml`:

```toml
[http_service]
  internal_port = 8080
```

2. Update `Dockerfile`:

```dockerfile
ENV PORT=8080
```

#### Build Errors

```bash
# Clear build cache
fly deploy --no-cache -a your-app-name

# Check Dockerfile syntax
docker build -t test .
```

### Cost Optimization

- **Auto-stop machines**: Enabled in `fly.toml` (machines stop when idle)
- **Min machines**: Set to 1 (always one running)
- **VM size**: Start with `shared-cpu-1x` (512MB RAM) - upgrade if needed

### Custom Domain

```bash
# Add custom domain
fly certs add yourdomain.com -a your-app-name

# Verify DNS records
fly certs show -a your-app-name
```

### Backup Strategy

For PostgreSQL database:

```bash
# Create backup
fly postgres backup create -a chatbot-db

# List backups
fly postgres backup list -a chatbot-db

# Restore backup
fly postgres backup restore <backup-id> -a chatbot-db
```

## Environment-Specific Configuration

### Development

- Uses `env.json` file
- Port: 3344 (or Vite dev server on 5173)
- Hot reload enabled
- Source maps available

### Production (Fly.io)

- Uses environment variables (secrets)
- Port: 8080 (internal)
- Optimized build
- Health checks enabled

## Security Considerations

1. **Never commit secrets**: `env.json` is in `.gitignore`
2. **Use Fly secrets**: Store sensitive data as Fly.io secrets
3. **HTTPS**: Enabled by default on Fly.io
4. **JWT Secret**: Generate strong random secret
5. **Database**: Use SSL connections for production

## Next Steps After Deployment

1. **Create Admin User**: Use login endpoint to create first admin
2. **Configure Settings**: Access admin dashboard to configure
3. **Set Up AI**: Verify Gemini API keys are working
4. **Test Widget**: Embed widget in test page
5. **Monitor**: Set up monitoring and alerts

## Support

- Fly.io Docs: https://fly.io/docs
- Fly.io Community: https://community.fly.io
- Application Issues: Check logs with `fly logs`

---

**Happy Deploying!** 🚀
