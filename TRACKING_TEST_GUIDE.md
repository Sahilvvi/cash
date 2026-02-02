# Tracking System Test Guide

## Quick Test: Click Tracking

### 1. Start the app
```bash
npm run dev
```

### 2. Test the tracking flow:
1. Login to your app
2. Go to `/stores` page
3. Click any "Shop Now" button
4. Check the browser console - you should see the redirect URL with tracking parameters
5. Check your database `affiliate_clicks` table - you should see a new record

### 3. View tracked clicks:
**As User:**
- Go to `/dashboard` 
- Click on "Cashback" tab
- Scroll down to "Recent Clicks" section

**As Admin:**
- Go to `/admin` 
- Click on "Tracking & Conversions" tab
- View all user clicks

## Manual Test: Conversion Tracking

Since you don't have real merchant accounts yet, test with simulation:

### Option 1: Test the Postback Handler
```bash
# Simulate a merchant sending a conversion postback
# Replace SESSION_ID with an actual session_id from affiliate_clicks table
curl -X POST "YOUR_SUPABASE_URL/functions/v1/track-conversion" \
  -H "Content-Type: application/json" \
  -d '{
    "subid": "SESSION_ID_FROM_DATABASE",
    "amount": 50,
    "order_id": "TEST-ORDER-123",
    "status": "confirmed"
  }'
```

### Option 2: Manually Insert Test Transaction
```sql
-- Get a recent click
SELECT id, user_id, store_id, session_id 
FROM affiliate_clicks 
ORDER BY clicked_at DESC 
LIMIT 1;

-- Insert a test cashback transaction
INSERT INTO cashback_transactions (user_id, store_id, amount, status, order_id, description)
VALUES (
  'USER_ID_FROM_CLICK',
  'STORE_ID_FROM_CLICK', 
  100.50,
  'confirmed',
  'TEST-ORDER-001',
  'Test cashback transaction'
);
```

## ✨ NEW: Offer18 Tracking (READY TO USE!)

### Your Offer18 Configuration:
```
✅ Affiliate ID: 744826
✅ Merchant ID:  1446
✅ API Key:      Configured in .env
✅ Status:       Ready to test
```

### Test Offer18 Integration:

#### Step 1: Test API Connection
```bash
# Start dev server
npm run dev

# Navigate to:
http://localhost:5173/admin
```

1. Go to **"Offer18 Integration"** section
2. Click **"Configuration"** tab  
3. Click **"Test Connection"** button
4. Expected: ✅ "Connection successful! Found X offers"

#### Step 2: Sync Offers to Database
1. Click **"Sync Offers"** tab
2. Click **"Sync All Active Offers"** (or "Sync Only Authorized Offers")
3. Wait for success message
4. Check **"Browse Offers"** tab to verify

#### Step 3: Test Click Tracking with Offer18
1. Go to `/stores` page
2. Find an Offer18 store (check for network badge)
3. Click "Shop Now" button
4. You should be redirected through Offer18's tracking URL:
   ```
   https://api.offer18.com/click?aid=744826&mid=1446&oid=OFFER_ID&s1=SESSION_ID
   ```
5. Check `affiliate_clicks` table - new record should appear

#### Step 4: Configure Postback (For real conversions)

Set this URL in your Offer18 dashboard:
```
https://your-domain.com/api/postback/offer18?transaction_id={transaction_id}&order_id={order_id}&amount={amount}&status={status}
```

Postback parameters:
- `{transaction_id}` - Offer18 transaction ID
- `{order_id}` - Merchant order ID  
- `{amount}` - Sale amount
- `{status}` - approved/pending/rejected

#### Step 5: Test Postback Handler (Simulation)
```bash
# Simulate Offer18 sending a conversion postback
curl -X POST "http://localhost:5173/api/postback/offer18" \
  -H "Content-Type: application/json" \
  -d "transaction_id=TEST123&order_id=ORD456&amount=100&status=approved"
```

### Offer18 Tracking Flow:

```
User clicks store → Your system logs click → 
Redirect via Offer18 (aid=744826) → 
User makes purchase → 
Offer18 sends postback → 
Your system creates cashback transaction →
User sees pending cashback
```

### View Offer18 Stats:

**Admin Stats Dashboard:**
- Total Offers from Offer18
- Active Offers  
- Authorized Offers
- Synced to Database

**Admin Tracking Page:**
- All Offer18 clicks
- All Offer18 conversions
- Filter by store/user

**User Dashboard:**
- Recent clicks on Offer18 stores
- Pending cashback from Offer18
- Confirmed cashback history



## For Real Amazon/Flipkart Tracking:

### Amazon Setup (NOT READY YET - needs API keys):
1. Sign up for Amazon Associates
2. Get your tracking ID (e.g., "yoursite-20")
3. Configure the store:
```sql
UPDATE stores 
SET network_type = 'amazon_direct',
    api_config = '{"tracking_id": "yoursite-20"}'
WHERE name = 'Amazon';
```
4. Implement actual Amazon PA-API calls in `fetch-conversions/index.ts`

### Flipkart Setup (NOT READY YET - needs API keys):
1. Join Flipkart Affiliate Program
2. Get your affiliate ID and token
3. Configure the store:
```sql
UPDATE stores 
SET network_type = 'flipkart_direct',
    api_config = '{"affiliate_id": "your_id", "affiliate_token": "your_token"}'
WHERE name = 'Flipkart';
```
4. Implement actual Flipkart API calls in `fetch-conversions/index.ts`

## Current Limitations:
- ⚠️ Amazon/Flipkart API integration requires real credentials
- ⚠️ The `fetch-conversions` function has placeholder code
- ⚠️ You need to deploy functions to Supabase
- ✅ Click tracking works out of the box
- ✅ Postback handler is ready for networks that support webhooks
