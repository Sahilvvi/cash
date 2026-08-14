import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { normalizeStatus } from '../_shared/postback.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This function is designed to be invoked via Cron (e.g., every hour)
// It polls Amazon, Flipkart, and other direct API integrations for conversions
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Starting conversion fetch job...')

        // Fetch all active stores that use direct API integration
        const { data: stores, error: storesError } = await supabaseClient
            .from('stores')
            .select('id, name, network_type, api_config')
            .in('network_type', ['amazon_direct', 'flipkart_direct'])
            .eq('is_active', true)

        if (storesError) {
            throw storesError
        }

        console.log(`Found ${stores?.length || 0} stores with direct API integration`)

        let totalProcessed = 0
        let totalInserted = 0

        // Process each store
        for (const store of stores || []) {
            console.log(`Processing store: ${store.name} (${store.network_type})`)

            try {
                let orders = []

                if (store.network_type === 'amazon_direct') {
                    orders = await fetchAmazonOrders(store, supabaseClient)
                } else if (store.network_type === 'flipkart_direct') {
                    orders = await fetchFlipkartOrders(store, supabaseClient)
                }

                totalProcessed += orders.length

                // Process each order
                for (const order of orders) {
                    const inserted = await processOrder(
                        order, store.id, store.network_type, supabaseClient
                    )
                    if (inserted) totalInserted++
                }

            } catch (error) {
                console.error(`Error processing store ${store.name}:`, error)
                // Continue with next store
            }
        }

        console.log(`Conversion fetch complete. Processed: ${totalProcessed}, Inserted: ${totalInserted}`)

        return new Response(
            JSON.stringify({
                success: true,
                processed: totalProcessed,
                inserted: totalInserted,
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error in fetch-conversions:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})

interface StoreRecord {
    id: string;
    name: string;
    network_type: string;
    api_config: Record<string, string> | null;
}

interface OrderRecord {
    session_id: string;
    order_id: string;
    amount: number;
    order_value: number;
    status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAmazonOrders(store: StoreRecord, supabaseClient: Record<string, any>) {
    /*
     * Amazon Product Advertising API / Associates API integration
     * 
     * To implement:
     * 1. Use api_config.tracking_id (Amazon Associates Tracking ID)
     * 2. Use api_config.access_key and api_config.secret_key for API authentication
     * 3. Call Amazon PA-API 5.0 or use Amazon's reporting endpoint
     * 4. Look for orders with your tracking tag
     * 
     * Note: Amazon doesn't provide real-time conversion API. You typically:
     * - Use their Reports center (delayed by 24-48 hours)
     * - Or parse affiliate link clicks and match with Product Advertising API data
     */

    console.log('Fetching Amazon orders...')

    const apiConfig = store.api_config || {}
    const trackingId = apiConfig.tracking_id // e.g., "yoursite-20"

    if (!trackingId) {
        console.warn(`No tracking_id configured for Amazon store: ${store.name}`)
        return []
    }

    // TODO: Implement actual Amazon API call
    // For now, return mock data for demonstration
    // In production, you would:
    // 1. Call Amazon Associates API or Reports API
    // 2. Parse the response
    // 3. Extract orders with your tracking tag

    return []

    // Example mock structure (remove in production):
    /*
    return [
        {
            session_id: 'abc-123-def',  // Your custom tracking tag from the URL
            order_id: 'AMZ-12345',
            amount: 50.00,              // Commission amount
            order_value: 1000.00,       // Total order value
            status: 'confirmed'
        }
    ]
    */
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFlipkartOrders(store: StoreRecord, supabaseClient: Record<string, any>) {
    /*
     * Flipkart Affiliate API integration
     * 
     * To implement:
     * 1. Use api_config.affiliate_id
     * 2. Use api_config.affiliate_token for authentication
     * 3. Call Flipkart Affiliate API to fetch conversions
     * 4. Parse the response for orders
     * 
     * Flipkart API endpoint example:
     * https://affiliate-api.flipkart.net/affiliate/report/orders/detail/json
     */

    console.log('Fetching Flipkart orders...')

    const apiConfig = store.api_config || {}
    const affiliateId = apiConfig.affiliate_id
    const affiliateToken = apiConfig.affiliate_token

    if (!affiliateId || !affiliateToken) {
        console.warn(`Missing Flipkart credentials for store: ${store.name}`)
        return []
    }

    // TODO: Implement actual Flipkart API call
    // For now, return empty array

    return []

    // Example implementation (uncomment and modify for production):
    /*
    try {
        const response = await fetch('https://affiliate-api.flipkart.net/affiliate/report/orders/detail/json', {
            method: 'GET',
            headers: {
                'Fk-Affiliate-Id': affiliateId,
                'Fk-Affiliate-Token': affiliateToken,
            }
        })
        
        const data = await response.json()
        
        // Parse Flipkart response and extract orders
        // Map to our standard format
        return data.orderList?.map((order: any) => ({
            session_id: order.customTrackingId,
            order_id: order.orderId,
            amount: parseFloat(order.tentativeCommission),
            order_value: parseFloat(order.orderValue),
            status: order.status === 'Approved' ? 'confirmed' : 'pending'
        })) || []
        
    } catch (error) {
        console.error('Flipkart API error:', error)
        return []
    }
    */
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processOrder(
    order: OrderRecord,
    storeId: string,
    networkType: string,
    supabaseClient: Record<string, any>
) {
    try {
        // Find the affiliate click by session_id
        const { data: clickData, error: clickError } = await supabaseClient
            .from('affiliate_clicks')
            .select('user_id, store_id, session_id')
            .eq('session_id', order.session_id)
            .eq('store_id', storeId)
            .single()

        if (clickError || !clickData) {
            console.log(`No matching click found for session_id: ${order.session_id}`)
            return false
        }

        // Route through the same state machine the live postback uses.
        //
        // The previous direct INSERT omitted `network_type`, which
        // migration 20260417080000 made NOT NULL — so every insert here
        // would have failed outright. It also hand-rolled a duplicate
        // check on (user_id, order_id) that didn't match the real
        // idempotency key, and could never move a row from pending to
        // confirmed on a later poll. apply_postback_state handles both.
        const { data: rpcRows, error: rpcError } = await supabaseClient.rpc(
            'apply_postback_state',
            {
                p_user_id:      clickData.user_id,
                p_store_id:     storeId,
                p_amount:       order.amount,
                p_order_id:     order.order_id,
                p_network_type: networkType,
                p_status:       normalizeStatus(order.status),
                p_order_amount: order.order_value ?? null,
                p_description:  `Cashback for order ${order.order_id}`,
                // Amazon/Flipkart report real merchant order ids, so this
                // is never a surrogate.
                p_session_id:         order.session_id,
                p_order_id_synthetic: false,
            }
        )

        if (rpcError) {
            console.error('apply_postback_state failed:', rpcError)
            return false
        }

        const action = (Array.isArray(rpcRows) ? rpcRows[0] : rpcRows)?.action
        if (action === 'noop' || action === 'rejected_backward') {
            console.log(`Order ${order.order_id} already recorded (${action})`)
            return false
        }

        console.log(`✓ ${action} transaction for order: ${order.order_id}, amount: ${order.amount}`)
        return true

    } catch (error) {
        console.error('Error processing order:', error)
        return false
    }
}
