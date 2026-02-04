import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
    const { matchId } = params;
    const { user } = await locals.safeGetSession();

    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase } = locals;

    // Check if the user is the creator of the match
    const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('creator_id')
        .eq('id', matchId)
        .single();

    if (matchError || !match) {
        return json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.creator_id !== user.id) {
        return json({ error: 'Only the match creator can cancel the match' }, { status: 403 });
    }

    // Delete the match (cascade will delete match_participants)
    const { error: deleteError } = await supabase.from('matches').delete().eq('id', matchId);

    if (deleteError) {
        console.error('Error deleting match:', deleteError);
        return json({ error: 'Failed to delete match' }, { status: 500 });
    }

    return json({ success: true });
};
