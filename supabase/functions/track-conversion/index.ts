
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { reportToSentry } from '../_shared/sentry.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Capture caller metadata once so we can attach it to any error log.
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    const userAgent = req.headers.get('user-agent') ?? null

    // Parse params up-front so the failure path can include them in the
    // postback_errors row even if processing aborts early.
    let params: Record<string, string> = {}
    let rawQuery: string | null = null
    try {
        if (req.method === 'GET') {
            const url = new URL(req.url)
            rawQuery = url.search ? url.search.slice(0, 1024) : null
            url.searchParams.forEach((value, key) => { params[key] = value })
        } else {
            const body = await req.json()
            params = body || {}
        }
    } catch {
        // Body wasn't valid JSON; keep params empty so we still log the failure.
    }

    // Helpers ---------------------------------------------------------------
    const logError = async (
        statusCode: number,
        reason: string,
        message: string
    ) => {
        try {
            // Strip the secret token from the stored query before persisting.
            const sanitisedQuery = rawQuery
                ? rawQuery.replace(/([?&])token=[^&]*/gi, '$1token=***')
                : null
            await supabaseClient.from('postback_errors').insert({
                status_code: statusCode,
                reason,
                message: message?.slice(0, 1024) ?? null,
                query: sanitisedQuery,
                session_id: params.session_id ?? params.subid ?? params.click_id ?? null,
                order_id:   params.order_id ?? null,
                network:    params.network_type ?? null,
                ip,
                user_agent: userAgent,
            })
        } catch (logErr) {
            // Never let the audit log break the postback path.
            console.error('postback_errors insert failed:', logErr)
        }
    }

    const failJson = async (
        statusCode: number,
        reason: string,
        message: string
    ) => {
        await logError(statusCode, reason, message)
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
        )
    }

    try {
        // Strip `token` from logged params — it carries POSTBACK_SECRET and
        // must never end up in the edge function logs.
        const { token: _loggedToken, ...loggableParams } = params
        console.log('Received conversion tracking request:', loggableParams)

        // Gate: if POSTBACK_SECRET is configured, reject any request whose
        // `token` query param (or `X-Postback-Token` header) doesn't match.
        const postbackSecret = Deno.env.get('POSTBACK_SECRET')
        if (postbackSecret) {
            const providedToken = params.token || req.headers.get('x-postback-token') || ''
            if (providedToken !== postbackSecret) {
                console.warn('Rejected postback: bad/missing token')
                return await failJson(401, 'bad_token', 'Unauthorized postback')
            }
        }

        // Support multiple parameter names for session_id
        const sessionId = params.session_id ||
            params.subid ||
            params.linkId ||  // Amazon
            params.affExtParam1 || // Flipkart
            params.click_id ||
            params.transaction_id

        const { amount, order_id, status } = params

        if (!sessionId) {
            console.error('Missing session identifier in params:', Object.keys(params))
            return await failJson(400, 'missing_session', 'Missing session_id or equivalent tracking parameter')
        }

        console.log(`Processing conversion for session: ${sessionId}`)

        // 1. Verify the session_id exists in affiliate_clicks AND bind the
        //    postback to the click's attributes.
        const { data: clickData, error: clickError } = await supabaseClient
            .from('affiliate_clicks')
            .select('user_id, store_id, network_type, clicked_at')
            .eq('session_id', sessionId)
            .single()

        if (clickError || !clickData) {
            console.error('Error finding click:', clickError)
            return await failJson(400, 'invalid_session', 'Invalid session_id')
        }

        // 1a. Reject stale clicks.
        const CLICK_MAX_AGE_DAYS = 90
        const clickedAt = new Date(clickData.clicked_at as string)
        const ageDays = (Date.now() - clickedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (Number.isFinite(ageDays) && ageDays > CLICK_MAX_AGE_DAYS) {
            console.warn(`Rejected postback: click ${sessionId} is ${ageDays.toFixed(1)}d old`)
            return await failJson(410, 'click_expired', 'Click expired (>90 days)')
        }

        // 1b. Network/store binding.
        if (params.network_type
            && clickData.network_type
            && String(params.network_type).toLowerCase()
               !== String(clickData.network_type).toLowerCase()) {
            console.warn(`Rejected postback: network_type mismatch ` +
                `(click=${clickData.network_type}, postback=${params.network_type})`)
            return await failJson(400, 'network_mismatch', 'Postback network_type does not match click')
        }

        if (params.store_id
            && clickData.store_id
            && String(params.store_id) !== String(clickData.store_id)) {
            console.warn(`Rejected postback: store_id mismatch ` +
                `(click=${clickData.store_id}, postback=${params.store_id})`)
            return await failJson(400, 'store_mismatch', 'Postback store_id does not match click')
        }

        // 2. Hand off to the state-machine RPC.
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
            // Return directly so the outer try/catch doesn't re-log this
            // as `unhandled` and clobber the 500 status with a 400.
            return await failJson(500, 'rpc_error', rpcError.message ?? 'apply_postback_state failed')
        }

        const rpcResult = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows
        const action = rpcResult?.action ?? 'unknown'
        const finalStatus = rpcResult?.final_status ?? transactionStatus
        const transactionId = rpcResult?.transaction_id

        // Re-fetch the row so the caller sees the canonical state.
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
        await reportToSentry(error, {
            fn: 'track-conversion',
            ctx: {
                session_id: params.session_id ?? params.subid ?? params.click_id ?? null,
                order_id: params.order_id ?? null,
                network: params.network_type ?? null,
            },
        })
        return await failJson(400, 'unhandled', (error as Error)?.message ?? 'Unhandled error')
    }
})
