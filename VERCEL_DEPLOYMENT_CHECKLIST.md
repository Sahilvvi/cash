# 🚀 VERCEL DEPLOYMENT CHECKLIST - Test Offer18 API

## ✅ Pre-Deployment Status
- [x] Code pushed to GitHub: `https://github.com/Sahilvvi/cash`
- [x] Offer18 credentials configured
- [ ] Deploy to Vercel
- [ ] Test Offer18 API integration live

---

## 📋 DEPLOYMENT STEPS (Follow in Order)

### **Step 1: Access Vercel**
1. Open browser and go to: **https://vercel.com**
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub repositories

### **Step 2: Import Your Project**
1. In Vercel dashboard, click **"Add New"** → **"Project"**
2. Find repository: **"cash"** or **"Sahilvvi/cash"**
3. Click **"Import"**

### **Step 3: Configure Build Settings**
Vercel auto-detects Vite. Verify these settings:

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
```

✅ These are usually auto-filled correctly

### **Step 4: Add Environment Variables** 🔑

Click **"Environment Variables"** and add ALL of these:

#### Supabase Configuration
```
Name: VITE_SUPABASE_PROJECT_ID
Value: rmdmcfgifglvtpbmcxov
```

```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA
```

```
Name: VITE_SUPABASE_URL
Value: https://rmdmcfgifglvtpbmcxov.supabase.co
```

#### Offer18 API Configuration (CRITICAL for testing!)
```
Name: VITE_OFFER18_API_KEY
Value: 81ad73157134a49e6ec27cc8daaed65d
```

```
Name: VITE_OFFER18_AFFILIATE_ID
Value: 744826
```

```
Name: VITE_OFFER18_MERCHANT_ID
Value: 1446
```

**⚠️ IMPORTANT**: For each variable, make sure to check:
- ✅ Production
- ✅ Preview
- ✅ Development

### **Step 5: Deploy**
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. You'll get a live URL like: `https://your-project-name.vercel.app`

---

## 🧪 POST-DEPLOYMENT TESTING

### Test Offer18 API Integration

Once deployed, follow these steps to verify Offer18 works:

#### 1. **Access Admin Panel** (2 minutes)
```
URL: https://your-project-name.vercel.app/admin
Login: notsahil@gmail.com
Password: [Your admin password]
```

#### 2. **Test API Connection** (1 minute)
- Navigate to **"Offer18 Integration"** tab
- Click **"Test Connection"** button
- ✅ Expected: Success message showing "Connected to Offer18 API"

#### 3. **Fetch Offers** (2 minutes)
- Go to **"Browse Offers"** tab
- Click **"Fetch Active Offers"**
- ✅ Expected: List of offers from Offer18 API appears

#### 4. **Sync Offers to Database** (3 minutes)
- Go to **"Sync Offers"** tab
- Click **"Sync All Active Offers"**
- Wait for sync to complete
- ✅ Expected: Success message with count of synced offers

#### 5. **Verify on Frontend** (1 minute)
- Navigate to: `https://your-project-name.vercel.app/stores`
- ✅ Expected: See stores with "Offer18" badge
- Click on an Offer18 store
- ✅ Expected: Redirects through tracking URL

#### 6. **Test Click Tracking** (2 minutes)
- As a logged-in user, click an Offer18 store
- Go to your user dashboard
- ✅ Expected: Click appears in "Recent Activity" or "Click History"

---

## 📊 Success Criteria Checklist

After deployment, verify all these work:

### Core Functionality
- [ ] Application loads without errors
- [ ] Login/Signup works
- [ ] User dashboard displays correctly
- [ ] Admin panel accessible

### Offer18 Integration (PRIMARY TEST)
- [ ] Admin can access Offer18 Integration section
- [ ] API connection test succeeds
- [ ] Can fetch offers from Offer18 API
- [ ] Offers display with correct data (name, cashback %, logo)
- [ ] Can sync offers to Supabase database
- [ ] Synced stores appear on `/stores` page
- [ ] Offer18 stores have "Offer18" badge
- [ ] Click tracking URLs are generated correctly
- [ ] Clicks are recorded in database

### Supabase Integration
- [ ] User authentication works
- [ ] Data saves to database
- [ ] Admin users table configured
- [ ] Stores table updated with Offer18 offers
- [ ] Clicks table records tracking data

### UI/UX
- [ ] Responsive design works on mobile
- [ ] All navigation routes work (no 404s)
- [ ] Images load correctly
- [ ] Forms submit properly

---

## 🐛 Common Issues & Solutions

### Issue 1: "Offer18 API Connection Failed"
**Cause**: Environment variables not set correctly

**Fix**:
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Verify all 3 Offer18 variables are set:
   - `VITE_OFFER18_API_KEY`
   - `VITE_OFFER18_AFFILIATE_ID`
   - `VITE_OFFER18_MERCHANT_ID`
3. After adding/fixing, go to Deployments tab
4. Click **"Redeploy"** on the latest deployment

### Issue 2: Blank page or 404 errors
**Cause**: SPA routing not configured

**Fix**: The `vercel.json` file should handle this. If issues persist:
1. Check that `vercel.json` exists in root
2. It should contain:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue 3: Build fails
**Cause**: TypeScript errors or missing dependencies

**Fix**:
1. Check build logs in Vercel
2. Test locally first: `npm run build`
3. Fix errors and push to GitHub
4. Vercel auto-redeploys

### Issue 4: No offers appearing after sync
**Cause**: Supabase connection or table structure

**Fix**:
1. Check Supabase environment variables
2. Verify `stores` table exists in Supabase
3. Check browser console for errors
4. Verify admin permissions

---

## 🔄 Future Updates

After initial deployment, updating is automatic:

```bash
# Make changes locally
# Then commit and push:
git add .
git commit -m "Update: description of changes"
git push origin main
```

✨ Vercel automatically rebuilds and deploys!

---

## 📞 Quick Reference Links

### Your Deployment
- **GitHub Repo**: https://github.com/Sahilvvi/cash
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Live URL**: (Will be shown after deployment)

### Offer18
- **Dashboard**: https://app.offer18.com
- **API Docs**: https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
- **Your Affiliate ID**: 744826
- **Your Merchant ID**: 1446

### Supabase
- **Dashboard**: https://supabase.com/dashboard
- **Your Project**: https://rmdmcfgifglvtpbmcxov.supabase.co

---

## 🎯 What Success Looks Like

After deployment, you should be able to:

1. ✅ Visit your live Vercel URL
2. ✅ Login as admin (notsahil@gmail.com)
3. ✅ See Offer18 Integration section in admin panel
4. ✅ Click "Test Connection" → Get success message
5. ✅ Fetch live offers from Offer18 API
6. ✅ Sync offers to your database
7. ✅ See Offer18 stores on `/stores` page
8. ✅ Track user clicks through Offer18 URLs
9. ✅ View click data in admin analytics

---

## 📝 Deployment Notes

**Date**: February 2, 2026  
**Repository**: Sahilvvi/cash  
**Framework**: React + Vite + TypeScript  
**Hosting**: Vercel  
**Database**: Supabase  
**API Integration**: Offer18  

**Admin Email**: notsahil@gmail.com  
**Affiliate ID**: 744826  

---

**Ready to Deploy?** Follow the steps above and test your Offer18 integration live! 🚀
