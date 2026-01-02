<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { matchManager } from "$lib/matchManager.svelte";

    //let { data } = $props();
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
</script>

<div class="challenges-container">
    <h1 class="challenges-title space-mono-bold">Select Your Challenge</h1>

    {#if loading}
        <div class="loading-state">
            <p>Loading problems...</p>
        </div>
    {:else}
        <div class="challenge-grid">
            {#each problems as problem}
                <div class="challenge-card">
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
                        Create match
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
    
    .challenges-container {
        padding: 0 1rem;
    }

    .challenges-title {
        text-align: center;
        line-height: 1.1;
        font-size: clamp(2rem, 6vw, 10rem);
        padding: 0 0 2rem 0;
    }

    .challenge-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem 0;
    }

    .challenge-card {
        background: var(--bg-card);
        border: 1px solid var(--border-default);
        padding: var(--space-lg);
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
        text-align: center;
        color: black;
        font-weight: bold;
        padding: 0.6rem;
        cursor: pointer;
        border: none;
    }
</style>
