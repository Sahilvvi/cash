#!/usr/bin/env node
/**
 * End-to-end verification of the cashback backend.
 *
 * Exercises every money-touching path end-to-end against a real Supabase
 * project (not mocks). Intended to run in CI before any deploy to catch
 * regressions in RLS, triggers, RPCs, or edge functions.
 *
 *   A. Postback pipeline
 *      1. Create throwaway user + affiliate_clicks row.
 *      2. POST postback → cashback row created.
 *      3. POST same postback → duplicate:true, no extra row (idempotent).
 *      4. Unknown session_id → 400.
 *      5. If POSTBACK_SECRET is set, postback without token → 401.
 *
 *   B. Gift-card purchase RPC
 *      1. Service-role sign-in as the throwaway user.
 *      2. Seed the user with N cashback via direct insert.
 *      3. Call purchase_gift_card() → card issued, cashback debited.
 *      4. Call purchase_gift_card() for more than remaining balance → error.
 *      5. Direct INSERT into user_gift_cards (as user) → RLS rejection.
 *
 *   C. Spin wheel RPC
 *      1. Call spin_wheel() → user_spins row + optionally cashback.
 *      2. Call spin_wheel() again within 24h → cooldown error.
 *      3. Direct INSERT into user_spins (as user) → RLS rejection.
 *
 *   D. Referral trigger
 *      1. Create two users; second signs up with referred_by = first's
 *         profile id.
 *      2. Assert a pending referrals row is auto-created.
 *      3. Insert a confirmed cashback row for the referred user.
 *      4. Assert the referral flips to completed and both parties are
 *         credited.
 *
 * Required env vars:
 *   SUPABASE_URL          e.g. https://cikmdkkngifzpulrwkwt.supabase.co
 *   SUPABASE_SERVICE_ROLE service_role JWT (NOT the anon key)
 *   SUPABASE_ANON_KEY     anon key (for user-level RLS probes)
 *
 * Optional:
 *   POSTBACK_SECRET       if set on the function, must match here to test
 *                         the auth gate end-to-end.
 *
 * Exits non-zero on any assertion failure.
 */

import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const POSTBACK_SECRET = process.env.POSTBACK_SECRET || "";

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    console.error(
        "Missing env. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY."
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

async function signInUser(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
            apikey: ANON_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });
    return await r.json();
}

async function asUser(accessToken, path, init = {}) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        ...init,
        headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
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

const cleanupUserIds = [];

async function createUser(label) {
    const email = `${label}+${Date.now()}-${randomUUID().slice(0, 8)}@devin.test`;
    const password = randomUUID();
    const created = await rest("/auth/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, email_confirm: true }),
    });
    if (created.status !== 200) {
        throw new Error(`admin create user failed: ${JSON.stringify(created)}`);
    }
    cleanupUserIds.push(created.json.id);
    return { id: created.json.id, email, password };
}

async function cleanup() {
    for (const uid of cleanupUserIds) {
        // kill derived rows first (FK)
        await rest(`/rest/v1/user_gift_cards?user_id=eq.${uid}`, { method: "DELETE" });
        await rest(`/rest/v1/user_spins?user_id=eq.${uid}`, { method: "DELETE" });
        await rest(`/rest/v1/withdrawals?user_id=eq.${uid}`, { method: "DELETE" });
        await rest(`/rest/v1/cashback_transactions?user_id=eq.${uid}`, { method: "DELETE" });
        await rest(`/rest/v1/affiliate_clicks?user_id=eq.${uid}`, { method: "DELETE" });
        // referrals reference profile.id not user_id; delete via join
        const prof = await rest(`/rest/v1/profiles?user_id=eq.${uid}&select=id`, { method: "GET" });
        const pid = Array.isArray(prof.json) ? prof.json[0]?.id : null;
        if (pid) {
            await rest(`/rest/v1/referrals?referrer_id=eq.${pid}`, { method: "DELETE" });
            await rest(`/rest/v1/referrals?referred_id=eq.${pid}`, { method: "DELETE" });
        }
        await rest(`/rest/v1/profiles?user_id=eq.${uid}`, { method: "DELETE" });
        await rest(`/auth/v1/admin/users/${uid}`, { method: "DELETE" });
    }
}

// --------------- Section A: postback pipeline ---------------
async function testPostbackFlow() {
    console.log("\n=== A. Postback pipeline ===");
    const orderId = `ORDER-${Date.now()}`;
    const amount = 42.5;
    const sessionId = randomUUID();

    const user = await createUser("postback");
    console.log(`  created user ${user.email}`);

    // Pick any existing active store
    const stores = await rest("/rest/v1/stores?select=id,name&is_active=eq.true&limit=1");
    const storeId = stores.json?.[0]?.id;
    if (!storeId) {
        assert(false, "no active stores in DB to anchor affiliate_clicks");
        return;
    }

    const click = await rest("/rest/v1/affiliate_clicks", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
            user_id: user.id, store_id: storeId,
            session_id: sessionId, network_type: "offer18",
        }),
    });
    assert(click.status === 201, `insert affiliate_clicks → 201 (got ${click.status})`);

    const tokenQS = POSTBACK_SECRET ? `&token=${encodeURIComponent(POSTBACK_SECRET)}` : "";
    const postbackUrl =
        `${SUPABASE_URL}/functions/v1/track-conversion` +
        `?session_id=${sessionId}&amount=${amount}&order_id=${orderId}&status=pending${tokenQS}`;

    const pb1 = await fetch(postbackUrl, { headers: HEADERS_ADMIN });
    const pb1Json = await pb1.json();
    assert(pb1.status === 200, `postback #1 → 200 (got ${pb1.status})`);
    assert(pb1Json?.duplicate === false, `postback #1 duplicate=false`);
    assert(Number(pb1Json?.transaction?.amount) === amount, `postback #1 amount=${amount}`);

    const pb2 = await fetch(postbackUrl, { headers: HEADERS_ADMIN });
    const pb2Json = await pb2.json();
    assert(pb2Json?.duplicate === true, `postback #2 duplicate=true (idempotent)`);

    const ctxRows = await rest(`/rest/v1/cashback_transactions?user_id=eq.${user.id}&network_type=eq.offer18&select=*`);
    assert(Array.isArray(ctxRows.json) && ctxRows.json.length === 1,
        `exactly 1 cashback row after duplicate (got ${ctxRows.json?.length})`);

    // Unknown session_id → 400
    const bogus = await fetch(
        `${SUPABASE_URL}/functions/v1/track-conversion?session_id=does-not-exist&amount=1&order_id=x${tokenQS}`,
        { headers: HEADERS_ADMIN }
    );
    assert(bogus.status === 400, `bogus session_id → 400 (got ${bogus.status})`);

    // Postback without token (only meaningful if secret is configured)
    if (POSTBACK_SECRET) {
        const noToken = await fetch(
            `${SUPABASE_URL}/functions/v1/track-conversion?session_id=${sessionId}&amount=1&order_id=NO_TOKEN_${Date.now()}`,
            { headers: HEADERS_ADMIN }
        );
        assert(noToken.status === 401, `postback without token → 401 (got ${noToken.status})`);
    } else {
        console.log("  skip — no POSTBACK_SECRET configured in env");
    }
}

// --------------- Section B: gift-card purchase ---------------
async function testGiftCardFlow() {
    console.log("\n=== B. Gift-card purchase RPC ===");
    const user = await createUser("giftcard");
    console.log(`  created user ${user.email}`);

    // Seed balance: service-role insert of confirmed cashback
    const seedAmount = 500;
    await rest("/rest/v1/cashback_transactions", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
            user_id: user.id, amount: seedAmount, status: "confirmed",
            network_type: "test", description: "test seed",
        }),
    });

    const auth = await signInUser(user.email, user.password);
    if (!auth.access_token) {
        assert(false, `user sign-in failed: ${JSON.stringify(auth)}`);
        return;
    }

    // Find any active gift card. We don't rely on denominations — pass an
    // amount that matches one of them if they exist.
    const gc = await rest("/rest/v1/gift_cards?is_active=eq.true&select=*&limit=1");
    const giftCard = gc.json?.[0];
    if (!giftCard) {
        console.log("  skip — no active gift_cards seeded");
        return;
    }

    // Pick an allowed denomination <= seedAmount
    let purchaseAmount = 100;
    if (Array.isArray(giftCard.denominations) && giftCard.denominations.length > 0) {
        const allowed = giftCard.denominations
            .map((d) => Number(d))
            .filter((d) => d > 0 && d <= seedAmount)
            .sort((a, b) => a - b);
        if (allowed.length === 0) {
            console.log(`  skip — no denominations <= ${seedAmount}`);
            return;
        }
        purchaseAmount = allowed[0];
    }

    const rpcOk = await asUser(auth.access_token, "/rest/v1/rpc/purchase_gift_card", {
        method: "POST",
        body: JSON.stringify({ p_gift_card_id: giftCard.id, p_amount: purchaseAmount }),
    });
    assert(rpcOk.status === 200, `purchase_gift_card RPC → 200 (got ${rpcOk.status}, body=${JSON.stringify(rpcOk.json)})`);
    assert(rpcOk.json?.code?.startsWith("GC"), `issued code starts with GC (${rpcOk.json?.code})`);

    const ugc = await rest(`/rest/v1/user_gift_cards?user_id=eq.${user.id}&select=*`);
    assert(Array.isArray(ugc.json) && ugc.json.length === 1,
        `exactly 1 user_gift_cards row (got ${ugc.json?.length})`);

    // Check debit row exists
    const debit = await rest(
        `/rest/v1/cashback_transactions?user_id=eq.${user.id}&network_type=eq.gift_card_purchase&select=*`
    );
    assert(Array.isArray(debit.json) && debit.json.length === 1 && Number(debit.json[0].amount) === -purchaseAmount,
        `debit row amount=-${purchaseAmount}`);

    // Second purchase that exceeds remaining balance should fail
    const rpcFail = await asUser(auth.access_token, "/rest/v1/rpc/purchase_gift_card", {
        method: "POST",
        body: JSON.stringify({ p_gift_card_id: giftCard.id, p_amount: seedAmount * 10 }),
    });
    assert(rpcFail.status !== 200, `over-balance purchase rejected (got ${rpcFail.status})`);
    assert(
        String(rpcFail.json?.message || rpcFail.json?.error || JSON.stringify(rpcFail.json)).toLowerCase().includes("insufficient") ||
        String(rpcFail.json?.message || rpcFail.json?.error || JSON.stringify(rpcFail.json)).toLowerCase().includes("denomination"),
        `over-balance error mentions balance/denomination (got ${JSON.stringify(rpcFail.json)})`
    );

    // Direct INSERT into user_gift_cards as user should be blocked by RLS
    const directInsert = await asUser(auth.access_token, "/rest/v1/user_gift_cards", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
            user_id: user.id, gift_card_id: giftCard.id, amount: 1,
            code: "HACK", pin: "0000", status: "active",
        }),
    });
    assert(directInsert.status >= 400, `direct insert into user_gift_cards blocked (got ${directInsert.status})`);
}

// --------------- Section C: spin wheel ---------------
async function testSpinFlow() {
    console.log("\n=== C. Spin wheel RPC ===");
    const user = await createUser("spin");
    console.log(`  created user ${user.email}`);

    const auth = await signInUser(user.email, user.password);
    if (!auth.access_token) {
        assert(false, `user sign-in failed: ${JSON.stringify(auth)}`);
        return;
    }

    const rewards = await rest("/rest/v1/spin_rewards?is_active=eq.true&select=*");
    if (!Array.isArray(rewards.json) || rewards.json.length === 0) {
        console.log("  skip — no active spin_rewards seeded");
        return;
    }

    const spin1 = await asUser(auth.access_token, "/rest/v1/rpc/spin_wheel", {
        method: "POST",
        body: "{}",
    });
    assert(spin1.status === 200, `spin_wheel RPC → 200 (got ${spin1.status}, body=${JSON.stringify(spin1.json)})`);
    assert(!!spin1.json?.spin?.id, `spin row returned with id`);
    assert(!!spin1.json?.reward?.name, `reward returned with name=${spin1.json?.reward?.name}`);

    const userSpins = await rest(`/rest/v1/user_spins?user_id=eq.${user.id}&select=*`);
    assert(Array.isArray(userSpins.json) && userSpins.json.length === 1,
        `1 user_spins row (got ${userSpins.json?.length})`);

    // Second spin within 24h must fail
    const spin2 = await asUser(auth.access_token, "/rest/v1/rpc/spin_wheel", {
        method: "POST",
        body: "{}",
    });
    assert(spin2.status !== 200, `spin within 24h rejected (got ${spin2.status})`);
    assert(
        String(spin2.json?.message || spin2.json?.error || JSON.stringify(spin2.json)).toLowerCase().includes("24 hours"),
        `cooldown error mentions 24h (got ${JSON.stringify(spin2.json)})`
    );

    // Direct INSERT into user_spins should be blocked by RLS
    const directInsert = await asUser(auth.access_token, "/rest/v1/user_spins", {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, reward_id: rewards.json[0].id, reward_value: 9999 }),
    });
    assert(directInsert.status >= 400, `direct insert into user_spins blocked (got ${directInsert.status})`);
}

// --------------- Section C2: withdrawal ---------------
async function testWithdrawalFlow() {
    console.log("\n=== C2. Withdrawal RPC ===");
    const user = await createUser("withdraw");
    console.log(`  created user ${user.email}`);

    // Seed ₹500 balance
    await rest("/rest/v1/cashback_transactions", {
        method: "POST",
        body: JSON.stringify({
            user_id: user.id, amount: 500, status: "confirmed",
            network_type: "test", description: "withdraw seed",
        }),
    });

    const auth = await signInUser(user.email, user.password);
    if (!auth.access_token) {
        assert(false, `user sign-in failed: ${JSON.stringify(auth)}`);
        return;
    }

    // Below minimum (₹100) → rejected
    const tooSmall = await asUser(auth.access_token, "/rest/v1/rpc/create_withdrawal", {
        method: "POST",
        body: JSON.stringify({
            p_amount: 50, p_payment_method: "upi",
            p_payment_details: { upi_id: "x@upi" },
        }),
    });
    assert(tooSmall.status !== 200, `below-minimum withdrawal rejected (got ${tooSmall.status})`);

    // Bad payment method → rejected
    const badMethod = await asUser(auth.access_token, "/rest/v1/rpc/create_withdrawal", {
        method: "POST",
        body: JSON.stringify({
            p_amount: 200, p_payment_method: "crypto",
            p_payment_details: {},
        }),
    });
    assert(badMethod.status !== 200, `unsupported method rejected (got ${badMethod.status})`);

    // Missing UPI id → rejected
    const missingField = await asUser(auth.access_token, "/rest/v1/rpc/create_withdrawal", {
        method: "POST",
        body: JSON.stringify({
            p_amount: 200, p_payment_method: "upi",
            p_payment_details: {},
        }),
    });
    assert(missingField.status !== 200, `missing upi_id rejected (got ${missingField.status})`);

    // Over-balance → rejected
    const overBalance = await asUser(auth.access_token, "/rest/v1/rpc/create_withdrawal", {
        method: "POST",
        body: JSON.stringify({
            p_amount: 10000, p_payment_method: "upi",
            p_payment_details: { upi_id: "x@upi" },
        }),
    });
    assert(overBalance.status !== 200, `over-balance rejected (got ${overBalance.status})`);
    assert(
        String(overBalance.json?.message || "").toLowerCase().includes("insufficient"),
        `over-balance error mentions insufficient (got ${JSON.stringify(overBalance.json)})`
    );

    // Valid path
    const ok = await asUser(auth.access_token, "/rest/v1/rpc/create_withdrawal", {
        method: "POST",
        body: JSON.stringify({
            p_amount: 200, p_payment_method: "upi",
            p_payment_details: { upi_id: "verify@upi" },
        }),
    });
    assert(ok.status === 200, `valid withdrawal → 200 (got ${ok.status}, body=${JSON.stringify(ok.json)})`);
    assert(ok.json?.status === "pending", `withdrawal row status=pending`);

    // Second withdraw that combined would exceed balance
    const overAfter = await asUser(auth.access_token, "/rest/v1/rpc/create_withdrawal", {
        method: "POST",
        body: JSON.stringify({
            p_amount: 400, p_payment_method: "upi",
            p_payment_details: { upi_id: "verify@upi" },
        }),
    });
    assert(overAfter.status !== 200, `second withdraw exceeding remaining balance rejected (got ${overAfter.status})`);

    // Direct insert as user → RLS reject
    const direct = await asUser(auth.access_token, "/rest/v1/withdrawals", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
            user_id: user.id, amount: 100, payment_method: "upi",
            payment_details: { upi_id: "x@upi" },
        }),
    });
    assert(direct.status >= 400, `direct insert into withdrawals blocked (got ${direct.status})`);

    // Cleanup withdrawals for this user
    await rest(`/rest/v1/withdrawals?user_id=eq.${user.id}`, { method: "DELETE" });
}

// --------------- Section D: referral ---------------
async function testReferralFlow() {
    console.log("\n=== D. Referral trigger ===");
    const referrer = await createUser("referrer");
    const referred = await createUser("referred");
    console.log(`  referrer ${referrer.email}, referred ${referred.email}`);

    // Fetch both profiles (auto-created by existing on_auth_user_created trigger
    // — present on cikm today). If missing, insert them manually.
    let refProf = await rest(`/rest/v1/profiles?user_id=eq.${referrer.id}&select=*`);
    if (!refProf.json?.[0]) {
        await rest("/rest/v1/profiles", {
            method: "POST",
            body: JSON.stringify({
                user_id: referrer.id, email: referrer.email, full_name: "Referrer Test",
            }),
        });
        refProf = await rest(`/rest/v1/profiles?user_id=eq.${referrer.id}&select=*`);
    }
    const referrerProfileId = refProf.json[0].id;

    // Ensure the referred user's profile has referred_by set. Insert manually
    // if the auto-trigger didn't populate it (no signup form to pass it).
    const refdProfExisting = await rest(`/rest/v1/profiles?user_id=eq.${referred.id}&select=*`);
    if (refdProfExisting.json?.[0]) {
        // Delete and re-insert so the AFTER INSERT trigger fires with referred_by
        await rest(`/rest/v1/profiles?user_id=eq.${referred.id}`, { method: "DELETE" });
    }
    const insertRefd = await rest("/rest/v1/profiles", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
            user_id: referred.id, email: referred.email,
            full_name: "Referred Test", referred_by: referrerProfileId,
        }),
    });
    assert(insertRefd.status === 201, `insert referred profile → 201 (got ${insertRefd.status})`);
    const referredProfileId = insertRefd.json?.[0]?.id;

    // Referral row should now exist (pending)
    const refRow = await rest(
        `/rest/v1/referrals?referred_id=eq.${referredProfileId}&select=*`
    );
    assert(Array.isArray(refRow.json) && refRow.json.length === 1,
        `1 referrals row auto-created (got ${refRow.json?.length})`);
    assert(refRow.json?.[0]?.status === "pending", `status=pending`);

    // Now give the referred user a confirmed cashback row — should complete the referral
    await rest("/rest/v1/cashback_transactions", {
        method: "POST",
        body: JSON.stringify({
            user_id: referred.id, amount: 100, status: "confirmed",
            network_type: "offer18", description: "test first conversion",
        }),
    });

    // Give triggers a beat
    await new Promise((r) => setTimeout(r, 250));

    const refRow2 = await rest(
        `/rest/v1/referrals?referred_id=eq.${referredProfileId}&select=*`
    );
    assert(refRow2.json?.[0]?.status === "completed", `referral auto-completed (got ${refRow2.json?.[0]?.status})`);

    // Both parties should have a 'referral' cashback row
    const refrCb = await rest(
        `/rest/v1/cashback_transactions?user_id=eq.${referrer.id}&network_type=eq.referral&select=*`
    );
    assert(Array.isArray(refrCb.json) && refrCb.json.length === 1 && Number(refrCb.json[0].amount) === 50,
        `referrer got ₹50 referral credit`);

    const refdCb = await rest(
        `/rest/v1/cashback_transactions?user_id=eq.${referred.id}&network_type=eq.referral&select=*`
    );
    assert(Array.isArray(refdCb.json) && refdCb.json.length === 1 && Number(refdCb.json[0].amount) === 25,
        `referred got ₹25 referral credit`);
}

async function main() {
    try {
        await testPostbackFlow();
        await testGiftCardFlow();
        await testSpinFlow();
        await testWithdrawalFlow();
        await testReferralFlow();
    } finally {
        console.log("\nCleaning up…");
        await cleanup();
    }
    console.log(`\nResult: ${pass} passed, ${fail} failed.`);
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
    console.error("FATAL:", err);
    cleanup().finally(() => process.exit(1));
});
