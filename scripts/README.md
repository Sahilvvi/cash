# Ops scripts

## `diagnose-cashback.sql`

Read-only triage for "clicks are tracked but no cashback is recorded". Paste
it into the Supabase SQL Editor and work down the sections — the first one
that comes back empty or wrong tells you which stage of the pipeline is
broken:

1. clicks landing in `affiliate_clicks`
2. which tracking param each store's redirect appends (driven by
   `stores.network_type` — an Offer18 store left on `generic_postback` gets
   `subid=`, which Offer18 ignores, so the postback comes back with no
   click id)
3. whether any postback reached the function at all
4. the last 25 rejected postbacks with the real query string the network
   sent — usually the fastest way to see the actual param names
5. what got recorded, by network and status
6. recent clicks you can replay a postback against by hand
7. whether nightly reconciliation is scheduled

Section 3 also covers the failure that leaves no trace anywhere: if
`track-conversion` was deployed without `--no-verify-jwt`, the Supabase
gateway 401s every postback before the function runs, so there is nothing in
`postback_errors` and nothing in the function logs.

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
