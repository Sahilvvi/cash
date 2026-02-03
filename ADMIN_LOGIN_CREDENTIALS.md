# 🔑 ADMIN LOGIN CREDENTIALS

## 📍 Your Live Site
**https://cash-delta-ten.vercel.app/**

---

## 👤 Admin Login Details

### Login URL
**https://cash-delta-ten.vercel.app/admin**

### Credentials
```
Email: notsahil@gmail.com
Password: [You need to set this - see below]
```

---

## ⚠️ IMPORTANT: First-Time Setup Required

The email `notsahil@gmail.com` is configured as admin, but **you need to sign up first** with this email on your live site.

### 🚀 Setup Steps (2 minutes)

#### Step 1: Sign Up
1. Go to: **https://cash-delta-ten.vercel.app/auth** (or click "Sign Up" on homepage)
2. Enter:
   - **Email:** `notsahil@gmail.com`
   - **Password:** Choose a strong password (and remember it!)
   - **Full Name:** Your name
3. Click "Sign Up"
4. Verify email if Supabase sends confirmation

#### Step 2: Add Admin Permissions
You have **3 options** to grant admin access:

##### **Option A: Supabase Dashboard (Easiest - 1 minute)**

1. Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql
2. Copy and paste this SQL:
   ```sql
   INSERT INTO admin_users (user_id)
   SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com'
   ON CONFLICT (user_id) DO NOTHING;
   ```
3. Click **"Run"**
4. Done! ✅

##### **Option B: Manual via Supabase Editor**

1. Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/users
2. Find user: `notsahil@gmail.com`
3. Copy the **User ID** (UUID)
4. Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor
5. Select table: **admin_users**
6. Click **"Insert row"**
7. Paste User ID in **user_id** field
8. Click **"Save"**
9. Done! ✅

##### **Option C: Run Local Script**

```powershell
# In your project directory
.\add-admin.ps1
```

#### Step 3: Login as Admin
1. Go to: **https://cash-delta-ten.vercel.app/admin**
2. Login with:
   - Email: `notsahil@gmail.com`
   - Password: [what you chose in Step 1]
3. Done! You're now admin! ✅

---

## ✅ After Login, You Can:

- Access full admin dashboard
- Manage users and stores
- **Test Offer18 Integration** (under "Offer18 Integration" tab)
- View analytics
- Configure settings
- Manage cashback requests

---

## 🧪 Test Offer18 API Integration

Once logged in as admin:

1. Click **"Offer18 Integration"** tab in admin panel
2. Click **"Test Connection"** to verify API works
3. Click **"Browse Offers"** → **"Fetch Active Offers"**
4. Click **"Sync Offers"** → **"Sync All Active Offers"**
5. Verify stores appear on: https://cash-delta-ten.vercel.app/stores

---

## 🔐 Your Offer18 Credentials (Already Configured)

These are already set in Vercel environment variables:

```
Affiliate ID: 744826
Merchant ID: 1446
API Key: 81ad73157134a49e6ec27cc8daaed65d
```

You don't need to enter these manually - they're already configured! ✅

---

## 🆘 Troubleshooting

### "Invalid login credentials"
- Make sure you've signed up first
- Check email spelling: `notsahil@gmail.com`
- Verify password is correct

### "Access denied" or "Not authorized"
- You haven't been added to admin_users table yet
- Follow Step 2 above to add admin permissions
- Logout and login again after adding

### "Email not confirmed"
- Check your email for Supabase confirmation
- Or disable email confirmation in Supabase settings

---

## 📞 Quick Links

| Resource | URL |
|----------|-----|
| **Login Page** | https://cash-delta-ten.vercel.app/admin |
| **Sign Up Page** | https://cash-delta-ten.vercel.app/auth |
| **Supabase SQL Editor** | https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql |
| **Supabase Users** | https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/users |
| **Vercel Dashboard** | https://vercel.com/dashboard |

---

## 📝 Summary

**To login as admin:**

1. ✅ Sign up first: https://cash-delta-ten.vercel.app/auth
   - Use email: `notsahil@gmail.com`
   - Choose a password

2. ✅ Add admin permissions via Supabase SQL (see Option A above)

3. ✅ Login: https://cash-delta-ten.vercel.app/admin
   - Email: `notsahil@gmail.com`
   - Password: [what you chose]

**That's it!** 🎉

---

## 🎯 Next Steps After Login

1. ✅ Access admin dashboard
2. 🧪 Test Offer18 API integration
3. 📦 Sync offers from Offer18
4. 🏪 Verify stores appear on frontend
5. 📊 Check analytics and monitoring

---

**Created**: February 2, 2026  
**Email**: notsahil@gmail.com  
**Site**: https://cash-delta-ten.vercel.app/  
**Status**: Ready for first-time setup
