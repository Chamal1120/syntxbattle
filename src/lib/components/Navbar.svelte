<script lang="ts">
    /**
     * Syntxbattle coding Battle platform - Navbar Component
     * * @author Chamal Mallawaarachchi
     */
    import Logout from "$lib/components/Logout.svelte";
    import type { User } from '@supabase/supabase-js';

    let { user }: { user: User | null } = $props();
</script>

<nav>
    <h1 class="vt323-regular nav-logo">SyntXBattle<span class="vtag space-mono-bold">v0.1.0</span></h1>
    <Logout authenticated={!!user} />
</nav>

<style>
    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        margin-bottom: 1rem;
    }

    .nav-logo {
        font-size: 2.5rem;
    }

    .vtag {
        font-size: 0.6rem;
        padding-left: 5px;
        color: var(--keyword);
    }
</style>
