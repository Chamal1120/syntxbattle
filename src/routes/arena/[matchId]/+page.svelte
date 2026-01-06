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
    import { beforeNavigate } from '$app/navigation';
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
    let isSubmitting = $state(false);
    let problemTitle = $state('');
    let problemDescription = $state('');
    let problemDifficulty = $state('');
    let matchStartTime = $state<Date | null>(null);
    let participants = $state<any[]>([]);
    let currentUserStatus = $state('...');
    let currentLanguage = $state('javascript');
    let showFailedTestsPopover = $state(false);
    let failedTestsMessage = $state('');
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

    // Handle navigation away from arena (back button, etc.)
    beforeNavigate(async (navigation) => {
        if (currentUserStatus !== 'finished' && currentUserStatus !== 'left') {
            // Update status to left
            const client = await getSupabase();
            if (client) {
                await client
                    .from('match_participants')
                    .update({ status: 'left' })
                    .eq('match_id', data.matchId)
                    .eq('user_id', data.user.id);
            }
            
            // If navigating out redirect to /battle
            if (navigation.to?.route?.id !== '/battle') {
                navigation.cancel();
                goto('/battle');
            }
        }
    });

    onMount(() => {
        if (!browser) return;

        (async () => {
            participants = data.initialParticipants || [];
            const match = data.match;
            problemTitle = match.problems.title;
            problemDescription = match.problems.description;
            problemDifficulty = match.problems.difficulty;
            currentLanguage = data.language || 'javascript';
            
            // Load starter code from problem_languages
            code = data.problemLanguage?.starter_code || '// Write your solution here\n';
            
            matchStartTime = match.started_at ? new Date(match.started_at) : new Date();

            // Set current user status from initial data
            const currentParticipant = participants.find((p) => p.user_id === data.user.id);
            if (currentParticipant) {
                currentUserStatus = currentParticipant.status || 'competing';
            }

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
                .on('broadcast', { event: 'participant_left' }, ({ payload }: any) => {
                    if (dev) console.log('Broadcast: participant left', payload);
                    const index = participants.findIndex((p) => p.user_id === payload.user_id);
                    if (index !== -1) {
                        participants[index] = {
                            ...participants[index],
                            status: 'left',
                        };
                        participants = [...participants];
                    }
                })
                .subscribe();
        })();

        // Handle browser back/navigation away
        const handleBeforeUnload = () => {
            if (currentUserStatus !== 'finished' && currentUserStatus !== 'left') {
                leaveArena(true);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (currentUserStatus !== 'finished' && currentUserStatus !== 'left') {
                leaveArena(true);
            }
        };
    });

    async function runCode(): Promise<void> {
        if (!container) return;
        isRunning = true;
        output = '';

        try {
            // Determine file extension and command based on language
            let filename: string;
            let command: string;
            let args: string[];

            switch (currentLanguage) {
                case 'python':
                    filename = 'solution.py';
                    command = 'python3';
                    args = [filename];
                    break;
                case 'typescript':
                    filename = 'solution.ts';
                    command = 'node';
                    args = [filename];
                    break;
                case 'javascript':
                default:
                    filename = 'solution.js';
                    command = 'node';
                    args = [filename];
                    break;
            }

            await container.fs.writeFile(filename, code);
            const process = await container.spawn(command, args);
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
        console.log('Submitting solution...');
        
        const client = await getSupabase();
        if (!client) return;
        if (!matchStartTime) {
            if (dev) console.error('No match start time');
            return;
        }

        // Check if user has left
        if (currentUserStatus === 'left') {
            if (dev) console.log('User has left the arena');
            return;
        }

        // Determine language based on problem or user selection
        const language = currentLanguage;

        // Show loading state
        isSubmitting = true;
        output = 'Running tests...';

        try {
            // Call server-side API to validate code
            const response = await fetch(`/api/arena/${data.matchId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    language,
                }),
            });

            const result = await response.json();

            console.log('Submission result:', result);

            if (!response.ok) {
                output = `Submission error: ${result.error}`;
                if (dev) console.error('Submission error:', result);
                isSubmitting = false;
                return;
            }

            // Show test results
            output = `Test Results: ${result.passed}/${result.total} passed\n\n`;
            result.results.forEach((test: any, i: number) => {
                output += `Test ${i + 1}: ${test.passed ? 'PASSED' : 'FAILED'}\n`;
                if (!test.passed) {
                    output += `  Input: ${test.input}\n`;
                    output += `  Expected: ${test.expected}\n`;
                    output += `  Actual: ${test.actual}\n`;
                    if (test.error) {
                        output += `  Error: ${test.error}\n`;
                    }
                }
                output += '\n';
            });

            console.log('Result success:', result.success);
            console.log('Completion data:', {
                status: result.status,
                finished_at: result.finished_at,
                completion_time_ms: result.completion_time_ms
            });

            if (result.success) {
                currentUserStatus = 'finished';
                output += 'All tests passed!\n';

                console.log('Current participants before update:', participants);
                console.log('Looking for user:', data.user.id);

                // Update local participant state
                const index = participants.findIndex((p) => p.user_id === data.user.id);
                console.log('Found participant at index:', index);
                
                if (index !== -1) {
                    participants[index] = {
                        ...participants[index],
                        status: 'finished',
                        finished_at: result.finished_at,
                        completion_time_ms: result.completion_time_ms,
                    };
                    participants = [...participants];
                    console.log('Updated participants:', participants);
                }

                // Broadcast to other participants
                channel
                    ?.send({
                        type: 'broadcast',
                        event: 'participant_finished',
                        payload: {
                            user_id: data.user.id,
                            status: 'finished',
                            finished_at: result.finished_at,
                            completion_time_ms: result.completion_time_ms,
                        },
                    })
                    .catch((err: unknown) => {
                        if (dev) console.error('Broadcast failed:', err);
                    });
            } else {
                // Tests failed - show popover
                output += 'Some tests failed.\n';
                failedTestsMessage = `${result.total - result.passed} out of ${result.total} tests failed.`;
                showFailedTestsPopover = true;
                
                // Auto-hide popover after 4 seconds
                setTimeout(() => {
                    showFailedTestsPopover = false;
                }, 4000);
            }
        } catch (error: any) {
            output = `Submission failed: ${error.message}`;
            if (dev) console.error('Submission error:', error);
        } finally {
            isSubmitting = false;
        }
    }

    /**
     * Marks participant as left the arena
     */
    async function leaveArena(isUnload = false) {
        console.log('leaveArena called, isUnload:', isUnload, 'currentUserStatus:', currentUserStatus);
        
        const client = await getSupabase();
        if (!client) {
            console.error('No Supabase client');
            return;
        }

        // For page unload, we can't rely on async operations completing
        // Just update the status and let it fire
        if (isUnload) {
            // Fire and forget - best effort
            client
                .from('match_participants')
                .update({ status: 'left' })
                .eq('match_id', data.matchId)
                .eq('user_id', data.user.id)
                .then(() => {
                    if (dev) console.log('Left arena on unload');
                })
                .catch((err: unknown) => {
                    if (dev) console.error('Leave arena error:', err);
                });
            
            currentUserStatus = 'left';
            return;
        }

        // Normal leave flow
        console.log('Starting normal leave flow');
        const { error } = await client
            .from('match_participants')
            .update({ status: 'left' })
            .eq('match_id', data.matchId)
            .eq('user_id', data.user.id);

        console.log('Leave update result:', { error });

        if (error) {
            if (dev) console.error('Leave arena error:', error);
            return;
        }

        currentUserStatus = 'left';

        // Update local participants state
        const index = participants.findIndex((p) => p.user_id === data.user.id);
        if (index !== -1) {
            participants[index] = {
                ...participants[index],
                status: 'left',
            };
            participants = [...participants];
        }

        // Broadcast leave event
        await channel
            ?.send({
                type: 'broadcast',
                event: 'participant_left',
                payload: { user_id: data.user.id, status: 'left' },
            })
            .catch((err: unknown) => {
                if (dev) console.error('Leave broadcast failed:', err);
            });

        // Navigate to battle page
        console.log('Navigating to /battle');
        goto('/battle');
    }

    const allFinished = $derived(
        participants.length > 0 &&
            participants.every((p) => p.status === 'finished' || p.status === 'left')
    );

    const activeCompetitors = $derived(
        participants.filter((p) => p.status !== 'finished' && p.status !== 'left').length
    );

    $effect(() => {
        if (allFinished || activeCompetitors === 0) {
            if (dev) console.log('Match complete - redirecting to summary');
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
                        disabled={currentUserStatus === 'finished' || currentUserStatus === 'left' || isSubmitting}
                    >
                        {isSubmitting ? 'Testing...' : currentUserStatus === 'finished' ? 'Submitted' : 'Submit Solution'}
                    </button>
                    {#if showFailedTestsPopover}
                        <div class="test-failed-popover">
                           {failedTestsMessage}
                        </div>
                    {/if}
                    <button
                        class="leave-btn"
                        onclick={() => leaveArena()}
                        disabled={currentUserStatus === 'finished' || currentUserStatus === 'left'}
                    >
                        {currentUserStatus === 'left' ? 'Left Arena' : 'Leave Arena'}
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
    
    <div class="right-column">
        <section class="pane problem-description">
            <div class="toolbar">
                <span>Problem</span>
                <span class="difficulty-badge difficulty-{problemDifficulty?.toLowerCase()}">
                    {problemDifficulty}
                </span>
            </div>
            <div class="problem-body">
                <h2>{problemTitle}</h2>
                <div class="description-content">
                    {problemDescription}
                </div>
            </div>
        </section>
        <Leaderboard {participants} currentUserId={data.user.id} />
    </div>
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

    .right-column {
        display: flex;
        flex-direction: column;
        width: 400px;
        gap: 1rem;
    }

    .pane {
        display: flex;
        flex: 1;
        flex-direction: column;
        background: var(--bg-main);
    }

    .problem-description {
        flex: 0 0 auto;
        max-height: 50%;
        overflow: hidden;
    }

    .problem-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        font-size: 0.9rem;
        line-height: 1.6;
    }

    .problem-body h2 {
        margin: 0 0 16px 0;
        font-size: 1.2rem;
        color: var(--accent);
    }

    .description-content {
        white-space: pre-wrap;
        color: var(--fg-main, #e4e4e7);
    }

    .difficulty-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
        text-transform: uppercase;
    }

    .difficulty-easy {
        background: #10b981;
        color: white;
    }

    .difficulty-medium {
        background: #f59e0b;
        color: white;
    }

    .difficulty-hard {
        background: #ef4444;
        color: white;
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

    .leave-btn {
        background: var(--error, #e74c3c);
        color: white;
    }

    .leave-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .test-failed-popover {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        padding: 12px 16px;
        background: var(--error, #e74c3c);
        color: white;
        border-radius: 4px;
        font-size: 0.9rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease-out;
        z-index: 1000;
        white-space: nowrap;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .toolbar-actions {
        position: relative;
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
