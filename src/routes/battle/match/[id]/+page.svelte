<script lang="ts">
    /**
     * Match Lobby - Waiting room for coding battle participants
     *
     * @description
     * Real-time lobby where players wait for opponents to join before battle starts.
     * Handles participant tracking, auto-join logic, and real-time synchronization.
     *
     * @author Chamal Mallawaarachchi
     */
    import { onMount, onDestroy } from 'svelte';
    import { beforeNavigate } from '$app/navigation';
    import { goto } from '$app/navigation';
    import { dev, browser } from '$app/environment';
    //import { page } from "$app/stores";
    import { getBotAvatar } from '$lib/userUtils';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let participants = $state<any[]>([]);
    let participantIds = $derived(new Set(participants.map((p) => p.user_id)));
    let matchInfo = $state<any>(null);
    let joining = $state(false);
    let channel: any;
    let matchId = $state('');
    let supabase: any;
    let matchLinkCopied = $state(false);
    let showToast = $state(false);

    $inspect('participants:', participants);
    $inspect('matchInfo:', matchInfo);

    async function getSupabase() {
        if (!browser) return null;
        if (!supabase) {
            const { supabase: client } = await import('$lib/supabaseClient');
            supabase = client;
        }
        return supabase;
    }

    // async function loadMatchData(matchId: string) {
    //     const client = await getSupabase();
    //     if (!client) return null;
    //     const { data: matchInfo, error: matchError } = await client
    //         .from("matches")
    //         .select("*, problems(*)")
    //         .eq("id", matchId)
    //         .single();

    //     if (matchError) {
    //         if (dev) console.error("Error fetching match:", matchError.message);
    //         return;
    //     }

    //     const { data: initialParts, error: partsError } = await client
    //         .from("match_participants")
    //         .select("user_id")
    //         .eq("match_id", matchId);

    //     if (partsError) {
    //         if (dev)
    //             console.error(
    //                 "Error fetching participants:",
    //                 partsError.message,
    //             );
    //     }
    //     return { matchInfo, participants: initialParts || [] };
    // }

    //--------------------- Event handlers ------------------------------------

    function handlePostgresChange(payload: any) {
        if (dev) console.log('Realtime Event Received:', payload);

        if (payload.eventType === 'INSERT') {
            if (!participantIds.has(payload.new.user_id)) {
                participants = [...participants, payload.new];
            }
        } else if (payload.eventType === 'DELETE') {
            participants = participants.filter((p) => p.user_id !== payload.old.user_id);
        }
    }

    function handleParticipantJoined({ payload }: any) {
        if (dev) console.log('Broadcast: participant joined', payload);
        if (!participantIds.has(payload.user_id)) {
            participants = [...participants, payload];
        }
    }

    function handleParticipantLeft({ payload }: any) {
        if (dev) console.log('Broadcast: participant left', payload);
        participants = participants.filter((p) => p.user_id !== payload.user_id);
    }

    function handleBattleStart({ payload }: any) {
        if (dev) console.log('Broadcast: battle starting', payload);
        goto(`/arena/${matchId}`);
    }

    async function handleSubscribed(matchId: string, matchInfo: any) {
        const client = await getSupabase();
        if (!client) return;
        const isAlreadyIn = participantIds.has(data.user.id);
        if (dev) console.log('Current user already in this match?', isAlreadyIn);

        if (!isAlreadyIn && participants.length < matchInfo.max_players) {
            joining = true;
            const { error: joinError } = await client
                .from('match_participants')
                .insert([{ match_id: matchId, user_id: data.user.id }]);

            if (joinError) {
                if (dev)
                    console.error(
                        'Auto-Join FAILED:',
                        joinError.message,
                        joinError.details,
                        'Code:',
                        joinError.code
                    );

                // Is already in DB?
                // (23505 = Duplicate key error code from postgres)
                if (joinError.code === '23505') {
                    participants = [...participants, { user_id: data.user.id }];
                }
                // Is match full? (from postgres guard function)
                // (P0001 = Postgres Raise Execption)
                else if (
                    joinError.code === 'P0001' ||
                    joinError.message?.includes('Match is full')
                ) {
                    alert('This match is full. Redirecting to battle selection...');
                    goto('/battle');
                    return;
                }
                // Other errors
                else {
                    alert('Failed to join match. Please try again.');
                    goto('/battle');
                    return;
                }
            } else {
                participants = [...participants, { user_id: data.user.id }];
            }

            channel
                .send({
                    type: 'broadcast',
                    event: 'participant_joined',
                    payload: { user_id: data.user.id },
                })
                .catch((err: unknown) => {
                    if (dev) console.error('Broadcast failed:', err);
                });
            joining = false;
        } else if (isAlreadyIn) {
            if (dev) console.log('Already in match - broadcasting presence');
            channel
                .send({
                    type: 'broadcast',
                    event: 'participant_joined',
                    payload: { user_id: data.user.id },
                })
                .catch((err: unknown) => {
                    if (dev) console.error('Broadcast failed:', err);
                });
        } else if (participants.length >= matchInfo.max_players && !isAlreadyIn) {
            if (dev) console.log('Room is full. Cannot join.');
        }
    }

    //-------------------- Other functions ------------------------------------

    async function subscribeToMatch(matchId: string, matchInfo: any) {
        const client = await getSupabase();
        if (!client) return;
        channel = client
            .channel(`match-${matchId}`, {
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
                    filter: `match_id=eq.${matchId}`,
                },
                handlePostgresChange
            )
            .on('broadcast', { event: 'participant_joined' }, handleParticipantJoined)
            .on('broadcast', { event: 'participant_left' }, handleParticipantLeft)
            .on('broadcast', { event: 'battle_start' }, handleBattleStart)
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    handleSubscribed(matchId, matchInfo);
                }
            });
    }

    /**
     * Start the battle - broadcasts to all participants to navigate to arena
     */
    async function startBattle() {
        if (dev) console.log('Starting battle');
        const client = await getSupabase();
        if (!client) return;

        await client
            .from('matches')
            .update({
                status: 'active',
                started_at: new Date().toISOString(),
            })
            .eq('id', matchId);

        channel.send({
            type: 'broadcast',
            event: 'battle_start',
            payload: { match_id: matchId },
        });

        goto(`/arena/${matchId}`);
    }

    /**
     * Cleanup participant from match on navigation/destruction
     * Removes user from database and broadcasts departure to other clients
     */
    async function cleanupParticipant() {
        if (!browser) return;
        if (dev) console.log('Cleaning up participant');
        const client = await getSupabase();
        if (!client) return;
        if (channel) {
            if (dev) console.log('Broadcasting participant_left');
            channel
                .send({
                    type: 'broadcast',
                    event: 'participant_left',
                    payload: { user_id: data.user.id },
                })
                .catch((err: unknown) => {
                    if (dev) console.error('Cleanup broadcast failed:', err);
                });

            client.removeChannel(channel);
            channel = null;
        }

        client
            .from('match_participants')
            .delete()
            .eq('match_id', matchId)
            .eq('user_id', data.user.id);
    }

    const inviteLink = $derived(typeof window !== 'undefined' ? window.location.href : '');

    function triggerToast() {
        showToast = true;
        setTimeout(() => (showToast = false), 3000);
    }

    //-------------------------- LifeCycle Hooks ------------------------------

    onMount(async () => {
        if (!browser) return;

        participants = data.initialParticipants || [];
        matchInfo = data.matchInfo;
        matchId = data.matchId;

        if (matchId === undefined) {
            if (dev) console.error(`matchId is undefined`);
            return;
        }

        await subscribeToMatch(matchId, matchInfo);
    });

    beforeNavigate(async () => {
        if (dev) console.log('beforeNavigate triggered');
        await cleanupParticipant();
    });

    onDestroy(async () => {
        if (dev) console.log('onDestroy triggered');
        await cleanupParticipant();
    });
</script>

<div class="waiting-area">
    {#if matchInfo}
        <div class="header">
            <h1 class="lobby-title">{matchInfo.problems.title}</h1>
            <button
                class="invite-tag"
                onclick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    matchLinkCopied = true;
                    triggerToast();
                }}
            >
                {#if !matchLinkCopied}
                    <span>Invite Link (Click to Copy)</span>
                {:else}
                    <span>Link Copied</span>
                {/if}
            </button>
        </div>

        <p class="status">
            {#if joining}
                Joining battle...
            {:else if participants.length === matchInfo.max_players}
                Ready to start.
            {:else}
                Waiting for opponent ({participants.length}/{matchInfo.max_players})
            {/if}
        </p>

        <div class="player-list">
            {#each participants as p (p.user_id)}
                <div class="player-slot active">
                    <img
                        src={getBotAvatar(p.user_id)}
                        alt="Robot"
                        crossorigin="anonymous"
                        width="60"
                    />
                </div>
            {/each}

            {#each Array(Math.max(0, matchInfo.max_players - participants.length)) as _}
                <div class="player-slot empty">?</div>
            {/each}
        </div>

        {#if participants.length >= matchInfo.max_players}
            <div class="ready-zone">
                <button class="start-btn" onclick={startBattle}>START BATTLE</button>
            </div>
        {/if}
    {:else}
        <p>Loading Match Data...</p>
    {/if}
    {#if showToast}
        <div class="css-toast">Link Copied to clipboard</div>
    {/if}
</div>

<style>
    .waiting-area {
        margin-top: 4rem;
        text-align: center;
    }

    .lobby-title {
        color: var(--success);
        font-size: clamp(1rem, 5vw, 5rem);
    }

    .invite-tag {
        display: inline-block;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        padding: 5px 15px;
        border: 1px solid var(--border-hover);
        border-radius: 5rem;
        background: var(--bg-card);
        font-size: 0.8rem;
        cursor: pointer;
    }
    .invite-tag:hover {
        border-color: var(--accent-bright);
        color: var(--fg-main);
    }
    .player-list {
        display: flex;
        justify-content: center;
        margin: 3rem 0;
        gap: 1.5rem;
    }
    .player-slot {
        display: grid;
        place-items: center;
        aspect-ratio: 1;
        width: 80px;
        border: 2px solid var(--border-default);
        border-radius: 50%;
        background: var(--bg-card);
    }
    .active {
        border-color: var(--accent-bright);
        transition: transform 0.5s;
    }
    .active:hover {
        transform: scale(1.05);
    }
    .empty {
        border-style: dashed;
        color: var(--border-hover);
    }
    .start-btn {
        padding: 1.2rem 3rem;
        border: none;
        background: var(--accent-bright);
        box-shadow: 0 0 20px var(--accent-bright-alpha-30);
        color: var(--bg-main);
        font-weight: 800;
        font-size: 1.1rem;
        animation: breathe 2s ease-in-out infinite;
        cursor: pointer;
        transition: transform(1s);

        &:active {
            transform: scale(0.95);
        }
    }

    @keyframes breathe {
        0%,
        100% {
            box-shadow: 0 0 36px 6px var(--accent-bright-alpha-20);
        }
        50% {
            box-shadow: 0 0 36px 6px var(--accent-bright-alpha-60);
        }
    }
    .css-toast {
        z-index: 1000;
        position: fixed;
        bottom: 20px;
        left: 50%;
        padding: 5px 10px;
        transform: translateX(-50%) translateY(100%);
        background: var(--fg-main);
        color: black;
        animation:
            slideIn 0.2s forwards,
            fadeOut 0.3s 2s forwards;
    }

    @keyframes slideIn {
        from {
            transform: translateX(-50%) translateY(100%);
        }
        to {
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes fadeOut {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
    }
</style>
