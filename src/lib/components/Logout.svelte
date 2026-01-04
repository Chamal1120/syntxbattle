<script lang="ts">
    /**
     * Syntxbattle - Logout button
     *
     */
    import { enhance } from '$app/forms';

    let { authenticated = false }: { authenticated: boolean } = $props();
</script>

{#if authenticated}
    <form method="POST" action="/logout" use:enhance>
        <button type="submit" class="logout-btn"> Log Out </button>
    </form>
{/if}

<style>
    .logout-btn {
        padding: 0.5rem 1rem;
        background: var(--error);
        color: var(--fg-main);
        cursor: pointer;
        transition: filter 0.2s;
    }

    .logout-btn:hover {
        filter: brightness(0.8);
    }
</style>
