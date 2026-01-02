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
    import { getBotAvatar } from "$lib/userUtils";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let participants = $state<any[]>([]);
    let participantIds = $derived(new Set(participants.map((p) => p.user_id)));
    let matchInfo = $state<any>(null);
    let joining = $state(false);
    let channel: any;
    let matchId = $state(data.matchId);

    $inspect("participants:", participants);
    $inspect("matchInfo:", matchInfo);

    async function loadMatchData(matchId: string) {
        const { data: matchInfo, error: matchError } = await supabase
            .from("matches")
            .select("*, problems(*)")
            .eq("id", matchId)
            .single();

        if (matchError) {
            if (dev) console.error("Error fetching match:", matchError.message);
            return;
        }

        const { data: initialParts, error: partsError } = await supabase
            .from("match_participants")
            .select("user_id")
            .eq("match_id", matchId);

        if (partsError) {
            if (dev)
                console.error(
                    "Error fetching participants:",
                    partsError.message,
                );
        }
        return { matchInfo, participants: initialParts || [] };
    }

    //--------------------- Event handlers ------------------------------------

    function handlePostgresChange(payload: any) {
        if (dev) console.log("Realtime Event Received:", payload);

        if (payload.eventType === "INSERT") {
            if (!participantIds.has(payload.new.user_id)) {
                participants = [...participants, payload.new];
            }
        } else if (payload.eventType === "DELETE") {
            participants = participants.filter(
                (p) => p.user_id !== payload.old.user_id,
            );
        }
    }

    function handleParticipantJoined({ payload }: any) {
        if (dev) console.log("Broadcast: participant joined", payload);
        if (!participantIds.has(payload.user_id)) {
            participants = [...participants, payload];
        }
    }

    function handleParticipantLeft({ payload }: any) {
        if (dev) console.log("Broadcast: participant left", payload);
        participants = participants.filter(
            (p) => p.user_id !== payload.user_id,
        );
    }

    function handleBattleStart({ payload }: any) {
        if (dev) console.log("Broadcast: battle starting", payload);
        goto(`/arena/${matchId}`);
    }

    async function handleSubscribed(matchId: string, matchInfo: any) {
        const isAlreadyIn = participantIds.has(data.user.id);
        if (dev)
            console.log("Current user already in this match?", isAlreadyIn);

        if (!isAlreadyIn && participants.length < matchInfo.max_players) {
            joining = true;
            const { error: joinError } = await supabase
                .from("match_participants")
                .insert([{ match_id: matchId, user_id: data.user.id }]);

            if (joinError) {
                if (dev)
                    console.error(
                        "Auto-Join FAILED:",
                        joinError.message,
                        joinError.details,
                        "Code:",
                        joinError.code,
                    );

                // Is already in DB?
                // (23505 = Duplicate key error code from postgres)
                if (joinError.code === "23505") {
                    participants = [...participants, { user_id: data.user.id }];
                }
                // Is match full? (from postgres guard function)
                // (P0001 = Postgres Raise Execption)
                else if (
                    joinError.code === "P0001" ||
                    joinError.message?.includes("Match is full")
                ) {
                    alert(
                        "This match is full. Redirecting to battle selection...",
                    );
                    goto("/battle");
                    return;
                }
                // Other errors
                else {
                    alert("Failed to join match. Please try again.");
                    goto("/battle");
                    return;
                }
            } else {
                participants = [...participants, { user_id: data.user.id }];
            }

            channel
                .send({
                    type: "broadcast",
                    event: "participant_joined",
                    payload: { user_id: data.user.id },
                })
                .catch((err: unknown) => {
                    if (dev) console.error("Broadcast failed:", err);
                });
            joining = false;
        } else if (isAlreadyIn) {
            if (dev) console.log("Already in match - broadcasting presence");
            channel
                .send({
                    type: "broadcast",
                    event: "participant_joined",
                    payload: { user_id: data.user.id },
                })
                .catch((err: unknown) => {
                    if (dev) console.error("Broadcast failed:", err);
                });
        } else if (
            participants.length >= matchInfo.max_players &&
            !isAlreadyIn
        ) {
            if (dev) console.log("Room is full. Cannot join.");
        }
    }

    //-------------------- Other functions ------------------------------------

    function subscribeToMatch(matchId: string, matchInfo: any) {
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
                handlePostgresChange,
            )
            .on(
                "broadcast",
                { event: "participant_joined" },
                handleParticipantJoined,
            )
            .on(
                "broadcast",
                { event: "participant_left" },
                handleParticipantLeft,
            )
            .on("broadcast", { event: "battle_start" }, handleBattleStart)
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    handleSubscribed(matchId, matchInfo);
                }
            });
    }

    /**
     * Start the battle - broadcasts to all participants to navigate to arena
     */
    async function startBattle() {
        if (dev) console.log("Starting battle");

        await supabase
            .from("matches")
            .update({
                status: "active",
                started_at: new Date().toISOString(),
            })
            .eq("id", matchId);

        channel.send({
            type: "broadcast",
            event: "battle_start",
            payload: { match_id: matchId },
        });

        goto(`/arena/${matchId}`);
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
                .catch((err: unknown) => {
                    if (dev) console.error("Cleanup broadcast failed:", err);
                });

            supabase.removeChannel(channel);
            channel = null;
        }

        supabase
            .from("match_participants")
            .delete()
            .eq("match_id", matchId)
            .eq("user_id", data.user.id);
    }

    const inviteLink = $derived(
        typeof window !== "undefined" ? window.location.href : "",
    );

    //-------------------------- LifeCycle Hooks ------------------------------

    onMount(async () => {
        if (matchId === undefined) {
            if (dev) console.error(`matchId is undefined`);
            return;
        }

        const result = await loadMatchData(matchId);
        if (!result) {
            if (dev) console.error(`Loading match Data failed`);
            return;
        }

        ({ matchInfo, participants } = result);

        // Starting realtime subscription
        subscribeToMatch(matchId, matchInfo);
    });

    beforeNavigate(() => {
        if (dev) console.log("beforeNavigate triggered");
        cleanupParticipant();
    });

    onDestroy(() => {
        if (dev) console.log("onDestroy triggered");
        cleanupParticipant();
    });
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
                <button class="start-btn" onclick={startBattle}
                    >START BATTLE</button
                >
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
        background: var(--bg-card);
        padding: 5px 15px;
        font-size: 0.8rem;
        cursor: pointer;
        border: 1px solid var(--border-hover);
    }
    .invite-tag:hover {
        border-color: var(--accent-bright);
        color: var(--fg-main);
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
        background: var(--bg-card);
        display: grid;
        place-items: center;
        border: 2px solid var(--border-default);
    }
    .active {
        border-color: var(--accent-bright);
    }
    .empty {
        border-style: dashed;
        color: var(--border-hover);
    }
    .start-btn {
        background: var(--accent-bright);
        color: var(--bg-main);
        font-weight: bold;
        padding: 1.2rem 3rem;
        font-size: 1.1rem;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 20px var(--accent-bright-alpha-30);
    }
</style>
