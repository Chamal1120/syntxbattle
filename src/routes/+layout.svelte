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

    import './app.css';

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
        // Check the browser support for the View Transition API
        if (!document.startViewTransition) return;

        // Don't delay first navigation - important for LCP
        if (performance.now() < 3000) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{#if isDesktop}
    <CustomCursor />
{/if}

<div class="page-loader" class:active={isNavigating}>
    <div class="lds-facebook">
        <div></div>
        <div></div>
        <div></div>
    </div>
</div>

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
