/**
 * Offer18 Integration Examples
 * 
 * This file contains practical examples of how to use the Offer18 API service
 * in your cashback platform.
 */

import { offer18Service, type Offer18Offer } from '@/services/offer18Service';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// EXAMPLE 1: Initialize the Service
// =============================================================================

export async function initializeOffer18() {
    // Option A: Load from environment variables
    offer18Service.initialize({
        apiKey: import.meta.env.VITE_OFFER18_API_KEY,
        affiliateId: import.meta.env.VITE_OFFER18_AFFILIATE_ID,
        merchantId: import.meta.env.VITE_OFFER18_MERCHANT_ID,
    });

    // Option B: Load from runtime config
    offer18Service.initialize({
        apiKey: 'your_api_key',
        affiliateId: 'your_affiliate_id',
        merchantId: 'your_merchant_id',
    });
}

// =============================================================================
// EXAMPLE 2: Fetch and Display Offers
// =============================================================================

export async function fetchAndDisplayOffers() {
    try {
        // Fetch all active offers
        const offers = await offer18Service.fetchActiveOffers();

        console.log(`Found ${offers.length} active offers`);

        // Display offer details
        offers.forEach(offer => {
            console.log({
                id: offer.offerid,
                name: offer.name,
                payout: `${offer.payout[0]?.payout} ${offer.currency}`,
                model: offer.model,
                countries: offer.country_allow,
                authorized: offer.authorized === 'true' ? 'Yes' : 'No',
            });
        });

        return offers;
    } catch (error) {
        console.error('Failed to fetch offers:', error);
        throw error;
    }
}

// =============================================================================
// EXAMPLE 3: Filter Offers by Category
// =============================================================================

export async function getGamingOffers() {
    try {
        // Method 1: Using API filter
        const offers = await offer18Service.fetchOffersByCategory('gaming');

        // Method 2: Fetch all and filter client-side
        const allOffers = await offer18Service.fetchActiveOffers();
        const gamingOffers = allOffers.filter(offer =>
            offer.category.toLowerCase().includes('gaming')
        );

        return gamingOffers;
    } catch (error) {
        console.error('Failed to fetch gaming offers:', error);
        return [];
    }
}

// =============================================================================
// EXAMPLE 4: Get Country-Specific Offers
// =============================================================================

export async function getOffersForCountry(countryCode: string) {
    try {
        // Fetch all offers
        const allOffers = await offer18Service.fetchActiveOffers();

        // Filter by country
        const countryOffers = allOffers.filter(offer =>
            offer18Service.isOfferAvailableInCountry(offer, countryCode)
        );

        console.log(`Found ${countryOffers.length} offers for ${countryCode}`);

        return countryOffers;
    } catch (error) {
        console.error('Failed to get country offers:', error);
        return [];
    }
}

// =============================================================================
// EXAMPLE 5: Sync Offers to Database
// =============================================================================

export async function syncOffersToDatabase() {
    try {
        // Fetch active offers
        const offers = await offer18Service.fetchActiveOffers();

        let successCount = 0;
        let errorCount = 0;

        for (const offer of offers) {
            try {
                // Convert to store format
                const storeData = offer18Service.convertToStore(offer);

                // Check if store exists
                const { data: existing } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('slug', storeData.slug)
                    .maybeSingle();

                if (existing) {
                    // Update existing store
                    await supabase
                        .from('stores')
                        .update({
                            ...storeData,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', existing.id);
                } else {
                    // Insert new store
                    await supabase
                        .from('stores')
                        .insert({
                            ...storeData,
                            is_active: true,
                            is_new: true,
                            offers_count: 1,
                        });
                }

                successCount++;
            } catch (error) {
                console.error(`Failed to sync offer ${offer.offerid}:`, error);
                errorCount++;
            }
        }

        console.log(`Sync complete: ${successCount} success, ${errorCount} errors`);

        return { successCount, errorCount, total: offers.length };
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
}

// =============================================================================
// EXAMPLE 6: Create Tracking Link
// =============================================================================

export async function createTrackingLink(
    offerId: string,
    userId: string,
    sessionId?: string
) {
    try {
        // Fetch the specific offer
        const offer = await offer18Service.fetchOfferById(offerId);

        if (!offer) {
            throw new Error('Offer not found');
        }

        // Generate sub ID (for tracking conversions back to user)
        const subId = sessionId || `${userId}_${Date.now()}`;

        // Get tracking URL
        const trackingUrl = offer18Service.getTrackingUrl(offer, subId);

        // Save click to database
        const { data: click, error } = await supabase
            .from('affiliate_clicks')
            .insert({
                user_id: userId,
                store_id: offerId,
                session_id: subId,
                clicked_url: trackingUrl,
                clicked_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        console.log('Tracking link created:', trackingUrl);

        return {
            trackingUrl,
            clickId: click.id,
            subId,
        };
    } catch (error) {
        console.error('Failed to create tracking link:', error);
        throw error;
    }
}

// =============================================================================
// EXAMPLE 7: Calculate Dynamic Cashback
// =============================================================================

export async function calculateCashback(
    offer: Offer18Offer,
    conditions?: {
        event?: string;
        country?: string;
        device_type?: string;
    }
): Promise<number> {
    // Get the relevant payout based on conditions
    const payout = offer18Service.getOfferPayout(offer, conditions);

    if (!payout) {
        return 0;
    }

    // Your platform's share (e.g., 80% to user, 20% platform fee)
    const userSharePercent = 80;

    // Calculate cashback
    const payoutAmount = parseFloat(payout.payout);
    const cashback = (payoutAmount * userSharePercent) / 100;

    return cashback;
}

// =============================================================================
// EXAMPLE 8: Get Offer Statistics
// =============================================================================

export async function getOfferStatistics() {
    try {
        const offers = await offer18Service.fetchOffers();
        const offerArray = Object.values(offers.data);

        const stats = {
            total: offerArray.length,
            active: offerArray.filter(o => o.status === 'active').length,
            authorized: offerArray.filter(o => o.authorized === 'true').length,
            byModel: {
                CPA: offerArray.filter(o => o.model === 'CPA').length,
                CPC: offerArray.filter(o => o.model === 'CPC').length,
                CPL: offerArray.filter(o => o.model === 'CPL').length,
                CPS: offerArray.filter(o => o.model === 'CPS').length,
                CPM: offerArray.filter(o => o.model === 'CPM').length,
            },
            byCategory: {} as Record<string, number>,
            averagePayout: 0,
        };

        // Count by category
        offerArray.forEach(offer => {
            const categories = offer.category.split(',');
            categories.forEach(cat => {
                const category = cat.trim();
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            });

            // Calculate average payout
            const payout = parseFloat(offer.payout[0]?.payout || '0');
            stats.averagePayout += payout;
        });

        stats.averagePayout = stats.averagePayout / offerArray.length;

        console.log('Offer Statistics:', stats);

        return stats;
    } catch (error) {
        console.error('Failed to get statistics:', error);
        throw error;
    }
}

// =============================================================================
// EXAMPLE 9: Handle Conversion Postback
// =============================================================================

export async function handleConversionPostback(postbackData: {
    offer_id: string;
    sub1: string; // Our session ID (userId_sessionId)
    payout: string;
    status: 'pending' | 'approved' | 'rejected';
    transaction_id: string;
}) {
    try {
        // Find the original click
        const { data: click, error: clickError } = await supabase
            .from('affiliate_clicks')
            .select('*')
            .eq('session_id', postbackData.sub1)
            .single();

        if (clickError || !click) {
            console.error('Click not found for sub ID:', postbackData.sub1);
            return { success: false, error: 'Click not found' };
        }

        // Calculate user cashback (80% of payout)
        const totalPayout = parseFloat(postbackData.payout);
        const userCashback = totalPayout * 0.8;
        const platformFee = totalPayout * 0.2;

        // Create cashback transaction
        const { error: transactionError } = await supabase
            .from('cashback_transactions')
            .insert({
                user_id: click.user_id,
                store_id: click.store_id,
                amount: userCashback,
                order_id: postbackData.transaction_id,
                status: postbackData.status === 'approved' ? 'confirmed' : 'pending',
                network_type: 'offer18',
                network_transaction_id: postbackData.transaction_id,
                platform_fee: platformFee,
                created_at: new Date().toISOString(),
            });

        if (transactionError) throw transactionError;

        // Update click status
        await supabase
            .from('affiliate_clicks')
            .update({
                converted: true,
                conversion_date: new Date().toISOString(),
            })
            .eq('id', click.id);

        console.log('Conversion recorded:', {
            userId: click.user_id,
            amount: userCashback,
            status: postbackData.status,
        });

        return {
            success: true,
            cashback: userCashback,
            status: postbackData.status,
        };
    } catch (error) {
        console.error('Failed to handle conversion:', error);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// EXAMPLE 10: Automated Daily Sync
// =============================================================================

export async function scheduledDailySync() {
    console.log('Starting scheduled Offer18 sync...');

    try {
        // 1. Fetch active authorized offers
        const offers = await offer18Service.fetchAuthorizedOffers();

        console.log(`Fetched ${offers.length} authorized offers`);

        // 2. Sync to database
        const result = await syncOffersToDatabase();

        // 3. Log results
        console.log('Sync Results:', {
            total: result.total,
            success: result.successCount,
            errors: result.errorCount,
            timestamp: new Date().toISOString(),
        });

        // 4. Send notification if there were errors
        if (result.errorCount > 0) {
            // Send email/notification to admin
            console.warn(`${result.errorCount} offers failed to sync`);
        }

        return result;
    } catch (error) {
        console.error('Scheduled sync failed:', error);
        // Send error notification to admin
        throw error;
    }
}

// =============================================================================
// EXAMPLE 11: Smart Offer Recommendations
// =============================================================================

export async function getRecommendedOffers(userId: string) {
    try {
        // 1. Get user's country from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('country')
            .eq('id', userId)
            .single();

        const userCountry = profile?.country || 'US';

        // 2. Get user's click history to determine interests
        const { data: clicks } = await supabase
            .from('affiliate_clicks')
            .select('store_id, stores(category)')
            .eq('user_id', userId)
            .limit(10);

        // 3. Extract categories from history
        const userCategories = new Set(
            clicks?.map(c => c.stores?.category).filter(Boolean) || []
        );

        // 4. Fetch all offers
        const allOffers = await offer18Service.fetchActiveOffers();

        // 5. Filter and score offers
        const scoredOffers = allOffers
            .filter(offer =>
                offer18Service.isOfferAvailableInCountry(offer, userCountry)
            )
            .map(offer => {
                let score = 0;

                // Higher score for authorized offers
                if (offer.authorized === 'true') score += 10;

                // Higher score for matching categories
                if (userCategories.size > 0) {
                    const offerCategories = offer.category.split(',').map(c => c.trim());
                    const matches = offerCategories.filter(cat =>
                        userCategories.has(cat)
                    ).length;
                    score += matches * 5;
                }

                // Higher score for better payouts
                const payout = parseFloat(offer.payout[0]?.payout || '0');
                score += payout / 10;

                return { offer, score };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10 recommendations

        return scoredOffers.map(s => s.offer);
    } catch (error) {
        console.error('Failed to get recommendations:', error);
        return [];
    }
}

// =============================================================================
// EXAMPLE 12: Bulk Operations
// =============================================================================

export async function bulkOperations() {
    // Fetch offers by multiple criteria
    const results = await Promise.all([
        offer18Service.fetchOffersByModel('CPA'),
        offer18Service.fetchOffersByCountry('US'),
        offer18Service.fetchOffersByCategory('gaming'),
    ]);

    const [cpaOffers, usOffers, gamingOffers] = results;

    console.log({
        cpa: cpaOffers.length,
        us: usOffers.length,
        gaming: gamingOffers.length,
    });

    // Find offers that match all criteria
    const matchingOffers = cpaOffers.filter(
        offer =>
            usOffers.includes(offer) &&
            gamingOffers.includes(offer) &&
            offer.authorized === 'true'
    );

    console.log(`Found ${matchingOffers.length} offers matching all criteria`);

    return matchingOffers;
}

// =============================================================================
// Export all examples for easy import
// =============================================================================

export const Offer18Examples = {
    initializeOffer18,
    fetchAndDisplayOffers,
    getGamingOffers,
    getOffersForCountry,
    syncOffersToDatabase,
    createTrackingLink,
    calculateCashback,
    getOfferStatistics,
    handleConversionPostback,
    scheduledDailySync,
    getRecommendedOffers,
    bulkOperations,
};
