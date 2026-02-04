import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
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

    // Get language preference from URL or default to javascript
    const language = url.searchParams.get('lang') || 'javascript';

    // Fetch language-specific starter code
    const { data: problemLang, error: langError } = await supabase
        .from('problem_languages')
        .select('*')
        .eq('problem_id', match.problem_id)
        .eq('language', language)
        .maybeSingle();

    if (langError) {
        console.error('Error fetching problem language config:', langError.message);
    }

    // Fetch participants with status
    const { data: initialParts, error: partsError } = await supabase
        .from('match_participants')
        .select('user_id, status, finished_at, completion_time_ms')
        .eq('match_id', params.matchId);

    console.log('[Arena] Match participants query result:', {
        count: initialParts?.length || 0,
        error: partsError?.message,
        matchId: params.matchId,
    });

    if (partsError) {
        console.error('Error fetching participants:', partsError.message);
    }

    // Fetch usernames from profiles
    const userIds = (initialParts || []).map((p) => p.user_id);
    let profilesData = [];

    if (userIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, username').in('id', userIds);
        profilesData = data || [];
    }

    const usernameMap = new Map(profilesData.map((p) => [p.id, p.username]));

    const participants = (initialParts || []).map((p) => ({
        ...p,
        username: usernameMap.get(p.user_id) || 'Unknown',
    }));

    return {
        matchId: params.matchId,
        user,
        match,
        initialParticipants: participants,
        language,
        problemLanguage: problemLang,
    };
};
