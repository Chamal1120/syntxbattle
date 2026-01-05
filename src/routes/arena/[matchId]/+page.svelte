<script lang="ts">
    /**
     * Syntxbattle - Battle Arena logic
     *
     * @description
     * Code editor and runner component for the battles.
     * Initializes a WebContainer, provides a two-pane IDE layout,
     * executes code in a sandboxed Node.js environment, and displays
     * real-time leaderboard of participants.
     *
     * @author Chamal Mallawaarachchi
     */
    import { onMount } from 'svelte';
    import { dev, browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { WebContainer } from '@webcontainer/api';
    import type { PageData } from './$types';
    import Leaderboard from '$lib/components/Leaderboard.svelte';
    import LeaderboardMobile from '$lib/components/LeaderboardMobile.svelte';
    import CodeEditor from '$lib/components/CodeEditor.svelte';

    let { data }: { data: PageData } = $props();

    let container = $state<WebContainer | null>(null);
    let code = $state('');
    let output = $state('Initializing battle arena...');
    let isRunning = $state(false);
    let problemTitle = $state('');
    let matchStartTime = $state<Date | null>(null);
    let participants = $state<any[]>([]);
    let currentUserStatus = $state('...');
    let channel: any;
    let supabase: any;
    let vimMode = $state(false);

    // Load vim preference from localStorage
    if (browser) {
        const saved = localStorage.getItem('syntxbattle-vim-mode');
        vimMode = saved === 'true';
    }

    function toggleVim() {
        vimMode = !vimMode;
        if (browser) {
            localStorage.setItem('syntxbattle-vim-mode', String(vimMode));
        }
    }

    $inspect('participants:', participants);

    async function getSupabase() {
        if (!browser) return null;
        if (!supabase) {
            const { supabase: client } = await import('$lib/supabaseClient');
            supabase = client;
        }
        return supabase;
    }

    onMount(async () => {
        if (!browser) return;

        participants = data.initialParticipants || [];
        const match = data.match;
        problemTitle = match.problems.title;
        code = match.problems.starter_code || '// Write your solution here\n';
        matchStartTime = match.started_at ? new Date(match.started_at) : new Date();

        // Boot WebContainer
        if (!window.crossOriginIsolated) {
            output = 'Error: Isolation Headers Missing';
        } else {
            try {
                const win = window as any;

                if (!win.__wc) {
                    output = 'Booting WebContainer...';
                    win.__wc = await WebContainer.boot();
                }

                container = win.__wc as WebContainer;
                output = 'Webcontainer is Ready!';
            } catch (e) {
                output = 'Boot failed!';
                if (dev) console.error(e);
            }
        }

        // Setup Supabase realtime for leaderboard updates
        const client = await getSupabase();
        if (!client) return;

        // Setup realtime for leaderboard updates
        channel = client
            .channel(`arena-${data.matchId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'match_participants',
                    filter: `match_id=eq.${data.matchId}`,
                },
                (payload: any) => {
                    if (dev) console.log('Participant updated:', payload);
                    const index = participants.findIndex((p) => p.user_id === payload.new.user_id);
                    if (index !== -1) {
                        participants[index] = payload.new;
                        participants = [...participants];
                    }
                }
            )
            .on('broadcast', { event: 'participant_finished' }, ({ payload }: any) => {
                if (dev) console.log('Broadcast: participant finished', payload);
                const index = participants.findIndex((p) => p.user_id === payload.user_id);
                if (index !== -1) {
                    participants[index] = {
                        ...participants[index],
                        status: payload.status,
                        finished_at: payload.finished_at,
                        completion_time_ms: payload.completion_time_ms,
                    };
                    participants = [...participants];
                }
            })
            .subscribe();
    });

    async function runCode(): Promise<void> {
        if (!container) return;
        isRunning = true;
        output = '';

        try {
            await container.fs.writeFile('solution.js', code);
            const process = await container.spawn('node', ['solution.js']);
            process.output.pipeTo(
                new WritableStream({
                    write(data) {
                        output += data.replace(/\x1B\[[0-9;]*m/g, '');
                    },
                })
            );

            await process.exit;
        } catch (err: any) {
            output += `\nError: ${err.message}`;
        } finally {
            isRunning = false;
        }
    }

    /**
     * Marks participant as finished and calculates completion time
     */
    async function submitSolution() {
        if (dev) console.log('Submit clicked, user:', data.user?.id);
        const client = await getSupabase();
        if (!client) return;
        if (!matchStartTime) {
            if (dev) console.error('No match start time');
            return;
        }

        // Check if participant exists
        const { data: existingParticipant, error: checkError } = await client
            .from('match_participants')
            .select('*')
            .eq('match_id', data.matchId)
            .eq('user_id', data.user.id)
            .single();

        if (checkError) {
            if (dev) console.error('Participant not found:', checkError);
            return;
        }

        if (dev) console.log('Found participant:', existingParticipant);

        const finishedAt = new Date();
        const completionTimeMs = finishedAt.getTime() - matchStartTime.getTime();

        if (dev)
            console.log('Updating participant:', {
                match_id: data.matchId,
                user_id: data.user.id,
                completionTimeMs,
            });

        const { data: result, error } = await client
            .from('match_participants')
            .update({
                status: 'finished',
                finished_at: finishedAt.toISOString(),
                completion_time_ms: completionTimeMs,
            })
            .eq('match_id', data.matchId)
            .eq('user_id', data.user.id)
            .select();

        if (error) {
            if (dev) console.error('Submission error:', error);
        } else {
            if (dev) console.log('Submission complete:', result);
            currentUserStatus = 'finished';

            // Manually update local state
            const index = participants.findIndex((p) => p.user_id === data.user.id);
            if (index !== -1) {
                participants[index] = {
                    ...participants[index],
                    status: 'finished',
                    finished_at: finishedAt.toISOString(),
                    completion_time_ms: completionTimeMs,
                };
                participants = [...participants];
            }

            // Broadcast to other participants
            channel
                .send({
                    type: 'broadcast',
                    event: 'participant_finished',
                    payload: {
                        user_id: data.user.id,
                        status: 'finished',
                        finished_at: finishedAt.toISOString(),
                        completion_time_ms: completionTimeMs,
                    },
                })
                .catch((err: unknown) => {
                    if (dev) console.error('Broadcast failed:', err);
                });
        }
    }

    const allFinished = $derived(
        participants.length > 0 && participants.every((p) => p.status === 'finished')
    );

    $effect(() => {
        if (allFinished) {
            if (dev) console.log('All participants finished - redirecting to summary');
            setTimeout(() => {
                goto(`/battle/summary/${data.matchId}`);
            }, 2000);
        }
    });
</script>

<div class="ide">
    <div class="editor-column">
        <section class="pane editor">
            <div class="toolbar">
                <span class="filename">{problemTitle || 'solution.js'}</span>
                <div class="toolbar-actions">
                    <button class="vim-toggle" onclick={toggleVim} class:active={vimMode}>
                        {vimMode ? 'VIM' : 'NORMAL'}
                    </button>
                    <button onclick={runCode} disabled={!container || isRunning}>
                        {isRunning ? 'Running...' : 'Run'}
                    </button>
                    <button
                        class="submit-btn"
                        onclick={submitSolution}
                        disabled={currentUserStatus === 'finished'}
                    >
                        {currentUserStatus === 'finished' ? 'Submitted' : 'Submit Solution'}
                    </button>
                </div>
            </div>
            <CodeEditor bind:value={code} bind:vimMode />
        </section>

        <section class="pane terminal">
            <div class="toolbar">Output</div>
            <div class="console-body">
                <pre><code>{output}</code></pre>
            </div>
        </section>
    </div>
    <Leaderboard {participants} currentUserId={data.user.id} />
</div>

<LeaderboardMobile {participants} currentUserId={data.user.id} />

<style>
    .ide {
        display: flex;
        height: calc(100vh - 8rem);
        padding: 0 1rem 1rem 1rem;
        gap: 1rem;
    }

    .editor-column {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 1rem;
    }

    .pane {
        display: flex;
        flex: 1;
        flex-direction: column;
        background: var(--bg-main);
    }

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        border-bottom: 1px solid var(--border-dim);
        background: var(--bg-inactive);
        color: var(--comment);
        font-size: 0.8rem;
    }

    .toolbar-actions {
        display: flex;
        gap: 0.5rem;
    }

    .console-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: var(--bg-main);
    }

    code {
        color: var(--accent);
        font-family: 'Fira Code', monospace;
        white-space: pre-wrap;
    }

    button {
        padding: 4px 12px;
        border: none;
        background: var(--accent);
        color: var(--bg-main);
        font-weight: bold;
        cursor: pointer;
        transition: filter 0.2s ease;

        &:hover {
            filter: brightness(1.1);
        }

        &:disabled {
            background: var(--bg-inactive);
            color: var(--comment);
            cursor: not-allowed;
        }
    }

    .submit-btn {
        background: var(--success);
        color: white;
    }

    .submit-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .vim-toggle {
        padding: 4px 8px;
        border: 1px solid var(--border-dim);
        background: var(--bg-main);
        color: var(--comment);
        font-size: 0.7rem;
        font-family: 'Fira Code', monospace;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .vim-toggle:hover {
        border-color: var(--accent);
        color: var(--accent);
    }

    .vim-toggle.active {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--bg-main);
    }
</style>
