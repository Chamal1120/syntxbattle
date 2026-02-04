<script lang="ts">
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
        z-index: 1000;
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .toast {
        padding: 0.75rem 1.25rem;
        background: var(--fg-main);
        color: var(--bg-main);
        border-radius: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
    }
</style>
