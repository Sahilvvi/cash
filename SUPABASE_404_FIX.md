# 🚨 SUPABASE PROJECT 404 ERROR - SOLUTION

## Issue: Supabase Links Showing 404

The Supabase project `rmdmcfgifglvtpbmcxov` is not accessible. This could mean:
- Project was deleted
- You don't have access to it
- It never existed in your account
- Wrong project ID

---

## ⚡ SOLUTION: Find/Create Your Supabase Project

### **OPTION 1: Find Your Existing Supabase Project**

1. Go to: **https://supabase.com/dashboard**

2. Login with your account

3. You should see your projects listed

4. Look for a project that might be your cashback platform

5. Click on it and note the **Project ID** (in the URL)

**Example URL:**
```
https://supabase.com/dashboard/project/YOUR-PROJECT-ID
```

The **YOUR-PROJECT-ID** is what we need!

---

### **OPTION 2: Create New Supabase Project (Recommended)**

Since the old project isn't accessible, let's create a fresh one:

#### **Step 1: Create Project**

1. Go to: **https://supabase.com/dashboard**
2. Click **"New project"**
3. Fill in:
   - **Name:** `cashback-platform`
   - **Database Password:** Choose strong password (SAVE IT!)
   - **Region:** Choose closest to you (e.g., `ap-south-1` for India)
4. Click **"Create new project"**
5. Wait 2-3 minutes ⏱️

#### **Step 2: Get Your Credentials**

Once project is ready:

1. Click **"Settings"** (⚙️ icon, bottom left)
2. Click **"API"**
3. Copy these 3 values:

```
Project URL: https://[YOUR-NEW-PROJECT-ID].supabase.co
Project Reference ID: [YOUR-NEW-PROJECT-ID]
anon public key: eyJhbGci... (long key)
```

Write these down somewhere safe!

#### **Step 3: Set Up Database**

1. Click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open the file: **`supabase_complete_schema.sql`** (in your project root)
4. Copy ALL the SQL from that file
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. ✅ All tables created!

#### **Step 4: Update Vercel Environment Variables**

1. Go to: **https://vercel.com/dashboard**
2. Select project: **cash**
3. Click **"Settings"** → **"Environment Variables"**
4. **DELETE** the old 3 Supabase variables
5. **ADD** new ones with your new credentials:

```
Name: VITE_SUPABASE_URL
Value: [YOUR Project URL from Step 2]
Environments: ✅ Production ✅ Preview ✅ Development

Name: VITE_SUPABASE_PROJECT_ID
Value: [YOUR Project ID from Step 2]
Environments: ✅ Production ✅ Preview ✅ Development

Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: [YOUR anon key from Step 2]
Environments: ✅ Production ✅ Preview ✅ Development
```

6. Click **"Save"** for each

#### **Step 5: Redeploy Vercel**

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

#### **Step 6: Create Admin Account**

1. Go to Supabase SQL Editor with YOUR new project
2. Run this SQL:

```sql
-- Create admin user
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'notsahil95@gmail.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    NOW(), NOW(), '', '', '', ''
  ) RETURNING id INTO new_user_id;
  
  -- Create profile
  INSERT INTO profiles (user_id, email, full_name, referral_code)
  VALUES (new_user_id, 'notsahil95@gmail.com', 'Admin User', 'PWADM001');
  
  -- Make admin
  INSERT INTO admin_users (user_id, role)
  VALUES (new_user_id, 'admin');
  
  RAISE NOTICE '✅ Admin account created!';
END $$;

-- Verify
SELECT 
  u.email,
  p.full_name,
  au.role,
  '✅ Ready to login!' as status
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
JOIN admin_users au ON au.user_id = u.id
WHERE u.email = 'notsahil95@gmail.com';
```

#### **Step 7: Test Login**

1. Go to: **https://cash-delta-ten.vercel.app/admin**
2. Email: `notsahil95@gmail.com`
3. Password: `password`
4. ✅ Login should work!

#### **Step 8: Test Offer18**

1. Click "Offer18 Integration"
2. Test Connection
3. Fetch Offers
4. Sync Offers

---

## 🎯 QUICK CHECKLIST

- [ ] Created new Supabase project
- [ ] Saved database password
- [ ] Copied 3 credentials (URL, ID, Key)
- [ ] Ran `supabase_complete_schema.sql` in SQL Editor
- [ ] All 16 tables created
- [ ] Updated Vercel environment variables
- [ ] Redeployed Vercel
- [ ] Created admin account with SQL
- [ ] Can login at /admin
- [ ] Offer18 integration works

---

## 📁 FILES YOU NEED

The file **`supabase_complete_schema.sql`** contains all the database setup. It was created earlier in this session.

If you don't have it, I can recreate it for you!

---

## 🆘 ALTERNATIVE: Use Supabase CLI to Find Projects

If you think you have a project but can't find it:

```powershell
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# List all your projects
supabase projects list
```

This will show all projects in your account.

---

## 💡 WHY THIS HAPPENED

The old project ID `rmdmcfgifglvtpbmcxov` was probably from:
- A demo/example project
- Someone else's project
- A deleted project
- Documentation that referenced wrong project

**Solution:** Create your OWN Supabase project and you'll have full control!

---

## ⏱️ TOTAL TIME

- Create Supabase project: 5 minutes
- Set up database: 2 minutes
- Update Vercel: 2 minutes
- Create admin: 1 minute
- **Total: 10 minutes**

---

## 📞 LINKS YOU'LL NEED

**Supabase Dashboard:**  
https://supabase.com/dashboard

**Vercel Dashboard:**  
https://vercel.com/dashboard

**Your Live Site:**  
https://cash-delta-ten.vercel.app

---

**Start with OPTION 2 - Create a new Supabase project. It's the cleanest solution! 🚀**

**After creating, you'll have:**
- ✅ Your own database
- ✅ Full admin access
- ✅ Complete control
- ✅ No 404 errors
