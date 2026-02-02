# 🔐 LOGIN & SIGNUP CREDENTIALS GUIDE

## 📝 **Important: No Default Credentials**

This application **does NOT have pre-configured credentials**. You need to create your own account using Supabase authentication.

---

## 🆕 **Creating Your First Account**

### **Step 1: Sign Up as a Regular User**

1. **Open the application:**
   ```
   http://localhost:8080/
   ```

2. **Go to Sign Up page:**
   - Click on **"Sign In"** or **"Login"** button in the header
   - Or navigate directly to: `http://localhost:8080/auth`

3. **Create your account:**
   - **Email:** your-email@example.com (use any valid email)
   - **Password:** Choose a strong password (minimum 6 characters)
   - **Full Name:** Your Name
   - **Referral Code:** (Optional - leave blank for first user)

4. **Click "Sign Up"**

5. **Check your email:**
   - Supabase will send a confirmation email
   - Click the confirmation link
   - ⚠️ **For local development:** Check your terminal/console for the confirmation link if email isn't configured

---

## 👨‍💼 **Creating an Admin Account**

After creating a regular user account, you need to manually add yourself as an admin in the database.

### **Method 1: Using Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Go to your project:**
   - Select your project: `rmdmcfgifglvtpbmcxov`

3. **Open Table Editor:**
   - Click on **"Table Editor"** in the left sidebar
   - Select **"admin_users"** table

4. **Add new admin:**
   - Click **"Insert row"**
   - Find your `user_id` from the `profiles` or `auth.users` table
   - Fill in:
     - `user_id`: Your user's UUID from auth
     - Other fields will auto-populate
   - Click **"Save"**

5. **Refresh your app and you're now an admin!** ✅

---

### **Method 2: Using SQL Editor**

1. **First, find your user ID:**
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```

2. **Copy your user ID (UUID)**

3. **Insert admin record:**
   ```sql
   INSERT INTO admin_users (user_id)
   VALUES ('YOUR_USER_ID_HERE');
   ```
   Replace `YOUR_USER_ID_HERE` with the UUID from step 1.

4. **Verify:**
   ```sql
   SELECT * FROM admin_users;
   ```

---

## 🔑 **Example Credentials (Create These Yourself)**

### **Regular User Account**
```
Email:    user@example.com
Password: YourSecurePassword123
```

### **Admin Account**
```
Email:    admin@example.com
Password: YourAdminPassword123

Note: After signup, add this user to admin_users table!
```

---

## 🌐 **Login URLs**

### **Regular User Login**
```
http://localhost:8080/auth
```

### **Admin Login**
```
http://localhost:8080/admin/login
```
or
```
http://localhost:8080/admin
```
*(Will redirect to login if not authenticated)*

---

## 🔐 **Quick Admin Setup Script**

If you want to quickly set up an admin account, use this SQL script in Supabase SQL Editor:

```sql
-- Step 1: Create a new user (you'll need to do this through the signup form)
-- OR use this to find your existing user ID:
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Make that user an admin
-- Replace 'YOUR_EMAIL_HERE' with your actual email
INSERT INTO admin_users (user_id)
SELECT id 
FROM auth.users 
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify admin status
SELECT 
  au.id,
  au.user_id,
  u.email,
  au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

---

## 📱 **Testing Your Credentials**

### **1. Test Regular User Login**
1. Go to: `http://localhost:8080/auth`
2. Enter your email and password
3. Click "Sign In"
4. Should redirect to homepage or dashboard ✅

### **2. Test Admin Login**
1. Go to: `http://localhost:8080/admin`
2. Enter your admin email and password
3. Click "Sign In"
4. Should see admin dashboard with all sections ✅

---

## 🚨 **Troubleshooting**

### **"Email not confirmed"**
- Check your email for confirmation link
- For local dev, check terminal for magic link
- Or use Supabase Dashboard → Authentication → Users → confirm manually

### **"Invalid login credentials"**
- Double-check email and password
- Passwords are case-sensitive
- Make sure you signed up first

### **"Access denied" on Admin page**
- You need to add your user to `admin_users` table
- Follow the admin setup steps above
- Make sure you're logged in as the correct user

### **"User already registered"**
- Use "Sign In" instead of "Sign Up"
- Or use password reset if you forgot password

---

## 🔄 **Password Reset**

If you forget your password:

1. Go to: `http://localhost:8080/auth`
2. Click **"Forgot Password?"** (if available)
3. Or use Supabase Dashboard:
   - Go to Authentication → Users
   - Find your user
   - Click "..." → Send password recovery email

---

## 💡 **Recommended Setup**

### **For Development/Testing:**

**Create 2 accounts:**

1. **Admin Account:**
   ```
   Email:    admin@test.com
   Password: Admin@123
   Role:     Admin (add to admin_users table)
   ```

2. **Regular User Account:**
   ```
   Email:    user@test.com
   Password: User@123
   Role:     Regular user
   ```

This allows you to test both user experiences!

---

## 🎯 **Quick Start Checklist**

- [ ] Sign up at `/auth` with your email
- [ ] Confirm email (check inbox or terminal)
- [ ] Login successfully
- [ ] Get your user ID from Supabase
- [ ] Add your user ID to `admin_users` table
- [ ] Logout and login again
- [ ] Access admin panel at `/admin`
- [ ] Test Offer18 integration

---

## 📊 **Current Database Connection**

Your app is connected to:
```
Supabase Project ID: rmdmcfgifglvtpbmcxov
Supabase URL:        https://rmdmcfgifglvtpbmcxov.supabase.co
```

All users are stored in this Supabase project.

---

## 🔗 **Useful Links**

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Your Project:** https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov
- **Auth Users:** https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/users
- **Table Editor:** https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor
- **SQL Editor:** https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql

---

## ✨ **After Setting Up Admin**

Once you're logged in as admin, you can:
- ✅ Access Offer18 Integration
- ✅ Manage stores and deals
- ✅ View user analytics
- ✅ Approve withdrawals
- ✅ Configure site settings

---

**Remember:** There are no default credentials - you must create your own account and then promote yourself to admin using the database! 🔐

---

*Last Updated: January 31, 2026*
