/**
 * Server-side hooks for the Syntxbattle platform.
 * * @description
 * This handle hook modifies outgoing HTTP responses to enable the security
 * headers required for WebContainers to function. 
 * * It sets:
 * 1. Cross-Origin-Embedder-Policy (COEP): 'require-corp'
 * 2. Cross-Origin-Opener-Policy (COOP): 'same-origin'
 * * These headers enable 'SharedArrayBuffer', allowing the browser to create 
 * the isolated environment needed to run a virtual Node.js process.
 * * @author Chamal Mallawaarachchi
 */
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

console.log('>>> SERVER HOOK INITIALIZED');
export const handle: Handle = async ({ event, resolve }) => {
    console.log('>>> ATTEMPTING REQUEST:', event.url.pathname);
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

    // Add the Auth Helper to 'locals' so pages can check login status easily
    event.locals.safeGetSession = async () => {
        const { data: { session } } = await event.locals.supabase.auth.getSession();
        if (!session) return { session: null, user: null };

        const { data: { user }, error } = await event.locals.supabase.auth.getUser();
        if (error) return { session: null, user: null };

        return { session, user };
    };

    // Resolve the request and get the Response object
    const response = await resolve(event, {
        // This is a Supabase-specific optimization for headers
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        },
    });

    // Apply WebContainer security headers to the response
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

    return response;
};
