/**
 * Syntxbattle - Ambient Type declarations
 * See https://svelte.dev/docs/kit/types#app.d.ts
 *
 * * @author: Chamal Mallawaarachchi
 */
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import { WebContainer } from '@webcontainer/api';
declare global {
    namespace App {
        // interface Error {}
        // interface Platform {}
        interface Locals {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
        }
        interface PageData {
            session: Session | null;
            user: User | null;
        }
        // interface PageData {}
        // interface PageState {}
    }

    interface Window {
        __wc: WebContainer;
    }
}

export {};
