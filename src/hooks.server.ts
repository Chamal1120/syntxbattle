/**
 * Syntxbattle - server-side hooks
 *
 * * @description
 * This handle hook modifies outgoing HTTP responses to enable the security
 * headers required for WebContainers to function.
 * * It sets:
 * 1. Cross-Origin-Embedder-Policy (COEP): 'require-corp'
 * 2. Cross-Origin-Opener-Policy (COOP): 'same-origin'
 * * These headers enable 'SharedArrayBuffer', allowing the browser to create
 * the isolated environment needed to run a virtual Node.js process.
 *
 * * @author Chamal Mallawaarachchi
 */
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Suppress Supabase's getSession warning - secure server-side auth is used with getUser()
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
    const message = String(args[0] || '');
    if (
        message.includes('supabase.auth.getSession()') ||
        message.includes('supabase.auth.onAuthStateChange()')
    ) {
        return;
    }
    originalWarn.apply(console, args);
};

export const handle: Handle = async ({ event, resolve }) => {
    // Setup Supabase Client (Server-Side)
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    try {
                        event.cookies.set(name, value, { ...options, path: '/' });
                    } catch (e) {
                        console.warn(`Could not set cookie ${name} - headers already sent.`);
                    }
                });
            },
        },
    });

    event.locals.safeGetSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession();
        if (!session) return { session: null, user: null };

        const {
            data: { user },
            error,
        } = await event.locals.supabase.auth.getUser();
        if (error) return { session: null, user: null };

        return { session, user };
    };

    // Determine if we need WebContainer security headers before resolving
    const needsHeaders =
        event.url.pathname.startsWith('/arena') || event.url.pathname.startsWith('/battle');
    const excludePaths =
        event.url.pathname === '/' ||
        event.url.pathname === '/login' ||
        event.url.pathname.startsWith('/auth/callback') ||
        event.url.pathname.startsWith('/_vercel');
    const userAgent = event.request.headers.get('user-agent') || '';
    const isLighthouse = userAgent.includes('Chrome-Lighthouse');

    const response = await resolve(event, {
        // This is a Supabase-specific optimization for headers
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        },
    });

    // Apply WebContainer security headers to arena and battle pages
    // This is required because browsers need consistent COOP/COEP headers across navigation
    if (needsHeaders && !excludePaths && !isLighthouse) {
        response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    }

    return response;
};
