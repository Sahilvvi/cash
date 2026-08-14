-- Why is cashback not being recorded?
--
-- Run this in the Supabase SQL Editor (it is read-only). Work down the
-- sections in order — the first one that comes back non-empty / wrong
-- tells you where the pipeline is breaking.
--
-- The pipeline is:
--   click  → affiliate_clicks row  (working if section 1 has rows)
--   redirect with tracking param   (section 2 tells you which param)
--   network fires postback         (section 3: did it arrive at all?)
--   track-conversion validates     (section 4: why it was rejected)
--   apply_postback_state writes    (section 5: what got recorded)

-- =====================================================================
-- 1. Are clicks landing?  Expect recent rows.
-- =====================================================================
SELECT
    date_trunc('day', clicked_at) AS day,
    network_type,
    count(*)                      AS clicks
FROM   public.affiliate_clicks
WHERE  clicked_at > now() - interval '14 days'
GROUP  BY 1, 2
ORDER  BY 1 DESC, 3 DESC;

-- =====================================================================
-- 2. What tracking param is each store's redirect actually using?
--
--    useAffiliateTracking branches on stores.network_type:
--      offer18          → appends  s1=<uuid>&aff_click_id=<uuid>
--      amazon_direct    → appends  linkId=<uuid>
--      flipkart_direct  → appends  affExtParam1=<uuid>
--      anything else    → appends  subid=<uuid>   (or api_config.tracking_param)
--
--    If an Offer18 store is sitting on 'generic_postback' it gets
--    `subid=`, Offer18 ignores that param, and the postback comes back
--    with NO click id — every conversion is then unattributable. Any row
--    below whose affiliate_url points at an Offer18 tracker but whose
--    network_type is not 'offer18' is a misconfiguration.
-- =====================================================================
SELECT
    network_type,
    count(*)                                        AS stores,
    count(*) FILTER (WHERE affiliate_url IS NOT NULL) AS with_affiliate_url,
    min(name)                                       AS example_store,
    min(affiliate_url)                              AS example_url
FROM   public.stores
WHERE  is_active
GROUP  BY 1
ORDER  BY 2 DESC;

-- =====================================================================
-- 3. Did ANY postback reach the function in the last 14 days?
--
--    Empty result + rows in section 1 = the network is not calling us,
--    OR the Supabase gateway is rejecting the call before the function
--    runs. The gateway case is the classic one: track-conversion must be
--    deployed with JWT verification OFF, because affiliate networks send
--    no Authorization header.
--
--        supabase functions deploy track-conversion --no-verify-jwt
--
--    A gateway 401 leaves NO trace here and NO trace in the function
--    logs — it never reaches your code. Confirm with:
--
--        curl -i "https://<project>.supabase.co/functions/v1/track-conversion?session_id=probe"
--
--    Expect 400 (invalid_session) — that means the function ran.
--    A 401 means verify_jwt is still on.
-- =====================================================================
SELECT
    date_trunc('day', occurred_at) AS day,
    reason,
    status_code,
    count(*)                       AS n,
    max(occurred_at)               AS last_seen
FROM   public.postback_errors
WHERE  occurred_at > now() - interval '14 days'
GROUP  BY 1, 2, 3
ORDER  BY 1 DESC, 4 DESC;

-- =====================================================================
-- 4. The 25 most recent rejected postbacks, with the (token-redacted)
--    query string the network actually sent. This is the single most
--    useful output in this file — it shows the real param names.
--
--    reason → meaning:
--      bad_token        POSTBACK_SECRET is set but the network's URL has
--                       no (or the wrong) &token=... — add it in the
--                       Offer18 postback template.
--      missing_session  No click id in the postback. The macro in the
--                       network's postback URL is wrong or empty.
--      invalid_session  Click id present but no matching affiliate_clicks
--                       row — usually the wrong param was appended on the
--                       redirect (see section 2).
--      network_mismatch Postback's network_type != the click's.
--      click_expired    Click older than 90 days.
--      rpc_error        Reached the state machine and it threw. Before the
--                       status-normalisation fix this fired on any status
--                       outside pending/approved/confirmed/reversed.
-- =====================================================================
SELECT
    occurred_at,
    status_code,
    reason,
    session_id,
    order_id,
    network,
    query,
    message
FROM   public.postback_errors
ORDER  BY occurred_at DESC
LIMIT  25;

-- =====================================================================
-- 5. What actually got recorded, by network and status.
--    'referral', 'gift_card_purchase', 'test' rows are internal — real
--    affiliate money shows up as 'offer18' / 'generic_postback' / etc.
-- =====================================================================
SELECT
    network_type,
    status,
    count(*)          AS rows,
    sum(amount)       AS total_amount,
    count(*) FILTER (WHERE amount = 0) AS zero_amount_rows,
    max(created_at)   AS last_recorded
FROM   public.cashback_transactions
GROUP  BY 1, 2
ORDER  BY 1, 2;

-- =====================================================================
-- 6. Clicks with no conversion, newest first. Use a session_id from here
--    to replay a postback by hand and watch what happens:
--
--      curl -i "https://<project>.supabase.co/functions/v1/track-conversion\
--        ?session_id=<paste>&amount=50&order_id=MANUAL-1&status=pending\
--        &token=<POSTBACK_SECRET>"
--
--    200 + action=inserted means the pipeline is healthy end to end and
--    the problem is upstream (the network isn't firing, or isn't firing
--    with the right macros).
-- =====================================================================
SELECT
    c.session_id,
    c.network_type,
    c.clicked_at,
    s.name AS store
FROM   public.affiliate_clicks c
LEFT   JOIN public.stores s ON s.id = c.store_id
WHERE  c.clicked_at > now() - interval '14 days'
ORDER  BY c.clicked_at DESC
LIMIT  20;

-- =====================================================================
-- 7. Is the nightly reconciliation actually scheduled and running?
--    Reconciliation is the safety net for postbacks that never arrive.
-- =====================================================================
SELECT name, cron, active FROM public.admin_scheduled_jobs;

-- =====================================================================
-- 8. Suspected double-credits: the same click credited more than once.
--
--    Before click correlation landed, a conversion that arrived by live
--    postback AND got picked up by the nightly reconciliation was written
--    twice — once under the merchant's real order id, once under
--    reconciliation's synthesised "o18:<click>:<stamp>" key. Both count
--    toward the user's balance.
--
--    Rows here are candidates, not proof: one click legitimately produces
--    two rows if the user placed two separate orders. Check `order_id` —
--    one real id alongside one `o18:` surrogate for the same click is the
--    duplicate signature. Two real ids are two genuine orders.
--
--    Requires migration 20260814130000 (adds session_id). Returns nothing
--    on rows written before it that could not be backfilled.
-- =====================================================================
SELECT
    session_id,
    network_type,
    count(*)                    AS rows,
    sum(amount)                 AS total_credited,
    array_agg(order_id ORDER BY created_at) AS order_ids,
    array_agg(status   ORDER BY created_at) AS statuses
FROM   public.cashback_transactions
WHERE  session_id IS NOT NULL
  AND  amount > 0
GROUP  BY 1, 2
HAVING count(*) > 1
ORDER  BY total_credited DESC;
