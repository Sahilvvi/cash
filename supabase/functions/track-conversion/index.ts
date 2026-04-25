
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

        // 2. Hand off to the state-machine RPC. apply_postback_state
        //    inserts a new row when (network_type, order_id) is novel,
        //    moves the row forward through pending → approved →
        //    confirmed (or to reversed) on subsequent postbacks, and
        //    returns a noop when the same status is replayed. The same
        //    RPC is reused by the reconciliation job so live postbacks
        //    and the nightly diff agree on transition rules.
        const networkType = clickData.network_type || params.network_type || 'generic_postback'
        const transactionStatus = status || 'pending'
        const cashbackAmount = parseFloat(amount) || 0
        const orderAmount = params.order_amount ? parseFloat(params.order_amount) : null

        const { data: rpcRows, error: rpcError } = await supabaseClient.rpc(
            'apply_postback_state',
            {
                p_user_id:      clickData.user_id,
                p_store_id:     clickData.store_id,
                p_amount:       cashbackAmount,
                p_order_id:     order_id ?? null,
                p_network_type: networkType,
                p_status:       transactionStatus,
                p_order_amount: orderAmount,
                p_description:  `Cashback for order ${order_id || 'N/A'}`,
            }
        )

        if (rpcError) {
            console.error('apply_postback_state failed:', rpcError)
            throw rpcError
        }

        const rpcResult = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows
        const action = rpcResult?.action ?? 'unknown'
        const finalStatus = rpcResult?.final_status ?? transactionStatus
        const transactionId = rpcResult?.transaction_id

        // Re-fetch the row so the caller (network or admin) sees the
        // canonical state, not just our request payload.
        const { data: transactionData } = await supabaseClient
            .from('cashback_transactions')
            .select('*')
            .eq('id', transactionId)
            .maybeSingle()

        return new Response(
            JSON.stringify({
                success: true,
                duplicate: action === 'noop',
                action,
                status: finalStatus,
                transaction: transactionData,
            }),
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
