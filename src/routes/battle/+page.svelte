<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { matchManager } from '$lib/matchManager.svelte';
    import { getBotAvatar } from '$lib/userUtils';

    let { data } = $props();
    let problems = $state<any[]>([]);
    let loading = $state(true);

    onMount(async () => {
        const { data: probData } = await supabase
            .from('problems')
            .select('*')
            .order('difficulty', { ascending: true });
        
        problems = probData || [];
        loading = false;
    });

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/login';
    }
</script>

<div class="arena-container">
    <header class="user-bar">
        <div class="user-info">
            <img 
                src={getBotAvatar(data.user.id)} 
                alt="Avatar" 
                class="user-avatar" 
                crossorigin="anonymous" 
            />
            <div class="user-details">
                <span class="label">Logged in as:</span>
                <span class="email">{data.user.email}</span>
            </div>
        </div>
        <button onclick={handleLogout} class="logout-btn">Sign Out</button>
    </header>

    <hr class="divider" />

    <h1>Select Your Challenge</h1>

    {#if loading}
        <div class="loading-state">
            <p>Loading problems...</p>
        </div>
    {:else}
        <div class="problem-grid">
            {#each problems as problem}
                <div class="problem-card">
                    <div class="card-header">
                        <h3>{problem.title}</h3>
                        <span class="difficulty {problem.difficulty.toLowerCase()}">
                            {problem.difficulty}
                        </span>
                    </div>
                    <p>{problem.description}</p>
                    <button 
                        onclick={() => matchManager.createMatch({ problemId: problem.id })}
                        class="battle-btn"
                    >
                        Create 1v1
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .user-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #1a1a1a;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        border: 1px solid #333;
        margin-bottom: 2rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: #000;
        border: 1px solid #444;
    }

    .user-details {
        display: flex;
        flex-direction: column;
    }

    .label {
        font-size: 0.7rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05rem;
    }

    .email {
        font-size: 0.9rem;
        color: #00ff88;
        font-weight: 500;
    }

    .logout-btn {
        background: transparent;
        border: 1px solid #444;
        color: #888;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .logout-btn:hover {
        border-color: #ff4444;
        color: #ff4444;
    }

    .divider {
        border: 0;
        border-top: 1px solid #222;
        margin-bottom: 2rem;
    }

    /* Keep your existing styles below */
    .problem-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    .problem-card {
        background: #111;
        border: 1px solid #333;
        padding: 1.5rem;
        border-radius: 12px;
    }
    .difficulty { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .easy { color: #00ff88; background: rgba(0, 255, 136, 0.1); }
    .battle-btn {
        margin-top: 1rem;
        width: 100%;
        background: #00ff88;
        color: black;
        font-weight: bold;
        padding: 0.6rem;
        border-radius: 6px;
        cursor: pointer;
    }
</style>
