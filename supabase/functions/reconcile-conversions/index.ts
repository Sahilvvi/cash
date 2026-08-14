import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { reportToSentry } from '../_shared/sentry.ts'
// Single source of truth for network status vocabularies, shared with
// track-conversion. Mirrored in SQL as public.cashback_normalize_status().
import { normalizeStatus } from '../_shared/postback.ts'

/**
 * Reconciliation job for Offer18.
 *
 * Live postbacks are best-effort: an Offer18 retry can hit a stale
 * function deploy, a Supabase outage can drop the request, or the
 * merchant can change a status without firing a status-update postback.
 * This function closes that gap by pulling Offer18's own conversions
 * report for the last N days and routing every row through the same
 * `apply_postback_state` RPC the live postback uses. The RPC handles
 * idempotency and forward-only state transitions, so reconciliation
 * is safe to run repeatedly.
 *
 * Trigger this from pg_cron (see migration 20260417080000) or invoke
 * it manually for ad-hoc backfill:
 *
 *   curl -X POST 'https://<project>.supabase.co/functions/v1/reconcile-conversions' \
 *        -H "Authorization: Bearer $SERVICE_ROLE" \
 *        -H "Content-Type: application/json" \
 *        -d '{"days":7}'
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Affiliate-side Reports API row. Offer18 capitalises the field names
// (`Aff_Click_Id`, `Affiliate_Price`, `Conversions`, etc.) but PHP-style
// snake_case is also accepted in some response variants, so we tolerate
// both. We only need the click correlation id and the payout amount;
// per-row order_id and per-status info are not exposed to affiliates.
interface Offer18ReportRow {
    Date?: string
    Time?: string
    OfferID?: string | number
    Aff_Click_Id?: string
    aff_click_id?: string
    Affiliate_Price?: string | number
    affiliate_price?: string | number
    Conversions?: number
    conversions?: number
    Event?: string
    [key: string]: unknown
}

interface ApplyPostbackResult {
    transaction_id: string
    final_status: string
    action: 'inserted' | 'transitioned' | 'noop' | 'rejected_backward'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Optional body lets a manual invocation override the default
        // 7-day window.
        let days = 7
        if (req.method === 'POST') {
            try {
                const body = await req.json()
                if (body && typeof body.days === 'number' && body.days > 0) {
                    days = Math.min(body.days, 90)
                }
            } catch {
                // empty body is fine
            }
        }

        const apiKey = Deno.env.get('OFFER18_API_KEY')
        const affiliateId = Deno.env.get('OFFER18_AFFILIATE_ID')
        if (!apiKey || !affiliateId) {
            console.warn('OFFER18_API_KEY / OFFER18_AFFILIATE_ID not configured; nothing to reconcile')
            return new Response(
                JSON.stringify({
                    success: true,
                    skipped: true,
                    reason: 'offer18 credentials not configured',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const since = new Date(Date.now() - days * 86_400_000)
        const sinceStr = since.toISOString().slice(0, 10)
        const todayStr = new Date().toISOString().slice(0, 10)

        // Offer18 affiliate-side reporting lives at /api/af/report.
        // There is no separate per-conversion list endpoint for
        // affiliates — the reports API is the canonical view of what
        // Offer18 thinks happened on our affiliate id.
        const merchantId = Deno.env.get('OFFER18_MERCHANT_ID') || ''
        const url = new URL('https://api.offer18.com/api/af/report')
        url.searchParams.set('key', apiKey)
        url.searchParams.set('aid', affiliateId)
        if (merchantId) url.searchParams.set('mid', merchantId)
        url.searchParams.set('from_date', sinceStr)
        url.searchParams.set('to_date', todayStr)
        url.searchParams.set(
            'fields',
            'date,time,offer,affiliate_price,aff_click_id,event,Conversions'
        )

        console.log(`Fetching Offer18 report ${sinceStr} \u2192 ${todayStr}`)

        const o18Res = await fetch(url.toString())
        const rawText = await o18Res.text()

        let parsed: { reports?: Offer18ReportRow[]; status?: number | string } = {}
        try {
            parsed = JSON.parse(rawText)
        } catch {
            // Offer18 returns plain HTML 404 pages on bad endpoints. Treat
            // any non-JSON response as a soft failure so the cron stays
            // green and we don't trip alerting on upstream issues we
            // can't fix from here.
            console.warn('Offer18 returned non-JSON response:', rawText.slice(0, 200))
            return new Response(
                JSON.stringify({
                    success: true,
                    skipped: true,
                    reason: 'offer18 report endpoint returned non-JSON',
                    upstream_status: o18Res.status,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        if (!o18Res.ok || (parsed.status && String(parsed.status) !== '200')) {
            console.warn('Offer18 reports returned a soft error:', o18Res.status, parsed)
            return new Response(
                JSON.stringify({
                    success: true,
                    skipped: true,
                    reason: 'offer18 returned a non-success payload',
                    upstream_status: o18Res.status,
                    upstream_payload: parsed,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        const conversions: Offer18ReportRow[] =
            (Array.isArray(parsed.reports) ? parsed.reports : [])
                .filter((r) => Number(r.Conversions ?? r.conversions ?? 0) > 0)
        console.log(`Offer18 returned ${conversions.length} converting rows`)

        let inserted = 0, transitioned = 0, noop = 0, rejected = 0, errors = 0

        for (const conv of conversions) {
            const sessionId = conv.Aff_Click_Id || conv.aff_click_id
            // Offer18 reports do not expose the merchant's transaction id
            // to the affiliate — we synthesise a stable surrogate from
            // the click id + the conversion timestamp so reruns are
            // idempotent against (network_type, order_id).
            const stamp = (conv.Time as string) || (conv.Date as string) || ''
            const orderId = sessionId ? `o18:${sessionId}:${stamp}` : null
            if (!sessionId) {
                errors += 1
                continue
            }

            // Look up the click to recover user_id / store_id. If the
            // click no longer exists (>90 days, garbage-collected, or
            // never written) we skip the row \u2014 there's nobody to
            // credit.
            const { data: click } = await supabaseClient
                .from('affiliate_clicks')
                .select('user_id, store_id, network_type')
                .eq('session_id', sessionId)
                .maybeSingle()

            if (!click) {
                errors += 1
                continue
            }

            // Affiliate reports only ever surface conversions the
            // network considers real, so we treat them as confirmed.
            // Anything that is later reversed will arrive as a separate
            // postback and the state machine will downgrade it.
            const status = normalizeStatus('confirmed')
            const amount = Number(conv.Affiliate_Price ?? conv.affiliate_price ?? 0)

            const { data: rpcRows, error: rpcErr } = await supabaseClient.rpc(
                'apply_postback_state',
                {
                    p_user_id:      click.user_id,
                    p_store_id:     click.store_id,
                    p_amount:       amount,
                    p_order_id:     orderId,
                    p_network_type: click.network_type || 'offer18',
                    p_status:       status,
                    p_order_amount: null,
                    p_description:  `Reconciled from Offer18 report (${conv.OfferID ?? conv.offer ?? 'unknown offer'})`,
                    // `orderId` here is always a surrogate — Offer18's
                    // affiliate reports never expose the merchant's
                    // transaction id. Flagging it as synthetic lets the RPC
                    // match this against a live postback's row for the same
                    // click instead of creating a second, double-crediting
                    // row under a different key.
                    p_session_id:         sessionId,
                    p_order_id_synthetic: true,
                }
            )

            if (rpcErr) {
                console.error('apply_postback_state failed during reconcile:', rpcErr)
                errors += 1
                continue
            }

            const result = (Array.isArray(rpcRows) ? rpcRows[0] : rpcRows) as ApplyPostbackResult | null
            switch (result?.action) {
                case 'inserted':     inserted += 1;     break
                case 'transitioned': transitioned += 1; break
                case 'noop':         noop += 1;         break
                case 'rejected_backward': rejected += 1; break
                default: errors += 1
            }
        }

        const summary = {
            success: true,
            window_days: days,
            received: conversions.length,
            inserted,
            transitioned,
            noop,
            rejected_backward: rejected,
            errors,
            timestamp: new Date().toISOString(),
        }
        console.log('Reconcile complete:', summary)

        return new Response(
            JSON.stringify(summary),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('reconcile-conversions error:', error)
        await reportToSentry(error, { fn: 'reconcile-conversions' })
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
