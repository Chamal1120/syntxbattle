<script lang="ts">
    /**
     * Syntxbattle - coding Battle platform - Root Layout
     * * @description
     * This component lays the root layout and styles.
     * * @author: Chamal Mallawaarachchi
     */
    import { page } from '$app/state';
    import { browser } from '$app/environment';
    import favicon from '$lib/assets/favicon.svg';
    import Navbar from '$lib/components/Navbar.svelte';
    import CustomCursor from '$lib/components/CustomCursor.svelte';
    import { onNavigate, beforeNavigate } from '$app/navigation';
    import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
    import Footer from '$lib/components/Footer.svelte';
    import Toast from '$lib/components/Toast.svelte';

    import './app.css';

    // Suppress Supabase auth warnings globally - we use secure server-side auth
    if (browser && typeof window !== 'undefined' && !window.__supabaseWarningsSuppressed) {
        window.__supabaseWarningsSuppressed = true;
        const originalWarn = console.warn;
        console.warn = (...args: any[]) => {
            const message = String(args[0] || '');
            if (
                message.includes('supabase.auth.getSession()') ||
                message.includes('supabase.auth.onAuthStateChange()')
            ) {
                return;
            }
            originalWarn.apply(console, args);
        };
    }

    let { children, data } = $props();
    let isNavigating = $state(false);
    let isDesktop = $state(true);

    injectSpeedInsights();

    $effect(() => {
        if (browser) {
            isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );
        }
    });

    beforeNavigate(() => {
        isNavigating = true;
    });

    onNavigate((navigation) => {
        isNavigating = false;
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{#if isDesktop}
    <CustomCursor />
{/if}

<!-- Disabled page loader to prevent blink on navigation
<div class="page-loader" class:active={isNavigating}>
    <div class="lds-facebook">
        <div></div>
        <div></div>
        <div></div>
    </div>
</div>
-->

<div class="page">
    {#if page.url.pathname !== '/'}
        <Navbar user={data.user} />
    {/if}
    <main class="body-content">
        {@render children()}
    </main>
    {#if page.url.pathname !== '/'}
        <Footer />
    {/if}
</div>

<Toast />

<style>
    .page {
        display: flex;
        flex-direction: column;
        min-height: 100dvh;
    }

    main {
        display: flex;
        flex: 1;
    }
</style>
