# 🚀 Hosting & Testing Guide

## Quick Start - Test Locally (5 minutes)

### Step 1: Apply Database Fixes
Since Supabase CLI isn't installed, use the Supabase Dashboard:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor

2. **Run Migration 1 - Network Tracking Support:**
   ```sql
   -- Add network type and API configuration to stores table
   ALTER TABLE public.stores 
   ADD COLUMN IF NOT EXISTS network_type text DEFAULT 'generic_postback' NOT NULL,
   ADD COLUMN IF NOT EXISTS api_config jsonb DEFAULT '{}'::jsonb;

   -- Add constraint for network_type
   ALTER TABLE public.stores 
   ADD CONSTRAINT stores_network_type_check 
   CHECK (network_type IN ('generic_postback', 'amazon_direct', 'flipkart_direct', 'commission_junction', 'impact', 'other'));

   -- Add index on session_id for faster lookups during API polling
   CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_session_id 
   ON public.affiliate_clicks(session_id);

   -- Add comment to document the columns
   COMMENT ON COLUMN public.stores.network_type IS 'Type of affiliate network integration: generic_postback (default), amazon_direct, flipkart_direct, etc.';
   COMMENT ON COLUMN public.stores.api_config IS 'JSON configuration for API integration including tag names, param names, API credentials references, etc.';
   ```

3. **Run Migration 2 - Security Fixes:**
   ```sql
   -- Fix 1: Add missing order_amount column to cashback_transactions
   ALTER TABLE public.cashback_transactions 
   ADD COLUMN IF NOT EXISTS order_amount numeric(10,2);

   COMMENT ON COLUMN public.cashback_transactions.order_amount 
   IS 'Total order value (before cashback)';

   -- Fix 2: Remove dangerous RLS policy that allows users to create fake cashback
   DROP POLICY IF EXISTS "Users can create their own cashback transactions" ON public.cashback_transactions;

   -- Fix 3: Add proper policies for cashback creation
   CREATE POLICY "Admins can create cashback transactions"
   ON public.cashback_transactions
   FOR INSERT
   USING (public.is_admin(auth.uid()))
   WITH CHECK (true);

   -- Fix 4: Add index for faster order_id lookups (prevent duplicate conversions)
   CREATE INDEX IF NOT EXISTS idx_cashback_transactions_order_id 
   ON public.cashback_transactions(order_id) 
   WHERE order_id IS NOT NULL;
   ```

### Step 2: Start Local Development Server
```bash
cd c:\Users\autiy\Downloads\remix-of-cashback-mirror-main\remix-of-cashback-mirror-main
npm run dev
```

### Step 3: Open the App
- **Frontend:** http://localhost:5173
- **Test Page:** Open `tracking-test.html` in your browser

---

## 🌐 Production Hosting Options

### Option 1: Vercel (Recommended - Free Tier Available)

#### Why Vercel?
- ✅ Free tier with good limits
- ✅ Automatic deployments from Git
- ✅ Built-in CI/CD
- ✅ Perfect for Vite/React apps
- ✅ Edge functions support

#### Deploy to Vercel:

**Method A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd c:\Users\autiy\Downloads\remix-of-cashback-mirror-main\remix-of-cashback-mirror-main
vercel
```

**Method B: Using Vercel Dashboard** (Easier)
1. Go to https://vercel.com/new
2. Import your Git repository (GitHub/GitLab)
3. Or drag & drop your project folder
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_PROJECT_ID=rmdmcfgifglvtpbmcxov
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_URL=https://rmdmcfgifglvtpbmcxov.supabase.co
   ```
6. Click **Deploy**

Your app will be live at: `https://your-app-name.vercel.app`

---

### Option 2: Netlify (Alternative Free Option)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd c:\Users\autiy\Downloads\remix-of-cashback-mirror-main\remix-of-cashback-mirror-main
netlify deploy --prod
```

Or use Netlify dashboard:
1. Go to https://app.netlify.com/drop
2. Drag your `dist` folder (after running `npm run build`)

---

### Option 3: Self-Hosted (VPS like DigitalOcean, AWS, etc.)

This requires more setup but gives you full control.

**Prerequisites:**
- VPS with Ubuntu
- Domain name (optional but recommended)

**Setup Steps:**
```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 3. Clone/Upload your code
git clone your-repo-url
cd your-app

# 4. Install dependencies
npm install

# 5. Build
npm run build

# 6. Install serve
npm install -g serve

# 7. Start with PM2
pm2 start "serve -s dist -l 3000" --name cashback-app

# 8. Setup Nginx reverse proxy (optional, for custom domain)
sudo apt install nginx
# Configure nginx to proxy to port 3000
```

---

## 🧪 Testing Guide

### Test 1: Click Tracking (5 min)

**What to Test:** User clicks are tracked properly

**Steps:**
1. Open http://localhost:5173 (or your deployed URL)
2. Login with test credentials
3. Go to **Stores** page
4. Click **"Shop Now"** on any store
5. Watch for:
   - ✅ Toast notification "Redirecting to store..."
   - ✅ New tab opens with tracking parameters in URL
   - Example: `?subid=550e8400-e29b-41d4-a716-446655440000`

**Verify in Database:**
```sql
-- Check Supabase SQL Editor
SELECT * FROM affiliate_clicks 
ORDER BY clicked_at DESC 
LIMIT 5;
```

**Expected Result:**
- New row with `session_id`, `user_id`, `store_id`
- `clicked_at` timestamp

---

### Test 2: View Tracking in Dashboard (2 min)

**Steps:**
1. Go to **Dashboard** page
2. Click **Cashback** tab
3. Scroll to "Recent Clicks" section

**Expected Result:**
- See the click you just made
- Shows store name, date/time

---

### Test 3: Convert a Click to Cashback (Manual Test)

**What to Test:** Conversion tracking works

**Steps:**
1. Get a `session_id` from the database:
   ```sql
   SELECT session_id, user_id, store_id 
   FROM affiliate_clicks 
   ORDER BY clicked_at DESC 
   LIMIT 1;
   ```

2. Deploy the edge function first:
   - Go to Supabase Dashboard
   - Upload function manually (instructions below)

3. Send test conversion:
   ```bash
   curl -X POST "https://rmdmcfgifglvtpbmcxov.supabase.co/functions/v1/track-conversion" \
     -H "Content-Type: application/json" \
     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA" \
     -d '{
       "subid": "YOUR_SESSION_ID_HERE",
       "amount": 50.00,
       "order_id": "TEST-ORDER-001",
       "status": "confirmed"
     }'
   ```

**Alternative: Use the Test HTML Page**
1. Open `tracking-test.html` in browser
2. Enter the `session_id`
3. Click "Send Test Conversion"

**Verify:**
```sql
SELECT * FROM cashback_transactions 
WHERE order_id = 'TEST-ORDER-001';
```

---

### Test 4: Withdrawal Flow (10 min)

**What to Test:** Users can request and admins can process withdrawals

**As User:**
1. Go to **Dashboard**
2. Check your balance (should have ₹50 from test transaction)
3. Try to withdraw (won't work, minimum is ₹100)
4. Add more test cashback:
   ```sql
   INSERT INTO cashback_transactions (user_id, store_id, amount, status, order_id, description)
   VALUES (
     'YOUR_USER_ID',
     (SELECT id FROM stores LIMIT 1),
     150,
     'confirmed',
     'TEST-002',
     'Manual test transaction'
   );
   ```
5. Refresh dashboard
6. Click **"Withdraw"** button
7. Select payment method (Bank/UPI/Paytm)
8. Enter details
9. Submit

**As Admin:**
1. Logout and login with admin account
2. Go to **Admin** → **Withdrawals** tab
3. See the pending withdrawal
4. Click **"View"**
5. Click **"Approve"**
6. Click **"Mark as Completed"**

**Verify:**
- User sees "completed" status in real-time
- Balance updates

---

### Test 5: Admin Panel (5 min)

**What to Test:** Admin can manage everything

**Steps:**
1. Login as admin
2. Go to **Admin** page
3. Test each tab:
   - **Overview:** See stats
   - **Users:** View/Edit users
   - **Stores:** Add/Edit stores
   - **Tracking & Conversions:** View clicks and cashback
   - **Withdrawals:** Process requests

---

## 📦 Deploy Edge Functions (Required for Conversions)

Since Supabase CLI isn't installed, use the dashboard:

### Method 1: Using Supabase Dashboard

1. **Go to Edge Functions:**
   - https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/functions

2. **Create `track-conversion` function:**
   - Click **"Create a new function"**
   - Name: `track-conversion`
   - Copy code from: `supabase/functions/track-conversion/index.ts`
   - Click **Deploy**

3. **Create `fetch-conversions` function:**
   - Same process
   - Name: `fetch-conversions`
   - Copy code from: `supabase/functions/fetch-conversions/index.ts`
   - Click **Deploy**

### Method 2: Using Git Integration (Recommended)

1. Push your code to GitHub
2. In Supabase Dashboard:
   - Go to **Edge Functions** → **Settings**
   - Connect to GitHub
   - Enable auto-deployment

---

## 🔍 Testing Checklist

Before going live, verify:

### Frontend Tests
- [ ] Can login/logout
- [ ] Can view stores
- [ ] Click tracking works (check `affiliate_clicks` table)
- [ ] Dashboard shows cashback
- [ ] Wallet displays correct balance
- [ ] Can request withdrawal
- [ ] Admin panel accessible

### Backend Tests
- [ ] Migrations applied successfully
- [ ] Edge functions deployed
- [ ] Postback creates cashback transaction
- [ ] Real-time updates working

### Integration Tests
- [ ] Click → Conversion → Dashboard flow works
- [ ] Withdrawal request → Admin approval → Completion works
- [ ] Real-time updates on all pages

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module 'vite'"
**Solution:**
```bash
npm install
```

### Issue: Functions return 404
**Solution:**
- Check if functions are deployed in Supabase dashboard
- Verify function names match exactly

### Issue: Migrations fail
**Solution:**
- Check if tables exist: `\dt` in SQL editor
- Try running migrations one at a time
- Check error messages for conflicts

### Issue: Real-time not working
**Solution:**
- Check browser console for errors
- Verify real-time is enabled in Supabase project settings
- Check RLS policies allow SELECT

### Issue: Balance shows 0
**Solution:**
```sql
-- Check if cashback exists
SELECT * FROM cashback_transactions 
WHERE user_id = 'YOUR_USER_ID' 
AND status = 'confirmed';

-- If empty, add test data
INSERT INTO cashback_transactions (user_id, store_id, amount, status, order_id, description)
VALUES (
  'YOUR_USER_ID',
  (SELECT id FROM stores LIMIT 1),
  100,
  'confirmed',
  'TEST-INIT',
  'Initial test cashback'
);
```

---

## 🌟 Production Checklist

Before launching to users:

### Security
- [ ] All migrations applied
- [ ] RLS policies correct (no fake cashback)
- [ ] Environment variables set
- [ ] API keys not exposed in code

### Performance
- [ ] Database indexes added
- [ ] Images optimized
- [ ] Build size reasonable (`npm run build`)

### Functionality
- [ ] All tests passing
- [ ] Error handling in place
- [ ] Toast notifications working
- [ ] Real-time updates smooth

### Monitoring
- [ ] Supabase logs enabled
- [ ] Function logs monitored
- [ ] Error tracking setup (optional: Sentry)

---

## 📊 Performance Benchmarks

Expected performance:
- **Page load:** < 2 seconds
- **Click tracking:** < 500ms
- **Conversion processing:** < 1 second
- **Real-time updates:** < 2 seconds
- **Dashboard load:** < 3 seconds

---

## 🎉 Next Steps After Hosting

1. **Get Real Affiliate Credentials:**
   - Amazon Associates
   - Flipkart Affiliate Program
   - Other networks

2. **Configure Stores:**
   ```sql
   UPDATE stores SET 
     network_type = 'amazon_direct',
     api_config = '{"tracking_id": "yoursite-20"}'
   WHERE slug = 'amazon';
   ```

3. **Set Up Monitoring:**
   - Track conversion rates
   - Monitor API usage
   - Alert on errors

4. **Marketing:**
   - Add stores
   - Create deals
   - Enable referral program

---

## 📝 Quick Commands Reference

```bash
# Local development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Deployment
vercel                   # Deploy to Vercel
netlify deploy --prod    # Deploy to Netlify

# Testing
curl -X POST ...         # Test conversion API
```

---

**Ready to host? Start with local testing, then deploy to Vercel!** 🚀
