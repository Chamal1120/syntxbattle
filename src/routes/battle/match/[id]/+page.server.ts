import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession }, params }) => {
    const { user } = await safeGetSession();

    if (!user) {
        throw redirect(303, '/login');
    }

    return {
        user,
        matchId: params.id
    };
};
