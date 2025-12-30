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
    <h1>SyntXBattle<span class="vtag">v0.1.0</span></h1>
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
</style>
