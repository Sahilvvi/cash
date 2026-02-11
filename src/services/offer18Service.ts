/**
 * Offer18 API Integration Service
 * 
 * Documentation: https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
 * Base URL: https://api.offer18.com/api/af/offers
 */

// Offer18 API Response Types
export interface Offer18Event {
    event_name: string;
    event_token: string;
}

export interface Offer18Payout {
    payout: string;
    currency: string;
    model: string;
    condition: any[][];
    rule_id: string;
}

export interface Offer18Capping {
    rule_type: 'shared_capping' | 'affiliate_capping';
    event: string;
    type: 'gross_conversions' | 'approved_conversions';
    period: 'daily' | 'monthly';
    value: number;
    timezone: string | null;
    rule_id: string;
}

export interface Offer18Creative {
    type: 'image' | 'html' | 'video';
    url: string;
}

export interface Offer18SuppressionList {
    name: string;
    file_url: string;
    unsubscribe_url: string;
    subject_lines: string;
    from_lines: string;
}

export interface Offer18Offer {
    offerid: string;
    name: string;
    logo: string;
    status: 'active' | 'paused' | 'inactive';
    category: string;
    currency: string;
    price: number;
    model: 'CPA' | 'CPC' | 'CPL' | 'CPS' | 'CPM';
    date_start: string;
    date_end: string;
    preview_url: string;
    offer_terms: string;
    offer_kpi: string;
    country_allow: string;
    country_block: string;
    city_allow: string;
    city_block: string;
    os_allow: string;
    os_block: string;
    device_allow: string;
    device_block: string;
    isp_allow: string;
    isp_block: string;
    browser_allow: string;
    browser_block: string;
    capping: Offer18Capping[];
    events: Offer18Event[];
    payout: Offer18Payout[];
    suppression_list: Offer18SuppressionList[];
    impression_url: string;
    click_url: string;
    authorized: string;
    creatives: Offer18Creative[];
    targeting: any[];
}

export interface Offer18Response {
    response: string;
    data: {
        [offerId: string]: Offer18Offer;
    };
    message?: string;
    error?: string;
}

// API Configuration
export interface Offer18Config {
    apiKey: string;
    affiliateId: string;
    merchantId: string;
}

// Query Parameters
export interface Offer18QueryParams {
    offer_id?: string;
    page?: number;
    category?: string;
    model?: 'CPA' | 'CPC' | 'CPL' | 'CPS' | 'CPM';
    country?: string;
    offer_status?: 1; // 1 = Active offers only
    authorized?: 1; // 1 = Assigned offers only
    offer_access?: 1; // 1 = Auto-approve public offers
}

/**
 * Offer18 API Service
 */
class Offer18Service {
    private baseUrl = 'https://api.offer18.com/api/af/offers';
    private config: Offer18Config | null = null;

    /**
     * Initialize the service with API credentials
     */
    initialize(config: Offer18Config) {
        this.config = config;
    }

    /**
     * Check if service is configured
     */
    isConfigured(): boolean {
        return !!(this.config?.apiKey && this.config?.affiliateId && this.config?.merchantId);
    }

    /**
     * Get configuration
     */
    getConfig(): Offer18Config | null {
        return this.config;
    }

    /**
     * Build API URL with query parameters
     */
    private buildUrl(params?: Offer18QueryParams): string {
        if (!this.config) {
            throw new Error('Offer18 service not configured. Please call initialize() first.');
        }

        const url = new URL(this.baseUrl);

        // Required parameters
        url.searchParams.append('key', this.config.apiKey);
        url.searchParams.append('aid', this.config.affiliateId);
        url.searchParams.append('mid', this.config.merchantId);

        // Optional parameters
        if (params) {
            if (params.offer_id) url.searchParams.append('offer_id', params.offer_id);
            if (params.page) url.searchParams.append('page', params.page.toString());
            if (params.category) url.searchParams.append('category', params.category);
            if (params.model) url.searchParams.append('model', params.model);
            if (params.country) url.searchParams.append('country', params.country);
            if (params.offer_status) url.searchParams.append('offer_status', params.offer_status.toString());
            if (params.authorized) url.searchParams.append('authorized', params.authorized.toString());
            if (params.offer_access) url.searchParams.append('offer_access', params.offer_access.toString());
        }

        return url.toString();
    }

    /**
     * Fetch offers from Offer18 API
     */
    async fetchOffers(params?: Offer18QueryParams): Promise<Offer18Response> {
        try {
            const url = this.buildUrl(params);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            let data: any;

            try {
                data = JSON.parse(text);
            } catch (e) {
                // If response is not JSON, it's likely an error message from the API
                throw new Error(text || 'Invalid API response format');
            }

            // check for "no offers found" error which is actually a valid connection
            if (data.response === '400' && (data.error?.toLowerCase().includes('no offers found') || data.message?.toLowerCase().includes('no offers found'))) {
                return {
                    response: '200',
                    data: {},
                    message: 'No offers found',
                } as Offer18Response;
            }

            if (data.response !== '200') {
                throw new Error(data.message || data.error || 'API request failed');
            }

            return data as Offer18Response;
        } catch (error) {
            console.error('Offer18 API Error:', error);
            throw error;
        }
    }

    /**
     * Fetch all active offers
     */
    async fetchActiveOffers(params?: Omit<Offer18QueryParams, 'offer_status'>): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({
            ...params,
            offer_status: 1, // Active offers only
        });

        return Object.values(response.data);
    }

    /**
     * Fetch authorized/assigned offers
     */
    async fetchAuthorizedOffers(params?: Omit<Offer18QueryParams, 'authorized'>): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({
            ...params,
            authorized: 1, // Assigned offers only
        });

        return Object.values(response.data);
    }

    /**
     * Fetch offers by category
     */
    async fetchOffersByCategory(category: string, params?: Offer18QueryParams): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({
            ...params,
            category,
        });

        return Object.values(response.data);
    }

    /**
     * Fetch offers by model (CPA, CPC, etc.)
     */
    async fetchOffersByModel(model: 'CPA' | 'CPC' | 'CPL' | 'CPS' | 'CPM', params?: Offer18QueryParams): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({
            ...params,
            model,
        });

        return Object.values(response.data);
    }

    /**
     * Fetch offers by country
     */
    async fetchOffersByCountry(country: string, params?: Offer18QueryParams): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({
            ...params,
            country,
        });

        return Object.values(response.data);
    }

    /**
     * Fetch a specific offer by ID
     */
    async fetchOfferById(offerId: string): Promise<Offer18Offer | null> {
        const response = await this.fetchOffers({
            offer_id: offerId,
        });

        return response.data[offerId] || null;
    }

    /**
     * Fetch offers with pagination
     */
    async fetchOffersPaginated(page: number = 1, params?: Offer18QueryParams): Promise<{
        offers: Offer18Offer[];
        page: number;
    }> {
        const response = await this.fetchOffers({
            ...params,
            page,
        });

        return {
            offers: Object.values(response.data),
            page,
        };
    }

    /**
     * Convert Offer18 offer to Store format for database
     */
    convertToStore(offer: Offer18Offer): {
        name: string;
        slug: string;
        description: string;
        logo_url: string;
        cashback_percent: number;
        cashback_type: string;
        category: string;
        affiliate_url: string;
        network_type: string;
        api_config: any;
    } {
        // Extract the best payout
        const bestPayout = offer.payout[0];
        const cashbackPercent = parseFloat(bestPayout?.payout || '0');

        // Generate slug from name
        const slug = offer.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        return {
            name: offer.name,
            slug: slug,
            description: offer.offer_terms || offer.offer_kpi || `${offer.name} - ${offer.model} offer`,
            logo_url: offer.logo,
            cashback_percent: cashbackPercent,
            cashback_type: offer.model,
            category: offer.category.split(',')[0].trim() || 'general',
            affiliate_url: offer.click_url,
            network_type: 'offer18',
            api_config: {
                offer_id: offer.offerid,
                click_url: offer.click_url,
                impression_url: offer.impression_url,
                preview_url: offer.preview_url,
                model: offer.model,
                currency: offer.currency,
                price: offer.price,
                payout: offer.payout,
                events: offer.events,
                country_allow: offer.country_allow,
                country_block: offer.country_block,
                authorized: offer.authorized === 'true',
            },
        };
    }

    /**
     * Get tracking URL for an offer
     */
    getTrackingUrl(offer: Offer18Offer, subId?: string): string {
        let url = offer.click_url;

        // Add sub ID if provided
        if (subId) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}s1=${subId}`;
        }

        return url;
    }

    /**
     * Check if offer is available in a specific country
     */
    isOfferAvailableInCountry(offer: Offer18Offer, countryCode: string): boolean {
        // Check if country is blocked
        if (offer.country_block) {
            const blocked = offer.country_block.split(',').map(c => c.trim());
            if (blocked.includes(countryCode)) {
                return false;
            }
        }

        // Check if country is allowed (if allow list exists)
        if (offer.country_allow) {
            const allowed = offer.country_allow.split(',').map(c => c.trim());
            return allowed.includes(countryCode);
        }

        // If no allow list, and not blocked, it's available
        return true;
    }

    /**
     * Get offer payout for specific conditions
     */
    getOfferPayout(offer: Offer18Offer, conditions?: {
        event?: string;
        country?: string;
        device_type?: string;
        browser?: string;
        os?: string;
    }): Offer18Payout | null {
        if (!conditions || offer.payout.length === 0) {
            return offer.payout[0] || null;
        }

        // Find matching payout based on conditions
        for (const payout of offer.payout) {
            let matches = true;

            for (const conditionGroup of payout.condition) {
                for (const condition of conditionGroup) {
                    const field = condition.field;
                    const value = condition.value;
                    const operator = condition.operator_type;

                    if (conditions[field as keyof typeof conditions]) {
                        const conditionValue = conditions[field as keyof typeof conditions];

                        if (operator === 'is_equal' && conditionValue !== value) {
                            matches = false;
                            break;
                        } else if (operator === 'not_equal' && conditionValue === value) {
                            matches = false;
                            break;
                        }
                    }
                }

                if (!matches) break;
            }

            if (matches) {
                return payout;
            }
        }

        // Return default payout if no match
        return offer.payout[0] || null;
    }
}

// Export singleton instance
export const offer18Service = new Offer18Service();
