// Centralised display helpers for store cashback values.
//
// The schema stores (cashback_percent, cashback_type) but the values can be
// messy in practice:
// - Many Offer18 offers come through with cashback_percent=0 because the
//   merchant hasn't published a payout yet (the offer is authorised but the
//   payout array is empty).
// - For flat (CPA/CPL) offers the value is an INR amount, not a percentage.
//
// Rather than sprinkle "Up to 0%" strings all over the UI, every cashback
// render path should go through these helpers.

export type CashbackType = "percent" | "flat" | "voucher" | string | null | undefined;

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const n = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Returns true when the store has an actual cashback value worth showing.
 * Use this to decide whether to render a cashback pill at all.
 */
export function hasCashback(
    percent: number | string | null | undefined,
    _type?: CashbackType,
): boolean {
    return toNumber(percent) > 0;
}

/**
 * Short label for cashback, used in store cards, lists, etc.
 * Falls back to a friendly "Cashback Available" when no rate is set,
 * so the UI never shows "Up to 0%".
 */
export function formatCashbackShort(
    percent: number | string | null | undefined,
    type: CashbackType,
): string {
    const n = toNumber(percent);
    if (n <= 0) return "Cashback Available";

    switch (type) {
        case "flat":
            return `Flat \u20B9${n}`;
        case "voucher":
            return `\u20B9${n} Voucher`;
        case "percent":
        default:
            return `Up to ${n}%`;
    }
}

/**
 * Longer label, used on the store detail page hero pill.
 */
export function formatCashbackLong(
    percent: number | string | null | undefined,
    type: CashbackType,
): string {
    const n = toNumber(percent);
    if (n <= 0) return "Cashback Available";

    switch (type) {
        case "flat":
            return `Flat \u20B9${n} Cashback`;
        case "voucher":
            return `\u20B9${n} Voucher Cash`;
        case "percent":
        default:
            return `Up to ${n}% Cashback`;
    }
}

/**
 * Cashback rate cell (category table on the store detail page).
 * Returns an em-dash for unknown rates instead of "0%".
 */
export function formatCashbackRate(
    percent: number | string | null | undefined,
    type: CashbackType,
): string {
    const n = toNumber(percent);
    if (n <= 0) return "\u2014";

    if (type === "flat") return `\u20B9${n} flat`;
    if (type === "voucher") return `\u20B9${n}`;
    return `${n}%`;
}
