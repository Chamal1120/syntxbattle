import { supabase } from '$lib/supabaseClient';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = async () => {
    // Get the session and user together
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        throw error(401, 'Unauthorized - Please log in to join the match');
    }

    return {
        session,
        user
    };
};
