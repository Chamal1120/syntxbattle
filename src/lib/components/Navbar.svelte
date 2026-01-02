<script lang="ts">
    /**
     * Syntxbattle coding Battle platform - Navbar Component
     * * @author Chamal Mallawaarachchi
     */
    import { getBotAvatar } from "$lib/userUtils";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabaseClient";
    import type { User } from '@supabase/supabase-js';

    let { user }: { user: User | null } = $props();
    let showMenu = $state(false);

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = "/login";
    }

    function toggleMenu() {
        showMenu = !showMenu;
    }
</script>

<nav>
    <button class="nav-logo-button" onclick={goto('/')}>
        <h1 class="space-mono-bold nav-logo-main">SyntXBattle</h1>
        <p class="vtag space-mono-bold">v0.1.0</p>
    </button>
    {#if user}
        <div class="user-menu">
            <button class="avatar-btn" onclick={toggleMenu}>
                <img
                    src={getBotAvatar(user.id)}
                    alt="Avatar"
                    class="user-avatar"
                    crossorigin="anonymous"
                />
            </button>
            {#if showMenu}
                <div class="menu-popup">
                    <div class="user-email">{user.email}</div>
                    <button onclick={handleLogout} class="logout-btn">Log Out</button>
                </div>
            {/if}
        </div>
    {/if}
</nav>

<style>
    nav {
        position: sticky;
        top: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1rem;
        margin-bottom: 1rem;
        background-color: var(--bg-main);
        z-index: 100;
    }

    .nav-logo-button {
        background-color: transparent;
        cursor: poiner;
        -webkit-tap-highlight-color: transparent;
    }

    .nav-logo-main {
        display: inline-block;
        padding: 0;
        anchor-name: --logo-text;
        background-color: transparent;
        font-size: 1.5rem;
        color: var(--string);
        transform: rotate(-3deg);
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;

    }

    .nav-logo-button:active .nav-logo-main {
        transform: rotate(2deg);
    }

    .nav-logo-button:active .vtag {
        transform: rotate(-5deg);
    }

    .vtag {
        position: absolute;
        position-anchor: --logo-text;
        top: anchor(bottom);
        left: anchor(right);
        background: var(--fg-main);
        padding: 0.05rem 0.2rem 0.05rem 0.2rem; 
        font-size: 0.5rem;
        margin-left: -20px;
        margin-top: -14px;
        color: var(--bg-main);
        z-index: 2;
    }

    .user-menu {
        position: relative;
    }

    .avatar-btn {
        background: transparent;
        border: none;
        padding: 0 0.5rem 0 0;
        cursor: pointer;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        padding: 10%;
        border: 2px solid var(--border-hover);
        transition: border-color 0.2s;
    }

    .avatar-btn:hover .user-avatar {
        border-color: var(--accent-bright);
    }

    .menu-popup {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-default);
        padding: 1rem;
        min-width: 200px;
        z-index: 1000;
        --shadow-color: color-mix(in srgb, var(--bg-card), black 15%);
        box-shadow: 0 10px 30px -5px var(--shadow-color);
    }

    .user-email {
        font-size: 0.9rem;
        color: var(--accent-bright);
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-dim);
    }

    .logout-btn {
        width: 100%;
        background: var(--error);
        color: var(--fg-main);
        text-align: center;
        padding: 0.5rem;
        cursor: pointer;
        border: none;
        transition: filter 0.2s;
    }

    .logout-btn:hover {
        filter: brightness(0.8);
    }
</style>
