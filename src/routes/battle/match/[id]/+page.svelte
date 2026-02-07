<script lang="ts">
    /**
     * Match Lobby - Waiting room for coding battle participants
     *
     * @description
     * Real-time lobby where players wait for opponents to join before battle starts.
     * This component now uses a MatchManager to handle state and real-time logic.
     *
     * @author Chamal Mallawaarachchi
     */
    import { getBotAvatar } from '$lib/userUtils';
    import { MatchManager } from '$lib/matchManager.svelte';
    import { toast } from '$lib/stores/toastStore';
    import type { PageData } from './$types';
    import RiLogoutBoxFill from '~icons/ri/logout-box-fill';
    import RiCloseCircleFill from '~icons/ri/close-circle-fill';

    let { data }: { data: PageData } = $props();

    let match: MatchManager | undefined = $state();

    $effect(() => {
        match = new MatchManager(data);
        return () => {
            match?.cleanup();
        };
    });

    //const inviteLink = $derived(typeof window !== 'undefined' ? window.location.href : '');

    function copyInviteLink() {
        navigator.clipboard.writeText(data.matchId);
        toast.show('Battle ID copied to clipboard');
    }

    async function cancelMatch() {
        if (!confirm('Are you sure you want to cancel this battle?')) {
            return;
        }

        // Broadcast cancellation to all participants via realtime
        if (match?.channel) {
            await match.channel.send({
                type: 'broadcast',
                event: 'match_cancelled',
                payload: { match_id: data.matchId },
            });
        }

        // Small delay to ensure broadcast is sent before deletion
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Delete the match from the database
        const response = await fetch(`/api/matches/${data.matchId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            toast.show('Match cancelled');
            window.location.href = '/begin';
        } else {
            toast.show('Failed to cancel battle!');
        }
    }

    async function leaveLobby() {
        if (!confirm('Are you sure you want to leave this lobby?')) {
            return;
        }

        // Broadcast that we're leaving
        if (match?.channel) {
            await match.channel.send({
                type: 'broadcast',
                event: 'participant_left',
                payload: { user_id: data.user.id },
            });
        }

        // Remove from match_participants table
        await match?.cleanup();

        toast.show('Left the lobby');
        window.location.href = '/begin';
    }

    const isCreator = $derived(match?.matchInfo?.creator_id === data.user.id);
</script>

<div class="waiting-area">
    {#if match && match.matchInfo}
        <div class="header">
            <h1 class="lobby-title">{match.matchInfo.problems.title}</h1>
            <button class="invite-tag" onclick={copyInviteLink}>
                <span>Battle ID (Click to Copy)</span>
            </button>
        </div>

        <p class="status">
            {#if match.joining}
                Joining battle...
            {:else if match.participants.length === match.matchInfo.max_players}
                Ready to start!
            {:else}
                Waiting for opponent ({match.participants.length}/{match.matchInfo.max_players})
            {/if}
        </p>

        <div class="player-list">
            {#each match.participants as p (p.user_id)}
                <div class="player-slot active">
                    <img
                        src={getBotAvatar(p.user_id)}
                        alt="Robot"
                        crossorigin="anonymous"
                        width="60"
                    />
                </div>
            {/each}

            {#each Array(Math.max(0, match.matchInfo.max_players - match.participants.length)) as _}
                <div class="player-slot empty">?</div>
            {/each}
        </div>

        <div class="lobby-actions">
            {#if isCreator}
                <button class="cancel-btn" onclick={cancelMatch}>
                    <RiCloseCircleFill />
                </button>
            {:else}
                <button class="leave-btn" onclick={leaveLobby} title="Leave Lobby">
                    <RiLogoutBoxFill />
                </button>
            {/if}

            {#if match.participants.length >= match.matchInfo.max_players}
                <div class="ready-zone">
                    <button class="start-btn" onclick={() => match?.startBattle()}
                        >START BATTLE</button
                    >
                </div>
            {/if}
        </div>
    {:else}
        <p>Loading Battle Info...</p>
    {/if}
</div>

<style>
    .waiting-area {
        display: flex;
        flex: 1;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
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

    .cancel-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        border: 2px solid var(--warning);
        outline: none;
        background: transparent;
        color: var(--warning);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn:hover {
        background: var(--warning);
        color: var(--bg-main);
    }

    .leave-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        border: 2px solid var(--warning);
        outline: none;
        background: transparent;
        color: var(--warning);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .leave-btn:hover {
        background: var(--warning);
        color: var(--bg-main);
    }

    .leave-btn:focus {
        outline: none;
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

    .lobby-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
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
    }

    .start-btn:active {
        transform: scale(0.95);
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
</style>
