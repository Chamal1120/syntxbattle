<script lang="ts">
    /**
     * BitSip - Welcome Page
     * @description
     * Landing page for the coding battle platform
     */
</script>

<div class="welcome">
    <h1>Welcome to BitSip</h1>
    <p>Ready to battle?</p>

    <div class="actions">
        <a href="/battle">
            <button>Start Battling</button>
        </a>
    </div>
</div>

<style>
    .welcome {
        text-align: center;
        margin-top: 4rem;
    }

    .actions {
        margin-top: 2rem;
    }

    button {
        background: var(--accent);
        color: var(--bg-main);
        border: none;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
    }
</style>
