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
    //import { WebContainer } from '@webcontainer/api';
    import type { PageData } from './$types';
    import Leaderboard from '$lib/components/Leaderboard.svelte';
    import LeaderboardMobile from '$lib/components/LeaderboardMobile.svelte';
    import CodeEditor from '$lib/components/CodeEditor.svelte';
    import RiQuestionLine from '~icons/ri/question-line';
    import RiFileChartLine from '~icons/ri/file-chart-line';
    import RiVimeoFill from '~icons/ri/vimeo-fill';
    import RiArrowRightDoubleFill from '~icons/ri/arrow-right-double-fill';
    import RiArrowRightUpBoxFill from '~icons/ri/arrow-right-up-box-fill';
    import RiLogoutBoxFill from '~icons/ri/logout-box-fill';

    let { data }: { data: PageData } = $props();

    let container = $state<import('@webcontainer/api').WebContainer | null>(null);
    let code = $state('');
    let output = $state('Initializing battle arena...');
    let isRunning = $state(false);
    let isSubmitting = $state(false);
    let problemTitle = $state('');
    let problemDescription = $state('');
    let problemDifficulty = $state('');
    let matchStartTime = $state<Date | null>(null);
    let participants = $state<any[]>([]);
    let currentUserStatus = $state('competing');
    let isInitializing = $state(true);
    let currentLanguage = $state('javascript');
    let showFailedTestsPopover = $state(false);
    let failedTestsMessage = $state('');
    let channel: any;
    let supabase: any;
    let vimMode = $state(false);
    let showProblemPopup = $state(false);
    let showLeaderboardPopup = $state(false);

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

    beforeNavigate(async (navigation) => {
        const isSamePage = navigation.to?.route?.id === navigation.from?.route?.id;
        const isRefresh = !navigation.to || isSamePage;

        console.log(
            '[Arena] beforeNavigate - isRefresh:',
            isRefresh,
            'currentUserStatus:',
            currentUserStatus
        );
        console.log('[Arena] navigation.to?.route?.id:', navigation.to?.route?.id);
        console.log('[Arena] navigation.from?.route?.id:', navigation.from?.route?.id);

        if (currentUserStatus !== 'finished' && currentUserStatus !== 'left' && !isRefresh) {
            console.log('[Arena] Marking user as left');
            const client = await getSupabase();
            if (client) {
                await client
                    .from('match_participants')
                    .update({ status: 'left' })
                    .eq('match_id', data.matchId)
                    .eq('user_id', data.user.id);
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

            code = data.problemLanguage?.starter_code || '// Write your solution here\n';

            matchStartTime = match.started_at ? new Date(match.started_at) : new Date();

            const currentParticipant = participants.find((p) => p.user_id === data.user.id);
            console.log('[Arena] Current participant:', currentParticipant);
            console.log('[Arena] Total participants:', participants.length);

            if (currentParticipant) {
                currentUserStatus = currentParticipant.status || 'competing';
                console.log('[Arena] Current user status from DB:', currentUserStatus);

                if (currentUserStatus === 'left' && currentParticipant.status !== 'finished') {
                    console.log('[Arena] Resetting status from left to competing');
                    currentUserStatus = 'competing';
                    const client = await getSupabase();
                    if (client) {
                        await client
                            .from('match_participants')
                            .update({ status: 'competing' })
                            .eq('match_id', data.matchId)
                            .eq('user_id', data.user.id);

                        const index = participants.findIndex((p) => p.user_id === data.user.id);
                        if (index !== -1) {
                            participants[index] = {
                                ...participants[index],
                                status: 'competing',
                            };
                            participants = [...participants];
                        }
                    }
                }
            } else {
                console.log('[Arena] Current user not in participants list - adding them');
                // User accessed arena directly or refreshed - add them to match
                const client = await getSupabase();
                if (client) {
                    const { error: joinError } = await client.from('match_participants').insert([
                        {
                            match_id: data.matchId,
                            user_id: data.user.id,
                            status: 'competing',
                        },
                    ]);

                    if (joinError && joinError.code !== '23505') {
                        // 23505 is duplicate key - means already exists
                        console.error('[Arena] Failed to join match:', joinError);
                    } else {
                        // Add to local participants list
                        participants = [
                            ...participants,
                            {
                                user_id: data.user.id,
                                status: 'competing',
                                finished_at: null,
                                completion_time_ms: null,
                                username: data.user.user_metadata?.username || 'You',
                            },
                        ];
                        currentUserStatus = 'competing';
                    }
                }
            }

            // Initialization complete
            isInitializing = false;

            if (!window.crossOriginIsolated) {
                output = 'Error: Isolation Headers Missing. Please refresh the page.';
                if (dev) console.error('crossOriginIsolated is false - headers not applied');
            } else {
                try {
                    const win = window as any;

                    if (!win.__wc) {
                        output = 'Booting WebContainer...';
                        if (document.hidden) {
                            output = 'Waiting for tab to be active...';
                            await new Promise((resolve) => {
                                const checkActive = () => {
                                    if (!document.hidden) {
                                        document.removeEventListener(
                                            'visibilitychange',
                                            checkActive
                                        );
                                        resolve(undefined);
                                    }
                                };
                                document.addEventListener('visibilitychange', checkActive);
                                // Timeout after 5 seconds
                                setTimeout(() => {
                                    document.removeEventListener('visibilitychange', checkActive);
                                    resolve(undefined);
                                }, 5000);
                            });
                        }
                        output = 'Booting WebContainer...';
                        const { WebContainer } = await import('@webcontainer/api');
                        win.__wc = await WebContainer.boot();
                    }

                    container = win.__wc;
                    output = 'Webcontainer is Ready!';
                } catch (e) {
                    output = 'Boot failed! Please refresh the page.';
                    if (dev) console.error('WebContainer boot error:', e);
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
                        const index = participants.findIndex(
                            (p) => p.user_id === payload.new.user_id
                        );
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
        // NOTE: Don't mark as 'left' on beforeunload as it fires on refresh too
        // Only handle leaving on actual navigation via beforeNavigate hook
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (currentUserStatus !== 'finished' && currentUserStatus !== 'left') {
                // Just show a warning, don't update status
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
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
                completion_time_ms: result.completion_time_ms,
            });

            if (result.success) {
                currentUserStatus = 'finished';
                output += 'All tests passed! Congratulations!\n';

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

                // Don't redirect immediately - wait for all players to finish
                // The $effect below will handle redirect when everyone is done
                output += 'Waiting for other players to finish...\n';
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
        console.log(
            'leaveArena called, isUnload:',
            isUnload,
            'currentUserStatus:',
            currentUserStatus
        );

        const client = await getSupabase();
        if (!client) {
            console.error('No Supabase client');
            return;
        }

        // For page unload, can't rely on async operations completing
        // for now, just update the status and let it fire
        if (isUnload) {
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

        // Normal leave
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

    const finishedCount = $derived(participants.filter((p) => p.status === 'finished').length);

    $effect(() => {
        // Stop redirecting if still initializing
        if (isInitializing) {
            return;
        }

        // Don't redirect if participants list is empty - it's still loading
        if (participants.length === 0) {
            if (dev) console.log('[Arena] Participants list empty, not redirecting');
            return;
        }

        if (dev) {
            console.log('[Arena] Status check:', {
                totalParticipants: participants.length,
                activeCompetitors,
                finishedCount,
                allFinished,
                participantStatuses: participants.map((p) => ({
                    user_id: p.user_id,
                    status: p.status,
                })),
            });
        }

        // Redirect when ALL participants are done (finished/left)
        if (allFinished) {
            if (dev) console.log('[Arena] All participants finished/left - redirecting to summary');
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
                    <button
                        class="vim-toggle"
                        onclick={toggleVim}
                        class:active={vimMode}
                        aria-label="Toggle VIM mode"
                    >
                        <RiVimeoFill />
                    </button>
                    <button
                        onclick={runCode}
                        disabled={!container || isRunning}
                        aria-label="Run code"
                    >
                        <RiArrowRightDoubleFill />
                    </button>
                    <button
                        class="submit-btn"
                        onclick={submitSolution}
                        disabled={currentUserStatus === 'finished' ||
                            currentUserStatus === 'left' ||
                            isSubmitting}
                        aria-label="Submit solution"
                    >
                        <RiArrowRightUpBoxFill />
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
                        aria-label="Leave arena"
                    >
                        <RiLogoutBoxFill />
                    </button>
                </div>
            </div>
            <div class="code-editor-wrapper">
                <CodeEditor bind:value={code} bind:vimMode />
            </div>
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

{#if showProblemPopup}
    <div class="problem-popup">
        <button
            class="popover-overlay"
            onclick={() => (showProblemPopup = false)}
            aria-label="Close problem description"
        ></button>
        <div class="popover-content">
            <section class="pane problem-description">
                <div class="toolbar">
                    <div>
                        <span>Problem</span>
                        <span
                            class="difficulty-badge difficulty-{problemDifficulty?.toLowerCase()}"
                        >
                            {problemDifficulty}
                        </span>
                    </div>
                    <button class="close-btn" onclick={() => (showProblemPopup = false)}>✕</button>
                </div>
                <div class="problem-body">
                    <h2>{problemTitle}</h2>
                    <div class="description-content">
                        {problemDescription}
                    </div>
                </div>
            </section>
        </div>
    </div>
{/if}

<div class="mobile-action-buttons">
    <button class="mobile-action-btn" onclick={() => (showProblemPopup = true)}>
        <RiQuestionLine />
    </button>
    <button class="mobile-action-btn" onclick={() => (showLeaderboardPopup = true)}>
        <RiFileChartLine />
    </button>
</div>

<LeaderboardMobile
    {participants}
    currentUserId={data.user.id}
    show={showLeaderboardPopup}
    on:close={() => (showLeaderboardPopup = false)}
/>

<style>
    :global(main.body-content) {
        align-self: center;
        width: 100%;
        max-inline-size: 1400px;
    }

    .ide {
        box-sizing: border-box;
        display: flex;
        width: 100%;
        height: calc(100vh - 8rem);
        padding: 0 1rem 1rem 1rem;
        gap: 1rem;
    }

    .editor-column {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
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
    .pane.editor {
        min-width: 0;
        overflow-x: auto;
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
        color: var(--accent);
        font-size: 1.2rem;
    }

    .description-content {
        color: var(--fg-main, #e4e4e7);
        white-space: pre-wrap;
    }

    .difficulty-badge {
        padding: 2px 8px;
        border-radius: 0;
        font-weight: bold;
        font-size: 0.75rem;
        text-transform: uppercase;
    }

    .difficulty-easy {
        background: var(--accent-bright-alpha-10);
        color: var(--accent-bright);
    }

    .difficulty-medium {
        background: color-mix(in srgb, var(--warning) 15%, transparent);
        color: var(--warning);
    }

    .difficulty-hard {
        background: color-mix(in srgb, var(--error) 15%, transparent);
        color: var(--error);
    }

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        gap: 1rem;
        border-bottom: 1px solid var(--border-dim);
        background: var(--bg-inactive);
        color: var(--comment);
        font-size: 0.8rem;
    }

    .toolbar-actions {
        display: flex;
        gap: 0.5rem;
    }

    .filename {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 10px;
        border: 2px solid var(--border-hover);
        background: var(--accent);
        color: var(--bg-main);
        font-weight: bold;
        cursor: pointer;
        transition: filter 0.1s;

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
        z-index: 1000;
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        padding: 12px 16px;
        border-radius: 4px;
        background: var(--error, #e74c3c);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        color: white;
        font-size: 0.9rem;
        white-space: nowrap;
        animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
        from {
            transform: translateY(-10px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .toolbar-actions {
        position: relative;
    }

    .vim-toggle {
        padding: 4px 8px;
        background: var(--bg-main);
        color: var(--comment);
        cursor: pointer;
        transition: all 0.2s;
    }

    .vim-toggle:hover {
        color: var(--accent);
    }

    .vim-toggle.active {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--bg-main);
    }

    .code-editor-wrapper {
        flex: 1;
        min-width: 0;
        overflow: auto;
    }

    .pane.terminal {
        flex: none;
        height: 200px;
    }

    @media (max-width: 768px) {
        .right-column {
            display: none;
        }
    }

    .problem-popup .popover-overlay {
        z-index: 1000;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        padding: 0;
        border: none;
        background: rgba(0, 0, 0, 0.5);
        cursor: pointer;
    }

    .problem-popup .popover-content {
        display: flex;
        z-index: 1001;
        position: fixed;
        top: 50%;
        left: 50%;
        width: 90vw;
        max-height: 70vh;
        transform: translate(-50%, -50%);
    }

    .problem-popup .popover-content .pane {
        width: 100%;
        border: 2px solid var(--border-default);
    }

    .mobile-action-buttons {
        display: none;
    }

    @media (max-width: 768px) {
        .mobile-action-buttons {
            display: flex;
            z-index: 50;
            position: fixed;
            right: 1rem;
            bottom: 1rem;
            gap: 0.5rem;
        }
    }

    .mobile-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        padding: 0;
        border: 2px solid var(--accent);
        border-radius: 50%;
        background: var(--bg-main);
        color: var(--accent);
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .mobile-action-btn:hover {
        background: var(--accent);
        color: var(--bg-main);
    }

    .close-btn {
        padding: 0.25rem 0.5rem;
        border: none;
        background: transparent;
        color: var(--comment);
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
        transition: color 0.2s ease;
    }

    .close-btn:hover {
        color: var(--accent);
    }
</style>
