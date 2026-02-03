# 🧪 OFFER18 API LIVE TESTING GUIDE

## 🎉 Your Live Application
**URL**: https://cash-delta-ten.vercel.app/

✅ **Status**: Successfully Deployed!  
✅ **Framework**: React + Vite  
✅ **Hosting**: Vercel  
✅ **Database**: Supabase  

---

## 📋 COMPREHENSIVE TESTING CHECKLIST

Follow these steps in order to fully test your Offer18 API integration on the live site.

---

### **PHASE 1: Basic Site Verification** (5 minutes)

#### 1.1 Homepage Check
- [ ] Visit: `https://cash-delta-ten.vercel.app/`
- [ ] Verify homepage loads correctly
- [ ] Check that navigation menu is visible
- [ ] Ensure no console errors (F12 → Console)

#### 1.2 User Authentication
- [ ] Click "Sign Up" or "Login"
- [ ] Test user registration with a new email
- [ ] Verify email confirmation (check Supabase)
- [ ] Login with test account
- [ ] Access user dashboard

#### 1.3 Basic Navigation
- [ ] Test all navigation links
- [ ] Visit `/stores` page
- [ ] Visit `/dashboard` page
- [ ] Check responsive design (mobile view)

**✅ Expected Result**: All pages load without errors, navigation works smoothly

---

### **PHASE 2: Admin Panel Access** (3 minutes)

#### 2.1 Admin Login
**URL**: `https://cash-delta-ten.vercel.app/admin`

**Credentials**:
- Email: `notsahil@gmail.com`
- Password: [Your admin password]

#### 2.2 Admin Dashboard Verification
- [ ] Admin dashboard loads
- [ ] Can see overview stats
- [ ] All admin tabs are visible:
  - Overview
  - Users
  - Stores
  - Cashback
  - **Offer18 Integration** ← KEY SECTION
  - Analytics
  - Settings

**✅ Expected Result**: Admin panel accessible, all sections visible

---

### **PHASE 3: Offer18 API Integration Testing** 🎯

This is the **PRIMARY TEST** for your Offer18 API!

#### 3.1 Access Offer18 Section
- [ ] In admin panel, click **"Offer18 Integration"** tab
- [ ] Verify section loads without errors
- [ ] Check that all sub-tabs are visible:
  - Overview
  - Browse Offers
  - Sync Offers
  - Settings

**URL**: `https://cash-delta-ten.vercel.app/admin` → Offer18 Integration

#### 3.2 Test API Connection ⚡
**Location**: Offer18 Integration → Overview tab

**Steps**:
1. Click **"Test Connection"** button
2. Wait for response (2-3 seconds)
3. Check the result message

**✅ Expected Success**:
```
✓ Connected to Offer18 API
✓ API Key Valid
✓ Affiliate ID: 744826
✓ Merchant ID: 1446
```

**❌ If Failed**:
- Check browser console (F12) for errors
- Verify environment variables in Vercel
- See troubleshooting section below

#### 3.3 Browse Offer18 Offers 📦
**Location**: Offer18 Integration → Browse Offers tab

**Steps**:
1. Click **"Browse Offers"** tab
2. Select filter options:
   - **Status**: Active Offers
   - **Category**: All (or specific category)
   - **Country**: India
3. Click **"Fetch Offers"** button
4. Wait for offers to load (5-10 seconds)

**✅ Expected Success**:
- List of offers appears
- Each offer shows:
  - Store name
  - Logo/image
  - Cashback percentage
  - "Sync" button
  - Offer status (Active/Authorized)

**Test Data Points**:
- [ ] At least 10+ offers appear
- [ ] Offer names are readable
- [ ] Cashback rates are shown (e.g., "5% cashback")
- [ ] Logos load correctly
- [ ] Can scroll through offers

#### 3.4 Sync Offers to Database 💾
**Location**: Offer18 Integration → Sync Offers tab

**Steps**:
1. Click **"Sync Offers"** tab
2. Choose sync option:
   - Option A: **"Sync All Active Offers"** (recommended for first test)
   - Option B: **"Sync Authorized Offers Only"**
3. Click sync button
4. Monitor progress indicator
5. Wait for completion message (can take 30-60 seconds for large batches)

**✅ Expected Success**:
```
✓ Successfully synced 47 offers
✓ Added to stores database
✓ Ready for users
```

**Verification After Sync**:
- [ ] Check Supabase `stores` table for new entries
- [ ] Verify `network_type = 'offer18'` for synced stores
- [ ] Confirm `tracking_url` contains Offer18 parameters

#### 3.5 Verify Synced Stores on Frontend 🏪
**Location**: `https://cash-delta-ten.vercel.app/stores`

**Steps**:
1. Navigate to `/stores` page
2. Look for stores with "Offer18" badge
3. Verify offer details are correct

**✅ Expected Success**:
- [ ] Offer18 stores appear in store list
- [ ] Each has "Offer18" badge or indicator
- [ ] Store name matches API data
- [ ] Cashback percentage is correct
- [ ] Store logo/image displays
- [ ] Click on store shows details

#### 3.6 Test Click Tracking 🖱️
**Location**: Frontend stores page

**Steps**:
1. **Login as a regular user** (not admin)
2. Go to `/stores` page
3. Click on an **Offer18 store**
4. Verify tracking behavior

**✅ Expected Success**:
- [ ] Redirects through tracking URL
- [ ] URL contains: `api.offer18.com/click?`
- [ ] URL parameters include:
  - `aid=744826` (Affiliate ID)
  - `mid=1446` (Merchant ID)
  - `oid=` (Offer ID)
  - `s1=` (Session/User ID)
- [ ] Click is logged in database (`affiliate_clicks` table)
- [ ] Finally redirects to merchant website

**Verify in Database**:
```sql
-- Check Supabase affiliate_clicks table
SELECT * FROM affiliate_clicks 
WHERE network_type = 'offer18' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### 3.7 Admin Analytics Check 📊
**Location**: Admin Panel → Offer18 Integration → Overview

**Verify These Stats**:
- [ ] Total offers available from API
- [ ] Total offers synced to database
- [ ] Total clicks on Offer18 stores
- [ ] Recent activity log
- [ ] Top performing offers

---

### **PHASE 4: Advanced Offer18 Testing** (Optional)

#### 4.1 Test Specific Offer Categories
**Test Different Categories**:
- [ ] E-commerce
- [ ] Fashion
- [ ] Electronics
- [ ] Travel
- [ ] Food Delivery

**Verify**: Each category fetches relevant offers

#### 4.2 Test Offer Filtering
- [ ] Filter by "Active" status
- [ ] Filter by "Authorized" status
- [ ] Filter by cashback percentage (highest first)
- [ ] Search by store name

#### 4.3 Test Bulk Operations
- [ ] Sync 10 offers
- [ ] Sync 50 offers
- [ ] Sync 100+ offers
- [ ] Measure sync speed

#### 4.4 Test Update/Refresh
- [ ] Click "Refresh Offers" button
- [ ] Verify updated cashback rates
- [ ] Check for new offers added by Offer18

---

## 🔍 WHAT TO LOOK FOR (Success Indicators)

### ✅ API Connection Working:
1. No CORS errors in console
2. API responses return in 2-5 seconds
3. Valid JSON data received
4. Offer18 logo/branding appears

### ✅ Data Syncing Working:
1. Offers appear in Supabase `stores` table
2. `network_type` field = 'offer18'
3. `tracking_url` contains Offer18 parameters
4. Store data matches API response

### ✅ Click Tracking Working:
1. Clicks redirect through Offer18 URL
2. URL contains correct affiliate parameters
3. Database logs each click
4. Session/user ID is tracked

### ✅ Admin Panel Working:
1. All statistics display correctly
2. Can browse, filter, and sync offers
3. Real-time updates appear
4. No JavaScript errors

---

## 🐛 TROUBLESHOOTING GUIDE

### Problem 1: "API Connection Failed"
**Symptoms**: Test connection button shows error

**Solutions**:
1. **Check Environment Variables in Vercel**:
   - Go to: https://vercel.com/dashboard
   - Select project: `cash`
   - Settings → Environment Variables
   - Verify these exist:
     ```
     VITE_OFFER18_API_KEY = 81ad73157134a49e6ec27cc8daaed65d
     VITE_OFFER18_AFFILIATE_ID = 744826
     VITE_OFFER18_MERCHANT_ID = 1446
     ```

2. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

3. **Check Browser Console**:
   - Press F12
   - Look for errors related to:
     - CORS
     - 401 Unauthorized
     - Network errors

### Problem 2: "Offers Not Loading"
**Symptoms**: Browse Offers tab shows empty or error

**Solutions**:
1. **Check API Rate Limits**: Offer18 may have rate limits
2. **Verify API Key**: Confirm key is valid in Offer18 dashboard
3. **Test API Manually**:
   ```bash
   curl -X GET \
     "https://api.offer18.com/v1/offers?apiKey=81ad73157134a49e6ec27cc8daaed65d&affiliateId=744826" \
     -H "Content-Type: application/json"
   ```

### Problem 3: "Sync Not Working"
**Symptoms**: Sync button doesn't add offers to database

**Solutions**:
1. **Check Supabase Connection**:
   - Verify `VITE_SUPABASE_*` variables in Vercel
   - Test Supabase connection in admin panel

2. **Check Database Permissions**:
   - Ensure `stores` table exists
   - Verify INSERT permissions for service role

3. **Check Browser Console**: Look for specific error messages

### Problem 4: "Click Tracking Not Recording"
**Symptoms**: Clicks don't appear in database

**Solutions**:
1. **Verify Table Exists**:
   - Check if `affiliate_clicks` table exists in Supabase
   - Create if missing (see schema below)

2. **Check User Authentication**:
   - User must be logged in for tracking
   - Verify session is active

3. **Test Tracking URL**:
   - Click a store and check console for tracking POST request
   - Should see: `POST /api/track-click` or similar

### Problem 5: "Stores Not Showing on Frontend"
**Symptoms**: Synced stores don't appear on `/stores` page

**Solutions**:
1. **Check Database Query**:
   - Verify stores are in database
   - Check `network_type` filter

2. **Clear Cache**:
   - Hard refresh browser (Ctrl+Shift+R)
   - Clear browser cache

3. **Check Component Logic**:
   - Verify StoresPage component fetches Offer18 stores
   - Check filter/search logic

---

## 📊 DATABASE VERIFICATION QUERIES

Use these in Supabase SQL Editor to verify data:

### Check Synced Offer18 Stores
```sql
SELECT 
  id,
  name,
  network_type,
  cashback_rate,
  created_at
FROM stores
WHERE network_type = 'offer18'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Click Tracking
```sql
SELECT 
  user_id,
  store_id,
  network_type,
  created_at
FROM affiliate_clicks
WHERE network_type = 'offer18'
ORDER BY created_at DESC
LIMIT 20;
```

### Count Offer18 Integration Status
```sql
SELECT 
  network_type,
  COUNT(*) as total_stores
FROM stores
GROUP BY network_type;
```

---

## 🎯 SUCCESS CRITERIA

Your Offer18 integration is **fully working** if:

✅ **Connection**: API test shows "Connected" ✓  
✅ **Browse**: Can fetch 10+ offers from Offer18 API ✓  
✅ **Sync**: Offers successfully save to Supabase ✓  
✅ **Display**: Offer18 stores appear on `/stores` page ✓  
✅ **Tracking**: Clicks generate correct tracking URLs ✓  
✅ **Logging**: Clicks are recorded in database ✓  
✅ **Admin**: All stats and analytics work ✓  

**If all 7 are green ✅ → Your integration is COMPLETE! 🎉**

---

## 📸 TESTING SCREENSHOT CHECKLIST

Take screenshots of these to document success:

1. ✅ Homepage loaded successfully
2. ✅ Admin panel - Offer18 section visible
3. ✅ API connection test - Success message
4. ✅ Browse Offers - List of offers from API
5. ✅ Sync Offers - Success confirmation
6. ✅ Frontend `/stores` - Offer18 stores visible
7. ✅ Click tracking URL - Proper Offer18 parameters
8. ✅ Database - Synced stores in Supabase
9. ✅ Database - Clicks logged in affiliate_clicks table
10. ✅ Admin analytics - Stats displaying

---

## 🆘 QUICK HELP REFERENCE

### Environment Variables Needed (Vercel)
```
VITE_SUPABASE_PROJECT_ID = rmdmcfgifglvtpbmcxov
VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGci...
VITE_SUPABASE_URL = https://rmdmcfgifglvtpbmcxov.supabase.co
VITE_OFFER18_API_KEY = 81ad73157134a49e6ec27cc8daaed65d
VITE_OFFER18_AFFILIATE_ID = 744826
VITE_OFFER18_MERCHANT_ID = 1446
```

### Your Credentials
- **Affiliate ID**: 744826
- **Merchant ID**: 1446
- **API Key**: 81ad73157134a49e6ec27cc8daaed65d

### Important URLs
- **Live Site**: https://cash-delta-ten.vercel.app/
- **Admin Panel**: https://cash-delta-ten.vercel.app/admin
- **Stores Page**: https://cash-delta-ten.vercel.app/stores
- **Offer18 Dashboard**: https://app.offer18.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## 📞 If You Need Help

1. **Check browser console** (F12) for specific errors
2. **Check Vercel deployment logs** for build/runtime errors
3. **Check Supabase logs** for database errors
4. **Review environment variables** - most issues come from here!

---

**Testing Date**: February 2, 2026  
**Live URL**: https://cash-delta-ten.vercel.app/  
**Integration**: Offer18 API  
**Affiliate ID**: 744826  

**Ready to test? Follow the checklist above step by step! 🚀**
