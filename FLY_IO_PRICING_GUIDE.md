# Fly.io Pricing Guide - Stay Within Free Tier

## ✅ Good News: Fly.io Has a FREE Tier!

You can run your app **completely FREE** if you stay within limits.

---

## Free Tier Limits (What You Get FREE)

### App Hosting (FREE)
- **3 shared-cpu-1x VMs** with 256MB RAM each
- **160GB outbound data transfer** per month
- **3GB persistent volume storage**

### What Costs Money
- **Managed Postgres (fly mpg)**: $38/month ❌ (Don't use this!)
- **Unmanaged Postgres**: FREE ✅ (But not recommended)
- **Additional VMs**: ~$5/month per VM
- **More RAM**: ~$2-5/month per GB
- **More storage**: ~$0.15/GB per month

---

## ✅ Recommended Setup (100% FREE)

### Option 1: External Database (BEST - Completely Free)

**Use Supabase/Neon/Railway for database (FREE)**
- Database: FREE (external provider)
- App hosting: FREE (Fly.io free tier)
- **Total Cost: $0/month** ✅

**Setup:**
```bash
# 1. Get free database from Supabase (or Neon/Railway)
# 2. Set connection string as secret:
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a chatbot-auspost-ai-support

# 3. Your app runs on Fly.io free tier
# Total: $0/month
```

### Option 2: Fly.io Unmanaged Postgres (FREE but Not Recommended)

**Unmanaged Postgres is FREE but:**
- ❌ No support from Fly.io
- ❌ You manage backups yourself
- ❌ More complex setup
- ✅ But it's FREE

**Setup:**
```bash
# Use a different name (chatbot-db is taken)
fly postgres create --name chatbot-db-prod --region syd

# Select: Development (1 node) - FREE option
# This will be FREE
```

---

## 💰 Cost Breakdown

### Current Configuration (fly.toml)
```toml
[[vm]]
  memory = '512mb'      # ✅ Within free tier (256MB × 3 = 768MB free)
  cpu_kind = 'shared'   # ✅ FREE
  cpus = 1              # ✅ FREE
```

**Your app will cost: $0/month** ✅

### If You Add Managed Postgres
- Managed Postgres: **$38/month** ❌
- **Total: $38/month**

### If You Use External Database
- External Database: **$0/month** ✅
- Fly.io App: **$0/month** ✅
- **Total: $0/month** ✅

---

## 🎯 How to Stay FREE

### ✅ DO:
1. Use **external database** (Supabase/Neon) - FREE
2. Use **shared-cpu-1x** VMs - FREE
3. Keep RAM at **256MB-512MB** - FREE
4. Use **1 VM** - FREE
5. Stay within **160GB data transfer** - FREE

### ❌ DON'T:
1. Don't use **Managed Postgres (fly mpg)** - $38/month
2. Don't scale to **multiple VMs** unnecessarily
3. Don't increase **RAM beyond free tier**
4. Don't exceed **160GB data transfer**

---

## 📊 Your Current Setup Cost

Based on your `fly.toml`:
- **App VM**: 1 × shared-cpu-1x, 512MB RAM = **$0/month** ✅
- **Database**: Use external (Supabase) = **$0/month** ✅
- **Total Monthly Cost**: **$0** ✅

---

## 🔍 How Fly.io Billing Works

1. **Free Tier**: First 3 VMs, 160GB transfer = FREE
2. **Pay-as-you-go**: Only charges if you exceed free tier
3. **No hidden fees**: You only pay for what you use
4. **Billing threshold**: Usually $5 minimum, but free tier is truly free

**Important**: As long as you stay within free tier limits, you pay **$0**.

---

## ✅ Recommended Action Plan

### Step 1: Use External Database (FREE)
```bash
# Sign up for Supabase (free)
# Get connection string
fly secrets set FLOOT_DATABASE_URL="postgresql://..." -a chatbot-auspost-ai-support
```

### Step 2: Deploy App (FREE)
```bash
fly deploy -a chatbot-auspost-ai-support
# This stays within free tier = $0/month
```

### Step 3: Monitor Usage
```bash
# Check your usage
fly dashboard
# Or visit: https://fly.io/dashboard
```

---

## 💡 Cost Optimization Tips

1. **Use external database** - Saves $38/month
2. **Keep 1 VM** - Stays free
3. **Use auto-stop** - Already configured in fly.toml ✅
4. **Monitor data transfer** - Stay under 160GB/month

---

## 🚨 When You Might Get Charged

You'll only be charged if:
- You exceed 3 VMs (you're using 1, so safe ✅)
- You exceed 160GB data transfer (unlikely for a chatbot)
- You add Managed Postgres (don't do this ❌)
- You increase RAM significantly (you're at 512MB, safe ✅)

**Bottom line**: Your current setup will be **$0/month** as long as you use an external database.

---

## ✅ Final Recommendation

**Use Supabase (FREE) + Fly.io Free Tier = $0/month**

1. Sign up for Supabase: https://supabase.com
2. Create project and get connection string
3. Set as Fly.io secret
4. Deploy app
5. **Total cost: $0/month** ✅

This is the best option for staying completely free!

