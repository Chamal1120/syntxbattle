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
        /* Modern Chrome 2025: Using relative colors for hover effects */
        background: #ff4444;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .logout-btn:hover {
        background: color-mix(in srgb, #ff4444, black 20%);
    }
</style>
