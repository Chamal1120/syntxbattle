<script lang="ts">
    /**
     * Syntxbattle - Navbar Component
     *
     * * @author Chamal Mallawaarachchi
     */
    import { enhance } from '$app/forms';
    import { getBotAvatar } from '$lib/userUtils';
    import { goto } from '$app/navigation';
    import type { User } from '@supabase/supabase-js';

    let { user }: { user: User | null } = $props();
    let showMenu = $state(false);

    function handleLogoClick() {
        goto('/begin');
    }

    function toggleMenu() {
        showMenu = !showMenu;
    }
</script>

<nav>
    <button class="nav-logo-btn hide-on-desktop" onclick={handleLogoClick}>
        <h1 class="space-mono-bold nav-logo-main">{`{SXB}`}</h1>
        <p class="vtag space-mono-bold">v0.1.0</p>
    </button>
    <button class="nav-logo-btn hide-on-mobile" onclick={handleLogoClick}>
        <h1 class="space-mono-bold nav-logo-main">{`{SyntXBattle}`}</h1>
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
                    <form method="POST" action="/logout" use:enhance>
                        <button type="submit" class="logout-btn">Log Out</button>
                    </form>
                </div>
            {/if}
        </div>
    {/if}
</nav>

<style>
    nav {
        display: flex;
        z-index: 100;
        position: sticky;
        top: 0;
        align-items: center;
        justify-content: space-between;
        margin: 1rem;
        padding: 1rem 0rem;
        border-bottom: 2px solid oklch(80% 0.02 250);
        background-color: var(--bg-main);
    }

    .nav-logo-btn {
        background-color: transparent;
        cursor: poiner;
    }

    .nav-logo-main {
        display: inline-block;
        anchor-name: --logo-text;
        padding: 0;
        transform: rotate(-3deg);
        background-color: transparent;
        color: var(--string);
        font-size: 1.8rem;
        transition: transform 0.1s;
        will-change: transform;
    }

    .vtag {
        z-index: 2;
        position: absolute;
        position-anchor: --logo-text;
        top: anchor(bottom);
        left: anchor(right);
        margin-top: -14px;
        margin-left: -20px;
        padding: 0.05rem 0.2rem 0.05rem 0.2rem;
        background: var(--fg-main);
        color: var(--bg-main);
        font-size: 0.5rem;
        transition: transform 0.1s;
    }

    .nav-logo-btn:active .nav-logo-main {
        transform: rotate(2deg);
    }

    .nav-logo-btn:active .vtag {
        transform: rotate(-5deg);
    }

    .user-menu {
        position: relative;
    }

    .avatar-btn {
        padding: 0 0.5rem 0 0;
        border: none;
        background: transparent;
        cursor: pointer;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        padding: 10%;
        border: 2px solid var(--border-hover);
        border-radius: 50%;

        &:active {
            transform: scale(0.95);
        }
    }

    .avatar-btn:hover .user-avatar {
        border-color: var(--accent-bright);
    }

    .menu-popup {
        z-index: 1000;
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 200px;
        padding: 1rem;
        border: 2px solid var(--border-default);
        background: var(--bg-card);
        --shadow-color: color-mix(in srgb, var(--bg-card), black 15%);
        box-shadow: 0 10px 30px -5px var(--shadow-color);
    }

    .user-email {
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-dim);
        color: var(--accent-bright);
        font-size: 0.9rem;
    }

    .logout-btn {
        width: 100%;
        padding: 0.5rem;
        border: 2px solid color-mix(in srgb, var(--border-dim) 50%, transparent);
        background: var(--error);
        color: var(--fg-main);
        text-align: center;
        cursor: pointer;
        transition: filter 0.1s;
    }

    .logout-btn:hover {
        filter: brightness(1.1);
    }

    .logout-btn:active {
        transform: scale(0.98);
    }
</style>
