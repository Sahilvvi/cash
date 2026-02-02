# Quick Fixes - Apply These First

## 1. Apply Database Migrations

```bash
cd c:\Users\autiy\Downloads\remix-of-cashback-mirror-main\remix-of-cashback-mirror-main

# Option A: Using Supabase CLI (if installed)
supabase db push

# Option B: Manual SQL in Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/rmdmcfgifglvtpbmcxov/editor
# Run the SQL from these files in order:
# 1. supabase/migrations/20260130063216_add_network_tracking_support.sql
# 2. supabase/migrations/20260130064600_fix_cashback_security.sql
```

## 2. Deploy Edge Functions

### Deploy track-conversion (Updated)
```bash
supabase functions deploy track-conversion --project-ref rmdmcfgifglvtpbmcxov
```

### Deploy fetch-conversions (New)
```bash
supabase functions deploy fetch-conversions --project-ref rmdmcfgifglvtpbmcxov
```

## 3. Test the System

### Test Click Tracking
1. Run the app:
   ```bash
   npm run dev
   ```
2. Open http://localhost:5173
3. Login with your account
4. Go to Stores page
5. Click "Shop Now" on any store
6. Check the URL that opens - should have tracking parameters
7. Check Supabase `affiliate_clicks` table - should have new row

### Test Conversion (Manual)
1. Get a session_id from affiliate_clicks table
2. Send test postback:
```bash
curl -X POST "https://rmdmcfgifglvtpbmcxov.supabase.co/functions/v1/track-conversion" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA" \
  -d '{
    "subid": "YOUR_SESSION_ID_HERE",
    "amount": 50,
    "order_id": "TEST-001",
    "status": "confirmed"
  }'
```

### Test Withdrawal
1. Login as user
2. Go to Dashboard → Wallet tab
3. Click "Withdraw" (only if you have ₹100+)
4. Fill in payment details
5. Submit
6. Login as admin
7. Go to Admin → Withdrawals tab
8. Approve/Complete the request

## 4. Configure Stores for Direct API

### For Amazon
```sql
UPDATE stores 
SET 
  network_type = 'amazon_direct',
  api_config = '{
    "tracking_id": "yoursite-20"
  }'::jsonb
WHERE slug = 'amazon';
```

### For Flipkart
```sql
UPDATE stores 
SET 
  network_type = 'flipkart_direct',
  api_config = '{
    "affiliate_id": "YOUR_AFFILIATE_ID",
    "affiliate_token": "YOUR_AFFILIATE_TOKEN"
  }'::jsonb
WHERE slug = 'flipkart';
```

### For Other Networks (Postback)
```sql
UPDATE stores 
SET 
  network_type = 'generic_postback',
  api_config = '{
    "tracking_param": "subid"
  }'::jsonb
WHERE slug = 'other-store';
```

## 5. Set Up Cron Job (For API Polling)

In Supabase Dashboard:
1. Go to Database → Cron Jobs (pg_cron extension)
2. Add new job:
```sql
SELECT cron.schedule(
    'fetch-amazon-flipkart-conversions',
    '0 * * * *',  -- Every hour
    $$
    SELECT net.http_post(
        url := 'https://rmdmcfgifglvtpbmcxov.supabase.co/functions/v1/fetch-conversions',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
    $$
);
```

## Verification Checklist

- [ ] Migrations applied successfully
- [ ] Edge functions deployed
- [ ] Click tracking works
- [ ] Postback creates cashback
- [ ] Withdrawals work end-to-end
- [ ] Admin can manage withdrawals
- [ ] Realtime updates working
- [ ] Stores configured with network types

## Common Issues

### "supabase command not found"
Install Supabase CLI:
```bash
npm install -g supabase
```

### "Permission denied" on functions
Make sure you're logged in:
```bash
supabase login
```

### Migrations fail
Apply manually in Supabase SQL Editor

### Functions return 404
Check deployment status in Supabase Dashboard → Edge Functions

## Next Steps After Deployment

1. **Get Real API Credentials**
   - Amazon Associates Program
   - Flipkart Affiliate Program

2. **Implement Actual API Calls**
   - Update fetch-conversions with real API logic
   - Add error handling and retry logic

3. **Monitor Performance**
   - Check function logs
   - Track conversion success rates
   - Monitor API usage

4. **Scale Considerations**
   - Consider batch processing for large volumes
   - Add rate limiting
   - Implement caching where appropriate
