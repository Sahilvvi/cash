/**
 * Offer18 API Integration Service
 *
 * All Offer18 calls are proxied through the `offer18-proxy` Supabase Edge
 * Function. The Offer18 API key lives ONLY in function secrets on the
 * server and is never exposed to the browser.
 *
 * Edge function path: `${SUPABASE_URL}/functions/v1/offer18-proxy`
 *
 * Upstream docs: https://knowledgebase.offer18.com/affiliate/affiliate-apis/offers-api
 */

import { supabase } from "@/integrations/supabase/client";

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

// Reported by the proxy's `?action=status` endpoint. Tells the admin UI
// whether the server has the Offer18 secrets set, without requiring any
// secret material on the client.
export interface Offer18Status {
    configured: boolean;
    affiliate_id: string | null;
    merchant_id: string | null;
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

const PROXY_FUNCTION = 'offer18-proxy';

/**
 * Offer18 API Service (proxied via Supabase Edge Function).
 */
class Offer18Service {
    private lastStatus: Offer18Status | null = null;

    /**
     * Ask the server whether Offer18 secrets are configured. Does NOT hit
     * the Offer18 API itself.
     */
    async getStatus(): Promise<Offer18Status> {
        const statusUrl = this.buildFunctionUrl({ action: 'status' });
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

        const resp = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                apikey: anonKey,
            },
        });
        if (!resp.ok) {
            throw new Error(`Status check failed: ${resp.status} ${resp.statusText}`);
        }
        const statusJson = (await resp.json()) as Offer18Status;
        this.lastStatus = statusJson;
        return statusJson;
    }

    /**
     * True iff the last status check said the server is configured.
     */
    isConfigured(): boolean {
        return !!this.lastStatus?.configured;
    }

    getLastStatus(): Offer18Status | null {
        return this.lastStatus;
    }

    /**
     * Build the absolute URL for the edge function.
     */
    private buildFunctionUrl(params: Record<string, string | number | undefined>): string {
        const base = import.meta.env.VITE_SUPABASE_URL as string;
        const url = new URL(`${base}/functions/v1/${PROXY_FUNCTION}`);
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        }
        return url.toString();
    }

    /**
     * Low-level fetch against the proxy.
     */
    async fetchOffers(params?: Offer18QueryParams): Promise<Offer18Response> {
        const query: Record<string, string | number | undefined> = {};
        if (params) {
            if (params.offer_id) query.offer_id = params.offer_id;
            if (params.page) query.page = params.page;
            if (params.category) query.category = params.category;
            if (params.model) query.model = params.model;
            if (params.country) query.country = params.country;
            if (params.offer_status) query.offer_status = params.offer_status;
            if (params.authorized) query.authorized = params.authorized;
            if (params.offer_access) query.offer_access = params.offer_access;
        }

        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        if (!token) {
            throw new Error('You must be signed in as an admin to call Offer18.');
        }
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

        const url = this.buildFunctionUrl(query);
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                apikey: anonKey,
            },
        });

        const text = await resp.text();
        let data: any;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(text || 'Invalid proxy response');
        }

        if (!resp.ok) {
            const msg = data?.error || data?.message || `Proxy error ${resp.status}`;
            throw new Error(msg);
        }

        if (data.response !== '200') {
            throw new Error(data.message || data.error || 'Offer18 API request failed');
        }

        return data as Offer18Response;
    }

    async fetchActiveOffers(params?: Omit<Offer18QueryParams, 'offer_status'>): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({ ...params, offer_status: 1 });
        return Object.values(response.data);
    }

    async fetchAuthorizedOffers(params?: Omit<Offer18QueryParams, 'authorized'>): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({ ...params, authorized: 1 });
        return Object.values(response.data);
    }

    async fetchOffersByCategory(category: string, params?: Offer18QueryParams): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({ ...params, category });
        return Object.values(response.data);
    }

    async fetchOffersByModel(
        model: 'CPA' | 'CPC' | 'CPL' | 'CPS' | 'CPM',
        params?: Offer18QueryParams,
    ): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({ ...params, model });
        return Object.values(response.data);
    }

    async fetchOffersByCountry(country: string, params?: Offer18QueryParams): Promise<Offer18Offer[]> {
        const response = await this.fetchOffers({ ...params, country });
        return Object.values(response.data);
    }

    async fetchOfferById(offerId: string): Promise<Offer18Offer | null> {
        const response = await this.fetchOffers({ offer_id: offerId });
        return response.data[offerId] || null;
    }

    async fetchOffersPaginated(
        page: number = 1,
        params?: Offer18QueryParams,
    ): Promise<{ offers: Offer18Offer[]; page: number }> {
        const response = await this.fetchOffers({ ...params, page });
        return { offers: Object.values(response.data), page };
    }

    /**
     * Convert Offer18 offer to Store format for database
     */
    convertToStore(offer: Offer18Offer) {
        const bestPayout = offer.payout && offer.payout.length > 0 ? offer.payout[0] : null;
        let cashbackPercent = 0;
        let cashbackType = 'percent';

        if (bestPayout) {
            const payoutValue = parseFloat(bestPayout.payout);
            if (!isNaN(payoutValue)) {
                cashbackPercent = payoutValue;
            }

            if (offer.model === 'CPS') {
                cashbackType = 'percent';
            } else {
                cashbackType = 'flat';
            }
        }

        const slug = offer.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        return {
            name: offer.name,
            slug,
            description: offer.offer_terms || offer.offer_kpi || `${offer.name} - ${offer.model} offer`,
            logo_url: offer.logo,
            cashback_percent: cashbackPercent,
            cashback_type: cashbackType,
            category: offer.category ? offer.category.split(',')[0].trim() : 'General',
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
     * Get tracking URL for an offer.
     */
    getTrackingUrl(offer: Offer18Offer, subId?: string): string {
        let url = offer.click_url;
        if (subId) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}s1=${subId}`;
        }
        return url;
    }

    /**
     * Check if offer is available in a specific country.
     */
    isOfferAvailableInCountry(offer: Offer18Offer, countryCode: string): boolean {
        if (offer.country_block) {
            const blocked = offer.country_block.split(',').map((c) => c.trim());
            if (blocked.includes(countryCode)) return false;
        }
        if (offer.country_allow) {
            const allowed = offer.country_allow.split(',').map((c) => c.trim());
            return allowed.includes(countryCode);
        }
        return true;
    }

    /**
     * Get offer payout for specific conditions.
     */
    getOfferPayout(
        offer: Offer18Offer,
        conditions?: {
            event?: string;
            country?: string;
            device_type?: string;
            browser?: string;
            os?: string;
        },
    ): Offer18Payout | null {
        if (!conditions || offer.payout.length === 0) {
            return offer.payout[0] || null;
        }

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

            if (matches) return payout;
        }

        return offer.payout[0] || null;
    }
}

export const offer18Service = new Offer18Service();
