<script lang="ts">
    /**
     * Battle Menu Page
     *
     * Entry point for authenticated users to either create a new coding battle
     * or join an existing one using a match ID.
     *
     * @author Chamal Mallawaarachchi
     */
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';
    import RiSwordLine from '~icons/ri/sword-line';
    import RiCollapseDiagonalLine from '~icons/ri/collapse-diagonal-line';

    let { data }: { data: PageData } = $props();

    function createBattle() {
        goto('/battle');
    }

    function joinBattle() {
        goto('/join');
    }
</script>

<svelte:head>
    <title>Battle Menu - SyntxBattle</title>
</svelte:head>

<div class="begin-container">
    <div class="begin-card">
        <h1>What do you want to do?</h1>
        <p class="subtitle">Start competing or join an existing match</p>

        <div class="button-group">
            <button class="battle-btn create-btn" onclick={createBattle}>
                <span class="btn-icon"><RiSwordLine /></span>
                <span class="btn-text">Create Battle</span>
                <span class="btn-desc">Start a new coding challenge</span>
            </button>

            <button class="battle-btn join-btn" onclick={joinBattle}>
                <span class="btn-icon"><RiCollapseDiagonalLine /></span>
                <span class="btn-text">Join Battle</span>
                <span class="btn-desc">Enter with a match ID</span>
            </button>
        </div>
    </div>
</div>

<style>
    :global(main.body-content) {
        max-inline-size: none;
        margin-inline: 0;
    }

    .begin-container {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 2rem;
        background: var(--bg-main);
    }

    .begin-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 600px;
        text-align: center;
    }

    h1 {
        margin-bottom: 0.5rem;
        color: var(--accent);
        font-weight: bold;
        font-size: 3rem;
    }

    .subtitle {
        margin-bottom: 3rem;
        color: var(--comment);
        font-size: 1.1rem;
    }

    .button-group {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        width: 100%;
        gap: 1.5rem;
    }

    .battle-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1 / 1;
        width: 100%;
        padding: 2rem;
        border: 2px solid var(--border-dim);
        background: var(--bg-dim);
        color: var(--fg-main);
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .create-btn .btn-icon {
        color: var(--keyword);
    }
    .join-btn .btn-icon {
        color: var(--accent-bright);
    }

    .battle-btn:hover {
        transform: translateY(-4px);
        border-color: var(--accent);
        background: var(--bg-lighter);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }

    .battle-btn:active {
        transform: translateY(-2px);
    }

    .btn-icon {
        margin-bottom: 1rem;
        font-size: 3rem;
    }

    .btn-text {
        margin-bottom: 0.5rem;
        font-weight: bold;
        font-size: 1.5rem;
    }

    .btn-desc {
        color: var(--comment);
        font-size: 0.9rem;
    }

    .create-btn:hover .btn-icon {
        animation: bounce 0.6s infinite;
    }

    .join-btn:hover .btn-icon {
        animation: pulse 0.6s infinite;
    }

    @keyframes bounce {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
    }

    @media (max-width: 640px) {
        h1 {
            font-size: 2rem;
        }

        .button-group {
            grid-template-columns: 1fr;
        }

        .battle-btn {
            padding: 1.5rem;
        }

        .btn-icon {
            font-size: 2.5rem;
        }

        .btn-text {
            font-size: 1.2rem;
        }
    }
</style>
