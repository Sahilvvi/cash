
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - env var automatically populated by Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Service Role Key - env var automatically populated by Supabase
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get request data (support both GET and POST)
        let params: any = {}
        if (req.method === 'GET') {
            const url = new URL(req.url)
            url.searchParams.forEach((value, key) => {
                params[key] = value
            })
        } else {
            params = await req.json()
        }

        // Strip `token` from logged params — it carries POSTBACK_SECRET and
        // must never end up in the edge function logs.
        const { token: _loggedToken, ...loggableParams } = params
        console.log('Received conversion tracking request:', loggableParams)

        // Gate: if POSTBACK_SECRET is configured, reject any request whose
        // `token` query param (or `X-Postback-Token` header) doesn't match.
        // This prevents an attacker who guesses a user's session_id from
        // forging a conversion. We keep the gate optional so the function
        // remains backwards-compatible if the secret has not been set yet
        // on a fresh environment.
        const postbackSecret = Deno.env.get('POSTBACK_SECRET')
        if (postbackSecret) {
            const providedToken = params.token || req.headers.get('x-postback-token') || ''
            if (providedToken !== postbackSecret) {
                console.warn('Rejected postback: bad/missing token')
                return new Response(
                    JSON.stringify({ error: 'Unauthorized postback' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
                )
            }
        }

        // Support multiple parameter names for session_id
        // Different networks use different parameter names
        const sessionId = params.session_id ||
            params.subid ||
            params.linkId ||  // Amazon
            params.affExtParam1 || // Flipkart
            params.click_id ||
            params.transaction_id

        const { amount, order_id, status } = params

        if (!sessionId) {
            console.error('Missing session identifier in params:', Object.keys(params))
            throw new Error('Missing session_id or equivalent tracking parameter')
        }

        console.log(`Processing conversion for session: ${sessionId}`)

        // 1. Verify the session_id exists in affiliate_clicks AND bind the
        //    postback to the click's attributes. Even if POSTBACK_SECRET
        //    leaks, an attacker still needs the original click's network
        //    type, store id, AND session id AND for the click to be less
        //    than 90 days old.
        const { data: clickData, error: clickError } = await supabaseClient
            .from('affiliate_clicks')
            .select('user_id, store_id, network_type, clicked_at')
            .eq('session_id', sessionId)
            .single()

        if (clickError || !clickData) {
            console.error('Error finding click:', clickError)
            return new Response(
                JSON.stringify({ error: 'Invalid session_id' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 1a. Reject stale clicks. 90 days matches the longest confirmation
        //     window any affiliate network uses in practice.
        const CLICK_MAX_AGE_DAYS = 90
        const clickedAt = new Date(clickData.clicked_at as string)
        const ageDays = (Date.now() - clickedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (Number.isFinite(ageDays) && ageDays > CLICK_MAX_AGE_DAYS) {
            console.warn(`Rejected postback: click ${sessionId} is ${ageDays.toFixed(1)}d old`)
            return new Response(
                JSON.stringify({ error: 'Click expired (>90 days)' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 }
            )
        }

        // 1b. If the postback carries a network_type and/or store_id,
        //     they must match what we stored at click time. Networks
        //     always echo back their own network_type; store_id is
        //     optional but validated when present.
        if (params.network_type
            && clickData.network_type
            && String(params.network_type).toLowerCase()
               !== String(clickData.network_type).toLowerCase()) {
            console.warn(`Rejected postback: network_type mismatch ` +
                `(click=${clickData.network_type}, postback=${params.network_type})`)
            return new Response(
                JSON.stringify({ error: 'Postback network_type does not match click' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        if (params.store_id
            && clickData.store_id
            && String(params.store_id) !== String(clickData.store_id)) {
            console.warn(`Rejected postback: store_id mismatch ` +
                `(click=${clickData.store_id}, postback=${params.store_id})`)
            return new Response(
                JSON.stringify({ error: 'Postback store_id does not match click' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 2. Idempotency: if we have already recorded this conversion
        // (same network_type + order_id), return the existing row instead
        // of inserting a duplicate. Networks retry postbacks on network
        // failures so this path is hit in normal operation.
        // Fallback must match the DB default on `cashback_transactions.network_type`
        // (set to 'generic_postback' in migration 20260417015000). If this
        // differs, rows inserted by other code paths (e.g. fetch-conversions) or
        // rows backfilled by the ALTER TABLE would get 'generic_postback' while
        // our idempotency lookup would miss them with a different fallback,
        // letting a second row slip in under the unique index.
        const networkType = clickData.network_type || params.network_type || 'generic_postback'

        if (order_id) {
            const { data: existing } = await supabaseClient
                .from('cashback_transactions')
                .select('*')
                .eq('network_type', networkType)
                .eq('order_id', order_id)
                .maybeSingle()

            if (existing) {
                console.log(`Duplicate postback ignored for ${networkType}/${order_id}`)
                return new Response(
                    JSON.stringify({ success: true, duplicate: true, transaction: existing }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
        }

        // 3. Insert into cashback_transactions
        const transactionStatus = status || 'pending'
        // Default to a simple calculation if amount not provided, or take amount as is
        // This logic might need refinement based on exact network parameters (e.g. commission vs order value)
        const cashbackAmount = parseFloat(amount) || 0

        const { data: transactionData, error: transactionError } = await supabaseClient
            .from('cashback_transactions')
            .insert({
                user_id: clickData.user_id,
                store_id: clickData.store_id,
                amount: cashbackAmount,
                status: transactionStatus,
                order_id: order_id,
                network_type: networkType,
                order_amount: params.order_amount ? parseFloat(params.order_amount) : null,
                description: `Cashback for order ${order_id || 'N/A'}`,
            })
            .select()
            .single()

        if (transactionError) {
            // Handle race: another request inserted between our idempotency
            // check and this insert. The unique index on (network_type,
            // order_id) will raise 23505 — treat it as a duplicate.
            if ((transactionError as { code?: string }).code === '23505') {
                const { data: existing } = await supabaseClient
                    .from('cashback_transactions')
                    .select('*')
                    .eq('network_type', networkType)
                    .eq('order_id', order_id)
                    .maybeSingle()
                return new Response(
                    JSON.stringify({ success: true, duplicate: true, transaction: existing }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
                )
            }
            console.error('Error recording transaction:', transactionError)
            throw transactionError
        }

        return new Response(
            JSON.stringify({ success: true, duplicate: false, transaction: transactionData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
