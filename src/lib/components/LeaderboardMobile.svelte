<script lang="ts">
    /**
     * Syntxbattle - Mobile Leaderboard Popover Component
     *
     * @description
     * Mobile-friendly leaderboard that displays as a popover overlay.
     *
     * @author Chamal Mallawaarachchi
     */
    import RiFileChartLine from '~icons/ri/file-chart-line';

    interface LeaderboardProps {
        participants: any[];
        currentUserId?: string;
    }

    let { participants, currentUserId }: LeaderboardProps = $props();
    let showPopover = $state(false);

    function formatTime(ms: number | null): string {
        if (!ms) return 'Competing...';
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

    function togglePopover() {
        showPopover = !showPopover;
    }

    function closePopover() {
        showPopover = false;
    }
</script>

<div class="mobile-leaderboard">
    <button class="toggle-btn" onclick={togglePopover}>
        <RiFileChartLine />
    </button>

    {#if showPopover}
        <button class="popover-overlay" onclick={closePopover} aria-label="Close leaderboard"
        ></button>
        <div class="popover-content">
            <div class="popover-header">
                <h3>Leaderboard</h3>
                <button class="close-btn" onclick={closePopover}>✕</button>
            </div>
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
        </div>
    {/if}
</div>

<style>
    .mobile-leaderboard {
        display: none;
    }

    .toggle-btn {
        display: flex;
        z-index: 50;
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        padding: 0;
        border: 2px solid var(--accent);
        border-radius: 50%;
        background: var(--bg-main);
        color: var(--accent);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle-btn:hover {
        background: var(--accent);
        color: var(--bg-main);
    }

    .popover-overlay {
        z-index: 100;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        padding: 0;
        border: none;
        background: rgba(0, 0, 0, 0.5);
        cursor: pointer;
    }

    .popover-content {
        z-index: 101;
        position: fixed;
        top: 50%;
        left: 50%;
        max-width: 90vw;
        max-height: 70vh;
        padding: 1rem;
        overflow-y: auto;
        transform: translate(-50%, -50%);
        border: 2px solid var(--border-default);
        background: var(--bg-inactive);
    }

    .popover-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .popover-header h3 {
        margin: 0;
        color: var(--accent);
    }

    .close-btn {
        padding: 0.25rem 0.5rem;
        border: none;
        background: transparent;
        color: var(--comment);
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        transition: color 0.2s ease;
    }

    .close-btn:hover {
        color: var(--accent);
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-dim);
        color: var(--comment);
        font-size: 0.8rem;
        text-align: left;
    }

    td {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-dim);
    }

    tr.current-user {
        background: rgba(180, 212, 207, 0.1);
    }

    @media (max-width: 768px) {
        .mobile-leaderboard {
            display: block;
        }
    }
</style>
