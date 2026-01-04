import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();

    if (!session) {
        throw redirect(303, '/login');
    }

    // Fetch problems for display
    const { data: problems, error } = await supabase
        .from('problems')
        .select('*')
        .order('difficulty');

    if (error) {
        console.error('Error fetching problems:', error);
        return { session, user, problems: [] };
    }

    return { session, user, problems: problems || [] };
};

export const actions: Actions = {
    createMatch: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { user } = await safeGetSession();
        if (!user) {
            throw redirect(303, '/login');
        }

        const formData = await request.formData();
        const problemId = formData.get('problemId') as string;
        const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 2;

        const { data: match, error: mError } = await supabase
            .from('matches')
            .insert({
                problem_id: problemId,
                creator_id: user.id,
                max_players: maxPlayers,
            })
            .select()
            .single();

        if (mError) {
            console.error('Match Error:', mError.message);
            return { error: mError.message };
        }

        await supabase.from('match_participants').insert({
            match_id: match.id,
            user_id: user.id,
        });

        throw redirect(303, `/battle/match/${match.id}`);
    },

    joinMatch: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { user } = await safeGetSession();
        if (!user) {
            throw redirect(303, '/login');
        }

        const formData = await request.formData();
        const matchId = formData.get('matchId') as string;

        const { error } = await supabase.from('match_participants').insert({
            match_id: matchId,
            user_id: user.id,
        });

        if (error) {
            console.error(error);
            return { error: 'Could not join: Match might be full or you are already in it.' };
        }

        throw redirect(303, `/battle/match/${matchId}`);
    },
};
