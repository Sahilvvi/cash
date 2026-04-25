// Tiny zero-dependency Sentry "envelope" reporter for Supabase edge
// functions. We deliberately avoid the @sentry/deno SDK because it pulls
// in a multi-megabyte transitive tree and slows cold start.
//
// Usage:
//
//   import { reportToSentry } from '../_shared/sentry.ts'
//   try { ... } catch (e) {
//       await reportToSentry(e, { fn: 'track-conversion', ctx: { ... } })
//       throw e
//   }
//
// If `SENTRY_DSN` is not configured, calls are no-ops, so this is safe to
// drop into production before the user creates a Sentry project.

const DSN = Deno.env.get('SENTRY_DSN') ?? ''
const ENV = Deno.env.get('SENTRY_ENV') ?? 'production'
const RELEASE = Deno.env.get('GIT_SHA') ?? 'dev'

type ParsedDsn = {
    storeUrl: string
    publicKey: string
}

function parseDsn(dsn: string): ParsedDsn | null {
    if (!dsn) return null
    try {
        // DSN shape: https://<publicKey>@oXXXX.ingest.sentry.io/<projectId>
        const url = new URL(dsn)
        const publicKey = url.username
        const projectId = url.pathname.replace(/^\/+/, '')
        if (!publicKey || !projectId) return null
        const storeUrl = `${url.protocol}//${url.host}/api/${projectId}/store/`
        return { storeUrl, publicKey }
    } catch {
        return null
    }
}

const PARSED = parseDsn(DSN)

export async function reportToSentry(
    err: unknown,
    extra?: { fn?: string; ctx?: Record<string, unknown> }
): Promise<void> {
    if (!PARSED) return  // No-op when DSN missing.

    const error = err instanceof Error ? err : new Error(String(err))

    // Minimal Sentry event payload — we only need message + stack +
    // tags/extras for debugging. Sentry will accept anything that matches
    // their public schema; missing fields default sensibly.
    const event = {
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: new Date().toISOString(),
        platform: 'javascript',
        level: 'error',
        environment: ENV,
        release: RELEASE,
        server_name: extra?.fn ?? 'edge-function',
        tags: { fn: extra?.fn ?? 'unknown' },
        extra: extra?.ctx ?? {},
        exception: {
            values: [
                {
                    type: error.name || 'Error',
                    value: (error.message ?? '').slice(0, 1024),
                    stacktrace: error.stack
                        ? {
                              frames: parseStack(error.stack),
                          }
                        : undefined,
                },
            ],
        },
    }

    const auth =
        `Sentry sentry_version=7,sentry_client=cash-edge/1.0,` +
        `sentry_key=${PARSED.publicKey}`

    try {
        // Fire-and-forget. We don't want a Sentry outage to break the
        // postback/sync paths, so we hard-cap with a 2s timeout and
        // swallow any failure.
        const ac = new AbortController()
        const timer = setTimeout(() => ac.abort(), 2000)
        await fetch(PARSED.storeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Sentry-Auth': auth,
            },
            body: JSON.stringify(event),
            signal: ac.signal,
        }).catch(() => undefined)
        clearTimeout(timer)
    } catch (_) {
        // never propagate
    }
}

function parseStack(stack: string) {
    // V8/Deno style:  "at funcName (file:line:col)"
    return stack
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('at '))
        .slice(0, 30)
        .map((line) => {
            const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/)
            if (!m) return { function: line }
            return {
                function: m[1] || '<anonymous>',
                filename: m[2],
                lineno: Number(m[3]),
                colno: Number(m[4]),
                in_app: !m[2].startsWith('https://'),
            }
        })
        .reverse()
}
