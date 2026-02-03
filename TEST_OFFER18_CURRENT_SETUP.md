# 🧪 OFFER18 INTEGRATION - TESTING GUIDE
## Test Your Live Offer18 API Integration (Current Setup)

---

## 📍 YOUR LIVE SITE
**https://cash-delta-ten.vercel.app/**

---

## ⚡ QUICK 5-STEP TEST (8 Minutes)

### ✅ STEP 1: Create Admin Account (2 minutes)

#### 1.1 Sign Up on Your Live Site
1. Go to: **https://cash-delta-ten.vercel.app/auth**
2. Click "Sign Up" (or register)
3. Enter:
   - **Email:** `notsahil@gmail.com` (or any email you want)
   - **Password:** Choose a strong password (remember it!)
   - **Full Name:** Your name
4. Click "Sign Up"
5. ✅ Account created!

#### 1.2 Make Yourself Admin
1. Go to: **https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql**
2. Paste this SQL:
   ```sql
   INSERT INTO admin_users (user_id)
   SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com'
   ON CONFLICT (user_id) DO NOTHING;
   ```
3. Click **"Run"**
4. ✅ You're now admin!

#### 1.3 Verify Admin Access
Go to: **https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql**

Run this to verify:
```sql
SELECT 
  u.email,
  au.created_at as admin_since,
  'Admin access granted ✓' as status
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'notsahil@gmail.com';
```

Should show your email with admin timestamp ✅

---

### ✅ STEP 2: Login to Admin Panel (1 minute)

1. Go to: **https://cash-delta-ten.vercel.app/admin**
2. Login with:
   - Email: `notsahil@gmail.com`
   - Password: [what you chose in Step 1]
3. ✅ Should see admin dashboard!

**What to look for:**
- Admin dashboard loads
- Sidebar with navigation visible
- "Offer18 Integration" tab should be visible
- No error messages

---

### ✅ STEP 3: Test Offer18 API Connection (1 minute)

1. In admin panel, click **"Offer18 Integration"** tab
2. You should see the Offer18 interface
3. Click **"Test Connection"** button
4. Wait 2-3 seconds

**✅ Expected Success:**
```
✓ Connected to Offer18 API
✓ API Key Valid
✓ Affiliate ID: 744826
✓ Merchant ID: 1446
```

**❌ If Failed:**
- Check browser console (F12) for errors
- Verify Vercel environment variables are set
- See troubleshooting section below

---

### ✅ STEP 4: Fetch Offers from Offer18 (2 minutes)

1. Click **"Browse Offers"** tab
2. Select filters (optional):
   - Status: **Active Offers**
   - Category: **All**
   - Country: **India** (or your country)
3. Click **"Fetch Offers"** button
4. Wait 5-10 seconds for API response

**✅ Expected Success:**
- List of 10+ offers appears
- Each offer shows:
  - Store name (e.g., "Amazon", "Flipkart")
  - Logo/image
  - Cashback percentage (e.g., "5% cashback")
  - Status (Active/Authorized)
  - "Sync" button

**What to verify:**
- [ ] Offers load successfully
- [ ] Store names are readable
- [ ] Cashback rates are displayed
- [ ] Images/logos load correctly
- [ ] At least 10+ offers visible

---

### ✅ STEP 5: Sync Offers to Database (2 minutes)

1. Click **"Sync Offers"** tab
2. Choose one of these options:
   - **"Sync All Active Offers"** (recommended for first test)
   - **"Sync Authorized Offers Only"** (more selective)
3. Click the sync button
4. Watch progress indicator
5. Wait for completion (30-60 seconds)

**✅ Expected Success:**
```
✓ Successfully synced 47 offers
✓ Added to database
✓ Ready for users
```

**Verify in Dashboard:**
- Success message appears
- Number of offers synced is shown
- No error messages

---

## 🔍 VERIFICATION STEPS

### Verify 1: Check Database (1 minute)

Go to: **https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor**

1. Click **"stores"** table
2. Look for new rows with:
   - `network_type = 'offer18'`
   - Recent `created_at` timestamp

Run this SQL to count:
```sql
SELECT COUNT(*) as total_offer18_stores
FROM stores
WHERE network_type = 'offer18';
```

Should show the number of synced offers ✅

### Verify 2: View on Frontend (1 minute)

1. Go to: **https://cash-delta-ten.vercel.app/stores**
2. Look for stores with **"Offer18"** badge
3. Verify:
   - [ ] Offer18 stores appear in list
   - [ ] Store names match what you synced
   - [ ] Cashback percentages are correct
   - [ ] Logos display properly

### Verify 3: Test Click Tracking (2 minutes)

1. **Logout from admin** if logged in
2. **Login as regular user** (or signup new account)
3. Go to: **https://cash-delta-ten.vercel.app/stores**
4. Click on any **Offer18 store**
5. Check the redirect URL

**✅ Expected URL format:**
```
https://api.offer18.com/click?aid=744826&mid=1446&oid=XXXXX&s1=XXXXX
```

**Verify URL contains:**
- [ ] `api.offer18.com/click`
- [ ] `aid=744826` (your Affiliate ID)
- [ ] `mid=1446` (your Merchant ID)
- [ ] `oid=` (Offer ID)
- [ ] `s1=` (Session/User ID)

### Verify 4: Check Click Logged (1 minute)

In Supabase SQL Editor:
```sql
SELECT 
  user_id,
  store_id,
  network_type,
  clicked_at
FROM affiliate_clicks
WHERE network_type = 'offer18'
ORDER BY clicked_at DESC
LIMIT 10;
```

Should show your recent click ✅

---

## 🎯 COMPLETE SUCCESS CHECKLIST

Mark each as you complete:

### Setup
- [ ] Signed up on live site
- [ ] Made myself admin in Supabase
- [ ] Can login to admin panel
- [ ] Offer18 Integration tab visible

### API Connection
- [ ] Test Connection succeeded
- [ ] Shows "Connected to Offer18 API"
- [ ] Displays correct Affiliate ID (744826)
- [ ] Displays correct Merchant ID (1446)

### Fetching Offers
- [ ] Can browse offers from API
- [ ] 10+ offers appear
- [ ] Offer data is complete (name, cashback, logo)
- [ ] No errors in browser console

### Syncing Offers
- [ ] Sync completed successfully
- [ ] Shows number of offers synced
- [ ] Offers appear in Supabase database
- [ ] `network_type = 'offer18'` is set

### Frontend Display
- [ ] Offer18 stores show on /stores page
- [ ] Stores have "Offer18" badge
- [ ] Store data displays correctly
- [ ] Can click on stores

### Click Tracking
- [ ] Click redirects through Offer18 URL
- [ ] URL has correct parameters
- [ ] Click is logged in database
- [ ] affiliate_clicks table has entry

**If ALL are checked ✅ → Your Offer18 integration is FULLY WORKING! 🎉**

---

## 🐛 TROUBLESHOOTING

### Issue 1: "Can't access admin panel"

**Symptoms:** 
- Login works but redirects to user dashboard
- No "Offer18 Integration" tab

**Fix:**
```sql
-- Check admin_users table
SELECT * FROM admin_users WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com'
);

-- If empty, add yourself:
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com';
```

Then **logout and login again**.

---

### Issue 2: "API Connection Failed"

**Symptoms:**
- Test Connection shows error
- "Unable to connect to Offer18 API"

**Fix Steps:**

1. **Check Vercel Environment Variables:**
   - Go to: https://vercel.com/dashboard
   - Select project: **cash**
   - Settings → Environment Variables
   - Verify these exist:
     ```
     VITE_OFFER18_API_KEY = 81ad73157134a49e6ec27cc8daaed65d
     VITE_OFFER18_AFFILIATE_ID = 744826
     VITE_OFFER18_MERCHANT_ID = 1446
     ```

2. **Check Browser Console:**
   - Press F12
   - Go to Console tab
   - Look for errors related to:
     - CORS errors
     - Network errors
     - 401 Unauthorized

3. **If variables missing:**
   - Add them in Vercel
   - Check all 3 environments: Production, Preview, Development
   - **Redeploy** the app

---

### Issue 3: "No offers loading"

**Symptoms:**
- Browse Offers shows empty
- "No offers found" message

**Fix:**

1. **Check API Key Validity:**
   - Login to: https://app.offer18.com
   - Verify your API key is active
   - Check affiliate account status

2. **Try Direct API Call:**
   Open browser console and run:
   ```javascript
   fetch('https://api.offer18.com/v1/offers?apiKey=81ad73157134a49e6ec27cc8daaed65d&affiliateId=744826')
     .then(r => r.json())
     .then(d => console.log(d));
   ```
   
   Should show offers in console.

3. **Check Filters:**
   - Try "All" instead of specific category
   - Try "Active" instead of "Authorized"
   - Some filters may return no results

---

### Issue 4: "Sync fails"

**Symptoms:**
- Sync button doesn't work
- "Failed to sync offers" error

**Fix:**

1. **Check Supabase Connection:**
   Run in Supabase SQL:
   ```sql
   -- Test if you can insert
   INSERT INTO stores (name, slug) 
   VALUES ('Test Store', 'test-store-' || gen_random_uuid());
   ```
   
   If this fails → RLS policy issue

2. **Check Admin Permissions:**
   ```sql
   -- Verify you're admin
   SELECT is_admin((SELECT id FROM auth.users WHERE email = 'notsahil@gmail.com'));
   ```
   
   Should return `true`

3. **Check Browser Console:**
   - F12 → Console
   - Look for specific error messages
   - Share error if you need help

---

### Issue 5: "Stores not showing on frontend"

**Symptoms:**
- Sync succeeded
- Stores in database
- But not visible on /stores page

**Fix:**

1. **Hard Refresh:**
   - Press Ctrl+Shift+R (Windows)
   - Or Cmd+Shift+R (Mac)
   - Clears cache

2. **Check Database:**
   ```sql
   SELECT name, network_type, is_active 
   FROM stores 
   WHERE network_type = 'offer18'
   LIMIT 10;
   ```
   
   Verify `is_active = true`

3. **Check Frontend Filter:**
   - Check if StoresPage component has filters
   - Ensure it's not filtering out Offer18 stores

---

### Issue 6: "Click tracking not working"

**Symptoms:**
- Click redirects but no entry in database
- affiliate_clicks table empty

**Fix:**

1. **Check User Logged In:**
   - Tracking requires user to be logged in
   - Login first, then click

2. **Check Table Exists:**
   ```sql
   SELECT * FROM affiliate_clicks LIMIT 1;
   ```
   
   If error → Table doesn't exist

3. **Check RLS Policy:**
   ```sql
   -- Check if clicks table has proper policies
   SELECT * FROM pg_policies 
   WHERE tablename = 'affiliate_clicks';
   ```

---

## 📊 TESTING CHECKLIST (Print This!)

```
┌─────────────────────────────────────────────┐
│  OFFER18 TESTING CHECKLIST                  │
├─────────────────────────────────────────────┤
│                                             │
│  SETUP                                      │
│  ☐ Created account on live site            │
│  ☐ Added as admin in Supabase              │
│  ☐ Can access admin panel                  │
│                                             │
│  API CONNECTION                             │
│  ☐ Test Connection passed                  │
│  ☐ Shows correct Affiliate ID              │
│  ☐ Shows correct Merchant ID               │
│                                             │
│  FETCH OFFERS                               │
│  ☐ Can browse offers                       │
│  ☐ 10+ offers display                      │
│  ☐ All offer data shows correctly          │
│                                             │
│  SYNC OFFERS                                │
│  ☐ Sync completed successfully             │
│  ☐ Offers in Supabase database             │
│  ☐ network_type = 'offer18'                │
│                                             │
│  FRONTEND DISPLAY                           │
│  ☐ Stores show on /stores page             │
│  ☐ "Offer18" badge visible                 │
│  ☐ Correct cashback percentages            │
│                                             │
│  CLICK TRACKING                             │
│  ☐ Click generates tracking URL            │
│  ☐ URL has Offer18 parameters              │
│  ☐ Click logged in database                │
│                                             │
│  ✅ ALL DONE = INTEGRATION WORKING!         │
└─────────────────────────────────────────────┘
```

---

## 🎯 WHAT TO TEST IN EACH SECTION

### Test Connection (1 item)
✅ API authentication works

### Browse Offers (4 items)
✅ Can fetch offers from Offer18 API  
✅ Offers display with complete data  
✅ Filtering works correctly  
✅ No API errors occur  

### Sync Offers (3 items)
✅ Sync process completes  
✅ Data saves to Supabase  
✅ Correct network_type tag applied  

### Frontend (3 items)
✅ Stores appear on public page  
✅ Offer18 stores have badge  
✅ Data displays accurately  

### Tracking (3 items)
✅ Tracking URLs generated correctly  
✅ Parameters include affiliate IDs  
✅ Clicks logged in database  

**Total Tests: 14**  
**Pass All = Production Ready! 🎉**

---

## 📞 QUICK REFERENCE

### URLs You'll Need
```
Live Site: https://cash-delta-ten.vercel.app/
Admin Panel: https://cash-delta-ten.vercel.app/admin
Sign Up: https://cash-delta-ten.vercel.app/auth
Stores Page: https://cash-delta-ten.vercel.app/stores
Supabase SQL: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/sql
Supabase Tables: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor
Vercel Dashboard: https://vercel.com/dashboard
```

### Credentials
```
Offer18 Affiliate ID: 744826
Offer18 Merchant ID: 1446
Offer18 API Key: 81ad73157134a49e6ec27cc8daaed65d
Supabase Project: rmdmcfgifglvtpbmcxov
```

### SQL Helpers
```sql
-- Make someone admin
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'YOUR-EMAIL@gmail.com';

-- Check Offer18 stores
SELECT COUNT(*) FROM stores WHERE network_type = 'offer18';

-- Check recent clicks
SELECT * FROM affiliate_clicks 
WHERE network_type = 'offer18' 
ORDER BY clicked_at DESC LIMIT 10;

-- Verify admin status
SELECT is_admin((SELECT id FROM auth.users WHERE email = 'YOUR-EMAIL'));
```

---

## ⏱️ ESTIMATED TIME

| Step | Time | Difficulty |
|------|------|------------|
| Create admin account | 2 min | Easy |
| Login to admin | 1 min | Easy |
| Test API connection | 1 min | Easy |
| Fetch offers | 2 min | Easy |
| Sync offers | 2 min | Easy |
| **Total** | **8 min** | **Easy** |

---

## 🎉 SUCCESS LOOKS LIKE

After completing all steps, you should be able to:

1. ✅ Login as admin
2. ✅ See Offer18 Integration section
3. ✅ Test API connection successfully
4. ✅ Browse 10+ offers from Offer18
5. ✅ Sync offers to your database
6. ✅ See Offer18 stores on your website
7. ✅ Track user clicks through Offer18 URLs
8. ✅ View click data in admin analytics

**This means your Offer18 integration is LIVE and WORKING! 🎊**

---

**Ready to start?** Follow the 5 steps above in order. Good luck! 🚀
