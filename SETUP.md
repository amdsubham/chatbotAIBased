# Setup Guide - Universal AI Support Chatbot System

This guide will help you set up the chatbot application for both **development** and **production** (Fly.io) environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Setup (Fly.io)](#production-setup-flyio)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)

---

## Prerequisites

- **Node.js** 20.x or higher
- **npm** or **pnpm** package manager
- **PostgreSQL** database (local or remote)
- **Git** (for version control)

### Optional for Production:

- **Fly.io account** (for deployment)
- **Fly CLI** installed (`curl -L https://fly.io/install.sh | sh`)

---

## Development Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd "Chatbot AusPost AI Support System"

# Install dependencies
npm install
# OR
pnpm install
```

### 2. Set Up Environment Variables

Create an `env.json` file in the root directory (you can copy from the example structure below):

```json
{
  "FLOOT_DATABASE_URL": "postgresql://user:password@localhost:5432/chatbot_db",
  "JWT_SECRET": "your-generated-jwt-secret",
  "GEMINI_API_KEY": "your-gemini-api-key",
  "GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1": "your-gemini-api-key",
  "EMAIL_SERVICE_API_KEY": "your-resend-api-key",
  "MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0": "from@example.com",
  "BREVO_API_KEY": "your-brevo-api-key",
  "MAILERLITE_API_KEY": "your-mailerlite-api-key",
  "TELEGRAM_BOT_TOKEN": "your-telegram-bot-token",
  "TELEGRAM_CHAT_ID": "your-telegram-chat-id"
}
```

### 3. Generate JWT Secret

Generate a secure JWT secret:

```bash
npm run generate-jwt
```

Copy the generated secret and add it to your `env.json` file as `JWT_SECRET`.

### 4. Set Up Database

#### Option A: Using Local PostgreSQL

1. Create a PostgreSQL database:

```bash
createdb chatbot_db
# OR using psql
psql -U postgres -c "CREATE DATABASE chatbot_db;"
```

2. Update `FLOOT_DATABASE_URL` in `env.json`:

```json
"FLOOT_DATABASE_URL": "postgresql://postgres:password@localhost:5432/chatbot_db"
```

3. Run the database migration:

```bash
npm run setup-db
```

#### Option B: Using Remote PostgreSQL (e.g., Supabase, Railway, Neon)

1. Get your database connection string from your provider
2. Update `FLOOT_DATABASE_URL` in `env.json`
3. Run the database migration:

```bash
npm run setup-db
```

### 5. Run Development Server

```bash
# Start development server (with hot reload)
npm run dev

# The app will be available at http://localhost:5173 (Vite default port)
```

### 6. Build and Run Production Build Locally

```bash
# Build the application
npm run build

# Start the production server
npm start

# The app will be available at http://localhost:3344
```

---

## Production Setup (Fly.io)

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
fly auth login
```

### 3. Create a Fly.io App

```bash
# Initialize Fly.io app (this will create fly.toml if it doesn't exist)
fly launch

# Follow the prompts:
# - App name: chatbot-auspost-ai-support (or your preferred name)
# - Region: Choose closest to your users (e.g., iad, ord, sjc)
# - PostgreSQL: Yes (or attach existing database)
# - Redis: No (unless needed)
```

### 4. Set Up PostgreSQL Database on Fly.io

If you didn't create a database during `fly launch`:

```bash
# Create a PostgreSQL database
fly postgres create --name chatbot-db

# Attach it to your app
fly postgres attach chatbot-db --app chatbot-auspost-ai-support
```

This will automatically set the `DATABASE_URL` environment variable. However, since the app uses `FLOOT_DATABASE_URL`, you'll need to set it manually:

```bash
# Get the database URL
fly postgres connect -a chatbot-db

# Set the environment variable
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a chatbot-auspost-ai-support
```

### 5. Set Environment Variables (Secrets)

Set all required secrets on Fly.io:

```bash
fly secrets set \
  JWT_SECRET="your-jwt-secret" \
  GEMINI_API_KEY="your-gemini-api-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-gemini-api-key" \
  EMAIL_SERVICE_API_KEY="your-resend-api-key" \
  MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0="from@example.com" \
  BREVO_API_KEY="your-brevo-api-key" \
  MAILERLITE_API_KEY="your-mailerlite-api-key" \
  TELEGRAM_BOT_TOKEN="your-telegram-bot-token" \
  TELEGRAM_CHAT_ID="your-telegram-chat-id" \
  -a chatbot-auspost-ai-support
```

**Note:** Since the app uses `env.json` for local development, you'll need to modify `loadEnv.js` to also check for environment variables, or create a wrapper. For now, set secrets directly on Fly.io.

### 6. Run Database Migration on Fly.io

```bash
# SSH into the Fly.io instance
fly ssh console -a chatbot-auspost-ai-support

# Once inside, run the migration
# You'll need to upload the migration file or run it directly
```

Alternatively, run migrations locally pointing to the Fly.io database:

```bash
# Temporarily update your local env.json with Fly.io database URL
# Then run:
npm run setup-db
```

### 7. Deploy to Fly.io

```bash
# Deploy the application
fly deploy -a chatbot-auspost-ai-support

# Monitor the deployment
fly logs -a chatbot-auspost-ai-support
```

### 8. Verify Deployment

```bash
# Check app status
fly status -a chatbot-auspost-ai-support

# Open the app in browser
fly open -a chatbot-auspost-ai-support
```

---

## Database Setup

### Schema Overview

The application uses the following tables:

- `users` - User accounts
- `user_passwords` - Password hashes
- `sessions` - User sessions
- `chats` - Chat conversations
- `messages` - Chat messages
- `knowledge_base` - Q&A pairs for AI training
- `shortcut_messages` - Pre-configured quick replies
- `availability_slots` - Admin availability schedule
- `typing_status` - Real-time typing indicators
- `settings` - Global application settings
- `login_attempts` - Login attempt tracking

### Running Migrations

```bash
# Run database setup script
npm run setup-db
```

This will:

- Create all required tables
- Set up indexes for performance
- Create triggers for `updated_at` timestamps
- Insert default settings row

### Manual Migration

If you prefer to run SQL manually:

```bash
psql $FLOOT_DATABASE_URL -f database/migrations/001_initial_schema.sql
```

---

## Environment Variables

### Required Variables

| Variable                                   | Description                  | Example                               |
| ------------------------------------------ | ---------------------------- | ------------------------------------- |
| `FLOOT_DATABASE_URL`                       | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`                               | Secret for JWT token signing | Generated random string               |
| `GEMINI_API_KEY`                           | Google Gemini API key        | `AIza...`                             |
| `GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1` | Additional Gemini API key    | `AIza...`                             |

### Optional Variables

| Variable                                           | Description        | Default                      |
| -------------------------------------------------- | ------------------ | ---------------------------- |
| `PORT`                                             | Server port        | `3344` (dev) / `8080` (prod) |
| `EMAIL_SERVICE_API_KEY`                            | Resend API key     | -                            |
| `MAILERSEND_FROM_EMAIL_ADDRESS_ADDITIONAL_FIELD_0` | From email address | -                            |
| `BREVO_API_KEY`                                    | Brevo API key      | -                            |
| `MAILERLITE_API_KEY`                               | MailerLite API key | -                            |
| `TELEGRAM_BOT_TOKEN`                               | Telegram bot token | -                            |
| `TELEGRAM_CHAT_ID`                                 | Telegram chat ID   | -                            |

---

## Running the Application

### Development Mode

```bash
npm run dev
```

- Frontend: http://localhost:5173 (Vite dev server)
- Hot reload enabled
- Source maps available

### Production Mode (Local)

```bash
# Build first
npm run build

# Then start
npm start
```

- Server: http://localhost:3344
- Serves built static files
- API endpoints at `/_api/*`

### Production Mode (Fly.io)

```bash
fly deploy
```

- Automatically builds and deploys
- App available at `https://your-app-name.fly.dev`

---

## Troubleshooting

### Database Connection Issues

- Verify `FLOOT_DATABASE_URL` is correct
- Check database is accessible from your network
- Ensure PostgreSQL is running (local) or accessible (remote)

### Port Already in Use

```bash
# Change port in env.json or set PORT environment variable
PORT=3000 npm start
```

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Fly.io Deployment Issues

```bash
# Check logs
fly logs -a chatbot-auspost-ai-support

# Check app status
fly status -a chatbot-auspost-ai-support

# SSH into instance for debugging
fly ssh console -a chatbot-auspost-ai-support
```

---

## Next Steps

1. **Create Admin User**: Use the login endpoint to create your first admin user
2. **Configure AI**: Set up your Gemini API keys
3. **Set Up Notifications**: Configure Telegram and email services
4. **Customize**: Update agent names and settings in the admin dashboard
5. **Embed Widget**: Use the widget SDK to embed the chat in your website

---

## Support

For issues or questions:

- Check the main README.md
- Review endpoint documentation in `/endpoints`
- Check Fly.io documentation: https://fly.io/docs

---

**Made with Floot** 🚀
