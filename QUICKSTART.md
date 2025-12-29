# Quick Start Guide

Get your chatbot running in 5 minutes!

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Create `env.json` with your configuration:
```json
{
  "FLOOT_DATABASE_URL": "postgresql://user:password@localhost:5432/chatbot_db",
  "JWT_SECRET": "run: npm run generate-jwt",
  "GEMINI_API_KEY": "your-key",
  "GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1": "your-key"
}
```

### 3. Generate JWT Secret
```bash
npm run generate-jwt
```
Copy the output to `env.json` as `JWT_SECRET`.

### 4. Set Up Database
```bash
# Create database (PostgreSQL)
createdb chatbot_db

# Run migrations
npm run setup-db
```

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

---

## Production Deployment (Fly.io)

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login & Launch
```bash
fly auth login
fly launch
```

### 3. Set Secrets
```bash
fly secrets set \
  FLOOT_DATABASE_URL="postgresql://..." \
  JWT_SECRET="your-secret" \
  GEMINI_API_KEY="your-key" \
  GOOGLE_GEMINI_API_KEY_ADDITIONAL_FIELD_1="your-key" \
  -a your-app-name
```

### 4. Deploy
```bash
fly deploy
```

Done! 🚀

For detailed instructions, see [SETUP.md](./SETUP.md)

