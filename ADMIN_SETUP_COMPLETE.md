# 🎯 COMPLETE ADMIN SETUP GUIDE FOR notsahil@gmail.com

## ✅ I've Created Everything You Need!

I've set up **3 automated methods** to add notsahil@gmail.com as admin. Choose whichever is easiest for you!

---

## 🚀 **METHOD 1: Automated Script (Recommended)**

### **Step 1: First, Sign Up**
1. Open: `http://localhost:8080/auth`
2. Sign up with:
   - **Email:** `notsahil@gmail.com`
   - **Password:** Choose any password (remember it!)
   - **Full Name:** Any name
3. Click "Sign Up"

### **Step 2: Run the Automated Script**

```bash
# Install dependencies
cd scripts
npm install

# Run the script
npm run add-admin notsahil@gmail.com
```

**Or run directly:**
```bash
npx tsx scripts/add-admin.ts notsahil@gmail.com
```

### **Step 3: Login**
- Go to: `http://localhost:8080/admin`
- Login with notsahil@gmail.com
- Done! ✅

---

## 🛠️ **METHOD 2: SQL Migration**

### **Step 1: Sign Up First** (Same as above)

### **Step 2: Apply Migration**

**Option A: Using Supabase Dashboard**
1. Open: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql
2. Copy this SQL:
   ```sql
   INSERT INTO admin_users (user_id)
   SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com';
   ```
3. Click "Run"
4. Done! ✅

**Option B: Using Supabase CLI**
```bash
supabase db reset
```
This will run the migration I created: `20260131095400_add_notsahil_admin.sql`

---

## 📝 **METHOD 3: Manual Dashboard**

### **Step 1: Sign Up** (Same as above)

### **Step 2: Manual Setup**

1. **Get User ID:**
   - Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/users
   - Find: notsahil@gmail.com
   - Copy the **ID** (UUID)

2. **Add to Admin Table:**
   - Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor
   - Select table: **admin_users**
   - Click: **Insert row**
   - Paste user ID in **user_id** field
   - Click: **Save**

3. **Done!** ✅

---

## 📁 **Files I Created For You**

1. **`scripts/add-admin.ts`** - Automated TypeScript script
2. **`scripts/package.json`** - Dependencies for script
3. **`supabase/migrations/20260131095400_add_notsahil_admin.sql`** - Migration file
4. **`add-admin.ps1`** - PowerShell helper script
5. **`LOGIN_CREDENTIALS_GUIDE.md`** - Full documentation

---

## ⚡ **Quick Start (Fastest Way)**

```bash
# 1. Sign up first at http://localhost:8080/auth
#    Email: notsahil@gmail.com
#    Password: [choose one]

# 2. Run this command:
cd scripts && npm install && npm run add-admin
```

That's it! 🎉

---

## 🔍 **Verify It Worked**

Run this in Supabase SQL Editor:
```sql
SELECT 
  u.email,
  au.created_at as admin_since
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'notsahil@gmail.com';
```

Should show: **notsahil@gmail.com** with admin timestamp ✅

---

## 🎊 **After Setup**

### **Login as Admin:**
- **URL:** `http://localhost:8080/admin`
- **Email:** `notsahil@gmail.com`
- **Password:** [what you chose during signup]

### **Access Offer18:**
1. Click "Offer18 Integration" in sidebar
2. Click "Test Connection"
3. Your credentials are ready:
   - ✅ Affiliate ID: 744826
   - ✅ Merchant ID: 1446
   - ✅ API Key: Configured

---

## 🆘 **Troubleshooting**

### **"User not found"**
- Make sure you signed up first at `/auth`
- Check email spelling: `notsahil@gmail.com`

### **Script won't run**
```bash
# Install dependencies
cd scripts
npm install

# Try again
npm run add-admin
```

### **Still having issues?**
Use Method 2 (SQL) - it's the most reliable!

---

## 📞 **Quick Links**

- **Signup:** http://localhost:8080/auth
- **Admin Login:** http://localhost:8080/admin
- **Supabase SQL:** https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql
- **Supabase Users:** https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/auth/users

---

## ✨ **Summary**

1. ✅ Sign up at `/auth` with notsahil@gmail.com
2. ✅ Run: `cd scripts && npm install && npm run add-admin`
3. ✅ Login at `/admin`
4. ✅ Test Offer18 integration!

**Everything is ready to go! Just sign up and run the script!** 🚀

---

*Created: January 31, 2026, 3:55 PM*
*All credentials and scripts are configured and ready to use!*
