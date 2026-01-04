import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase }, params }) => {
    const { user } = await safeGetSession();

    if (!user) {
        throw redirect(303, '/login');
    }

    // Fetch match data
    const { data: matchInfo, error: matchError } = await supabase
        .from('matches')
        .select('*, problems(*)')
        .eq('id', params.id)
        .single();

    if (matchError) {
        console.error('Error fetching match:', matchError.message);
        throw redirect(303, '/battle');
    }

    // Fetch initial participants
    const { data: participants, error: partsError } = await supabase
        .from('match_participants')
        .select('user_id')
        .eq('match_id', params.id);

    if (partsError) {
        console.error('Error fetching participants:', partsError.message);
    }

    return {
        user,
        matchId: params.id,
        matchInfo,
        initialParticipants: participants || [],
    };
};
