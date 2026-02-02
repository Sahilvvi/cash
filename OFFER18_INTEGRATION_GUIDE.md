# Offer18 API Integration Guide

Complete guide for integrating Offer18 affiliate network into your cashback platform.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [API Configuration](#api-configuration)
4. [Using the Integration](#using-the-integration)
5. [API Reference](#api-reference)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### What is Offer18?

Offer18 is a performance marketing platform that provides:
- **Wide range of affiliate offers** across multiple categories
- **Multiple payout models**: CPA, CPC, CPL, CPS, CPM
- **Real-time tracking** and reporting
- **Global reach** with country-specific targeting
- **FREE API access** for affiliates

### Integration Benefits

✅ **Automated Offer Sync** - Fetch offers directly from Offer18
✅ **Real-time Updates** - Keep your store catalog up-to-date
✅ **Smart Tracking** - Automatic click and conversion tracking
✅ **Multiple Models** - Support for all payout types
✅ **Country Targeting** - Show relevant offers based on user location

---

## 🚀 Getting Started

### Step 1: Get Offer18 Credentials

1. **Sign up as an Affiliate:**
   - Go to your Offer18 network (provided by your advertiser)
   - Create an affiliate account
   - Wait for approval (usually 1-3 days)

2. **Get API Credentials:**
   Once approved, you'll need three pieces of information:
   - **API Key** (key): Your unique API authentication key
   - **Affiliate ID** (aid): Your affiliate identifier
   - **Merchant ID** (mid): Your advertiser's merchant ID

3. **Where to find them:**
   - Login to your Offer18 affiliate dashboard
   - Navigate to API Settings or Developer section
   - Copy your credentials

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Offer18 API Configuration
VITE_OFFER18_API_KEY=your_api_key_here
VITE_OFFER18_AFFILIATE_ID=your_affiliate_id_here
VITE_OFFER18_MERCHANT_ID=your_merchant_id_here
```

**Example:**
```env
VITE_OFFER18_API_KEY=a1b2c3d4e5f6g7h8i9j0
VITE_OFFER18_AFFILIATE_ID=12345
VITE_OFFER18_MERCHANT_ID=67890
```

### Step 3: Access Admin Panel

1. Login to your admin panel
2. Navigate to **Offer18 Integration** section
3. Your credentials should auto-load from environment variables
4. Click **Test Connection** to verify

---

## ⚙️ API Configuration

### Option 1: Environment Variables (Recommended)

Set in `.env` file (most secure):

```env
VITE_OFFER18_API_KEY=your_api_key
VITE_OFFER18_AFFILIATE_ID=your_affiliate_id
VITE_OFFER18_MERCHANT_ID=your_merchant_id
```

### Option 2: Admin Panel

Configure directly in the admin interface:
1. Go to Offer18 Integration → Configuration tab
2. Enter your API Key, Affiliate ID, and Merchant ID
3. Click **Save Configuration**
4. Click **Test Connection** to verify

---

## 📦 Using the Integration

### Syncing Offers

#### 1. Sync All Active Offers

Fetch and sync all active offers from Offer18:

1. Go to **Offer18 Integration** → **Sync Offers** tab
2. Click **Sync All Active Offers**
3. Wait for the sync to complete
4. Offers will be added to your stores database

#### 2. Sync Only Authorized Offers

Fetch only offers you're approved for:

1. Go to **Offer18 Integration** → **Sync Offers** tab
2. Click **Sync Only Authorized Offers**
3. Only pre-approved offers will be synced

#### 3. Preview Before Syncing

Browse offers before adding them:

1. Click **Fetch All Offers (Preview)**
2. Go to **Browse Offers** tab
3. Review the offers list
4. Manually sync selected offers

### What Happens During Sync?

When you sync offers, the system:

1. ✅ Fetches offers from Offer18 API
2. ✅ Converts offer data to store format
3. ✅ Checks if store already exists (by slug)
4. ✅ Updates existing stores or creates new ones
5. ✅ Preserves network tracking configuration
6. ✅ Shows success/error notifications

### Synced Store Data

Each synced offer becomes a store with:

- **Name**: Offer name
- **Logo**: Offer logo image
- **Description**: Offer terms/KPIs
- **Cashback**: Payout amount and model
- **Category**: Primary offer category
- **Tracking**: Offer18 click URL
- **API Config**: Full offer metadata for tracking

---

## 🔧 API Reference

### Service: `offer18Service`

Located in `src/services/offer18Service.ts`

#### Initialize

```typescript
import { offer18Service } from '@/services/offer18Service';

offer18Service.initialize({
  apiKey: 'your_api_key',
  affiliateId: 'your_affiliate_id',
  merchantId: 'your_merchant_id'
});
```

#### Fetch All Offers

```typescript
const response = await offer18Service.fetchOffers();
const offers = Object.values(response.data);
```

#### Fetch Active Offers

```typescript
const activeOffers = await offer18Service.fetchActiveOffers();
```

#### Fetch Authorized Offers

```typescript
const authorizedOffers = await offer18Service.fetchAuthorizedOffers();
```

#### Fetch by Category

```typescript
const offers = await offer18Service.fetchOffersByCategory('gaming');
```

#### Fetch by Model

```typescript
const cpaOffers = await offer18Service.fetchOffersByModel('CPA');
```

#### Fetch by Country

```typescript
const usOffers = await offer18Service.fetchOffersByCountry('US');
```

#### Fetch Specific Offer

```typescript
const offer = await offer18Service.fetchOfferById('12345');
```

#### Get Tracking URL

```typescript
const trackingUrl = offer18Service.getTrackingUrl(offer, 'user_session_id');
// Returns: https://network.o18.click/c?o=12345&m=678&a=910&s1=user_session_id
```

#### Check Country Availability

```typescript
const isAvailable = offer18Service.isOfferAvailableInCountry(offer, 'IN');
```

#### Get Payout for Conditions

```typescript
const payout = offer18Service.getOfferPayout(offer, {
  event: 'registration',
  country: 'US',
  device_type: 'smartphone'
});
```

---

## 🎨 Advanced Features

### 1. Automated Daily Sync

Create a cron job to sync offers daily:

```typescript
// Example: Daily sync at 3 AM
async function dailyOfferSync() {
  try {
    const offers = await offer18Service.fetchActiveOffers();
    
    for (const offer of offers) {
      const storeData = offer18Service.convertToStore(offer);
      
      // Upsert to database
      await supabase
        .from('stores')
        .upsert(storeData, { onConflict: 'slug' });
    }
    
    console.log(`Synced ${offers.length} offers`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

### 2. Smart Country Filtering

Show offers based on user's location:

```typescript
async function getOffersForUser(userCountry: string) {
  const allOffers = await offer18Service.fetchActiveOffers();
  
  const availableOffers = allOffers.filter(offer =>
    offer18Service.isOfferAvailableInCountry(offer, userCountry)
  );
  
  return availableOffers;
}
```

### 3. Dynamic Cashback Calculator

Calculate exact cashback based on conditions:

```typescript
function calculateCashback(offer: Offer18Offer, conditions: any) {
  const payout = offer18Service.getOfferPayout(offer, conditions);
  
  if (!payout) return 0;
  
  const payoutAmount = parseFloat(payout.payout);
  const cashbackPercent = 80; // Your platform's share
  
  return (payoutAmount * cashbackPercent) / 100;
}
```

### 4. Tracking with Sub IDs

Track conversions with custom sub IDs:

```typescript
async function createTrackedLink(
  offerId: string,
  userId: string,
  sessionId: string
) {
  const offer = await offer18Service.fetchOfferById(offerId);
  
  if (!offer) throw new Error('Offer not found');
  
  // Sub ID format: userId_sessionId_timestamp
  const subId = `${userId}_${sessionId}_${Date.now()}`;
  
  const trackingUrl = offer18Service.getTrackingUrl(offer, subId);
  
  // Save click to database
  await supabase.from('affiliate_clicks').insert({
    user_id: userId,
    store_id: offer.offerid,
    session_id: subId,
    clicked_url: trackingUrl,
  });
  
  return trackingUrl;
}
```

### 5. Postback Integration

Handle Offer18 postbacks for conversion tracking:

```typescript
// Backend endpoint: /api/postback/offer18
export async function handleOffer18Postback(req: Request) {
  const {
    offer_id,
    sub1, // Your session ID
    payout,
    status,
    transaction_id
  } = req.query;
  
  // Find the click
  const { data: click } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('session_id', sub1)
    .single();
  
  if (!click) {
    return { error: 'Click not found' };
  }
  
  // Create cashback transaction
  await supabase.from('cashback_transactions').insert({
    user_id: click.user_id,
    store_id: click.store_id,
    amount: parseFloat(payout) * 0.8, // 80% to user
    order_id: transaction_id,
    status: status === 'approved' ? 'confirmed' : 'pending',
    network_transaction_id: transaction_id,
  });
  
  return { success: true };
}
```

---

## 📊 API Response Structure

### Offer Object

```typescript
{
  offerid: "12345",
  name: "Example Offer",
  logo: "https://example.com/logo.png",
  status: "active",
  category: "gaming, download campaigns",
  currency: "USD",
  price: 100,
  model: "CPA",
  date_start: "2024-01-01 00:00:00",
  date_end: "2024-12-31 23:59:59",
  preview_url: "https://example.com/offer",
  offer_terms: "Complete registration and make first deposit",
  offer_kpi: "Target: 100 conversions/day",
  country_allow: "US,CA,GB",
  country_block: "CN,RU",
  payout: [
    {
      payout: "50.00",
      currency: "USD",
      model: "CPA",
      condition: [[
        {
          field: "event",
          operator_type: "is_equal",
          value: "registration"
        }
      ]],
      rule_id: "001"
    }
  ],
  events: [
    {
      event_name: "registration",
      event_token: "reg_token"
    }
  ],
  click_url: "https://network.o18.click/c?o=12345&m=678&a=910",
  impression_url: "https://network.o18.click/i?o=12345&m=678&a=910",
  authorized: "true",
  creatives: [
    {
      type: "image",
      url: "https://example.com/banner.png"
    }
  ]
}
```

---

## 🔍 Query Parameters

### Available Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `offer_id` | String | Specific offer(s) | `&offer_id=001,002,003` |
| `page` | Integer | Page number | `&page=1` |
| `category` | String | Offer category | `&category=gaming,sports` |
| `model` | String | Payout model | `&model=CPA,CPC` |
| `country` | String | Country codes | `&country=US,IN,AU` |
| `offer_status` | Integer | 1 = Active only | `&offer_status=1` |
| `authorized` | Integer | 1 = Assigned only | `&authorized=1` |
| `offer_access` | Integer | 1 = Auto-approve | `&offer_access=1` |

### Example Queries

**Get all active CPA offers:**
```
https://api.offer18.com/api/af/offers?key=xxx&aid=xxx&mid=xxx&offer_status=1&model=CPA
```

**Get authorized offers for US:**
```
https://api.offer18.com/api/af/offers?key=xxx&aid=xxx&mid=xxx&authorized=1&country=US
```

**Get specific offers:**
```
https://api.offer18.com/api/af/offers?key=xxx&aid=xxx&mid=xxx&offer_id=001,002,003
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. "API request failed: 401 Unauthorized"

**Cause:** Invalid API credentials

**Solution:**
- Double-check your API Key, Affiliate ID, and Merchant ID
- Ensure credentials are active in Offer18 dashboard
- Test connection in admin panel

#### 2. "API request failed: 403 Forbidden"

**Cause:** Your affiliate account may not have API access

**Solution:**
- Contact your Offer18 account manager
- Request API access for your affiliate account
- Ensure your account is approved and active

#### 3. "No offers found"

**Cause:** No offers match your filters or you're not authorized

**Solution:**
- Try fetching without `authorized=1` filter
- Check if you're approved for any offers in Offer18 dashboard
- Contact advertiser to get offers assigned

#### 4. "Connection timeout"

**Cause:** Network issues or API downtime

**Solution:**
- Check your internet connection
- Verify Offer18 API status
- Try again after a few minutes
- Contact Offer18 support if issue persists

#### 5. "Synced offers not appearing"

**Cause:** Offers may be set as inactive in database

**Solution:**
- Check `is_active` field in stores table
- Verify slug doesn't conflict with existing stores
- Check browser console for errors

---

## 📝 Best Practices

### 1. Security

✅ **Always use environment variables** for API credentials
✅ **Never commit** `.env` file to version control
✅ **Rotate credentials** periodically
✅ **Use HTTPS** for all API requests

### 2. Performance

✅ **Cache offer data** - Don't fetch on every request
✅ **Sync during off-peak hours** - Use cron jobs at night
✅ **Paginate results** - Don't fetch all offers at once
✅ **Filter smartly** - Only sync offers you need

### 3. Data Management

✅ **Regular syncs** - Keep offers updated (daily recommended)
✅ **Track sync status** - Log successes and failures
✅ **Monitor changes** - Alert on significant updates
✅ **Clean old data** - Remove expired offers

### 4. User Experience

✅ **Show relevant offers** - Filter by user location
✅ **Display payout clearly** - Show potential cashback
✅ **Update frequently** - Keep offer terms current
✅ **Handle errors gracefully** - Fallback to cached data

---

## 🎓 Examples

### Complete Integration Flow

```typescript
// 1. Initialize service
import { offer18Service } from '@/services/offer18Service';

offer18Service.initialize({
  apiKey: import.meta.env.VITE_OFFER18_API_KEY,
  affiliateId: import.meta.env.VITE_OFFER18_AFFILIATE_ID,
  merchantId: import.meta.env.VITE_OFFER18_MERCHANT_ID,
});

// 2. Fetch active offers
const offers = await offer18Service.fetchActiveOffers();

// 3. Filter for user's country
const userCountry = 'US';
const availableOffers = offers.filter(offer =>
  offer18Service.isOfferAvailableInCountry(offer, userCountry)
);

// 4. Convert and sync to database
for (const offer of availableOffers) {
  const storeData = offer18Service.convertToStore(offer);
  
  await supabase.from('stores').upsert(storeData, {
    onConflict: 'slug'
  });
}

// 5. Create tracking link for user
const userId = 'user_123';
const sessionId = 'session_456';
const offer = availableOffers[0];

const trackingUrl = offer18Service.getTrackingUrl(
  offer,
  `${userId}_${sessionId}`
);

// 6. Record click
await supabase.from('affiliate_clicks').insert({
  user_id: userId,
  store_id: offer.offerid,
  session_id: `${userId}_${sessionId}`,
  clicked_url: trackingUrl,
});

// 7. Redirect user
window.location.href = trackingUrl;
```

---

## 📞 Support

### Offer18 Documentation
- **Knowledge Base**: https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
- **API Domain**: api.offer18.com
- **Contact**: Your Offer18 account manager

### Integration Support
- Check the admin panel logs for detailed error messages
- Review browser console for frontend errors
- Check Supabase logs for database errors
- Contact your development team for custom issues

---

## 🎉 Success Checklist

- [ ] Obtained Offer18 API credentials
- [ ] Added credentials to `.env` file
- [ ] Tested connection in admin panel
- [ ] Successfully synced offers
- [ ] Verified offers in stores table
- [ ] Created tracking link
- [ ] Tested complete flow
- [ ] Set up automated daily sync
- [ ] Configured postback URL (if needed)
- [ ] Monitored first conversions

---

**Your Offer18 integration is now complete! Start earning cashback! 🚀**
