# 🚀 Offer18 API Integration - Complete Package

Your cashback platform now includes **full Offer18 affiliate network integration**! This package provides everything you need to fetch, sync, and track offers from Offer18.

---

## 📦 What's Included

### 1. **Core Service** (`src/services/offer18Service.ts`)
- Complete Offer18 API wrapper
- Type-safe interfaces for all API responses
- Helper methods for common operations
- Automatic URL generation
- Smart offer filtering and conversion

### 2. **Admin Component** (`src/components/admin/AdminOffer18.tsx`)
- Beautiful, intuitive admin interface
- Configuration management
- One-click offer syncing
- Offer browsing and preview
- Real-time statistics
- Connection testing

### 3. **Comprehensive Documentation**
- **OFFER18_QUICK_START.md** - Get started in 5 minutes
- **OFFER18_INTEGRATION_GUIDE.md** - Complete technical reference
- API examples and best practices
- Troubleshooting guides

### 4. **Complete Integration**
- Integrated into admin panel
- Environment variable support
- Auto-configuration
- Database sync functionality

---

## 🎯 Key Features

### For Administrators

✅ **Easy Configuration**
- Add credentials via .env or admin panel
- Auto-load from environment variables
- Test connection before syncing

✅ **Flexible Syncing**
- Sync all active offers
- Sync only authorized offers
- Preview before syncing
- Manual or automated sync

✅ **Offer Management**
- Browse all fetched offers
- View detailed offer information
- Filter by category, model, country
- Real-time statistics

✅ **Smart Conversion**
- Automatic store creation/update
- Preserve existing data
- Handle duplicates intelligently
- Track sync status

### For Developers

✅ **Type-Safe API**
- Full TypeScript support
- Comprehensive interfaces
- Auto-completion in IDEs
- Type checking at compile time

✅ **Flexible Architecture**
- Singleton service pattern
- Reusable helper methods
- Easy to extend
- Well-documented

✅ **Best Practices**
- Error handling
- Loading states
- Toast notifications
- Real-time updates

---

## 📚 Documentation Files

### Quick Start
📄 **OFFER18_QUICK_START.md**
- 5-minute setup guide
- Step-by-step instructions
- Common tasks
- Troubleshooting

### Complete Guide
📘 **OFFER18_INTEGRATION_GUIDE.md**
- Full API reference
- Advanced features
- Code examples
- Best practices
- Security guidelines

---

## 🔧 API Configuration

### Option 1: Environment Variables (Recommended)

Add to `.env`:
```env
VITE_OFFER18_API_KEY=your_api_key_here
VITE_OFFER18_AFFILIATE_ID=your_affiliate_id_here
VITE_OFFER18_MERCHANT_ID=your_merchant_id_here
```

### Option 2: Admin Panel

1. Go to Admin Panel → **Offer18 Integration**
2. Navigate to **Configuration** tab
3. Enter credentials
4. Click **Save Configuration**

---

## 💡 Quick Example

### Initialize Service

```typescript
import { offer18Service } from '@/services/offer18Service';

// Initialize with credentials
offer18Service.initialize({
  apiKey: 'your_api_key',
  affiliateId: 'your_affiliate_id',
  merchantId: 'your_merchant_id'
});
```

### Fetch Offers

```typescript
// Get all active offers
const offers = await offer18Service.fetchActiveOffers();

// Get authorized offers only
const authorizedOffers = await offer18Service.fetchAuthorizedOffers();

// Get offers by category
const gamingOffers = await offer18Service.fetchOffersByCategory('gaming');

// Get offers by country
const usOffers = await offer18Service.fetchOffersByCountry('US');
```

### Convert & Sync

```typescript
// Convert to store format
const storeData = offer18Service.convertToStore(offer);

// Save to database
await supabase.from('stores').insert(storeData);
```

### Generate Tracking URL

```typescript
// Get tracking URL with session ID
const trackingUrl = offer18Service.getTrackingUrl(
  offer,
  `${userId}_${sessionId}`
);

// Example output:
// https://network.o18.click/c?o=12345&m=678&a=910&s1=user123_session456
```

---

## 🎨 Admin Interface

Access via: **Admin Panel** → **Offer18 Integration**

### Configuration Tab
- Enter API credentials
- Test connection
- Save settings

### Sync Offers Tab
- Sync all active offers
- Sync authorized offers only
- Preview before syncing

### Browse Offers Tab
- View fetched offers
- See offer details
- Check payout and model
- Preview countries

---

## 📊 Offer Data Structure

Each synced offer includes:

```typescript
{
  offerid: "12345",
  name: "Example Offer",
  logo: "https://example.com/logo.png",
  status: "active",
  model: "CPA", // CPA, CPC, CPL, CPS, CPM
  payout: [
    {
      payout: "50.00",
      currency: "USD",
      model: "CPA"
    }
  ],
  click_url: "https://network.o18.click/c?...",
  country_allow: "US,IN,GB",
  authorized: "true"
}
```

---

## 🔄 Syncing Workflow

1. **Fetch** offers from Offer18 API
2. **Convert** to store format
3. **Check** for existing stores (by slug)
4. **Update** or **create** stores
5. **Preserve** network configuration
6. **Display** success/error notifications

---

## 🛡️ Security

### Environment Variables
- Never commit `.env` to git
- Use different credentials per environment
- Rotate API keys periodically

### API Credentials
- Store securely
- Use HTTPS for all requests
- Validate responses
- Handle errors gracefully

---

## 🚀 Getting Started

### Step 1: Get Credentials

Contact your Offer18 affiliate network for:
- API Key
- Affiliate ID  
- Merchant ID

### Step 2: Configure

Add credentials to `.env` file:
```env
VITE_OFFER18_API_KEY=your_key
VITE_OFFER18_AFFILIATE_ID=your_id
VITE_OFFER18_MERCHANT_ID=your_mid
```

### Step 3: Test Connection

1. Login to admin panel
2. Go to **Offer18 Integration**
3. Click **Test Connection**
4. Verify success message

### Step 4: Sync Offers

1. Go to **Sync Offers** tab
2. Click **Sync All Active Offers**
3. Wait for completion
4. Check **Browse Offers** tab

### Step 5: Verify

1. Go to **Stores** section
2. Verify new stores appear
3. Check store details
4. Test on frontend

---

## 📞 Support & Resources

### Documentation Links

- **Offer18 API Docs**: https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
- **API Base URL**: https://api.offer18.com/api/af/offers
- **API Domain**: api.offer18.com

### Integration Files

- Service: `src/services/offer18Service.ts`
- Admin Component: `src/components/admin/AdminOffer18.tsx`
- Quick Start: `OFFER18_QUICK_START.md`
- Full Guide: `OFFER18_INTEGRATION_GUIDE.md`

### Troubleshooting

Check the documentation files for:
- Common issues and solutions
- API error codes
- Connection problems
- Sync failures

---

## 🎯 Use Cases

### 1. **Automated Offer Sync**
Sync offers daily to keep catalog updated:
```typescript
// Daily sync at 3 AM
cron.schedule('0 3 * * *', async () => {
  const offers = await offer18Service.fetchActiveOffers();
  // Sync to database
});
```

### 2. **Country-Specific Offers**
Show relevant offers based on user location:
```typescript
const availableOffers = offers.filter(offer =>
  offer18Service.isOfferAvailableInCountry(offer, userCountry)
);
```

### 3. **Dynamic Cashback Calculator**
Calculate exact cashback for users:
```typescript
const payout = offer18Service.getOfferPayout(offer, {
  event: 'registration',
  country: 'US'
});
const cashback = payout ? parseFloat(payout.payout) * 0.8 : 0;
```

### 4. **Conversion Tracking**
Track user clicks and conversions:
```typescript
// Generate tracking URL with sub ID
const trackingUrl = offer18Service.getTrackingUrl(
  offer,
  `${userId}_${sessionId}_${Date.now()}`
);

// Save click
await supabase.from('affiliate_clicks').insert({
  user_id: userId,
  session_id: subId,
  clicked_url: trackingUrl
});
```

---

## ✅ Feature Checklist

- [x] Offer18 API service
- [x] TypeScript interfaces
- [x] Admin integration
- [x] Auto-configuration
- [x] One-click sync
- [x] Offer browsing
- [x] Statistics dashboard
- [x] Error handling
- [x] Loading states
- [x] Real-time updates
- [x] Environment variables
- [x] Comprehensive docs
- [x] Code examples
- [x] Quick start guide
- [x] Troubleshooting

---

## 🎉 What's Next?

1. ✅ Get your Offer18 credentials
2. ✅ Follow the Quick Start guide
3. ✅ Sync your first offers
4. ✅ Test the tracking flow
5. ✅ Set up automated syncing
6. ✅ Configure postback (optional)
7. ✅ Start earning commissions!

---

## 📈 Benefits

### For Your Business

🚀 **Faster Setup** - Get started in minutes
💰 **More Offers** - Access hundreds of offers
📊 **Better Tracking** - Real-time conversion data
🤖 **Automation** - Auto-sync and update
🎯 **Smart Targeting** - Country-specific offers

### For Developers

🔧 **Clean Code** - Well-structured and documented
🛡️ **Type Safe** - Full TypeScript support
🎨 **UI Ready** - Beautiful admin interface
📚 **Complete Docs** - Everything documented
🔄 **Reusable** - Easy to extend and customize

---

## 💬 Need Help?

1. Check **OFFER18_QUICK_START.md** for quick answers
2. Review **OFFER18_INTEGRATION_GUIDE.md** for details
3. Check browser console for errors
4. Contact your Offer18 account manager
5. Reach out to your development team

---

## 🌟 Credits

Built with:
- TypeScript
- React
- Tanstack Query
- Shadcn UI
- Supabase

Integration created for seamless affiliate network management.

---

**Ready to get started?** Open `OFFER18_QUICK_START.md` and follow the 5-minute setup guide! 🚀
