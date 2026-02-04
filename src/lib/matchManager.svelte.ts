/**
 * Syntxbattle - Match Manager
 *
 * @description
 * This class manages the state and real-time interactions for a single battle match.
 *
 * @author Chamal Mallawaarachchi
 */
import { browser, dev } from '$app/environment';
import { goto } from '$app/navigation';
import { supabase } from '$lib/supabaseClient';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export class MatchManager {
    // Public state - Svelte runes make these reactive
    participants = $state<any[]>([]);
    matchInfo = $state<any>(null);
    joining = $state(false);

    // Private state
    private channel: RealtimeChannel | null = null;
    private supabase: SupabaseClient | null = null;
    private matchId = '';
    private user: any = null;
    private participantIds = $derived(new Set(this.participants.map((p) => p.user_id)));

    constructor(initialData: {
        matchId: string;
        matchInfo: any;
        initialParticipants: any[];
        user: any;
    }) {
        this.matchId = initialData.matchId;
        this.matchInfo = initialData.matchInfo;
        this.participants = initialData.initialParticipants;
        this.user = initialData.user;

        if (browser) {
            this.init();
        }
    }

    private async init() {
        this.supabase = supabase;
        if (!this.supabase || !this.matchId || !this.matchInfo) {
            console.error('MatchManager initialization failed');
            return;
        }
        this.subscribeToChannel();
    }

    private subscribeToChannel() {
        if (!this.supabase) return;

        this.channel = this.supabase
            .channel(`match-${this.matchId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'match_participants',
                    filter: `match_id=eq.${this.matchId}`,
                },
                (payload) => this.handlePostgresChange(payload)
            )
            .on('broadcast', { event: 'participant_joined' }, (payload) =>
                this.handleParticipantJoined(payload)
            )
            .on('broadcast', { event: 'participant_left' }, (payload) =>
                this.handleParticipantLeft(payload)
            )
            .on('broadcast', { event: 'battle_start' }, () => this.handleBattleStart())
            .on('broadcast', { event: 'match_cancelled' }, () => this.handleMatchCancelled())
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    this.handleSubscribed();
                }
            });
    }

    //--------------------- Event handlers ------------------------------------

    private handlePostgresChange(payload: any) {
        if (dev) console.log('[MatchManager] Realtime Event Received:', payload);

        if (payload.eventType === 'INSERT') {
            if (!this.participantIds.has(payload.new.user_id)) {
                this.participants = [...this.participants, payload.new];
            }
        } else if (payload.eventType === 'DELETE') {
            this.participants = this.participants.filter((p) => p.user_id !== payload.old.user_id);
        }
    }

    private handleParticipantJoined({ payload }: any) {
        if (dev) console.log('[MatchManager] Broadcast: participant joined', payload);
        if (!this.participantIds.has(payload.user_id)) {
            this.participants = [...this.participants, payload];
        }
    }

    private handleParticipantLeft({ payload }: any) {
        if (dev) console.log('[MatchManager] Broadcast: participant left', payload);
        this.participants = this.participants.filter((p) => p.user_id !== payload.user_id);
    }

    private handleBattleStart() {
        if (dev) console.log('[MatchManager] Broadcast: battle starting');
        goto(`/arena/${this.matchId}`);
    }

    private handleMatchCancelled() {
        if (dev) console.log('[MatchManager] Broadcast: match cancelled');
        alert('The match has been cancelled by the host.');
        goto('/begin');
    }

    private async handleSubscribed() {
        if (!this.supabase) return;

        const isAlreadyIn = this.participantIds.has(this.user.id);
        if (dev) console.log('[MatchManager] Current user already in this match?', isAlreadyIn);

        if (!isAlreadyIn && this.participants.length < this.matchInfo.max_players) {
            await this.joinMatch();
        } else if (isAlreadyIn) {
            if (dev) console.log('[MatchManager] Already in match - broadcasting presence');
            this.broadcastPresence();
        } else if (this.participants.length >= this.matchInfo.max_players && !isAlreadyIn) {
            if (dev) console.log('[MatchManager] Room is full. Cannot join.');
        }
    }

    private async joinMatch() {
        if (!this.supabase) return;
        this.joining = true;
        const { error: joinError } = await this.supabase
            .from('match_participants')
            .insert([{ match_id: this.matchId, user_id: this.user.id }]);

        if (joinError) {
            this.handleJoinError(joinError);
        } else {
            this.participants = [...this.participants, { user_id: this.user.id }];
            this.broadcastPresence();
        }
        this.joining = false;
    }

    private handleJoinError(joinError: any) {
        if (dev)
            console.error(
                '[MatchManager] Auto-Join FAILED:',
                joinError.message,
                joinError.details,
                'Code:',
                joinError.code
            );

        if (joinError.code === '23505') {
            // Already in DB
            this.participants = [...this.participants, { user_id: this.user.id }];
        } else if (joinError.code === 'P0001' || joinError.message?.includes('Match is full')) {
            alert('This match is full. Redirecting to battle selection...');
            goto('/battle');
        } else {
            alert('Failed to join match. Please try again.');
            goto('/battle');
        }
    }

    private broadcastPresence() {
        if (!this.channel) return;
        this.channel
            .send({
                type: 'broadcast',
                event: 'participant_joined',
                payload: { user_id: this.user.id },
            })
            .catch((err: unknown) => {
                if (dev) console.error('[MatchManager] Broadcast failed:', err);
            });
    }

    //-------------------- Public Actions ------------------------------------

    async startBattle() {
        if (dev) console.log('[MatchManager] Starting battle');
        if (!this.channel) return;

        this.channel.send({
            type: 'broadcast',
            event: 'battle_start',
            payload: { match_id: this.matchId },
        });

        goto(`/arena/${this.matchId}`);
    }

    async cleanup() {
        if (!browser || !this.supabase) return;
        if (dev) console.log('[MatchManager] Cleaning up participant');

        if (this.channel) {
            if (dev) console.log('[MatchManager] Broadcasting participant_left');
            this.channel
                .send({
                    type: 'broadcast',
                    event: 'participant_left',
                    payload: { user_id: this.user.id },
                })
                .catch((err: unknown) => {
                    if (dev) console.error('[MatchManager] Cleanup broadcast failed:', err);
                });

            this.supabase.removeChannel(this.channel);
            this.channel = null;
        }

        // Don't delete participants - they're needed for the summary page
        // Only mark as left if they haven't started competing yet
        const { data: participant } = await this.supabase
            .from('match_participants')
            .select('status')
            .eq('match_id', this.matchId)
            .eq('user_id', this.user.id)
            .single();

        if (participant?.status === 'competing') {
            // If status is 'competing', it means they never entered arena
            // Mark them as left but DON'T delete
            await this.supabase
                .from('match_participants')
                .update({ status: 'left' })
                .eq('match_id', this.matchId)
                .eq('user_id', this.user.id);
        }
        // If status is 'finished', leave the data intact for summary page
    }
}
