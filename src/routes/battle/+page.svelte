<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { matchManager } from "$lib/matchManager.svelte";
    import { getBotAvatar } from "$lib/userUtils";

    let { data } = $props();
    let problems = $state<any[]>([]);
    let loading = $state(true);

    onMount(async () => {
        const { data: probData } = await supabase
            .from("problems")
            .select("*")
            .order("difficulty", { ascending: true });

        problems = probData || [];
        loading = false;
    });

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = "/login";
    }
</script>

<div class="arena-container">
    <header class="user-bar">
        <div class="user-info">
            <img
                src={getBotAvatar(data.user.id)}
                alt="Avatar"
                class="user-avatar"
                crossorigin="anonymous"
            />
            <div class="user-details">
                <span class="label">Logged in as:</span>
                <span class="email">{data.user.email}</span>
            </div>
        </div>
        <button onclick={handleLogout} class="logout-btn">Sign Out</button>
    </header>

    <hr class="divider" />

    <h1>Select Your Challenge</h1>

    {#if loading}
        <div class="loading-state">
            <p>Loading problems...</p>
        </div>
    {:else}
        <div class="problem-grid">
            {#each problems as problem}
                <div class="problem-card">
                    <div class="card-header">
                        <h3>{problem.title}</h3>
                        <span
                            class="difficulty {problem.difficulty.toLowerCase()}"
                        >
                            {problem.difficulty}
                        </span>
                    </div>
                    <p>{problem.description}</p>
                    <button
                        onclick={() =>
                            matchManager.createMatch({ problemId: problem.id })}
                        class="battle-btn"
                    >
                        Create 1v1
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .loading-state {
        text-align: center;
        margin-top: var(--space-2xl);
        color: var(--comment);
    }
    .card {
        background: var(--bg-card);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-xl);
        padding: var(--space-lg);
    }

    .user-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-hover);
        padding: 0.75rem 1.25rem;
        border-radius: var(--radius-xl);
        border: 1px solid var(--border-default);
        margin-bottom: var(--space-xl);
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-lg);
        background: var(--bg-main);
        border: 1px solid var(--border-hover);
    }

    .user-details {
        display: flex;
        flex-direction: column;
    }

    .label {
        font-size: 0.7rem;
        color: var(--comment);
        text-transform: uppercase;
        letter-spacing: 0.05rem;
    }

    .email {
        font-size: 0.9rem;
        color: var(--accent-bright);
        font-weight: 500;
    }

    .logout-btn {
        background: transparent;
        border: 1px solid var(--border-hover);
        color: var(--comment);
        padding: 0.4rem 0.8rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.8rem;
    }

    .logout-btn:hover {
        border-color: var(--error);
        color: var(--error);
    }

    .divider {
        border: 0;
        border-top: 1px solid var(--border-dim);
        margin-bottom: var(--space-xl);
    }

    .problem-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-lg);
    }

    .problem-card {
        background: var(--bg-card);
        border: 1px solid var(--border-default);
        padding: var(--space-lg);
        border-radius: var(--radius-xl);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-md);
    }

    .difficulty {
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-weight: bold;
    }

    .difficulty.easy {
        color: var(--accent-bright);
        background: var(--accent-bright-alpha-10);
    }

    .battle-btn {
        margin-top: var(--space-md);
        width: 100%;
        background: var(--accent-bright);
        color: black;
        font-weight: bold;
        padding: 0.6rem;
        border-radius: var(--radius-md);
        cursor: pointer;
        border: none;
    }
</style>
