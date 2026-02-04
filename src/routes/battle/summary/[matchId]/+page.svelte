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
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    $inspect('Summary page data:', data);
    $inspect('Participants:', data.participants);

    let participants = $derived(
        (data.participants || []).sort((a: any, b: any) => {
            if (a.completion_time_ms && b.completion_time_ms) {
                return a.completion_time_ms - b.completion_time_ms;
            }
            return 0;
        })
    );
    let matchInfo = $derived(data.match);

    function formatTime(ms: number | null): string {
        if (!ms) return 'DNF';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function newMatch() {
        goto('/battle');
    }
</script>

<div class="summary-container">
    <div class="summary-card">
        <h1>Match Summary</h1>

        {#if matchInfo}
            <h2>{matchInfo.problems.title}</h2>

            <div class="podium">
                {#if participants[0]}
                    <div class="winner">
                        <div class="trophy">
                            <img src="/sxb-trophy.svg" alt="Trophy" />
                        </div>
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
                            <th class="col-rank">Rank</th>
                            <th class="col-participant">Participant</th>
                            <th class="col-time">Time</th>
                            <th class="col-status">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each participants as participant, index}
                            <tr class={participant.user_id === data.user.id ? 'current-user' : ''}>
                                <td class="rank">#{index + 1}</td>
                                <td class="participant">{participant.username}</td>
                                <td class="time">{formatTime(participant.completion_time_ms)}</td>
                                <td class="status-cell">
                                    <span class="status {participant.status}">
                                        {participant.status === 'finished'
                                            ? 'Completed'
                                            : 'Did not complete'}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <button class="new-match-btn" onclick={newMatch}> Start New Match </button>
        {:else}
            <p>Loading match data...</p>
        {/if}
    </div>
</div>

<style>
    :global(main.body-content) {
        max-inline-size: none;
        margin-inline: 0;
    }

    .summary-container {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 1400px;
        min-height: 100vh;
        margin: 0 auto;
        padding: 1rem;
        background: var(--bg-main);
    }

    .summary-card {
        width: 100%;
        max-width: 800px;
        text-align: center;
    }

    h1 {
        margin-bottom: 0.5rem;
        color: var(--accent);
        font-size: 2.5rem;
    }

    h2 {
        margin-bottom: 2rem;
        font-weight: normal;
    }

    .podium {
        margin: 2rem 0;
    }

    .trophy {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        font-size: 4rem;
    }

    .trophy img {
        width: 6rem;
        height: 6rem;
        object-fit: contain;
    }

    .winner h3 {
        margin-bottom: 0.5rem;
        color: var(--accent);
    }

    .winner .username {
        margin-bottom: 0.25rem;
        color: var(--fg-main);
        font-weight: bold;
        font-size: 1.5rem;
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
        margin-bottom: 2rem;
        border-collapse: collapse;
    }

    th {
        padding: 0.75rem;
        border-bottom: 2px solid var(--border-dim);
        color: var(--comment);
        font-size: 0.9rem;
        text-align: left;
        text-transform: uppercase;
    }

    th.col-rank {
        width: 15%;
        text-align: left;
    }

    th.col-participant {
        width: 35%;
        text-align: left;
    }

    th.col-time {
        width: 20%;
        text-align: center;
    }

    th.col-status {
        width: 30%;
        text-align: center;
    }

    td {
        padding: 1rem 0.75rem;
        border-bottom: 1px solid var(--border-dim);
        text-align: left;
    }

    td.rank {
        color: var(--accent);
        font-weight: bold;
        text-align: left;
    }

    td.participant {
        text-align: left;
    }

    td.time {
        font-size: 1.1rem;
        font-family: monospace;
        text-align: center;
    }

    td.status-cell {
        text-align: center;
    }

    tr.current-user {
        background: rgba(180, 212, 207, 0.1);
    }

    .status {
        padding: 0.25rem 0.75rem;
        font-weight: bold;
        font-size: 0.8rem;
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
        padding: 1rem 2rem;
        border: none;
        background: var(--accent);
        color: var(--bg-main);
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .new-match-btn:active {
        transform: scale(0.95);
    }

    @media (max-width: 640px) {
        .summary-card {
            padding: 1.5rem;
        }

        h1 {
            font-size: 2rem;
        }

        table {
            font-size: 0.9rem;
        }

        th,
        td {
            padding: 0.5rem;
        }

        th.col-rank,
        td.rank {
            width: 20%;
        }

        th.col-participant,
        td.participant {
            width: 40%;
        }

        th.col-time,
        td.time {
            width: 20%;
            font-size: 0.95rem;
        }

        th.col-status,
        td.status-cell {
            width: 20%;
        }

        .status {
            padding: 0.2rem 0.4rem;
            font-size: 0.7rem;
        }

        .trophy img {
            width: 4rem;
            height: 4rem;
        }

        .winner .username {
            font-size: 1.2rem;
        }

        .winner .time {
            font-size: 1rem;
        }
    }
</style>
