/**
 * Syntxbattle - Match Manager (Legacy)
 *
 * @description
 * DEPRECATED: This file contains legacy client-side match management functions.
 *
 * New implementations should use server-side form actions instead:
 * - Match creation: POST to /battle?/createMatch
 * - Match joining: POST to /battle?/joinMatch
 *
 * This file is kept for backwards compatibility with any remaining client-side
 * code but should not be used in new features.
 *
 * @author Chamal Mallawaarachchi
 * @deprecated Use server actions in +page.server.ts instead
 */
import { goto } from '$app/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient;

async function getSupabase() {
    if (!supabaseClient) {
        const { supabase } = await import('$lib/supabaseClient');
        supabaseClient = supabase;
    }
    return supabaseClient;
}

export const matchManager = {
    async createMatch({ problemId, maxPlayers = 2 }: { problemId: string; maxPlayers?: number }) {
        const supabase = await getSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return console.error('No user found');

        const { data: match, error: mError } = await supabase
            .from('matches')
            .insert({
                problem_id: problemId,
                creator_id: user.id,
                max_players: maxPlayers,
            })
            .select()
            .single();

        if (mError) return console.error('Match Error:', mError.message);

        await supabase.from('match_participants').insert({
            match_id: match.id,
            user_id: user.id,
        });

        goto(`/battle/match/${match.id}`);
    },
    async joinMatch(matchId: string) {
        const supabase = await getSupabase();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return alert('Please log in first.');

        const { error } = await supabase.from('match_participants').insert({
            match_id: matchId,
            user_id: user.id,
        });

        if (error) {
            console.error(error);
            alert('Could not join: Match might be full or you are already in it.');
        } else {
            goto(`/battle/match/${matchId}`);
        }
    },
};
