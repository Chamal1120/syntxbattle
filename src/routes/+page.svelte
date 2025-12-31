<script lang="ts">
    /**
     * Syntxbattle - Welcome Page
     * @description
     * Landing page for the coding battle platform
     */
</script>

<div class="centered-container">
    <h1 class="space-mono-bold extra-styles">SyntXBattle</h1>
    <p>Code with your friends like in a multiplayer game</p>

    <div class="actions">
        <a href="/battle">
            <button>Start Battling</button>
        </a>
    </div>
</div>

<style>
    .centered-container {
        text-align: center;
        place-content: center;
        height: 100dvh;
    }

    button {
        padding: var(--space-md) var(--space-xl);
        border-radius: 0;
        color: var(--fg-main);
        background: var(--bg-main);
        margin: 2rem;
        outline: 2px solid var(--fg-main);
        font-size: 1.1rem;
        background: linear-gradient(to top, var(--accent-bright) 50%, var(--bg-main) 50%);
        background-size: 100% 200%;
        background-position: top;
        transition:
            background-position 0.4s ease-in-out,
            color 0.3s;
    }

    button:hover {
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
