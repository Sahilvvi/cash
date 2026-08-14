// Shared normalisation for inbound affiliate postbacks.
//
// Every affiliate network invents its own spelling for the same four
// facts: which click this was, how much we earned, which order it was,
// and what state the conversion is in. Offer18 alone varies by merchant
// (`{s1}` vs `{aff_click_id}` vs `{p1}`, `{payout}` vs `{amount}`,
// `Approved` vs `approved` vs `1`).
//
// Before this module `track-conversion` read exactly one name per field
// and handed `status` to `apply_postback_state` verbatim — and that RPC
// RAISEs on any status outside its four-state vocabulary. A postback
// carrying `status=Approved` therefore came back 500 and the user was
// never credited. Normalising here keeps the RPC strict (it stays the
// single source of truth for legal states) while making the edge
// tolerant of whatever the network actually sends.

/** The only four states `apply_postback_state` accepts. */
export type CashbackStatus = 'pending' | 'approved' | 'confirmed' | 'reversed'

type Params = Record<string, string>

/**
 * Pick the first param present (non-empty) from a list of aliases.
 * `skip` lets a later field avoid re-consuming a value an earlier field
 * already claimed — e.g. `transaction_id` doubles as both a click id and
 * a conversion id depending on the network.
 */
function firstOf(params: Params, keys: string[], skip?: string | null): string | null {
    for (const key of keys) {
        const raw = params[key]
        if (raw === undefined || raw === null) continue
        const value = String(raw).trim()
        if (!value) continue
        if (skip && value === skip) continue
        return value
    }
    return null
}

// Ordered most- to least-specific. `s1` and `aff_click_id` are what
// useAffiliateTracking appends for offer18; `subid` is the generic
// default; the rest cover networks we may add later.
const SESSION_KEYS = [
    'session_id',
    'subid',
    'sub_id',
    'sub1',
    's1',
    'aff_click_id',
    'aff_sub',
    'p1',
    'linkId',        // Amazon
    'affExtParam1',  // Flipkart
    'click_id',
    'transaction_id',
]

const AMOUNT_KEYS = [
    'amount',
    'payout',
    'aff_payout',
    'affiliate_price',
    'commission',
    'revenue',
]

const ORDER_AMOUNT_KEYS = [
    'order_amount',
    'sale_amount',
    'order_value',
    'transaction_amount',
]

const ORDER_KEYS = [
    'order_id',
    'oid',
    'txn_id',
    'conversion_id',
    'transaction_id',
]

export function pickSessionId(params: Params): string | null {
    return firstOf(params, SESSION_KEYS)
}

/**
 * `skipSessionId` prevents a param that already served as the click id
 * (typically `transaction_id`) from silently becoming the order id too,
 * which would make the idempotency key meaningless.
 */
export function pickOrderId(params: Params, skipSessionId?: string | null): string | null {
    return firstOf(params, ORDER_KEYS, skipSessionId ?? null)
}

export function pickAmount(params: Params): number {
    const raw = firstOf(params, AMOUNT_KEYS)
    if (raw === null) return 0
    const n = parseFloat(raw)
    return Number.isFinite(n) ? n : 0
}

export function pickOrderAmount(params: Params): number | null {
    const raw = firstOf(params, ORDER_AMOUNT_KEYS)
    if (raw === null) return null
    const n = parseFloat(raw)
    return Number.isFinite(n) ? n : null
}

// The vocabulary we know how to map, lowercased. Kept in sync with
// public.cashback_normalize_status() in the SQL migration — change one,
// change the other.
const STATUS_MAP: Record<string, CashbackStatus> = {
    pending: 'pending',
    unconfirmed: 'pending',
    processing: 'pending',
    onhold: 'pending',
    on_hold: 'pending',
    '0': 'pending',

    approved: 'approved',
    validated: 'approved',
    valid: 'approved',
    accepted: 'approved',
    sale: 'approved',
    lead: 'approved',
    conversion: 'approved',
    '1': 'approved',

    confirmed: 'confirmed',
    paid: 'confirmed',
    closed: 'confirmed',
    complete: 'confirmed',
    completed: 'confirmed',
    success: 'confirmed',
    successful: 'confirmed',

    reversed: 'reversed',
    rejected: 'reversed',
    reject: 'reversed',
    declined: 'reversed',
    refunded: 'reversed',
    cancelled: 'reversed',
    canceled: 'reversed',
    chargeback: 'reversed',
    invalid: 'reversed',
    '2': 'reversed',
}

function statusKey(raw: string | undefined | null): string | null {
    if (raw === undefined || raw === null) return null
    const s = String(raw).toLowerCase().trim()
    return s === '' ? null : s
}

/**
 * Map a network's status vocabulary onto our four states.
 *
 * Unrecognised values fall back to `pending` rather than throwing: a
 * conversion recorded as pending can be moved forward by the next
 * postback or by reconciliation, whereas a rejected postback is lost
 * for good (networks retry a handful of times, then give up). Never
 * silently credits — `pending` is not withdrawable.
 */
export function normalizeStatus(raw: string | undefined | null): CashbackStatus {
    const key = statusKey(raw)
    if (key === null) return 'pending'   // absent/empty → pending, by design
    return STATUS_MAP[key] ?? 'pending'
}

/**
 * False when `normalizeStatus` had to guess. Callers log that case so a
 * network vocabulary we don't cover yet is visible in the function logs
 * instead of quietly parking every conversion on `pending`.
 */
export function isKnownStatus(raw: string | undefined | null): boolean {
    const key = statusKey(raw)
    if (key === null) return true
    return key in STATUS_MAP
}

/**
 * Idempotency key fallback.
 *
 * `apply_postback_state` de-dupes on `(network_type, order_id)` and skips
 * the check entirely when `order_id` is NULL — so a network that omits
 * an order id would get a fresh row on every retry, double-crediting the
 * user. One click almost always maps to one conversion, so deriving a
 * surrogate from the click id is the safe default.
 */
export function orderIdOrSurrogate(
    orderId: string | null,
    networkType: string,
    sessionId: string,
): { orderId: string; synthesized: boolean } {
    if (orderId) return { orderId, synthesized: false }
    return { orderId: `${networkType}:click:${sessionId}`, synthesized: true }
}
