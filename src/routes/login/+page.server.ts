import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (session) {
        throw redirect(303, '/battle');
    }

    return {};
};

export const actions: Actions = {
    github: async ({ request, locals: { supabase }, url }) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${url.origin}/auth/callback?next=/battle`,
            },
        });

        if (error) {
            return { error: error.message };
        }

        if (data.url) {
            throw redirect(303, data.url);
        }
    },

    google: async ({ request, locals: { supabase }, url }) => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${url.origin}/auth/callback?next=/battle`,
            },
        });

        if (error) {
            return { error: error.message };
        }

        if (data.url) {
            throw redirect(303, data.url);
        }
    },

    magiclink: async ({ request, locals: { supabase }, url }) => {
        const formData = await request.formData();
        const email = formData.get('email') as string;

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${url.origin}/auth/callback?next=/battle`,
            },
        });

        if (error) {
            return { error: error.message };
        }

        return { success: true, message: 'Check your email for the magic link!' };
    },
};
