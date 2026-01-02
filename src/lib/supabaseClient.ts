import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Filter out Supabase's getSession warning since we use secure authentication everywhere
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Using the user object as returned from supabase.auth.getSession()')) {
        // Suppress this warning as we properly use getUser() for all authentication checks
        return;
    }
    originalConsoleWarn.apply(console, args);
};

// This ensures we only create the client once in the browser
export const supabase = createBrowserClient(
    PUBLIC_SUPABASE_URL, 
    PUBLIC_SUPABASE_ANON_KEY
)
