# Offer18 API Integration - Quick Start

Welcome! This guide will help you integrate Offer18 API into your cashback platform in just a few minutes.

## 📋 What You'll Need

1. **Offer18 Affiliate Account** - Already have one or will be provided by your advertiser
2. **API Credentials** - Three pieces of information:
   - API Key
   - Affiliate ID (AID)
   - Merchant ID (MID)

---

## 🚀 Step-by-Step Setup

### Option 1: If you already have Offer18 credentials

#### Step 1: Add Credentials to `.env`

Open `.env` file and replace the placeholder values:

```env
VITE_OFFER18_API_KEY=your_actual_api_key
VITE_OFFER18_AFFILIATE_ID=your_actual_affiliate_id
VITE_OFFER18_MERCHANT_ID=your_actual_merchant_id
```

#### Step 2: Start Your App

```bash
npm run dev
```

#### Step 3: Access Admin Panel

1. Navigate to Admin Panel
2. Click **Offer18 Integration** in the sidebar
3. Your credentials should auto-load from `.env`
4. Click **Test Connection** to verify

#### Step 4: Sync Offers

1. Go to **Sync Offers** tab
2. Click **Sync All Active Offers** or **Sync Only Authorized Offers**
3. Wait for sync to complete
4. Check **Browse Offers** tab to preview synced offers
5. Offers are now available in your stores!

---

### Option 2: If you need to get Offer18 credentials

#### Step 1: Get Access from Your Network

Contact your affiliate network manager and request:

1. **Offer18 affiliate account** access
2. **API credentials** (Key, Affiliate ID, Merchant ID)
3. **Documentation URL** (usually provided in their affiliate portal)

#### Step 2: Once You Receive Credentials

Follow **Option 1** above with your new credentials.

---

## 🎯 Using the Integration

### Admin Panel Features

#### 1. **Configuration Tab**
- Enter/view API credentials
- Test connection to Offer18
- Save configuration

#### 2. **Sync Offers Tab**
- **Sync All Active Offers** - Imports all active offers from Offer18
- **Sync Only Authorized Offers** - Imports only offers you're approved for
- **Fetch All Offers (Preview)** - Preview offers without syncing

#### 3. **Browse Offers Tab**
- View all fetched offers
- See offer details (payout, model, countries, etc.)
- Preview before syncing to database

### What Happens During Sync?

When you sync offers:

1. ✅ Fetches offers from Offer18 API
2. ✅ Converts to your store format
3. ✅ Creates/updates stores in database
4. ✅ Sets up tracking URLs automatically
5. ✅ Preserves all offer metadata

### Synced Store Structure

Each Offer18 offer becomes a store with:

- **Name** from offer name
- **Logo** from offer logo URL
- **Cashback** from payout amount
- **Category** from offer category
- **Tracking URL** from offer click URL
- **Network Type** set to `offer18`
- **API Config** with full offer details

---

## 📊 API Information

### Base URL
```
https://api.offer18.com/api/af/offers
```

### API Domain
```
api.offer18.com
```

### Documentation
```
https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
```

### Example API Request
```
https://api.offer18.com/api/af/offers?key=YOUR_KEY&aid=YOUR_AID&mid=YOUR_MID&offer_status=1
```

---

## 🔧 Configuration Methods

### Method 1: Environment Variables (Recommended)

In `.env`:
```env
VITE_OFFER18_API_KEY=abc123...
VITE_OFFER18_AFFILIATE_ID=12345
VITE_OFFER18_MERCHANT_ID=67890
```

**Pros:**
- ✅ Secure
- ✅ Auto-loads in admin panel
- ✅ Easy to manage
- ✅ Version control safe (when .env is .gitignored)

### Method 2: Admin Panel

Enter credentials directly in **Offer18 Integration** → **Configuration** tab

**Pros:**
- ✅ No file editing needed
- ✅ Quick testing

**Cons:**
- ⚠️ Doesn't persist across page reloads (unless saved to backend)

---

## 🎓 Common Tasks

### Sync Offers Daily

**Option A: Manual**
1. Login to admin panel
2. Go to Offer18 Integration
3. Click "Sync All Active Offers"

**Option B: Automated**
Set up a cron job or scheduled task (requires backend setup):

```javascript
// Example: Daily sync at 3 AM
cron.schedule('0 3 * * *', async () => {
  await syncOffer18Offers();
});
```

### Filter Offers by Country

When browsing offers, check the `country_allow` field to show only relevant offers to users.

### Get Tracking URL

The system automatically generates tracking URLs when users click "Shop Now":

```
Original: https://network.o18.click/c?o=12345&m=678&a=910
With Tracking: https://network.o18.click/c?o=12345&m=678&a=910&s1=user123_session456
```

The `s1` parameter contains your user/session ID for conversion tracking.

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Credentials entered in `.env`
- [ ] Admin panel shows "Connected" badge
- [ ] Test connection successful
- [ ] Offers fetched successfully  
- [ ] Offers visible in Browse tab
- [ ] Offers synced to database
- [ ] Stores appear in Stores section
- [ ] Tracking URLs generated correctly
- [ ] Offers visible on frontend

---

## 🆘 Troubleshooting

### "API request failed: 401 Unauthorized"

**Fix:** Check your API credentials
- Verify API Key is correct
- Verify Affiliate ID is correct
- Verify Merchant ID is correct

### "No offers found"

**Fix:** 
- Try without `authorized=1` filter
- Check your Offer18 dashboard for available offers
- Contact advertiser to assign offers

### "Connection timeout"

**Fix:**
- Check internet connection
- Verify api.offer18.com is accessible
- Try again in  a few minutes

### "Offers not appearing in stores"

**Fix:**
- Check if sync was successful
- Verify `is_active` field in database
- Check browser console for errors
- Refresh the stores page

---

## 📞 Support

### Offer18 Documentation
- **Knowledge Base**: https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
- **API Domain**: api.offer18.com

### Your Integration Support
- Check `OFFER18_INTEGRATION_GUIDE.md` for detailed documentation
- Review admin panel logs
- Check browser developer console
- Contact your development team

---

## 🎉 Success!

You're all set! Your cashback platform can now:

✅ Fetch offers from Offer18
✅ Auto-sync new offers
✅ Track conversions
✅ Manage offer catalog
✅ Earn commissions

**Next Steps:**
1. Sync your first batch of offers
2. Test the complete tracking flow
3. Set up automated daily syncs
4. Configure postback URL (if needed)
5. Start earning! 🚀

---

**Need more details?** Check `OFFER18_INTEGRATION_GUIDE.md` for comprehensive documentation.
