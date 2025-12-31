<script lang="ts">
    /**
     * Syntxbattle - Match Summary 
     *
     * @description
     * Displays final match results with leaderboard showing all participants
     * and their completion times. Provides option to start a new match.
     *
     * @author Chamal Mallawaarachchi
     */
    import { onMount } from "svelte";
    import { dev } from "$app/environment";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabaseClient";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let participants = $state<any[]>([]);
    let matchInfo = $state<any>(null);
    let loading = $state(true);

    onMount(async () => {
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*, problems(*)")
            .eq("id", data.matchId)
            .single();

        if (matchError) {
            if (dev) console.error("Error fetching match:", matchError.message);
            return;
        }

        matchInfo = match;

        const { data: initialParts, error: partsError } = await supabase
            .from("match_participants")
            .select("user_id, status, finished_at, completion_time_ms")
            .eq("match_id", data.matchId);

        if (dev) console.log("Fetched participants:", initialParts);

        if (partsError) {
            if (dev)
                console.error(
                    "Error fetching participants:",
                    partsError.message,
                );
        }

        const userIds = (initialParts || []).map((p) => p.user_id);
        const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

        const usernameMap = new Map(
            (profilesData || []).map((p) => [p.id, p.username]),
        );

        participants = (initialParts || [])
            .map((p) => ({
                ...p,
                username: usernameMap.get(p.user_id) || "Unknown",
            }))
            .sort((a, b) => {
                if (a.completion_time_ms && b.completion_time_ms) {
                    return a.completion_time_ms - b.completion_time_ms;
                }
                return 0;
            });

        if (dev) console.log("Participants with usernames:", participants);
        loading = false;
    });

    function formatTime(ms: number | null): string {
        if (!ms) return "DNF";
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    function newMatch() {
        goto("/battle");
    }
</script>

<div class="summary-container">
    <div class="summary-card">
        <h1>Match Complete!</h1>

        {#if loading}
            <p>Loading results...</p>
        {:else if matchInfo}
            <h2>{matchInfo.problems.title}</h2>

            <div class="podium">
                {#if participants[0]}
                    <div class="winner">
                        <div class="trophy">🏆</div>
                        <h3>Winner</h3>
                        <p class="username">{participants[0].username}</p>
                        <p class="time">
                            {formatTime(participants[0].completion_time_ms)}
                        </p>
                    </div>
                {/if}
            </div>

            <div class="leaderboard-section">
                <h3>Final Standings</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Participant</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each participants as participant, index}
                            <tr
                                class={participant.user_id === data.user.id
                                    ? "current-user"
                                    : ""}
                            >
                                <td class="rank">#{index + 1}</td>
                                <td>{participant.username}</td>
                                <td
                                    >{formatTime(
                                        participant.completion_time_ms,
                                    )}</td
                                >
                                <td>
                                    <span class="status {participant.status}">
                                        {participant.status === "finished"
                                            ? "Completed"
                                            : "Competing"}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <button class="new-match-btn" onclick={newMatch}>
                Start New Match
            </button>
        {/if}
    </div>
</div>

<style>
    .summary-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 2rem;
        background: var(--bg-main);
    }

    .summary-card {
        max-width: 800px;
        width: 100%;
        background: var(--bg-inactive);
        padding: 3rem;
        text-align: center;
    }

    h1 {
        color: var(--accent);
        margin-bottom: 0.5rem;
        font-size: 2.5rem;
    }

    h2 {
        margin-bottom: 2rem;
        font-weight: normal;
    }

    .podium {
        margin: 2rem 0;
    }

    .winner {
        display: inline-block;
        padding: 2rem;
        background: rgba(180, 212, 207, 0.1);
        border: 2px solid var(--accent);
    }

    .trophy {
        font-size: 4rem;
        margin-bottom: 0.5rem;
    }

    .winner h3 {
        color: var(--accent);
        margin-bottom: 0.5rem;
    }

    .winner .username {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--fg-main);
        margin-bottom: 0.25rem;
    }

    .winner .time {
        color: var(--comment);
        font-size: 1.2rem;
    }

    .leaderboard-section {
        margin-top: 3rem;
    }

    .leaderboard-section h3 {
        margin-bottom: 1rem;
        color: var(--fg-main);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2rem;
    }

    th {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 2px solid var(--border-dim);
        color: var(--comment);
        font-size: 0.9rem;
        text-transform: uppercase;
    }

    td {
        padding: 1rem 0.75rem;
        border-bottom: 1px solid var(--border-dim);
    }

    .rank {
        font-weight: bold;
        color: var(--accent);
    }

    tr.current-user {
        background: rgba(180, 212, 207, 0.1);
    }

    .status {
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
        font-weight: bold;
    }

    .status.finished {
        background: rgba(0, 255, 136, 0.2);
        color: var(--success);
    }

    .status.competing {
        background: rgba(243, 190, 124, 0.2);
        color: var(--warning);
    }

    .new-match-btn {
        background: var(--accent);
        color: var(--bg-main);
        border: none;
        padding: 1rem 2rem;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .new-match-btn:hover {
        transform: scale(1.05);
    }
</style>
