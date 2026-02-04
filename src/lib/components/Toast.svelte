<script lang="ts">
    /**
     * Toast Notification Component
     *
     * Displays temporary notification messages at the bottom center of the screen.
     * Messages automatically fade in and out with smooth animations.
     *
     * @author Chamal Mallawaarachchi
     */
    import { toast } from '$lib/stores/toastStore';
    import { fly } from 'svelte/transition';
</script>

<div class="toast-container">
    {#each $toast as t (t.id)}
        <div in:fly={{ y: 20, duration: 200 }} out:fly={{ y: -20, duration: 150 }} class="toast">
            {t.message}
        </div>
    {/each}
</div>

<style>
    .toast-container {
        display: flex;
        z-index: 1000;
        position: fixed;
        bottom: 20px;
        left: 50%;
        flex-direction: column;
        gap: 0.5rem;
        transform: translateX(-50%);
    }

    .toast {
        padding: 0.75rem 1.25rem;
        border-radius: 2rem;
        background: var(--fg-main);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        color: var(--bg-main);
        font-weight: 500;
    }
</style>
