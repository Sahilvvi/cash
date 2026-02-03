# 🔐 CREATE ADMIN ACCOUNT
## Email: notsahil95@gmail.com

---

## ⚡ STEP-BY-STEP SETUP (3 Minutes)

### **STEP 1: Sign Up on Your Live Site** (1 minute)

1. Open your browser and go to: **https://cash-delta-ten.vercel.app/auth**

2. Click **"Sign Up"** or **"Register"**

3. Fill in the form:
   - **Email:** `notsahil95@gmail.com`
   - **Password:** `password`
   - **Full Name:** Any name (e.g., "Admin User")

4. Click **"Sign Up"** or **"Create Account"**

5. ✅ Wait for confirmation (should be instant)

**Note:** If the site asks for email verification, check the email inbox for `notsahil95@gmail.com` and click the verification link.

---

### **STEP 2: Add Admin Permissions** (1 minute)

1. Open Supabase SQL Editor: **https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql**

2. Click **"New query"**

3. Copy and paste this SQL:

```sql
-- Add notsahil95@gmail.com as admin
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users 
WHERE email = 'notsahil95@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify admin was added successfully
SELECT 
  u.email,
  u.created_at as account_created,
  au.created_at as admin_since,
  'Admin access granted ✓' as status
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'notsahil95@gmail.com';
```

4. Click **"Run"** (or press Ctrl+Enter)

5. ✅ You should see output showing:
   ```
   email: notsahil95@gmail.com
   status: Admin access granted ✓
   ```

---

### **STEP 3: Login as Admin** (30 seconds)

1. Go to: **https://cash-delta-ten.vercel.app/admin**

2. Enter credentials:
   - **Email:** `notsahil95@gmail.com`
   - **Password:** `password`

3. Click **"Login"**

4. ✅ You should now see the admin dashboard!

---

## ✅ VERIFICATION

After logging in, you should see:

- ✅ Admin dashboard homepage
- ✅ Sidebar with admin navigation:
  - Overview
  - Users
  - Stores
  - Cashback
  - **Offer18 Integration** ← Click this to test
  - Analytics
  - Settings
- ✅ No error messages
- ✅ Full admin access

---

## 🧪 TEST OFFER18 INTEGRATION

Now that you're admin, test the Offer18 API:

### Quick Test (2 minutes):

1. Click **"Offer18 Integration"** in sidebar
2. Click **"Test Connection"** button
3. ✅ Should show: "Connected to Offer18 API"
4. Click **"Browse Offers"** tab
5. Click **"Fetch Offers"**
6. ✅ Should show: List of offers from Offer18

---

## 🆘 TROUBLESHOOTING

### Issue: "Email already exists" when signing up

**Solution:** The email is already registered. Just login:
- Go to: https://cash-delta-ten.vercel.app/admin
- Login with: `notsahil95@gmail.com` / `password`
- Then proceed to Step 2 to add admin permissions

### Issue: "User not found" when running SQL

**Solution:** User hasn't signed up yet
- Make sure you completed Step 1 (sign up)
- Wait 10 seconds, then try SQL again
- Check auth.users table:
  ```sql
  SELECT email, created_at FROM auth.users 
  WHERE email = 'notsahil95@gmail.com';
  ```

### Issue: "Access denied" when logging into admin panel

**Solution:** Not added as admin yet
- Run the SQL from Step 2 again
- Verify with this SQL:
  ```sql
  SELECT * FROM admin_users WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'notsahil95@gmail.com'
  );
  ```
- If empty, run INSERT statement again
- Logout and login again

### Issue: Email verification required

**Solution:** Check email or disable verification
1. Check `notsahil95@gmail.com` inbox for verification email
2. Or disable verification in Supabase:
   - Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/providers
   - Disable "Confirm email"
   - Re-signup

---

## 📊 SQL HELPER COMMANDS

### Check if user exists:
```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users 
WHERE email = 'notsahil95@gmail.com';
```

### Check if user is admin:
```sql
SELECT 
  au.id,
  u.email,
  au.role,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'notsahil95@gmail.com';
```

### Make user admin (if not already):
```sql
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'notsahil95@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```

### Remove admin access (if needed):
```sql
DELETE FROM admin_users 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'notsahil95@gmail.com'
);
```

### List all admins:
```sql
SELECT 
  u.email,
  au.role,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC;
```

---

## 🎯 SUCCESS CHECKLIST

- [ ] Signed up at /auth with notsahil95@gmail.com
- [ ] Ran SQL to add to admin_users table
- [ ] Verified with SELECT query (shows admin status)
- [ ] Can login at /admin
- [ ] See admin dashboard
- [ ] Can access "Offer18 Integration" section
- [ ] Test Connection works
- [ ] Can fetch offers from Offer18

**All checked? You're all set! 🎉**

---

## 📞 QUICK REFERENCE

**Admin Credentials:**
```
Email: notsahil95@gmail.com
Password: password
```

**Admin Login URL:**
```
https://cash-delta-ten.vercel.app/admin
```

**Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql
```

**Supabase Users Table:**
```
https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/users
```

---

## ⏱️ TOTAL TIME

- Sign up: 1 minute
- Add admin permission: 1 minute
- Login and verify: 1 minute
- **Total: 3 minutes**

---

## 🔒 SECURITY NOTE

⚠️ **IMPORTANT:** The password `password` is very weak. For production use:

1. **Change password after first login**
2. Use strong password (12+ chars, mixed case, numbers, symbols)
3. Enable 2FA if available
4. Don't share credentials

To change password:
- Login to admin panel
- Go to Profile Settings
- Update password

---

**Ready to start? Follow the 3 steps above! 🚀**

**Created:** February 2, 2026, 5:22 PM IST  
**Admin Email:** notsahil95@gmail.com  
**Status:** Ready to create
