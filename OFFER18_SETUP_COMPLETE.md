# ✅ Offer18 Integration Setup - COMPLETE

## 🎉 Configuration Status

Your Offer18 API credentials have been successfully configured!

### Configured Credentials

```
Affiliate ID: 744826
Merchant ID:  1446
API Key:      81ad73157134a49e6ec27cc8daaed65d
```

These credentials are now stored in your `.env` file and will be automatically loaded when the application starts.

---

## 🚀 Quick Start Guide

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Access the Admin Panel

1. Navigate to: `http://localhost:5173/admin` (or your configured port)
2. Go to the **Offer18 Integration** section

### Step 3: Test the Connection

In the Offer18 Integration panel:

1. Click on the **Configuration** tab
2. Click the **"Test Connection"** button
3. You should see: ✅ "Connection successful! Found X offers."

---

## 📊 How to Sync Offers

### Method 1: Sync All Active Offers (Recommended)

1. Go to the **Sync Offers** tab
2. Click **"Sync All Active Offers"**
3. This will:
   - Fetch all active offers from Offer18
   - Convert them to your store format
   - Save them to your Supabase database

### Method 2: Sync Only Authorized Offers

1. Go to the **Sync Offers** tab
2. Click **"Sync Only Authorized Offers"**
3. This syncs only the offers you're authorized for

### Method 3: Preview Before Syncing

1. Go to the **Sync Offers** tab
2. Click **"Fetch All Offers (Preview)"**
3. Switch to the **Browse Offers** tab to review
4. Each offer shows:
   - Store name and logo
   - Cashback rate and model (CPA, CPS, etc.)
   - Authorization status
   - Countries allowed

---

## 🔍 Understanding the Dashboard

### Stats Cards

After fetching offers, you'll see 4 stats cards:

- **📦 Total Offers**: All offers available in Offer18
- **📈 Active Offers**: Offers that are currently active
- **✅ Authorized**: Offers you're approved to promote
- **💾 Synced to DB**: Offers successfully saved to your database

### Browse Offers Tab

View detailed information for each offer:
- Logo and name
- Description/Terms
- Payout model (CPA, CPS, CPC, etc.)
- Cashback rate
- Allowed countries
- Authorization status

---

## 🔄 How Offer18 Integration Works

### 1. API Connection

The system uses the Offer18 API to fetch offers:
- **Base URL**: `https://api.offer18.com/api/af/offers`
- **Authentication**: API Key + Affiliate ID + Merchant ID
- **Format**: GET requests with query parameters

### 2. Data Conversion

Each Offer18 offer is converted to your store format:

```javascript
{
  name: "Store Name",
  slug: "store-name",
  description: "Offer description",
  logo_url: "https://...",
  cashback_percent: 5.0,
  cashback_type: "CPA",
  category: "Shopping",
  affiliate_url: "https://tracking-url...",
  network_type: "offer18",
  api_config: {
    offer_id: "123",
    click_url: "...",
    // ... more tracking data
  }
}
```

### 3. Database Sync

- **New stores**: Automatically created
- **Existing stores**: Updated with latest data
- **Tracking URLs**: Stored in `api_config` field

---

## 🎯 Tracking & Conversions

### How User Clicks are Tracked

1. **User clicks a store card** → System logs the click
2. **User is redirected** → Through Offer18's click URL
3. **User makes a purchase** → Offer18 tracks the conversion
4. **Postback received** → Your system updates the cashback

### Tracking URL Format

```
https://api.offer18.com/click?
  aid=744826
  &mid=1446
  &oid=OFFER_ID
  &s1=USER_SESSION_ID
```

### Postback Configuration

Set up in Offer18 dashboard:
```
Postback URL: https://your-domain.com/api/postback/offer18?
  transaction_id={transaction_id}
  &order_id={order_id}
  &amount={amount}
  &status={status}
```

---

## 🛠️ Troubleshooting

### Issue: "Please configure Offer18 API credentials first"

**Solution**: 
- Make sure the `.env` file has all three credentials
- Restart the development server
- Clear browser cache

### Issue: "API request failed: 401 Unauthorized"

**Solution**:
- Double-check your API Key
- Verify your Affiliate ID and Merchant ID
- Ensure credentials match those in your Offer18 dashboard

### Issue: "Connection successful but 0 offers found"

**Possible Causes**:
- No active offers in your Offer18 account
- No authorized offers yet
- Try fetching all offers instead of just active/authorized

### Issue: Offers not syncing to database

**Solution**:
- Check Supabase connection
- Verify `stores` table exists
- Check browser console for errors
- Ensure proper permissions on Supabase

---

## 📝 API Response Example

When you test the connection, here's what a successful response looks like:

```json
{
  "response": "200",
  "data": {
    "12345": {
      "offerid": "12345",
      "name": "Amazon India",
      "logo": "https://...",
      "status": "active",
      "category": "E-Commerce,Shopping",
      "model": "CPS",
      "payout": [{
        "payout": "5.00",
        "currency": "INR",
        "model": "CPS"
      }],
      "click_url": "https://api.offer18.com/click?...",
      "authorized": "true",
      ...
    }
  }
}
```

---

## 🎨 Admin Interface Features

### Configuration Tab
- Save API credentials
- Test connection
- View connection status

### Sync Offers Tab
- Quick sync buttons
- Sync active offers only
- Sync authorized offers only
- Preview before syncing

### Browse Offers Tab
- Scrollable list of all fetched offers
- Visual cards with logos
- Status badges (Active, Authorized)
- Payout information
- Country targeting info

---

## 🔐 Security Best Practices

### Environment Variables
✅ **DO**: Store credentials in `.env`
❌ **DON'T**: Commit `.env` to Git
❌ **DON'T**: Share API keys publicly

### Git Configuration
Your `.gitignore` should include:
```
.env
.env.local
.env.*.local
```

---

## 📊 Next Steps

### 1. Verify Your Setup
- [ ] Run the dev server
- [ ] Test the connection
- [ ] Fetch offers successfully

### 2. Sync Initial Offers
- [ ] Review available offers
- [ ] Sync active offers to database
- [ ] Verify in Supabase

### 3. Configure Postback
- [ ] Set up postback URL in Offer18
- [ ] Test conversion tracking
- [ ] Monitor admin tracking page

### 4. Go Live
- [ ] Deploy to production
- [ ] Update environment variables
- [ ] Test end-to-end flow

---

## 🆘 Need Help?

### Common Questions

**Q: How often should I sync offers?**
A: Sync daily or weekly to get latest offers and rates.

**Q: Can I filter offers by category?**
A: Yes! The API supports category filtering (coming soon to UI).

**Q: What happens if an offer becomes inactive?**
A: The sync process updates the status automatically.

**Q: Can I customize the cashback rates?**
A: Yes, after sync you can manually adjust rates in Supabase.

---

## 📚 Additional Resources

- [Offer18 API Documentation](https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api)
- [Integration Guide](./OFFER18_INTEGRATION_GUIDE.md)
- [Quick Start Guide](./OFFER18_QUICK_START.md)
- [Implementation Summary](./OFFER18_IMPLEMENTATION_SUMMARY.md)

---

## ✨ Success Checklist

- [x] API credentials configured
- [x] Environment variables set
- [ ] Development server running
- [ ] Connection tested successfully
- [ ] Offers fetched from API
- [ ] Offers synced to database
- [ ] Store cards displaying on frontend
- [ ] Click tracking working
- [ ] Postback configured
- [ ] Conversions tracking properly

---

**🎊 Congratulations!** Your Offer18 integration is ready to use. Start fetching and syncing offers to grow your cashback platform!

---

*Last Updated: January 31, 2026*
*Version: 1.0*
