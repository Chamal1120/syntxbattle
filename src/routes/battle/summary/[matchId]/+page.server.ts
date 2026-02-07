import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    const { session, user } = await locals.safeGetSession();

    if (!user) {
        throw redirect(303, '/login');
    }

    const { supabase } = locals;

    console.log('[Summary] Loading summary for match:', params.matchId);

    // Fetch match data
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*, problems(*)')
        .eq('id', params.matchId)
        .single();

    if (matchError) {
        console.error('[Summary] Error fetching match:', matchError.message);
        throw redirect(303, '/battle');
    }

    console.log('[Summary] Match loaded:', match?.id);

    // Fetch participants with status - ensure we get the latest data
    const { data: initialParts, error: partsError } = await supabase
        .from('match_participants')
        .select('user_id, status, finished_at, completion_time_ms')
        .eq('match_id', params.matchId)
        .order('completion_time_ms', { ascending: true, nullsFirst: false });

    if (partsError) {
        console.error('[Summary] Error fetching participants:', partsError.message);
    }

    console.log('[Summary] Participants fetched:', initialParts?.length || 0, initialParts);

    // Fetch usernames from profiles
    const userIds = (initialParts || []).map((p: any) => p.user_id);
    let profilesData: Array<{ id: string; username: string }> = [];

    if (userIds.length > 0) {
        const { data, error: profileError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

        if (profileError) {
            console.error('[Summary] Error fetching profiles:', profileError.message);
        }

        profilesData = data || [];
        console.log('[Summary] Profiles fetched:', profilesData.length);
    }

    const usernameMap = new Map(profilesData.map((p: any) => [p.id, p.username]));

    const participants = (initialParts || []).map((p: any) => ({
        ...p,
        username: usernameMap.get(p.user_id) || 'Unknown',
    }));

    console.log('[Summary] Final participants with usernames:', participants);

    return {
        matchId: params.matchId,
        user,
        match,
        participants,
    };
};
