<script lang="ts">
    /**
     * Syntxbattle - Landing Page
     *
     * @author Chamal Mallwaarachchi
     */
    import { Tween, Spring } from "svelte/motion";
    import { cubicIn, cubicOut } from "svelte/easing";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import PauseLine from "~icons/ri/pause-line";
    import PlayLine from "~icons/ri/play-line";

    let animating = $state(false);
    let prefersReducedMotion = $state(false);
    let userMotionPreference = $state<boolean | null>(null);
    let mounted = $state(false);

    let pTagX = new Spring(0, {
        stiffness: 0.02,
        damping: 0.3,
    });

    let pTagOpacity = new Tween(0, {
        duration: 1200,
        easing: cubicOut,
    });

    onMount(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );
        const shouldReduce = mediaQuery.matches;

        // Load reduce motion preference from localStorage
        const saved = localStorage.getItem("motionPreference");
        if (saved !== null) {
            userMotionPreference = saved === "true";
            prefersReducedMotion = !userMotionPreference;
        } else {
            prefersReducedMotion = shouldReduce;
        }

        // Set initial position before marking as mounted
        if (!prefersReducedMotion) {
            pTagX.stiffness = 1;
            pTagX.damping = 1;
            pTagX.target = -800;

            // Wait a tick, then restore spring settings
            setTimeout(() => {
                pTagX.stiffness = 0.01;
                pTagX.damping = 0.15;
                mounted = true;
            }, 10);
        } else {
            mounted = true;
        }

        // Listen for changes
        mediaQuery.addEventListener("change", (e) => {
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
        localStorage.setItem("motionPreference", String(userMotionPreference));
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

        // Small delay to let component render first
        setTimeout(() => {
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
        }, 50);
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

        goto("/battle");
    }
</script>

<div class="centered-container">
    <button
        class="motion-toggle"
        onclick={toggleMotion}
        aria-label={prefersReducedMotion
            ? "Enable animations"
            : "Disable animations"}
        title={prefersReducedMotion
            ? "Enable animations"
            : "Disable animations"}
    >
        {#if prefersReducedMotion}
            <PlayLine />
        {:else}
            <PauseLine />
        {/if}
    </button>

    <h1
        class="space-mono-bold extra-styles"
        style="transform: translateY({titleY.current}px) rotate({titleRotate.current}deg); opacity: {titleOpacity.current}; will-change: transform, opacity"
    >
        SyntXBattle
    </h1>
    <p
        style="transform: translateX({pTagX.current}px); opacity: {pTagOpacity.current}; will-change: transform, opacity"
    >
        Code with your friends like in a multiplayer game
    </p>

    <div
        class="actions"
        style="transform: translateY({buttonY.current}px) rotate({buttonRotate.current}deg); opacity: {buttonOpacity.current}; will-change: transform, opacity"
    >
        <button onclick={startBattleAnim} disabled={animating}>
            Start Battling
        </button>
    </div>
</div>

<style>
    .centered-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        height: 100dvh;
        position: relative;
    }

    .motion-toggle {
        position: fixed;
        top: 1rem;
        right: 1rem;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        border: 2px solid var(--fg-main);
        background: var(--bg-main);
        color: var(--fg-main);
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: all 0.2s ease;
        outline: 2px solid transparent;
        outline-offset: 2px;
    }

    .motion-toggle:hover {
        background: var(--accent-bright);
        border-color: var(--accent-bright);
        transform: scale(1.1);
    }

    .motion-toggle:focus-visible {
        outline-color: var(--accent-bright);
    }

    h1,
    .actions,
    p {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
    }

    button:not(.motion-toggle) {
        padding: var(--space-md) var(--space-xl);
        border-radius: 0;
        color: var(--fg-main);
        background: var(--bg-main);
        margin: 2rem;
        outline: 2px solid var(--fg-main);
        font-size: 1.1rem;
        background: linear-gradient(
            to top,
            var(--accent-bright) 50%,
            var(--bg-main) 50%
        );
        background-size: 100% 200%;
        background-position: top;
        transition:
            background-position 0.4s ease-in-out,
            color 0.3s;
    }

    button:not(.motion-toggle):hover {
        background-position: bottom;
        color: var(--bg-main);
    }

    .extra-styles {
        font-size: clamp(5rem, 10vw, 15rem);
        color: var(--string);
        transform: rotate(-3deg);
        padding: 0.8vw;
        margin: 0;
    }
</style>

