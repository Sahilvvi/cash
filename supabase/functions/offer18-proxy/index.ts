// Offer18 API proxy.
//
// Why this exists:
//   1. `api.offer18.com` does not send CORS headers for browser origins, so
//      calling it directly from the frontend fails in production.
//   2. The Offer18 API key MUST NOT be shipped in the frontend bundle. We
//      keep it only in Supabase function secrets here.
//
// Auth model:
//   ALL requests (including `?action=status`) require an authenticated
//   Supabase user whose `user_id` exists in the `admin_users` table. We
//   verify the user JWT via the anon client, then perform the admin lookup
//   with the service role client (which bypasses RLS and can reliably read
//   `admin_users`). The status probe is admin-gated so unauthenticated
//   callers can't learn the affiliate_id / merchant_id.
//
// Required function secrets:
//   OFFER18_API_KEY        - Offer18 API key (from Offer18 dashboard)
//   OFFER18_AFFILIATE_ID   - Offer18 affiliate id (aid)
//   OFFER18_MERCHANT_ID    - Offer18 merchant id (mid)
//
// Set them with:
//   supabase secrets set OFFER18_API_KEY=... OFFER18_AFFILIATE_ID=... OFFER18_MERCHANT_ID=...

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { reportToSentry } from '../_shared/sentry.ts';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const OFFER18_BASE_URL = "https://api.offer18.com/api/af/offers";

// Query keys we forward to Offer18. Everything else is silently dropped so
// callers can't sneak in arbitrary parameters like `key=` / `aid=` / `mid=`.
const ALLOWED_PARAM_KEYS = new Set([
    "offer_id",
    "page",
    "category",
    "model",
    "country",
    "offer_status",
    "authorized",
    "offer_access",
]);

type JsonResponse = Record<string, unknown> | { error: string };

function json(body: JsonResponse, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

// Decode a JWT's payload without verifying the signature.
// Used to inspect the `role` claim of an already-gateway-verified
// service-role token; do NOT use this to authenticate untrusted tokens.
function decodeJwtRole(token: string): string | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
        const decoded = atob(padded);
        const obj = JSON.parse(decoded) as { role?: string };
        return typeof obj?.role === "string" ? obj.role : null;
    } catch {
        return null;
    }
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const SUPABASE_SERVICE_ROLE_KEY =
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        const OFFER18_API_KEY = Deno.env.get("OFFER18_API_KEY") ?? "";
        const OFFER18_AFFILIATE_ID = Deno.env.get("OFFER18_AFFILIATE_ID") ?? "";
        const OFFER18_MERCHANT_ID = Deno.env.get("OFFER18_MERCHANT_ID") ?? "";

        const url = new URL(req.url);
        const action = url.searchParams.get("action");
        const isStatus = action === "status";
        const isSync = action === "sync";

        // --- Auth: caller must be an admin (or the service-role key) -------
        // Note: we intentionally run the auth check BEFORE the status probe
        // so we don't leak affiliate/merchant IDs to unauthenticated callers.
        //
        // Two valid auth modes:
        //   1. User JWT for an admin in `admin_users` (interactive admin UI).
        //   2. The Supabase service-role key directly (used by pg_cron from
        //      run_nightly_offer18_sync — see the scheduled-jobs migration).
        //      We never have a "user" for cron, so getUser() would always
        //      401 here without this branch.
        const authHeader = req.headers.get("Authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
            return json({ error: "Missing Authorization header" }, 401);
        }
        const jwt = authHeader.slice("bearer ".length).trim();

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Cron jobs (and other server-side callers) hit us with the
        // service-role JWT. We deliberately don't compare strings —
        // SUPABASE_SERVICE_ROLE_KEY in the function's env can be a
        // legacy JWT or a new sb_secret_… token, and either way the
        // safe contract is "this token has role=service_role and was
        // signed by Supabase". The Supabase gateway already verified
        // the signature before our code runs (otherwise we'd get a
        // 401 UNAUTHORIZED_INVALID_JWT_FORMAT response from the
        // platform), so it's safe here to just decode the payload
        // and check the role claim.
        const isServiceRoleCaller = decodeJwtRole(jwt) === "service_role";

        if (!isServiceRoleCaller) {
            // Pass the JWT explicitly to getUser(). Otherwise supabase-js looks at
            // its own (empty) stored session and the auth check silently fails
            // regardless of the Authorization header. This is the pattern that
            // works for ES256 access tokens too.
            const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
            if (userErr || !userData?.user) {
                return json({ error: "Invalid or expired session" }, 401);
            }

            const { data: adminRow, error: adminErr } = await adminClient
                .from("admin_users")
                .select("id")
                .eq("user_id", userData.user.id)
                .maybeSingle();
            if (adminErr) {
                console.error("admin_users lookup failed:", adminErr);
                return json({ error: "Authorization check failed" }, 500);
            }
            if (!adminRow) {
                return json({ error: "Admin access required" }, 403);
            }
        }

        // Health check / config probe: tells the admin UI whether the function
        // has its Offer18 secrets set, without actually hitting Offer18.
        // Admin-only (see auth check above) to avoid leaking internal IDs.
        if (isStatus) {
            return json({
                configured: !!(
                    OFFER18_API_KEY &&
                    OFFER18_AFFILIATE_ID &&
                    OFFER18_MERCHANT_ID
                ),
                affiliate_id: OFFER18_AFFILIATE_ID || null,
                merchant_id: OFFER18_MERCHANT_ID || null,
            });
        }

        if (!OFFER18_API_KEY || !OFFER18_AFFILIATE_ID || !OFFER18_MERCHANT_ID) {
            return json(
                {
                    error:
                        "Offer18 secrets are not configured on the server. Set OFFER18_API_KEY, OFFER18_AFFILIATE_ID, OFFER18_MERCHANT_ID as Supabase function secrets.",
                },
                500,
            );
        }

        // --- action=sync: server-side full Offer18 -> stores upsert -------
        // Used by pg_cron's nightly_offer18_sync. Mirrors the client-side
        // sync in src/components/admin/AdminOffer18.tsx so the database
        // stays fresh without an admin manually clicking "Sync All".
        if (isSync) {
            return await runServerSideSync({
                offer18BaseUrl: OFFER18_BASE_URL,
                apiKey: OFFER18_API_KEY,
                affiliateId: OFFER18_AFFILIATE_ID,
                merchantId: OFFER18_MERCHANT_ID,
                adminClient,
            });
        }

        // --- Build outbound Offer18 URL -----------------------------------
        // Accept params from either query string (GET) or JSON body (POST).
        const params = new URLSearchParams();
        url.searchParams.forEach((value, key) => {
            if (ALLOWED_PARAM_KEYS.has(key)) params.set(key, value);
        });

        if (req.method === "POST") {
            try {
                const body = await req.json();
                if (body && typeof body === "object") {
                    for (const [key, value] of Object.entries(body)) {
                        if (ALLOWED_PARAM_KEYS.has(key) && value != null) {
                            params.set(key, String(value));
                        }
                    }
                }
            } catch {
                // Empty / non-JSON body is fine.
            }
        }

        params.set("key", OFFER18_API_KEY);
        params.set("aid", OFFER18_AFFILIATE_ID);
        params.set("mid", OFFER18_MERCHANT_ID);

        const offerUrl = `${OFFER18_BASE_URL}?${params.toString()}`;

        const upstream = await fetch(offerUrl, { method: "GET" });
        const text = await upstream.text();

        let parsed: Record<string, unknown> | null = null;
        try {
            parsed = JSON.parse(text);
        } catch {
            return json(
                {
                    error: "Offer18 returned a non-JSON response",
                    status: upstream.status,
                    body: text.slice(0, 500),
                },
                502,
            );
        }

        // Normalise Offer18's "no offers found" 400 into an empty success so
        // the client doesn't treat it as a hard error.
        const resp = (parsed?.response as string | undefined)?.toString();
        const message = (parsed?.message as string | undefined) ?? "";
        const errorStr = (parsed?.error as string | undefined) ?? "";
        if (
            resp === "400" &&
            (message.toLowerCase().includes("no offers found") ||
                errorStr.toLowerCase().includes("no offers found"))
        ) {
            return json({ response: "200", data: {}, message: "No offers found" });
        }

        return json(parsed as JsonResponse, upstream.ok ? 200 : upstream.status);
    } catch (err) {
        console.error("offer18-proxy unexpected error:", err);
        await reportToSentry(err, { fn: 'offer18-proxy' });
        return json({ error: (err as Error).message ?? "Unknown error" }, 500);
    }
});

// ----------------------------------------------------------------------
// Server-side sync: fetch Offer18's offer feed, upsert into `stores`.
// ----------------------------------------------------------------------
// Mirrors `convertToStore` + `handleSyncToDatabase` from
// src/components/admin/AdminOffer18.tsx so the cron-driven sync produces
// identical rows to the manual admin-button sync. Keep the two in step.

type Offer18Offer = {
    offerid: string | number;
    name: string;
    logo?: string;
    click_url?: string;
    impression_url?: string;
    preview_url?: string;
    model?: string;
    currency?: string;
    price?: string;
    payout?: Array<{ payout?: string }>;
    events?: unknown;
    country_allow?: string;
    country_block?: string;
    category?: string;
    offer_terms?: string;
    offer_kpi?: string;
    status?: string;
    authorized?: string;
};

function convertOfferToStoreRow(offer: Offer18Offer): Record<string, unknown> | null {
    if (!offer?.name) return null;
    const slug = offer.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    if (!slug) return null;

    const bestPayout =
        offer.payout && offer.payout.length > 0 ? offer.payout[0] : null;
    let cashbackPercent = 0;
    let cashbackType: "percent" | "flat" = "percent";
    if (bestPayout) {
        const v = parseFloat(bestPayout.payout ?? "");
        if (!isNaN(v)) cashbackPercent = v;
        cashbackType = offer.model === "CPS" ? "percent" : "flat";
    }

    return {
        name: offer.name,
        slug,
        description:
            offer.offer_terms ||
            offer.offer_kpi ||
            `${offer.name} - ${offer.model ?? "Offer"} offer`,
        logo_url: offer.logo ?? null,
        cashback_percent: cashbackPercent,
        cashback_type: cashbackType,
        category: offer.category ? offer.category.split(",")[0].trim() : "General",
        affiliate_url: offer.click_url ?? null,
        network_type: "offer18",
        offer18_offer_id: String(offer.offerid),
        offers_count: 1,
        is_active: !!offer.click_url,
        updated_at: new Date().toISOString(),
        api_config: {
            offer_id: offer.offerid,
            click_url: offer.click_url,
            impression_url: offer.impression_url,
            preview_url: offer.preview_url,
            model: offer.model,
            currency: offer.currency,
            price: offer.price,
            payout: offer.payout,
            events: offer.events,
            country_allow: offer.country_allow,
            country_block: offer.country_block,
            authorized: offer.authorized === "true",
        },
    };
}

async function runServerSideSync(args: {
    offer18BaseUrl: string;
    apiKey: string;
    affiliateId: string;
    merchantId: string;
    adminClient: ReturnType<typeof createClient>;
}): Promise<Response> {
    const { offer18BaseUrl, apiKey, affiliateId, merchantId, adminClient } = args;

    // Pass offer_access=1 to auto-approve public offers, giving us
    // click_urls for any offer that allows automatic affiliate access.
    const params = new URLSearchParams({
        key: apiKey,
        aid: affiliateId,
        mid: merchantId,
        offer_access: "1",
    });
    const upstream = await fetch(`${offer18BaseUrl}?${params}`, { method: "GET" });
    const text = await upstream.text();

    let parsed: { data?: Record<string, Offer18Offer> } = {};
    try { parsed = JSON.parse(text); } catch {
        return json(
            {
                error: "Offer18 returned a non-JSON response",
                status: upstream.status,
                body: text.slice(0, 500),
            },
            502,
        );
    }

    // Mirror src/services/offer18Service.ts#fetchActiveOffers exactly:
    // require status === "active". Offers with missing/empty status are
    // NOT promoted to active — that would be more permissive than the
    // manual admin-button sync.
    const offers = Object.values(parsed?.data ?? {});
    const activeOffers = offers.filter((o) => o.status === "active");

    // Map -> dedupe by slug -> batch upsert. Same shape as the client.
    const rows: Record<string, unknown>[] = [];
    const bySlug = new Map<string, Record<string, unknown>>();
    for (const o of activeOffers) {
        const row = convertOfferToStoreRow(o);
        if (!row) continue;
        bySlug.set(row.slug as string, row);
    }
    for (const r of bySlug.values()) rows.push(r);

    const BATCH = 50;
    let success = 0;
    let failures = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error } = await adminClient
            .from("stores")
            .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });
        if (error) {
            failures += batch.length;
            errors.push(error.message);
            console.error("offer18-proxy sync batch failed:", error);
        } else {
            success += batch.length;
        }
    }

    return json({
        success: failures === 0,
        fetched: offers.length,
        active: activeOffers.length,
        upserted: success,
        failures,
        errors: errors.slice(0, 5),
        timestamp: new Date().toISOString(),
    });
}
