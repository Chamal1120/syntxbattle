<script lang="ts">
    /**
     * Join Battle Page
     *
     * Allows users to join an existing battle match by entering a match ID.
     * Validates the UUID format before navigating to the match lobby.
     *
     * @author Chamal Mallawaarachchi
     */
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let matchId = $state('');
    let error = $state('');

    function handleJoin() {
        error = '';

        const trimmedId = matchId.trim();

        if (!trimmedId) {
            error = 'Please enter a Battle ID';
            return;
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(trimmedId)) {
            error = 'Invalid Battle ID format';
            return;
        }

        goto(`/battle/match/${trimmedId}`);
    }

    function goBack() {
        goto('/begin');
    }
</script>

<svelte:head>
    <title>Join Battle - SyntxBattle</title>
</svelte:head>

<div class="join-container">
    <div class="join-card">
        <button class="back-btn" onclick={goBack}> ← Back </button>

        <h1>Join Battle</h1>
        <p class="subtitle">Enter the Battle ID to join an existing battle</p>

        <div class="input-group">
            <input
                id="matchId"
                type="text"
                bind:value={matchId}
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                onkeydown={(e) => e.key === 'Enter' && handleJoin()}
            />
            {#if error}
                <p class="error-message">{error}</p>
            {/if}
        </div>

        <button class="join-btn" onclick={handleJoin}> Join Battle </button>

        <div class="help-text">
            <p>💡 Ask your opponent for the Battle ID</p>
            <p>📋 They can copy it from the lobby</p>
        </div>
    </div>
</div>

<style>
    :global(main.body-content) {
        max-inline-size: none;
        margin-inline: 0;
    }

    .join-container {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 2rem;
        background: var(--bg-main);
    }

    .join-card {
        position: relative;
        width: 100%;
        max-width: 500px;
        padding: 3rem;
        border: 2px solid var(--border-dim);
        background: var(--bg-dim);
    }

    .back-btn {
        position: absolute;
        top: 1rem;
        left: 1rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-dim);
        background: transparent;
        color: var(--comment);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .back-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    h1 {
        margin-bottom: 0.5rem;
        color: var(--accent);
        font-weight: bold;
        font-size: 2.5rem;
        text-align: center;
    }

    .subtitle {
        margin-bottom: 2rem;
        color: var(--comment);
        text-align: center;
    }

    .input-group {
        margin-bottom: 2rem;
    }

    input {
        box-sizing: border-box;
        width: 100%;
        padding: 1rem;
        border: 2px solid var(--border-dim);
        background: var(--bg-main);
        color: var(--fg-main);
        font-size: 0.9rem;
        font-family: monospace;
        transition: border-color 0.2s;
    }

    input:focus {
        border: 2px solid var(--border-dim);
        outline: none;
    }
    input:hover {
        border: 2px solid var(--border-dim);
        outline: none;
    }

    input::placeholder {
        color: var(--comment);
    }

    .error-message {
        margin-top: 0.5rem;
        color: var(--error);
        font-size: 0.9rem;
        text-align: center;
    }

    .join-btn {
        display: block;
        width: 50%;
        margin: 0 auto;
        padding: 1rem 2rem;
        border: none;
        background: var(--accent);
        color: var(--bg-main);
        font-weight: bold;
        font-size: 1.1rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .join-btn:hover {
        transform: translateY(-2px);
        background: var(--success);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .join-btn:active {
        transform: translateY(0);
    }

    .help-text {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-dim);
        color: var(--comment);
        font-size: 0.85rem;
        text-align: center;
    }

    .help-text p {
        margin: 0.5rem 0;
    }

    @media (max-width: 640px) {
        .join-card {
            padding: 2rem 1.5rem;
        }

        h1 {
            font-size: 2rem;
        }

        input {
            font-size: 0.8rem;
        }
    }
</style>
