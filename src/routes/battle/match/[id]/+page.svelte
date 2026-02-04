<script lang="ts">
	/**
	 * Match Lobby - Waiting room for coding battle participants
	 *
	 * @description
	 * Real-time lobby where players wait for opponents to join before battle starts.
	 * This component now uses a MatchManager to handle state and real-time logic.
	 *
	 * @author Chamal Mallawaarachchi (Original)
	 * @author Gemini (Refactor)
	 */
	import { getBotAvatar } from '$lib/userUtils';
	import { MatchManager } from '$lib/matchManager.svelte';
	import { toast } from '$lib/stores/toastStore';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// All complex logic is now handled by the MatchManager!
	// We use an $effect to correctly manage the lifecycle of the MatchManager instance.
	let match: MatchManager | undefined = $state();

	$effect(() => {
		// This code runs when the component mounts and whenever `data` changes.
		match = new MatchManager(data);

		// The returned function is a cleanup function.
		// It runs before the effect re-runs or when the component is destroyed.
		return () => {
			match?.cleanup();
		};
	});

	const inviteLink = $derived(typeof window !== 'undefined' ? window.location.href : '');

	function copyInviteLink() {
		navigator.clipboard.writeText(inviteLink);
		toast.show('Link Copied to clipboard');
	}
</script>

<div class="waiting-area">
	{#if match && match.matchInfo}
		<div class="header">
			<h1 class="lobby-title">{match.matchInfo.problems.title}</h1>
			<button class="invite-tag" onclick={copyInviteLink}>
				<span>Invite Link (Click to Copy)</span>
			</button>
		</div>

		<p class="status">
			{#if match.joining}
				Joining battle...
			{:else if match.participants.length === match.matchInfo.max_players}
				Ready to start.
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

		{#if match.participants.length >= match.matchInfo.max_players}
			<div class="ready-zone">
				<button class="start-btn" onclick={() => match?.startBattle()}>START BATTLE</button>
			</div>
		{/if}
	{:else}
		<p>Loading Match Data...</p>
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
