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
    import { onMount, onDestroy } from "svelte";
    import { beforeNavigate } from "$app/navigation";
    import { goto } from "$app/navigation";
    import { dev } from "$app/environment";
    import { supabase } from "$lib/supabaseClient";
    import { page } from "$app/state";
    import { getBotAvatar } from "$lib/userUtils";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let participants = $state<any[]>([]);
    let participantIds = $derived(new Set(participants.map((p) => p.user_id)));
    let matchInfo = $state<any>(null);
    let joining = $state(false);
    let channel: any;
    
    $inspect("participants:", participants);
    $inspect("matchInfo:", matchInfo);

    onMount(async () => {
        const matchId = page.params.id;
        if (dev) console.log("Match Page Loaded for ID:", matchId);

        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*, problems(*)")
            .eq("id", matchId)
            .single();

        if (matchError) {
            if (dev) console.error("Error fetching match:", matchError.message);
            return;
        }

        matchInfo = match;
        if (dev) console.log("Match Info loaded:", matchInfo.problems.title);

        const { data: initialParts, error: partsError } = await supabase
            .from("match_participants")
            .select("user_id")
            .eq("match_id", matchId);

        if (partsError) {
            if (dev) console.error("Error fetching participants:", partsError.message);
        }
        participants = initialParts || [];
        if (dev) console.log("Initial Participants count:", participants.length);

        if (dev) console.log("Starting Realtime Subscription...");
        channel = supabase
            .channel(`match-${matchId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "match_participants",
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    if (dev) console.log("Realtime Event Received:", payload);

                    if (payload.eventType === "INSERT") {
                        if (dev) console.log(
                            "Realtime: New player detected!",
                            payload.new.user_id,
                        );
                        if (!participantIds.has(payload.new.user_id)) {
                            participants = [...participants, payload.new];
                        }
                    } else if (payload.eventType === "DELETE") {
                        if (dev) console.log("Realtime: Player left!", payload.old.user_id);
                        participants = participants.filter(
                            (p) => p.user_id !== payload.old.user_id,
                        );
                    }
                },
            )
            .on("broadcast", { event: "participant_joined" }, ({ payload }) => {
                if (dev) console.log("Broadcast: participant joined", payload);
                if (!participantIds.has(payload.user_id)) {
                    participants = [...participants, payload];
                }
            })
            .on("broadcast", { event: "participant_left" }, ({ payload }) => {
                if (dev) console.log("Broadcast: participant left", payload);
                participants = participants.filter(
                    (p) => p.user_id !== payload.user_id,
                );
            })
            .on("broadcast", { event: "battle_start" }, ({ payload }) => {
                if (dev) console.log("Broadcast: battle starting", payload);
                goto(`/arena/${page.params.id}`);
            })
            .subscribe(async (status) => {
                if (dev) console.log("Subscription Status:", status);

                if (status === "SUBSCRIBED") {
                    const isAlreadyIn = participantIds.has(data.user.id);
                    if (dev) console.log("Am I already in this match?", isAlreadyIn);

                    if (
                        !isAlreadyIn &&
                        participants.length < matchInfo.max_players
                    ) {
                        if (dev) console.log("Attempting to Auto-Join...");
                        joining = true;
                        const { error: joinError } = await supabase
                            .from("match_participants")
                            .insert([
                                { match_id: matchId, user_id: data.user.id },
                            ]);

                        if (joinError) {
                            if (dev) console.error(
                                "Auto-Join FAILED:",
                                joinError.message,
                                joinError.details,
                            );
                            if (joinError.code === "23505") {
                                if (dev) console.log("Already in DB - adding to local state");
                                participants = [
                                    ...participants,
                                    { user_id: data.user.id },
                                ];
                            }
                        } else {
                            if (dev) console.log("Auto-join successful");
                            participants = [
                                ...participants,
                                { user_id: data.user.id },
                            ];
                        }

                        
                        channel
                            .send({
                                type: "broadcast",
                                event: "participant_joined",
                                payload: { user_id: data.user.id },
                            })
                            .catch((err: unknown) => { if (dev) console.error("Broadcast failed:", err) });
                        joining = false;
                    } else if (isAlreadyIn) {
                        if (dev) console.log("Already in match - broadcasting presence");
                        channel
                            .send({
                                type: "broadcast",
                                event: "participant_joined",
                                payload: { user_id: data.user.id },
                            })
                            .catch((err: unknown) => { if (dev) console.error("Broadcast failed:", err) });
                    } else if (
                        participants.length >= matchInfo.max_players &&
                        !isAlreadyIn
                    ) {
                        if (dev) console.log("Room is full. Cannot join.");
                    }
                }
            });
    });

    /**
     * Start the battle - broadcasts to all participants to navigate to arena
     */
    async function startBattle() {
        if (dev) console.log("Starting battle");
        
        await supabase
            .from("matches")
            .update({ 
                status: "active",
                started_at: new Date().toISOString()
            })
            .eq("id", page.params.id);

        channel.send({
            type: "broadcast",
            event: "battle_start",
            payload: { match_id: page.params.id }
        });

        goto(`/arena/${page.params.id}`);
    }

    /**
     * Cleanup participant from match on navigation/destruction
     * Removes user from database and broadcasts departure to other clients
     */
    function cleanupParticipant() {
        if (dev) console.log("Cleaning up participant");
        if (channel) {
            if (dev) console.log("Broadcasting participant_left");
            channel
                .send({
                    type: "broadcast",
                    event: "participant_left",
                    payload: { user_id: data.user.id },
                })
                .catch((err: unknown) => { if (dev) console.error("Cleanup broadcast failed:", err) });

            supabase.removeChannel(channel);
            channel = null;
        }

        supabase
            .from("match_participants")
            .delete()
            .eq("match_id", page.params.id)
            .eq("user_id", data.user.id);
    }

    beforeNavigate(() => {
        if (dev) console.log("beforeNavigate triggered");
        cleanupParticipant();
    });

    onDestroy(() => {
        if (dev) console.log("onDestroy triggered");
        cleanupParticipant();
    });

    const inviteLink = $derived(
        typeof window !== "undefined" ? window.location.href : "",
    );
</script>

<div class="waiting-area">
    {#if matchInfo}
        <div class="header">
            <h1>{matchInfo.problems.title}</h1>
            <button
                class="invite-tag"
                onclick={() => navigator.clipboard.writeText(inviteLink)}
            >
                Invite Link (Click to Copy)
            </button>
        </div>

        <p class="status">
            {#if joining}
                Joining battle...
            {:else if participants.length === matchInfo.max_players}
                Room Full! Ready to start.
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
</div>

<style>
    .waiting-area {
        text-align: center;
        margin-top: 4rem;
    }
    .invite-tag {
        display: inline-block;
        background: #222;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.8rem;
        cursor: pointer;
        border: 1px solid #444;
    }
    .invite-tag:hover {
        border-color: #00ff88;
        color: #fff;
    }
    .player-list {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        margin: 3rem 0;
    }
    .player-slot {
        width: 80px;
        aspect-ratio: 1;
        background: #111;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: 2px solid #333;
    }
    .active {
        border-color: #00ff88;
    }
    .empty {
        border-style: dashed;
        color: #444;
    }
    .start-btn {
        background: #00ff88;
        color: black;
        font-weight: bold;
        padding: 1.2rem 3rem;
        border-radius: 50px;
        font-size: 1.1rem;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
    }
</style>
