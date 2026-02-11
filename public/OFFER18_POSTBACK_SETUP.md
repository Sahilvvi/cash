# 🔄 Offer18 Postback Setup Guide

To ensure that cashback is tracked in **real-time** when a user makes a purchase, you must configure the Postback URL in your Offer18 dashboard.

## 1. Get Your Postback URL

Your Postback URL follows this format:

```
https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/track-conversion
```

### How to find your Supabase Project Reference:
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Go to **Project Settings** -> **API**.
4.  Your **URL** will look like `https://abcdefghijklm.supabase.co`.
5.  The part `abcdefghijklm` is your Project Reference.

## 2. Configure in Offer18

1.  Login to your **Offer18 Affiliate Dashboard**.
2.  Go to **Tools** -> **Postback / Pixel**.
3.  Click **Add New Postback**.
4.  **Level**: Global (recommended) or Offer specific.
5.  **Postback URL**: Paste your URL from step 1 and append the parameters:

```
https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/functions/v1/track-conversion?session_id={s1}&amount={payout}&status={status}&order_id={transaction_id}
```

### Key Parameters:
-   `session_id={s1}`: matches our `s1` tracking parameter (Critical).
-   `amount={payout}`: the commission amount you earned.
-   `status={status}`: conversion status (approved, pending, etc.).
-   `order_id={transaction_id}`: unique transaction ID from the merchant.

## 3. Deploy the Tracking Function

Ensure you have deployed the Supabase Edge Function that handles this tracking.

Run this command in your project terminal:

```bash
npx supabase functions deploy track-conversion
```

_(Note: You need to be logged in to Supabase CLI: `npx supabase login`)_

## 4. Testing the Flow

1.  **Click**: User clicks "Shop Now" on an offer card.
    *   System records `session_id` in `affiliate_clicks` table.
    *   Redirects to Offer18 with `&s1=<session_id>`.
2.  **Conversion**: Offer18 creates a test conversion (or real purchase).
3.  **Postback**: Offer18 bumps your URL.
4.  **Record**: The `track-conversion` function receives the request.
    *   Finds the user from `session_id`.
    *   Creates a record in `cashback_transactions`.
5.  **Dashboard**: The user's dashboard automatically updates via real-time subscription.

---
**✅ Status**: The dashboard logic and tracking hooks are already implemented. Once you configure the Postback URL above, it will work automatically.
