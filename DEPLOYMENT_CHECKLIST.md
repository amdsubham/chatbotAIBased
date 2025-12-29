# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] All environment variables documented
- [ ] Database schema migration script ready
- [ ] JWT secret generated
- [ ] API keys obtained (Gemini, Email services, Telegram)
- [ ] Database created and accessible
- [ ] Local development environment working

## Development Setup

- [ ] Dependencies installed (`npm install`)
- [ ] `env.json` file created with all required variables
- [ ] JWT secret generated (`npm run generate-jwt`)
- [ ] Database created
- [ ] Database migrations run (`npm run setup-db`)
- [ ] Development server runs successfully (`npm run dev`)
- [ ] Production build works (`npm run build && npm start`)

## Fly.io Deployment

### Initial Setup

- [ ] Fly.io account created
- [ ] Fly CLI installed (`curl -L https://fly.io/install.sh | sh`)
- [ ] Logged into Fly.io (`fly auth login`)
- [ ] App initialized (`fly launch`)
- [ ] App name chosen and `fly.toml` configured

### Database Setup

- [ ] PostgreSQL database created on Fly.io OR external database configured
- [ ] Database connection string obtained
- [ ] `FLOOT_DATABASE_URL` secret set on Fly.io
- [ ] Database migrations run successfully
- [ ] Database connection tested

### Environment Variables

- [ ] `FLOOT_DATABASE_URL` set
- [ ] `JWT_SECRET` set (strong random value)
- [ ] `GEMINI_API_KEY` set
- [ ] `GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1` set
- [ ] `EMAIL_SERVICE_API_KEY` set (if using email)
- [ ] `MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0` set (if using MailerSend)
- [ ] `BREVO_API_KEY` set (if using Brevo)
- [ ] `MAILERLITE_API_KEY` set (if using MailerLite)
- [ ] `TELEGRAM_BOT_TOKEN` set (if using Telegram)
- [ ] `TELEGRAM_CHAT_ID` set (if using Telegram)

### Deployment

- [ ] Code committed to git
- [ ] `fly.toml` configured correctly
- [ ] `Dockerfile` present and correct
- [ ] `.dockerignore` configured
- [ ] Deployment successful (`fly deploy`)
- [ ] No errors in logs (`fly logs`)

### Post-Deployment Verification

- [ ] App accessible via Fly.io URL (`fly open`)
- [ ] Health check passing
- [ ] API endpoints responding (`/_api/auth/session`)
- [ ] Frontend loading correctly
- [ ] Database queries working
- [ ] Admin login functional
- [ ] Chat widget embeddable
- [ ] AI responses working (if configured)
- [ ] Email notifications working (if configured)
- [ ] Telegram notifications working (if configured)

## Testing Checklist

### Core Functionality

- [ ] User can create chat
- [ ] Messages can be sent
- [ ] Admin can view chats
- [ ] Admin can reply to chats
- [ ] AI auto-response working (if enabled)
- [ ] Chat status can be updated
- [ ] Knowledge base CRUD operations
- [ ] Shortcut messages working
- [ ] Availability slots configured

### Admin Dashboard

- [ ] Chat list loads
- [ ] Filters work correctly
- [ ] Chat detail view works
- [ ] Real-time updates working
- [ ] Settings can be updated
- [ ] Knowledge base management works

### Widget

- [ ] Widget loads on embed page
- [ ] Widget can send messages
- [ ] Widget receives messages
- [ ] Image upload works
- [ ] Typing indicators work
- [ ] Online/offline status works

## Monitoring

- [ ] Logs accessible (`fly logs`)
- [ ] Metrics visible (`fly metrics`)
- [ ] Error tracking set up (if applicable)
- [ ] Uptime monitoring configured (if applicable)

## Security

- [ ] Secrets not committed to git
- [ ] `env.json` in `.gitignore`
- [ ] HTTPS enabled (automatic on Fly.io)
- [ ] Database uses SSL (if external)
- [ ] JWT secret is strong and unique
- [ ] API keys are valid and have correct permissions

## Documentation

- [ ] README updated
- [ ] SETUP.md reviewed
- [ ] Deployment steps documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide available

## Rollback Plan

- [ ] Know how to rollback (`fly releases` and `fly releases rollback`)
- [ ] Database backup strategy in place
- [ ] Previous working version identified

## Post-Launch

- [ ] Monitor logs for first 24 hours
- [ ] Check error rates
- [ ] Verify all integrations working
- [ ] Test from different locations/devices
- [ ] Performance metrics acceptable
- [ ] User feedback collected

---

## Quick Commands Reference

```bash
# Development
npm install
npm run setup-db
npm run dev

# Production Build
npm run build
npm start

# Fly.io
fly auth login
fly launch
fly secrets set KEY=value -a app-name
fly deploy -a app-name
fly logs -a app-name
fly status -a app-name
fly ssh console -a app-name
```

---

**Check off each item as you complete it!** ✅

