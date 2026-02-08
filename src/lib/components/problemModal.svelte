<script lang="ts">
    import RiCloseCircleLine from '~icons/ri/close-circle-line';

    export let problem: { title: string; description: string; difficulty: string };
    export let isOpen: boolean;

    function closeModal(event?: MouseEvent) {
        if (!event || event.target === event.currentTarget) {
            isOpen = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

{#if isOpen}
    <div
        class="modal-overlay"
        on:click={closeModal}
        on:keydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div class="modal-content" role="document">
            <button class="modal-close-btn" on:click={() => closeModal()} aria-label="Close modal">
                <RiCloseCircleLine />
            </button
            >
            <div class="modal-header">
                <h2 class="space-mono-bold">{problem.title}</h2>
                <p class="difficulty-badge {problem.difficulty?.toLowerCase()}">
                    {problem.difficulty || 'TBD'}
                </p>
            </div>
            <div class="description-content">
                {problem.description}
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-header {
        display: flex;
        flex-direction: flex-row;
        gap: 1rem;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
    }

    .modal-content {
        background-color: var(--bg-main);
        padding: 2rem;
        border-radius: 0;
        max-width: 600px;
        width: 90%;
        position: relative;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        color: var(--fg-main);
    }

    .modal-close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: var(--comment);
        cursor: pointer;
    }

    .modal-close-btn:hover {
        color: var(--accent);
    }

    h2 {
        margin-top: 0;
        color: var(--accent);
    }

    .description-content {
        border: 2px solid var(--comment);
        padding: 2rem;
        color: var(--fg-main, #e4e4e7);
        white-space: pre-wrap;
    }

    .difficulty-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        border-radius: 0;
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
</style>
