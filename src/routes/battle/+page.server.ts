import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
    const { session, user } = await safeGetSession();

    // Redirect unauthenticated users to login page
    if (!session) {
        throw redirect(303, '/login');
    }

    return { session, user };
};
