
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

        // 1. Verify the session_id exists in affiliate_clicks
        const { data: clickData, error: clickError } = await supabaseClient
            .from('affiliate_clicks')
            .select('user_id, store_id, network_type')
            .eq('session_id', sessionId)
            .single()

        if (clickError || !clickData) {
            console.error('Error finding click:', clickError)
            return new Response(
                JSON.stringify({ error: 'Invalid session_id' }),
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
