# Database Setup Guide

This guide will help you set up a PostgreSQL database for the chatbot application.

## Quick Options

### Option 1: Local PostgreSQL (Development)

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**macOS (using Postgres.app):**
- Download from https://postgresapp.com/
- Install and start the app

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Use the installer

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE chatbot_db;

# Create user (optional, or use default postgres user)
CREATE USER chatbot_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chatbot_db TO chatbot_user;

# Exit
\q
```

#### Update env.json

```json
{
  "FLOOT_DATABASE_URL": "postgresql://postgres:your_password@localhost:5432/chatbot_db"
}
```

Or if you created a user:
```json
{
  "FLOOT_DATABASE_URL": "postgresql://chatbot_user:your_password@localhost:5432/chatbot_db"
}
```

---

### Option 2: Supabase (Free Cloud Database) ⭐ Recommended

1. **Sign up** at https://supabase.com
2. **Create a new project**
3. **Go to Settings → Database**
4. **Copy the connection string** (URI format)
5. **Update env.json:**

```json
{
  "FLOOT_DATABASE_URL": "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
}
```

Replace `[YOUR-PASSWORD]` and `[PROJECT-REF]` with your actual values.

---

### Option 3: Railway (Free Cloud Database)

1. **Sign up** at https://railway.app
2. **Create a new project**
3. **Add PostgreSQL service**
4. **Click on PostgreSQL → Connect → Copy the connection string**
5. **Update env.json:**

```json
{
  "FLOOT_DATABASE_URL": "postgresql://postgres:password@host:5432/railway"
}
```

---

### Option 4: Neon (Free Cloud Database)

1. **Sign up** at https://neon.tech
2. **Create a new project**
3. **Copy the connection string** from the dashboard
4. **Update env.json:**

```json
{
  "FLOOT_DATABASE_URL": "postgresql://user:password@host.neon.tech/dbname"
}
```

---

## Running Migrations

Once you've set up your database and updated `env.json`:

```bash
npm run setup-db
```

This will:
- ✅ Create all required tables
- ✅ Set up indexes for performance
- ✅ Create triggers for automatic timestamps
- ✅ Insert default settings

## Connection String Format

The connection string format is:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Examples:**
- Local: `postgresql://postgres:mypassword@localhost:5432/chatbot_db`
- Supabase: `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
- Railway: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

## Troubleshooting

### "Invalid URL" Error
- Make sure `FLOOT_DATABASE_URL` doesn't contain placeholder text
- Check that the connection string is properly formatted
- Ensure no extra spaces or quotes

### "Connection Refused" Error
- Verify PostgreSQL is running (local)
- Check firewall settings (cloud)
- Verify host, port, and credentials

### "Database does not exist" Error
- Create the database first: `CREATE DATABASE chatbot_db;`
- Or use an existing database name

### "Password authentication failed"
- Double-check username and password
- For cloud providers, use the credentials from their dashboard

## Security Notes

⚠️ **Never commit `env.json` to git** - it contains sensitive credentials!

The `.gitignore` file already excludes `env.json` for your protection.

## Next Steps

After setting up the database:

1. ✅ Run migrations: `npm run setup-db`
2. ✅ Verify tables created: Connect to your database and check
3. ✅ Start development: `npm run dev`
4. ✅ Create admin user: Use the login endpoint

---

**Need help?** Check the main [SETUP.md](./SETUP.md) for more details.

