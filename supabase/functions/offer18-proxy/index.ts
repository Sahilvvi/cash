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
        const isStatus = url.searchParams.get("action") === "status";

        // --- Auth: caller must be an admin --------------------------------
        // Note: we intentionally run the auth check BEFORE the status probe
        // so we don't leak affiliate/merchant IDs to unauthenticated callers.
        const authHeader = req.headers.get("Authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
            return json({ error: "Missing Authorization header" }, 401);
        }
        const jwt = authHeader.slice("bearer ".length).trim();

        // Pass the JWT explicitly to getUser(). Otherwise supabase-js looks at
        // its own (empty) stored session and the auth check silently fails
        // regardless of the Authorization header. This is the pattern that
        // works for ES256 access tokens too.
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
        if (userErr || !userData?.user) {
            return json({ error: "Invalid or expired session" }, 401);
        }

        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
