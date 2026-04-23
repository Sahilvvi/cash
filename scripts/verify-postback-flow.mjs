#!/usr/bin/env node
/**
 * End-to-end verification of the cashback postback pipeline.
 *
 * Simulates what Offer18 does when a user converts:
 *
 *   1. A throwaway user is created (Supabase admin API).
 *   2. An `affiliate_clicks` row is inserted with a known session_id
 *      (what our frontend does in `useTrackAffiliateClick`).
 *   3. We POST to the `track-conversion` edge function with that
 *      session_id + an order_id + an amount (what Offer18 posts to our
 *      postback URL).
 *   4. We assert that a `cashback_transactions` row exists for that user
 *      with the right amount/order_id.
 *   5. We POST the exact same payload a second time and assert:
 *        - the response says `duplicate: true`
 *        - no second row is inserted (idempotency).
 *   6. Cleanup: the throwaway user and all related rows are deleted.
 *
 * Required env vars:
 *   SUPABASE_URL          e.g. https://cikmdkkngifzpulrwkwt.supabase.co
 *   SUPABASE_SERVICE_ROLE service_role JWT (NOT the anon key)
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... node scripts/verify-postback-flow.mjs
 *
 * Exits non-zero on any assertion failure; this is suitable for CI.
 */

import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
        "Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE."
    );
    process.exit(2);
}

const HEADERS_ADMIN = {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
};

let pass = 0;
let fail = 0;
function assert(cond, msg) {
    if (cond) {
        console.log(`  ok  — ${msg}`);
        pass += 1;
    } else {
        console.error(`  FAIL — ${msg}`);
        fail += 1;
    }
}

async function rest(path, init = {}) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        ...init,
        headers: { ...HEADERS_ADMIN, ...(init.headers || {}) },
    });
    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = text;
    }
    return { status: res.status, json };
}

async function main() {
    const testEmail = `verify-postback+${Date.now()}@devin.test`;
    const orderId = `ORDER-${Date.now()}`;
    const amount = 42.5;
    const sessionId = randomUUID();

    console.log(`\n1/5 Creating throwaway user (${testEmail})…`);
    const created = await rest("/auth/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
            email: testEmail,
            password: randomUUID(),
            email_confirm: true,
        }),
    });
    assert(created.status === 200, `admin create user → 200 (got ${created.status})`);
    const userId = created.json?.id;
    assert(!!userId, `user id returned: ${userId}`);
    if (!userId) process.exit(1);

    // Pick any existing active store to satisfy the FK on affiliate_clicks.
    console.log(`\n2/5 Finding a store to anchor the click to…`);
    const stores = await rest("/rest/v1/stores?select=id,name&is_active=eq.true&limit=1", {
        method: "GET",
    });
    assert(stores.status === 200, `GET stores → 200 (got ${stores.status})`);
    const storeId = stores.json?.[0]?.id;
    assert(!!storeId, `store id found: ${stores.json?.[0]?.name || "-"}`);

    console.log(`\n3/5 Inserting affiliate_clicks row (session=${sessionId.slice(0, 8)}…)…`);
    const click = await rest("/rest/v1/affiliate_clicks", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
            user_id: userId,
            store_id: storeId,
            session_id: sessionId,
            network_type: "offer18",
        }),
    });
    assert(click.status === 201, `insert affiliate_clicks → 201 (got ${click.status})`);

    console.log(`\n4/5 Sending postback #1…`);
    const postbackUrl =
        `${SUPABASE_URL}/functions/v1/track-conversion` +
        `?session_id=${sessionId}` +
        `&amount=${amount}` +
        `&order_id=${orderId}` +
        `&status=pending`;

    const pb1 = await fetch(postbackUrl, {
        method: "GET",
        headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
        },
    });
    const pb1Json = await pb1.json();
    console.log(`   response:`, pb1Json);
    assert(pb1.status === 200, `postback #1 status 200 (got ${pb1.status})`);
    assert(pb1Json?.success === true, `postback #1 success=true`);
    assert(pb1Json?.duplicate === false, `postback #1 duplicate=false`);
    assert(
        Number(pb1Json?.transaction?.amount) === amount,
        `postback #1 recorded amount=${amount}`
    );
    assert(
        pb1Json?.transaction?.order_id === orderId,
        `postback #1 recorded order_id=${orderId}`
    );

    // Direct DB read to confirm RLS-correctness (service role bypasses RLS,
    // but we also want to verify the row is actually there).
    const ctxRows = await rest(
        `/rest/v1/cashback_transactions?user_id=eq.${userId}&select=*`,
        { method: "GET" }
    );
    assert(ctxRows.status === 200, `GET cashback_transactions → 200`);
    assert(
        Array.isArray(ctxRows.json) && ctxRows.json.length === 1,
        `exactly 1 cashback row after postback #1 (got ${ctxRows.json?.length})`
    );

    console.log(`\n5/5 Sending duplicate postback (same order_id)…`);
    const pb2 = await fetch(postbackUrl, {
        method: "GET",
        headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
        },
    });
    const pb2Json = await pb2.json();
    console.log(`   response:`, pb2Json);
    assert(pb2.status === 200, `postback #2 status 200 (got ${pb2.status})`);
    assert(pb2Json?.success === true, `postback #2 success=true`);
    assert(pb2Json?.duplicate === true, `postback #2 duplicate=true (idempotent)`);

    const ctxRows2 = await rest(
        `/rest/v1/cashback_transactions?user_id=eq.${userId}&select=*`,
        { method: "GET" }
    );
    assert(
        Array.isArray(ctxRows2.json) && ctxRows2.json.length === 1,
        `still exactly 1 cashback row after duplicate postback (got ${ctxRows2.json?.length})`
    );

    // Also exercise the "invalid session_id" branch.
    console.log(`\nExtra: postback with unknown session_id should 400…`);
    const bogus = await fetch(
        `${SUPABASE_URL}/functions/v1/track-conversion?session_id=does-not-exist&amount=1&order_id=x`,
        {
            method: "GET",
            headers: {
                apikey: SERVICE_ROLE,
                Authorization: `Bearer ${SERVICE_ROLE}`,
            },
        }
    );
    assert(bogus.status === 400, `bogus session_id → 400 (got ${bogus.status})`);

    // Cleanup
    console.log(`\nCleaning up…`);
    await rest(`/rest/v1/cashback_transactions?user_id=eq.${userId}`, { method: "DELETE" });
    await rest(`/rest/v1/affiliate_clicks?user_id=eq.${userId}`, { method: "DELETE" });
    await rest(`/rest/v1/profiles?user_id=eq.${userId}`, { method: "DELETE" });
    await rest(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
    console.log(`   cleanup complete.`);

    console.log(`\nResult: ${pass} passed, ${fail} failed.`);
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
});
