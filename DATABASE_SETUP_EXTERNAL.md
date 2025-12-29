# External Database Setup (Free Option)

Since Fly.io PostgreSQL costs $38/month, here's how to use a **FREE** external database instead.

## Recommended: Supabase (Free Tier)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up (free)
3. Create a new project

### Step 2: Get Connection String
1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** connection string
4. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### Step 3: Set as Fly.io Secret
```bash
fly secrets set FLOOT_DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.xxxxx.supabase.co:5432/postgres" -a chatbot-auspost-ai-support
```

**Replace:**
- `YOUR-PASSWORD` with your actual Supabase database password
- `xxxxx` with your project reference

### Step 4: Run Migrations
```bash
# Backup local env.json
cp env.json env.json.backup

# Edit env.json: Replace FLOOT_DATABASE_URL with Supabase connection string
# Then run:
npm run setup-db

# Restore local env.json
mv env.json.backup env.json
```

---

## Alternative: Neon (Free Tier)

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project

### Step 2: Get Connection String
1. Go to your project dashboard
2. Click **Connection Details**
3. Copy the connection string
4. It looks like: `postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname`

### Step 3: Set as Fly.io Secret
```bash
fly secrets set FLOOT_DATABASE_URL="postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname" -a chatbot-auspost-ai-support
```

### Step 4: Run Migrations
Same as Supabase above.

---

## Alternative: Railway (Free Tier)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up (free, $5 credit/month)

### Step 2: Create PostgreSQL
1. Create new project
2. Add **PostgreSQL** service
3. Click on PostgreSQL → **Connect** → Copy connection string

### Step 3: Set as Fly.io Secret
```bash
fly secrets set FLOOT_DATABASE_URL="postgresql://postgres:password@host:5432/railway" -a chatbot-auspost-ai-support
```

### Step 4: Run Migrations
Same as above.

---

## Quick Comparison

| Provider | Free Tier | Database Size | Best For |
|----------|-----------|---------------|----------|
| **Supabase** | ✅ Free | 500MB | Easiest setup |
| **Neon** | ✅ Free | 3GB | More storage |
| **Railway** | ✅ $5 credit/month | Unlimited* | Flexible |

*Within credit limits

---

## Recommendation

**Use Supabase** - it's the easiest and has a good free tier for this project.

---

## After Setting Up External Database

1. ✅ Set `FLOOT_DATABASE_URL` secret on Fly.io
2. ✅ Run migrations (update env.json temporarily)
3. ✅ Create admin user (update env.json temporarily)
4. ✅ Deploy your app

Then you can proceed with the rest of the deployment steps!

