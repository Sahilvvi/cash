# 🚀 NEW SUPABASE PROJECT SETUP GUIDE

## Complete Guide to Creating Your Own Supabase Database

---

## 📋 TABLE OF CONTENTS

1. [Create New Supabase Project](#step-1-create-new-supabase-project)
2. [Set Up Database Schema](#step-2-set-up-database-schema)
3. [Configure Authentication](#step-3-configure-authentication)
4. [Update Environment Variables](#step-4-update-environment-variables)
5. [Deploy to Vercel](#step-5-deploy-to-vercel)
6. [Create Admin User](#step-6-create-admin-user)
7. [Test Connection](#step-7-test-connection)

---

## STEP 1: Create New Supabase Project

### 1.1 Go to Supabase
1. Open: **https://supabase.com**
2. Click **"Start your project"** or **"New Project"**
3. Sign in with GitHub (recommended) or email

### 1.2 Create Organization (if first time)
1. Click **"New organization"**
2. Enter organization name (e.g., "My Cashback Platform")
3. Choose plan: **Free** (perfect for starting)
4. Click **"Create organization"**

### 1.3 Create New Project
1. Click **"New project"**
2. Fill in details:
   - **Name**: `cashback-platform` (or your preferred name)
   - **Database Password**: Create strong password ⚠️ **SAVE THIS!**
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
   - **Pricing Plan**: Free
3. Click **"Create new project"**
4. Wait 2-3 minutes for project to provision ⏱️

### 1.4 Save Your Credentials
Once project is ready, note these down:

```
Project URL: https://[YOUR-PROJECT-REF].supabase.co
Project ID: [YOUR-PROJECT-REF]
API URL: https://[YOUR-PROJECT-REF].supabase.co
anon/public key: [SHOWN IN PROJECT SETTINGS]
service_role key: [SHOWN IN PROJECT SETTINGS - KEEP SECRET!]
Database Password: [WHAT YOU CHOSE]
```

---

## STEP 2: Set Up Database Schema

### 2.1 Access SQL Editor
1. In your Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**

### 2.2 Run Database Setup Script

Copy ALL SQL from the file I'll create: `supabase_complete_schema.sql`

Click **"Run"** to execute

**This will create:**
- ✅ 15 tables (stores, users, cashback, etc.)
- ✅ Functions for referrals, admin checks
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updates

### 2.3 Verify Tables Created

1. Click **"Table Editor"** (left sidebar)
2. You should see these tables:
   - admin_users
   - affiliate_clicks
   - banners
   - cashback_transactions
   - categories
   - deals
   - gift_cards
   - notifications
   - profiles
   - referrals
   - site_settings
   - spin_rewards
   - stores
   - user_gift_cards
   - user_spins
   - withdrawals

✅ If all 16 tables appear → Success!

---

## STEP 3: Configure Authentication

### 3.1 Email Settings
1. Click **"Authentication"** → **"Providers"**
2. Enable **"Email"** provider (should be on by default)
3. Configure:
   - ✅ Enable email confirmation (or disable for testing)
   - ✅ Minimum password length: 6
   - ✅ Enable sign ups

### 3.2 Configure Auth Trigger
1. Go to **"SQL Editor"**
2. Run this SQL to enable auto-profile creation:

```sql
-- Enable automatic profile creation when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

This creates a user profile automatically when someone signs up.

### 3.3 Auth Settings (Optional)
1. Go to **"Authentication"** → **"Policies"**
2. Verify RLS is enabled on all tables
3. Site URL: Add your Vercel URL later

---

## STEP 4: Update Environment Variables

### 4.1 Get Your New Credentials

In Supabase Dashboard:
1. Click **"Settings"** (⚙️ icon)
2. Click **"API"**
3. Copy these values:
   - **Project URL** 
   - **Project API keys** → **anon/public** key
   - **Project Reference ID**

### 4.2 Update Local .env File

Create/update `.env` file in project root:

```env
# Supabase Configuration (NEW)
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-REF
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-KEY-HERE

# Offer18 Configuration (KEEP SAME)
VITE_OFFER18_API_KEY=81ad73157134a49e6ec27cc8daaed65d
VITE_OFFER18_AFFILIATE_ID=744826
VITE_OFFER18_MERCHANT_ID=1446
```

**Replace:**
- `YOUR-PROJECT-REF` with your actual project reference
- `YOUR-ANON-KEY-HERE` with your actual anon key

---

## STEP 5: Deploy to Vercel

### 5.1 Update Vercel Environment Variables

1. Go to: **https://vercel.com/dashboard**
2. Select your project: **cash**
3. Click **"Settings"** → **"Environment Variables"**
4. **DELETE** old Supabase variables
5. **ADD** new variables:

```
VITE_SUPABASE_URL = https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PROJECT_ID = YOUR-PROJECT-REF
VITE_SUPABASE_PUBLISHABLE_KEY = YOUR-ANON-KEY-HERE
```

**Keep Offer18 variables unchanged:**
```
VITE_OFFER18_API_KEY = 81ad73157134a49e6ec27cc8daaed65d
VITE_OFFER18_AFFILIATE_ID = 744826
VITE_OFFER18_MERCHANT_ID = 1446
```

### 5.2 Redeploy

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes
5. Your site will use the NEW database! ✅

---

## STEP 6: Create Admin User

### 6.1 Sign Up on Your Site
1. Go to: **https://cash-delta-ten.vercel.app/auth**
2. Sign up with your email (e.g., `notsahil@gmail.com`)
3. Choose a password
4. Complete signup

### 6.2 Add Admin Permissions

In Supabase SQL Editor:

```sql
-- Add your email as admin
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify admin was added
SELECT 
  u.email,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'notsahil@gmail.com';
```

Should show: `notsahil@gmail.com` with timestamp ✅

---

## STEP 7: Test Connection

### 7.1 Test Local Development

```powershell
# In project directory
npm run dev
```

Visit: `http://localhost:5173`
- ✅ Try signing up
- ✅ Try logging in
- ✅ Check dashboard loads

### 7.2 Test Live Site

Visit: **https://cash-delta-ten.vercel.app/**
- ✅ Login with your account
- ✅ Access dashboard
- ✅ Go to `/admin`
- ✅ Test Offer18 integration

### 7.3 Verify Database

In Supabase:
1. Go to **"Table Editor"**
2. Check `profiles` table → Should have your profile
3. Check `admin_users` table → Should have your entry

---

## 🎯 COMPLETE CHECKLIST

Use this to verify everything is set up:

- [ ] Created new Supabase project
- [ ] Saved database password
- [ ] Ran complete schema SQL
- [ ] Verified all 16 tables exist
- [ ] Configured authentication settings
- [ ] Created auth trigger
- [ ] Updated local .env file
- [ ] Updated Vercel environment variables
- [ ] Redeployed Vercel app
- [ ] Signed up on live site
- [ ] Added admin permissions
- [ ] Verified admin access works
- [ ] Tested Offer18 integration
- [ ] Confirmed data saves to new database

---

## 📊 Database Schema Overview

Your new database includes:

### User Management
- **profiles** - User profiles and details
- **admin_users** - Admin permissions
- **referrals** - Referral system

### Cashback System
- **stores** - Store/merchant data (synced from Offer18)
- **deals** - Deals and coupons
- **cashback_transactions** - User cashback records
- **affiliate_clicks** - Click tracking

### Features
- **gift_cards** - Gift card inventory
- **user_gift_cards** - User's gift cards
- **spin_rewards** - Spin wheel rewards
- **user_spins** - User spin history
- **withdrawals** - Withdrawal requests

### Site Content
- **banners** - Homepage banners
- **categories** - Store categories
- **notifications** - User notifications
- **site_settings** - Site configuration

---

## 🔧 Advanced Configuration

### Enable Realtime (Optional)

For real-time updates:

```sql
-- Enable realtime on important tables
ALTER PUBLICATION supabase_realtime 
ADD TABLE cashback_transactions,
ADD TABLE affiliate_clicks,
ADD TABLE notifications;
```

### Set Up Storage (Optional)

For user avatars and store logos:

1. Go to **"Storage"** in Supabase
2. Create bucket: `avatars`
3. Create bucket: `store-logos`
4. Set public access policies

---

## 🆘 Troubleshooting

### Issue: "relation does not exist"
**Fix**: Schema not created. Re-run the SQL script.

### Issue: "permission denied"
**Fix**: Check RLS policies are correct. Temporarily disable RLS for testing:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Issue: Can't login as admin
**Fix**: 
1. Verify user exists in auth.users
2. Verify user is in admin_users table
3. Logout and login again

### Issue: Offer18 integration not working
**Fix**: Offer18 variables are independent of Supabase. Check they're still set in Vercel.

---

## 📞 Quick Reference

### Supabase Dashboard URLs

```
Main Dashboard: https://supabase.com/dashboard
Your Project: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]
SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/sql
Table Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/editor
Auth Users: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/auth/users
```

### Your App URLs
```
Live Site: https://cash-delta-ten.vercel.app/
Admin Panel: https://cash-delta-ten.vercel.app/admin
Vercel Dashboard: https://vercel.com/dashboard
```

---

## 🎉 Success Criteria

Your new Supabase is ready when:

✅ All tables created in Supabase  
✅ Can sign up new users  
✅ User profiles auto-create  
✅ Admin access works  
✅ Offer18 integration works  
✅ Data saves correctly  
✅ Live site uses new database  

---

## 📝 Next Steps After Setup

1. ✅ Add sample data to stores table
2. ✅ Sync offers from Offer18
3. ✅ Customize site settings
4. ✅ Configure email templates
5. ✅ Set up monitoring
6. ✅ Enable backups

---

**Created**: February 2, 2026  
**For**: Cashback Tracking Platform  
**Database Type**: PostgreSQL (Supabase)  
**Total Tables**: 16  

**Ready to get started? Follow Step 1! 🚀**
