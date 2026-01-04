import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { user } = await locals.safeGetSession();

    if (!user) {
        throw redirect(303, '/login');
    }

    const { supabase } = locals;

    // Fetch match data
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*, problems(*)')
        .eq('id', params.matchId)
        .single();

    if (matchError) {
        console.error('Error fetching match:', matchError.message);
        throw redirect(303, '/battle');
    }

    // Fetch participants with status
    const { data: initialParts, error: partsError } = await supabase
        .from('match_participants')
        .select('user_id, status, finished_at, completion_time_ms')
        .eq('match_id', params.matchId);

    if (partsError) {
        console.error('Error fetching participants:', partsError.message);
    }

    // Fetch usernames from profiles
    const userIds = (initialParts || []).map((p) => p.user_id);
    const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

    const usernameMap = new Map((profilesData || []).map((p) => [p.id, p.username]));

    const participants = (initialParts || []).map((p) => ({
        ...p,
        username: usernameMap.get(p.user_id) || 'Unknown',
    }));

    return {
        matchId: params.matchId,
        user,
        match,
        initialParticipants: participants,
    };
};
