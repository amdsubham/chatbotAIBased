# Fly.io Account Verification Guide

## Issue: High Risk Account

If you see this error:
```
Your account has been marked as high risk. Please go to https://fly.io/high-risk-unlock to verify your account.
```

This is a security verification step required by Fly.io. It's normal for new accounts or accounts with certain activity patterns.

---

## Step-by-Step Verification Process

### Step 1: Visit the Verification Page

Go to: **https://fly.io/high-risk-unlock**

Or click the link provided in the error message.

### Step 2: Complete Verification

You'll be asked to verify your account. This typically involves:

1. **Email Verification**
   - Confirm your email address
   - Check your inbox for verification email
   - Click the verification link

2. **Phone Verification** (if required)
   - Provide a valid phone number
   - Receive SMS verification code
   - Enter the code

3. **Payment Method** (if required)
   - Add a credit card or payment method
   - This is for verification purposes
   - You won't be charged unless you exceed free tier limits

### Step 3: Wait for Approval

- Verification is usually instant, but can take up to 24 hours
- You'll receive an email when your account is verified
- Check your email inbox

### Step 4: Retry Launch

Once verified, try launching again:

```bash
fly launch
```

---

## Alternative: Use Fly.io Dashboard

If CLI verification doesn't work:

1. **Go to Fly.io Dashboard**
   - Visit: https://fly.io/dashboard
   - Log in with your account

2. **Complete Verification**
   - Follow prompts in the dashboard
   - Complete any required steps

3. **Return to CLI**
   - Try `fly launch` again

---

## Common Reasons for High Risk Flag

- New account (first-time users)
- Using VPN or proxy
- Unusual activity patterns
- Missing payment method
- Email domain reputation

---

## What to Do While Waiting

While waiting for verification, you can:

1. **Prepare Your Deployment**
   - Review `PRODUCTION_DEPLOYMENT_STEPS.md`
   - Ensure all secrets are ready
   - Prepare database connection strings

2. **Test Locally**
   - Make sure everything works in development
   - Test all features
   - Fix any bugs

3. **Set Up External Database** (Optional)
   - If you want to use external PostgreSQL (Supabase, Neon, etc.)
   - Set it up now so it's ready when Fly.io is verified

---

## After Verification

Once your account is verified:

1. **Retry Launch**
   ```bash
   fly launch
   ```

2. **Continue with Deployment Steps**
   - Follow `PRODUCTION_DEPLOYMENT_STEPS.md`
   - Set up database
   - Configure secrets
   - Deploy

---

## Still Having Issues?

If verification doesn't work:

1. **Contact Fly.io Support**
   - Email: support@fly.io
   - Or use the support form in dashboard

2. **Check Account Status**
   ```bash
   fly auth whoami
   ```

3. **Try Different Payment Method**
   - Sometimes using a different card helps
   - Or try PayPal if available

---

## Quick Checklist

- [ ] Visited https://fly.io/high-risk-unlock
- [ ] Completed email verification
- [ ] Added payment method (if required)
- [ ] Received verification confirmation
- [ ] Retried `fly launch`

---

**Note:** This is a one-time verification. Once completed, you won't need to do it again.

