<script lang="ts">
    import { enhance } from '$app/forms';

    let { authenticated = false }: { authenticated: boolean } = $props();
</script>

{#if authenticated}
<form method="POST" action="/logout" use:enhance>
    <button type="submit" class="logout-btn">
        Log Out
    </button>
</form>
{/if}

<style>
    .logout-btn {
        background: var(--error);
        color: var(--fg-main);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: filter 0.2s;
    }

    .logout-btn:hover {
        filter: brightness(0.8);
    }
</style>
