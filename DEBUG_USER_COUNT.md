# Debug User Count Issue

## Problem
Database shows 3 users but admin dashboard shows only 1.

## Quick Fix - Try These Steps:

### Step 1: Hard Refresh
1. Go to your admin dashboard
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Check if the user count updates

### Step 2: Check Browser Console
1. Press `F12` to open DevTools
2. Go to the **Console** tab
3. Paste this code and press Enter:

```javascript
// Check user count directly
const { createClient } = supabase;
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

supabase.from('profiles').select('*', { count: 'exact' }).then(result => {
  console.log('Total users in DB:', result.count);
  console.log('User data:', result.data);
});
```

### Step 3: Clear React Query Cache
In the browser console, paste:

```javascript
// Clear all cached queries
window.location.reload(true);
```

### Step 4: Check Database Directly
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → **profiles**
3. Count the rows manually
4. Check if there are any filters applied

### Step 5: Check RLS Policies
The issue might be Row Level Security (RLS) policies.

Run this SQL in Supabase SQL Editor:

```sql
-- Check all profiles (bypass RLS as admin)
SELECT COUNT(*) as total_users FROM profiles;

-- Check what your admin user can see
SELECT COUNT(*) as visible_users FROM profiles;

-- List all users
SELECT id, email, full_name, created_at FROM auth.users ORDER BY created_at DESC;
```

### Step 6: Check for Errors
In your admin dashboard:
1. Open Browser Console (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for any failed requests (red color)
5. Click on the failed request to see the error

## Most Likely Causes:

1. **React Query Cache** - Old data is cached
2. **RLS Policy** - Row Level Security blocking some users
3. **Stale WebSocket Connection** - Real-time updates not working
4. **Browser Cache** - Page is cached

## Solution

Try running the app with cache disabled:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check "Disable cache"
4. Keep DevTools open
5. Refresh the page

If this works, the issue is browser caching.
