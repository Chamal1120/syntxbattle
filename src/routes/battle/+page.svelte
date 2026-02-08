<script lang="ts">
    import { enhance } from '$app/forms';
    import RiListCheck from '~icons/ri/list-check';
    import RiMapSwordLine from '~icons/ri/sword-line';
    import ProblemModal from '$lib/components/problemModal.svelte';

    import { goto } from '$app/navigation';

    let { data } = $props();
    let problems = $derived(data.problems || []);

    let showProblemModal = $state(false);
    let selectedProblem: (typeof problems)[number] | null = $state(null);

    function openProblemModal(problem: (typeof problems)[number]) {
        selectedProblem = problem;
        showProblemModal = true;
    }

    function goBack() {
        goto('/begin');
    }
</script>

<div class="problem-container">
    <button class="back-btn" onclick={goBack}> ← Back </button>
    <h1 class="problem-title space-mono-bold">Select Your Challenge</h1>

    {#if problems.length === 0}
        <div class="loading-state">
            <p>No challenges available...</p>
        </div>
    {:else}
        <div class="table-wrapper">
            <table class="problems-table">
                <thead>
                    <tr>
                        <th class="col-num">#</th>
                        <th class="col-name">Name</th>
                        <th class="col-difficulty">Difficulty</th>
                        <th class="col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each problems as problem, index}
                        <tr>
                            <td class="col-num">{index + 1}</td>
                            <td class="col-name">
                                <div class="problem-name">{problem.title}</div>
                                <div class="problem-description">{problem.description}</div>
                            </td>
                            <td class="col-difficulty">
                                <span class="difficulty-badge {problem.difficulty?.toLowerCase()}">
                                    {problem.difficulty || 'Medium'}
                                </span>
                            </td>
                            <td class="col-actions">
                                <div class="action-buttons">
                                    <button
                                        onclick={() => {openProblemModal(problem)}}
                                        class="info-btn"
                                        title="More information"
                                        aria-label="Go to more information"
                                    >
                                        <RiListCheck />
                                    </button>
                                    <form method="POST" action="?/createMatch" use:enhance>
                                        <input type="hidden" name="problemId" value={problem.id} />
                                        <input type="hidden" name="maxPlayers" value="2" />
                                        <button
                                            type="submit"
                                            class="select-btn"
                                            aria-label="Select problem {problem.title}"
                                        >
                                            <RiMapSwordLine />
                                            <span class="select-btn-text">Select</span>
                                        </button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
    {#if selectedProblem}
        <ProblemModal bind:isOpen={showProblemModal} problem={selectedProblem}/>
    {/if}
</div>

<style>
    .loading-state {
        margin-top: var(--space-2xl);
        color: var(--comment);
        text-align: center;
    }

    .problem-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 1rem;
    }

    .back-btn {
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

    .problem-title {
        padding: 0 0 1rem 0;
        font-size: clamp(2.5rem, 5vw, 6rem);
        line-height: 1.1;
        text-align: center;
    }

    .table-wrapper {
        margin: 1rem 0;
        overflow-x: auto;
    }

    .problems-table {
        width: 100%;
        border: 1px solid var(--border-default);
        border-collapse: collapse;
        background: var(--bg-card);
    }

    thead {
        z-index: 10;
        position: sticky;
        top: 0;
        background: var(--bg-inactive);
    }

    th {
        padding: 1rem;
        border-bottom: 2px solid var(--border-hover);
        color: var(--comment);
        font-weight: bold;
        font-size: 0.85rem;
        letter-spacing: 0.05em;
        text-align: left;
        text-transform: uppercase;
    }

    th.col-num {
        width: 60px;
        text-align: center;
    }

    th.col-name {
        width: auto;
        min-width: 300px;
    }

    th.col-difficulty {
        width: 120px;
        text-align: center;
    }

    th.col-actions {
        width: 200px;
        text-align: center;
    }

    tbody tr {
        border-bottom: 1px solid var(--border-dim);
        transition: background-color 0.15s ease;
    }

    tbody tr:hover {
        background: var(--bg-inactive);
    }

    td {
        padding: 1rem;
        vertical-align: middle;
    }

    td.col-num {
        color: var(--accent);
        font-weight: bold;
        font-size: 0.9rem;
        text-align: center;
    }

    td.col-name {
        line-height: 1.5;
    }

    .problem-name {
        margin-bottom: 0.25rem;
        color: var(--fg-main);
        font-weight: 600;
        font-size: 1rem;
    }

    .problem-description {
        display: -webkit-box;
        color: var(--comment);
        font-size: 0.85rem;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
    }

    td.col-difficulty {
        text-align: center;
    }

    .difficulty-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        border-radius: 1rem;
        font-weight: bold;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .difficulty-badge.easy {
        background: var(--accent-bright-alpha-10);
        color: var(--accent-bright);
    }

    .difficulty-badge.medium {
        background: color-mix(in srgb, var(--warning) 15%, transparent);
        color: var(--warning);
    }

    .difficulty-badge.hard {
        background: color-mix(in srgb, var(--error) 15%, transparent);
        color: var(--error);
    }

    td.col-actions {
        text-align: center;
    }

    .action-buttons {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .info-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.4rem;
        border: 2px solid var(--border-default);
        background: color-mix(in srgb, var(--bg-main) 50%, transparent);
        color: var(--fg-main);
        font-size: 1.5rem;
        cursor: pointer;
    }

    .info-btn:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    .info-btn:active {
        transform: scale(0.96);
    }

    .action-buttons form {
        display: contents;
    }

    .select-btn {
        display: flex;
        align-items: center;
        padding: 0.6rem 1rem;
        gap: 0.5rem;
        border: 2px solid var(--border-default);
        background: var(--keyword);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        color: var(--bg-main);
        font-weight: bold;
        cursor: pointer;
    }

    .select-btn:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        filter: brightness(1.1);
    }

    .select-btn:active {
        transform: scale(0.97);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 768px) {
        th.col-name {
            min-width: 200px;
        }

        th.col-difficulty,
        td.col-difficulty {
            width: 100px;
        }

        th.col-actions,
        td.col-actions {
            width: auto;
        }

        .info-btn,
        .select-btn {
            width: 100%;
        }

        .problem-description {
            -webkit-line-clamp: 1;
            line-clamp: 1;
        }
    }

    @media (max-width: 480px) {
        th,
        td {
            padding: 0.75rem 0.5rem;
        }

        .problem-title {
            font-size: clamp(1.5rem, 8vw, 4rem);
        }

        th.col-difficulty {
            display: none;
        }

        td.col-difficulty {
            display: none;
        }

        .info-btn {
            display: none;
        }

        .select-btn-text {
            display: none;
        }

        .select-btn {
            justify-content: center;
        }
    }
</style>
