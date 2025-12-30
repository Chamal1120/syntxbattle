import { supabase } from '$lib/supabaseClient';
import { goto } from '$app/navigation';

export const matchManager = {
    async createMatch({ problemId, maxPlayers = 2 }: { problemId: string, maxPlayers?: number }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return console.error("No user found");

        const { data: match, error: mError } = await supabase
            .from('matches')
            .insert({ 
                problem_id: problemId, 
                creator_id: user.id, 
                max_players: maxPlayers
            })
            .select()
            .single();

        if (mError) return console.error("Match Error:", mError.message);

        await supabase.from('match_participants').insert({ 
            match_id: match.id, 
            user_id: user.id 
        });
        
        goto(`/battle/match/${match.id}`);
    },
    async joinMatch(matchId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Please log in first.");

        const { error } = await supabase
            .from('match_participants')
            .insert({ 
                match_id: matchId, 
                user_id: user.id 
            });

        if (error) {
            console.error(error);
            alert("Could not join: Match might be full or you are already in it.");
        } else {
            goto(`/battle/match/${matchId}`);
        }
    }
};;
