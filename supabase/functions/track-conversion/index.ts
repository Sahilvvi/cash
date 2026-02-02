
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

        console.log('Received conversion tracking request:', params)

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
            .select('user_id, store_id')
            .eq('session_id', sessionId)
            .single()

        if (clickError || !clickData) {
            console.error('Error finding click:', clickError)
            return new Response(
                JSON.stringify({ error: 'Invalid session_id' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 2. Insert into cashback_transactions
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
                description: `Cashback for order ${order_id || 'N/A'}`,
            })
            .select()

        if (transactionError) {
            console.error('Error recording transaction:', transactionError)
            throw transactionError
        }

        return new Response(
            JSON.stringify({ success: true, transaction: transactionData }),
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
