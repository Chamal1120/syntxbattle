<script lang="ts">
    /**
     * Syntxbattle - Landing Page
     *
     * @author Chamal Mallwaarachchi
     */
    import { Tween, Spring } from 'svelte/motion';
    import { cubicIn, cubicOut } from 'svelte/easing';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import PauseLine from '~icons/ri/pause-line';
    import PlayLine from '~icons/ri/play-line';

    const title = 'SyntXBattle - Code with Friends';
    const description = 'Code with your friends like in a multiplayer game';

    let animating = $state(false);
    let prefersReducedMotion = $state(false);
    let userMotionPreference = $state<boolean | null>(null);
    let mounted = $state(false);
    let hasAnimated = $state(false);

    let pTagX = new Spring(0, {
        stiffness: 0.02,
        damping: 0.3,
    });

    let pTagOpacity = new Tween(0, {
        duration: 1200,
        easing: cubicOut,
    });

    onMount(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const shouldReduce = mediaQuery.matches;

        // Load reduce motion preference from localStorage
        const saved = localStorage.getItem('motionPreference');
        if (saved !== null) {
            userMotionPreference = saved === 'true';
            prefersReducedMotion = !userMotionPreference;
        } else {
            prefersReducedMotion = shouldReduce;
        }

        // Immediately mark as mounted for faster FCP
        mounted = true;

        // Set initial position after mount
        if (!prefersReducedMotion) {
            pTagX.stiffness = 1;
            pTagX.damping = 1;
            pTagX.target = -800;

            // Restore spring settings on next frame
            requestAnimationFrame(() => {
                pTagX.stiffness = 0.01;
                pTagX.damping = 0.15;
            });
        }

        // Listen for changes
        mediaQuery.addEventListener('change', (e) => {
            if (userMotionPreference === null) {
                prefersReducedMotion = e.matches;
            }
        });
    });

    $effect(() => {
        if (userMotionPreference !== null) {
            prefersReducedMotion = !userMotionPreference;
        }
    });

    function toggleMotion() {
        userMotionPreference = prefersReducedMotion;
        localStorage.setItem('motionPreference', String(userMotionPreference));
    }

    // Entrance animations
    const buttonY = new Tween(700, {
        duration: 900,
        easing: cubicOut,
    });

    const titleY = new Tween(-700, {
        duration: 900,
        easing: cubicOut,
    });

    const buttonRotate = new Tween(30, {
        duration: 900,
        easing: cubicOut,
    });

    const titleRotate = new Tween(27, {
        duration: 900,
        easing: cubicOut,
    });

    const titleOpacity = new Tween(0, {
        duration: 400,
        easing: cubicOut,
    });

    const buttonOpacity = new Tween(0, {
        duration: 400,
        easing: cubicOut,
    });

    $effect(() => {
        if (!mounted) return;

        // Trigger animations on next frame after mount
        requestAnimationFrame(() => {
            hasAnimated = true;

            if (prefersReducedMotion) {
                buttonY.set(0, { duration: 0 });
                titleY.set(0, { duration: 0 });
                buttonRotate.set(0, { duration: 0 });
                titleRotate.set(-3, { duration: 0 });
                titleOpacity.set(1, { duration: 0 });
                buttonOpacity.set(1, { duration: 0 });
                pTagOpacity.set(1, { duration: 0 });
            } else {
                buttonY.target = 0;
                titleY.target = 0;
                buttonRotate.target = 0;
                titleRotate.target = -3;
                titleOpacity.target = 1;
                buttonOpacity.target = 1;
                pTagX.target = 0;
                pTagOpacity.target = 1;
            }
        });
    });

    async function startBattleAnim() {
        animating = true;

        if (prefersReducedMotion) {
            // Simple fade out, no movement
            titleOpacity.set(0, { duration: 200 });
            buttonOpacity.set(0, { duration: 200 });
            pTagOpacity.set(0, { duration: 200 });
            await new Promise((r) => setTimeout(r, 250));
        } else {
            // Exit animations
            buttonY.set(900, { duration: 900, easing: cubicIn });
            buttonRotate.set(-30, { duration: 900, easing: cubicIn });
            buttonOpacity.set(0, { duration: 700, easing: cubicIn });

            titleY.set(-900, { duration: 900, easing: cubicIn });
            titleRotate.set(-33, { duration: 900, easing: cubicIn });
            titleOpacity.set(0, { duration: 700, easing: cubicIn });

            // Pull back a bit before spring right
            pTagX.target = -100;
            setTimeout(() => {
                pTagX.target = 1600;
            }, 200);

            pTagOpacity.set(0, { duration: 1200, easing: cubicIn });

            await new Promise((r) => setTimeout(r, 700));
        }

        goto('/battle');
    }
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <style>
        .hero-title:not(.animating) {
            visibility: visible !important;
            transform: rotate(-3deg) !important;
            opacity: 0.001 !important;
        }
        .hero-tagline:not(.animating) {
            visibility: visible !important;
            transform: translateX(0) !important;
            opacity: 0.001 !important;
        }
        .hero-button:not(.animating) {
            visibility: visible !important;
            transform: translateY(0) rotate(0deg) !important;
            opacity: 0.001 !important;
        }
    </style>

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:site_name" content="SyntXBattle" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
</svelte:head>

<div class="centered-container">
    <button
        class="motion-toggle"
        onclick={toggleMotion}
        aria-label={prefersReducedMotion ? 'Enable animations' : 'Disable animations'}
        title={prefersReducedMotion ? 'Enable animations' : 'Disable animations'}
    >
        {#if prefersReducedMotion}
            <PlayLine />
        {:else}
            <PauseLine />
        {/if}
    </button>

    <h1
        class="space-mono-bold extra-styles hero-title"
        class:animating={hasAnimated}
        style="transform: translateY({titleY.current}px) rotate({titleRotate.current}deg); opacity: {titleOpacity.current};"
    >
        <span class="title-inner">{`{SyntXBattle}`}</span>
    </h1>
    <p
        class="tagline hero-tagline"
        class:animating={hasAnimated}
        style="transform: translateX({pTagX.current}px); opacity: {pTagOpacity.current};"
    >
        Code with your friends like in a multiplayer game
    </p>

    <div
        class="actions hero-button"
        class:animating={hasAnimated}
        style="transform: translateY({buttonY.current}px) rotate({buttonRotate.current}deg); opacity: {buttonOpacity.current};"
    >
        <button onclick={startBattleAnim} disabled={animating}> Start Battling </button>
    </div>
</div>

<style>
    .centered-container {
        display: flex;
        position: relative;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100dvh;
        padding: 0 2rem;
        gap: clamp(0.5rem, 2vh, 2rem);
        text-align: center;
    }

    .motion-toggle {
        display: flex;
        z-index: 1000;
        position: fixed;
        top: 1rem;
        right: 1rem;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        padding: 0;
        border: 2px solid var(--fg-main);
        border-radius: 50%;
        outline: 2px solid transparent;
        outline-offset: 2px;
        background: var(--bg-main);
        color: var(--fg-main);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .motion-toggle:hover {
        transform: scale(1.1);
        border-color: var(--accent-bright);
        background: var(--accent-bright);
        color: var(--bg-main);
    }

    .motion-toggle:focus-visible {
        outline-color: var(--accent-bright);
    }

    h1,
    .actions,
    p {
        transform: translateZ(0);
        backface-visibility: hidden;
        will-change: transform, opacity;
    }

    /* Override inline styles until JS kicks in - for getting a better LCP :) */
    .hero-title:not(.animating),
    .hero-tagline:not(.animating),
    .hero-button:not(.animating) {
        visibility: visible !important;
        opacity: 0.001 !important;
    }

    .hero-title:not(.animating) {
        transform: rotate(-3deg) !important;
    }

    .hero-tagline:not(.animating) {
        transform: translateX(0) !important;
    }

    .hero-button:not(.animating) {
        transform: translateY(0) rotate(0deg) !important;
    }

    .tagline {
        max-width: 90%;
        margin: 0;
        font-size: 1rem;
    }

    .actions {
        margin-top: clamp(0.5rem, 1vh, 1rem);
    }

    button:not(.motion-toggle) {
        margin: 0;
        padding: var(--space-md) var(--space-xl);
        border-radius: 0;
        outline: 2px solid var(--fg-main);
        background: var(--bg-main);
        background: linear-gradient(to top, var(--accent-bright) 50%, var(--bg-main) 50%);
        background-position: top;
        background-size: 100% 200%;
        color: var(--fg-main);
        font-size: 1.1rem;
        transition:
            background-position 0.4s ease-in-out,
            color 0.3s;
    }

    button:not(.motion-toggle):hover {
        background-position: bottom;
        color: var(--bg-main);
    }

    .extra-styles {
        content-visibility: auto;
        margin: 0;
        padding: 2rem 1rem;
        overflow: visible;
        transform: rotate(-3deg);
        color: var(--string);
        font-size: clamp(3rem, 12vw, 12rem);
        line-height: 1;
        white-space: nowrap;
        word-break: keep-all;
        overflow-wrap: normal;
    }

    .title-inner {
        display: inline-block;
    }

    @media (max-width: 640px) {
        .extra-styles {
            padding: 0.5rem;
            font-size: clamp(2rem, 11vw, 12rem);
        }

        .centered-container {
            padding: 0 0.5rem;
            gap: clamp(0.75rem, 2vh, 1.5rem);
        }

        .tagline {
            max-width: 95%;
            padding: 0 1rem;
            font-size: 0.85rem;
        }

        .actions {
            margin-top: clamp(0.5rem, 1.5vh, 1rem);
        }

        button:not(.motion-toggle) {
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
        }
    }

    @media (min-width: 641px) and (max-width: 1024px) {
        .extra-styles {
            font-size: clamp(3rem, 10vw, 12rem);
        }

        .tagline {
            font-size: 0.95rem;
        }

        .centered-container {
            gap: clamp(1rem, 2.5vh, 1.75rem);
        }

        button:not(.motion-toggle) {
            font-size: 1.05rem;
        }
    }
</style>
