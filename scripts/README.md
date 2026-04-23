# Ops scripts

## `verify-postback-flow.mjs`

End-to-end test for the cashback attribution pipeline. Creates a throwaway
Supabase user, inserts an `affiliate_clicks` row, posts a fake conversion to
the `track-conversion` edge function, and asserts:

- the `cashback_transactions` row is created with the right amount / order_id,
- a second, identical postback is treated as a duplicate (no double-credit),
- an unknown `session_id` is rejected with 400,
- the throwaway user and all related rows are cleaned up after.

### Running

```sh
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE=<service_role JWT>   # NOT the anon key

node scripts/verify-postback-flow.mjs
```

Exit code is `0` when all assertions pass; non-zero otherwise. Suitable for
wiring into CI.

### What this proves

Before we had this script, the cashback flow was "wired up" but unproven:
Offer18 postbacks have never been seen in production (there are no real
conversions yet). This script exercises the exact path that Offer18 uses,
so any regression in the edge function or the DB schema surfaces immediately.
