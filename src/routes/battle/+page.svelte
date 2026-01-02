<script lang="ts">
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { matchManager } from "$lib/matchManager.svelte";
    import RiSystemInformationLine from "~icons/ri/information-line";
    import RiMapSwordLine from "~icons/ri/sword-line";

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

<div class="problem-container">
    <h1 class="problem-title space-mono-bold">Select Your Problem</h1>

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
                    <p class="card-description">{problem.description}</p>
                    <div class="problem-actions">
                    <button
                        onclick={() => {}}
                        class="more-info-btn"
                    >
                        <RiSystemInformationLine />
                        More Info
                    </button>
                    <button
                        onclick={() =>
                            matchManager.createMatch({ problemId: problem.id })}
                        class="battle-btn"
                    >
                        <RiMapSwordLine />
                        Select
                    </button>
                    </div>
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
    
    .problem-container {
        padding: 0 1rem;
    }

    .problem-title {
        text-align: center;
        line-height: 1.1;
        font-size: clamp(2rem, 6vw, 10rem);
        padding: 0 0 2rem 0;
    }

    .problem-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem 0;
    }

    .problem-card {
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

    .card-description {
        filter: brightness(0.8);
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

    .problem-actions {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
    }

    .more-info-btn,
    .battle-btn {
        margin-top: var(--space-md);
        background: var(--keyword);
        width: 100%;
        text-align: center;
        color: black;
        font-weight: bold;
        padding: 0.6rem;
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        transition: all 0.1s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

        &:active {
            transform: scale(0.94);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            filter: brightness(1.15);
        }
    }


</style>
