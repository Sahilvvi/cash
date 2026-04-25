// Lightweight liveness/readiness probe for the cashback platform.
//
// Returns 200 with a JSON envelope describing whether the database is
// reachable and which critical functions/secrets are wired up. Returns 503
// if any check fails. Designed to be polled by uptime monitors (Better
// Uptime / UptimeRobot / Cloudflare Workers cron) AND by the Vercel
// frontend for a quick "is the backend alive" indicator.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERSION = Deno.env.get('GIT_SHA') ?? 'dev'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    const startedAt = Date.now()
    const checks: Record<string, { ok: boolean; detail?: string; ms?: number }> = {}

    // 1. Database round-trip via service-role.
    const dbStart = Date.now()
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        // Use a lightweight COUNT against a system table we control
        // rather than `select 1`, since postgrest doesn't speak `select 1`.
        const { error } = await supabase
            .from('postback_errors')
            .select('id', { head: true, count: 'exact' })
            .limit(1)
        if (error) throw error
        checks.database = { ok: true, ms: Date.now() - dbStart }
    } catch (e) {
        checks.database = {
            ok: false,
            detail: (e as Error)?.message?.slice(0, 200) ?? 'unknown',
            ms: Date.now() - dbStart,
        }
    }

    // 2. POSTBACK_SECRET configured? Without it, conversions are unauthenticated.
    checks.postback_secret = {
        ok: Boolean(Deno.env.get('POSTBACK_SECRET')),
        detail: Deno.env.get('POSTBACK_SECRET') ? undefined : 'POSTBACK_SECRET env var not set',
    }

    // 3. Offer18 credentials configured? Without these, sync + reconcile fail.
    const offer18Configured = Boolean(
        Deno.env.get('OFFER18_API_KEY')
        && Deno.env.get('OFFER18_AFFILIATE_ID')
    )
    checks.offer18 = {
        ok: offer18Configured,
        detail: offer18Configured
            ? undefined
            : 'OFFER18_API_KEY / OFFER18_AFFILIATE_ID not configured',
    }

    const allOk = Object.values(checks).every((c) => c.ok)

    return new Response(
        JSON.stringify({
            status: allOk ? 'ok' : 'degraded',
            version: VERSION,
            uptime_ms: Date.now() - startedAt,
            checks,
            timestamp: new Date().toISOString(),
        }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            // 200 if all critical checks pass, 503 if DB is down (the only
            // truly critical check; missing optional secrets are surfaced
            // but don't make the overall service "down").
            status: checks.database.ok ? 200 : 503,
        }
    )
})
