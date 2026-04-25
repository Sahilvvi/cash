// Opt-in Sentry initialisation for the cashback frontend.
//
// If `VITE_SENTRY_DSN` is not set this module is a complete no-op, so the
// build keeps working in environments where you haven't created a Sentry
// project yet (local dev, Vercel preview before the secret is wired up).
// To enable in production, add `VITE_SENTRY_DSN` to the Vercel project's
// env vars and redeploy.

import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENV =
    (import.meta.env.VITE_SENTRY_ENV as string | undefined) ??
    (import.meta.env.MODE as string | undefined) ??
    "production";

let initialised = false;

export function initSentry() {
    if (initialised || !DSN) return;
    Sentry.init({
        dsn: DSN,
        environment: ENV,
        // Conservative defaults — we mostly care about runtime errors,
        // not perf/replay traces (those eat the free tier).
        tracesSampleRate: 0.0,
        replaysSessionSampleRate: 0.0,
        replaysOnErrorSampleRate: 0.0,
        // Drop noisy events the cashback app doesn't care about.
        ignoreErrors: [
            "ResizeObserver loop limit exceeded",
            "ResizeObserver loop completed",
            "Non-Error promise rejection captured",
        ],
    });
    initialised = true;
}

export const sentry = Sentry;
