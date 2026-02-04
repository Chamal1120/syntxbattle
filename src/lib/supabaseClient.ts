/**
 * Syntxbattle - Client-side Supabase Client
 *
 * @description
 * Creates a lazy-loaded, browser-only Supabase client for client-side operations.
 * Used primarily for realtime subscriptions and browser-based interactions.
 *
 * NOTE: Most authentication and data fetching should use server-side Supabase
 * (via locals.supabase in hooks.server.ts). This client is only for:
 * - Realtime subscriptions (match lobbies, arena leaderboards)
 * - Browser-only features that require live updates
 *
 * @author Chamal Mallawaarachchi
 */
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { browser } from '$app/environment';
import type { SupabaseClient } from '@supabase/supabase-js';

// Suppress Supabase's getSession warning - we use secure server-side authentication
if (browser && !window.__supabaseWarningsSuppressed) {
    window.__supabaseWarningsSuppressed = true;
    const originalWarn = console.warn;
    console.warn = (...args) => {
        const message = args[0]?.toString() || '';
        if (
            message.includes('Using the user object as returned from supabase.auth.getSession()') ||
            message.includes('supabase.auth.onAuthStateChange()')
        ) {
            return;
        }
        originalWarn.apply(console, args);
    };
}

// Lazy initialization - only create the client when accessed in the browser
let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        if (!_supabase && browser) {
            _supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
        }
        if (!_supabase) {
            throw new Error('Supabase client can only be used in the browser');
        }
        return Reflect.get(_supabase, prop);
    },
});
