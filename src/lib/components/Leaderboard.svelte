<script lang="ts">
    /**
     * Syntxbattle - Leaderboard Component
     *
     * @description
     * Displays real-time leaderboard of participants with their positions,
     * usernames, and completion times.
     *
     * @author Chamal Mallawaarachchi
     */

    interface LeaderboardProps {
        participants: any[];
        currentUserId?: string;
    }

    let { participants, currentUserId }: LeaderboardProps = $props();

    function formatTime(ms: number | null): string {
        if (!ms) return '...';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    const sortedParticipants = $derived(
        [...participants].sort((a, b) => {
            if (a.status === 'finished' && b.status === 'finished') {
                return (a.completion_time_ms || 0) - (b.completion_time_ms || 0);
            }
            if (a.status === 'finished') return -1;
            if (b.status === 'finished') return 1;
            return 0;
        })
    );
</script>

<aside class="leaderboard">
    <h3>Leaderboard</h3>
    <table>
        <thead>
            <tr>
                <th>Pos</th>
                <th>Participant</th>
                <th>Time</th>
            </tr>
        </thead>
        <tbody>
            {#each sortedParticipants as participant, index}
                <tr class={participant.user_id === currentUserId ? 'current-user' : ''}>
                    <td>{index + 1}</td>
                    <td>{participant.username || 'Unknown'}</td>
                    <td>{formatTime(participant.completion_time_ms)}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</aside>

<style>
    .leaderboard {
        width: 250px;
        padding: 1rem;
        overflow-y: auto;
        border-radius: 8px;
        background: var(--bg-inactive);
    }

    .leaderboard h3 {
        margin: 0 0 1rem 0;
        color: var(--accent);
    }

    .leaderboard table {
        width: 100%;
        border-collapse: collapse;
    }

    .leaderboard th {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-dim);
        color: var(--comment);
        font-size: 0.8rem;
        text-align: left;
    }

    .leaderboard td {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-dim);
    }

    .leaderboard tr.current-user {
        background: rgba(180, 212, 207, 0.1);
    }

    @media (max-width: 768px) {
        .leaderboard {
            display: none;
        }
    }
</style>
