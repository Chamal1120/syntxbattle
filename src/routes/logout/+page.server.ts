import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async ({ locals: { supabase, safeGetSession } }) => {
        const { user } = await safeGetSession();

        if (user) {
            // Remove user from any active match participants before logout
            await supabase.from('match_participants').delete().eq('user_id', user.id);
        }

        await supabase.auth.signOut();
        throw redirect(303, '/login');
    },
};
