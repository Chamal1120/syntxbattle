<script lang="ts">
    /**
     * Battle Arena - WebContainer-based coding battle
     *
     * @description
     * Code editor and runner component for competitive coding battles.
     * Initializes a WebContainer, provides a two-pane IDE layout,
     * executes code in a sandboxed Node.js environment, and displays
     * real-time leaderboard of participants.
     *
     * @author Chamal Mallawaarachchi
     */
    import { onMount } from "svelte";
    import { dev } from "$app/environment";
    import { goto } from "$app/navigation";
    import { WebContainer } from "@webcontainer/api";
    import { supabase } from "$lib/supabaseClient";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let container = $state<WebContainer | null>(null);
    let code = $state("");
    let output = $state("Initializing battle arena...");
    let isRunning = $state(false);
    let problemTitle = $state("");
    let matchStartTime = $state<Date | null>(null);
    let participants = $state<any[]>([]);
    let currentUserStatus = $state("competing");
    let channel: any;

    $inspect("participants:", participants);

    onMount(async () => {
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*, problems(*)")
            .eq("id", data.matchId)
            .single();

        if (matchError) {
            if (dev) console.error("Error fetching match:", matchError.message);
            output = "Error loading match data";
            return;
        }

        problemTitle = match.problems.title;
        code = match.problems.starter_code || "// Write your solution here\n";
        matchStartTime = match.started_at
            ? new Date(match.started_at)
            : new Date();

        // Fetch participants with status
        const { data: initialParts, error: partsError } = await supabase
            .from("match_participants")
            .select("user_id, status, finished_at, completion_time_ms")
            .eq("match_id", data.matchId);

        if (partsError) {
            if (dev)
                console.error(
                    "Error fetching participants:",
                    partsError.message,
                );
        }

        // Fetch usernames from profiles
        const userIds = (initialParts || []).map(p => p.user_id);
        const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

        const usernameMap = new Map(
            (profilesData || []).map(p => [p.id, p.username])
        );

        participants = (initialParts || []).map(p => ({
            ...p,
            username: usernameMap.get(p.user_id) || 'Unknown'
        }));

        // Setup realtime for leaderboard updates
        channel = supabase
            .channel(`arena-${data.matchId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "match_participants",
                    filter: `match_id=eq.${data.matchId}`,
                },
                (payload) => {
                    if (dev) console.log("Participant updated:", payload);
                    const index = participants.findIndex(
                        (p) => p.user_id === payload.new.user_id,
                    );
                    if (index !== -1) {
                        participants[index] = payload.new;
                        participants = [...participants];
                    }
                },
            )
            .on("broadcast", { event: "participant_finished" }, ({ payload }) => {
                if (dev) console.log("Broadcast: participant finished", payload);
                const index = participants.findIndex(
                    (p) => p.user_id === payload.user_id
                );
                if (index !== -1) {
                    participants[index] = {
                        ...participants[index],
                        status: payload.status,
                        finished_at: payload.finished_at,
                        completion_time_ms: payload.completion_time_ms
                    };
                    participants = [...participants];
                }
            })
            .subscribe();

        // Boot WebContainer
        if (!window.crossOriginIsolated) {
            output = "Error: Isolation Headers Missing";
            return;
        }

        try {
            const win = window as any;

            if (!win.__wc) {
                output = "Booting WebContainer...";
                win.__wc = await WebContainer.boot();
            }

            container = win.__wc as WebContainer;
            output = "ENGINE ONLINE - Ready to battle!";
        } catch (e) {
            output = "Boot failed!";
            if (dev) console.error(e);
        }
    });

    async function runCode(): Promise<void> {
        if (!container) return;
        isRunning = true;
        output = "";

        try {
            await container.fs.writeFile("solution.js", code);
            const process = await container.spawn("node", ["solution.js"]);
            process.output.pipeTo(
                new WritableStream({
                    write(data) {
                        output += data.replace(/\x1B\[[0-9;]*m/g, "");
                    },
                }),
            );

            await process.exit;
        } catch (err: any) {
            output += `\nError: ${err.message}`;
        } finally {
            isRunning = false;
        }
    }

    /**
     * Submit solution - marks participant as finished and calculates completion time
     */
    async function submitSolution() {
        if (dev) console.log("Submit clicked, user:", data.user?.id);
        if (!matchStartTime) {
            if (dev) console.error("No match start time");
            return;
        }

        // Check if participant exists
        const { data: existingParticipant, error: checkError } = await supabase
            .from("match_participants")
            .select("*")
            .eq("match_id", data.matchId)
            .eq("user_id", data.user.id)
            .single();

        if (checkError) {
            if (dev) console.error("Participant not found:", checkError);
            return;
        }

        if (dev) console.log("Found participant:", existingParticipant);

        const finishedAt = new Date();
        const completionTimeMs =
            finishedAt.getTime() - matchStartTime.getTime();

        if (dev) console.log("Updating participant:", {
            match_id: data.matchId,
            user_id: data.user.id,
            completionTimeMs
        });

        const { data: result, error } = await supabase
            .from("match_participants")
            .update({
                status: "finished",
                finished_at: finishedAt.toISOString(),
                completion_time_ms: completionTimeMs,
            })
            .eq("match_id", data.matchId)
            .eq("user_id", data.user.id)
            .select();

        if (error) {
            if (dev) console.error("Submission error:", error);
        } else {
            if (dev) console.log("Submission complete:", result);
            currentUserStatus = "finished";
            
            // Manually update local state
            const index = participants.findIndex(p => p.user_id === data.user.id);
            if (index !== -1) {
                participants[index] = {
                    ...participants[index],
                    status: "finished",
                    finished_at: finishedAt.toISOString(),
                    completion_time_ms: completionTimeMs
                };
                participants = [...participants];
            }

            // Broadcast to other participants
            channel.send({
                type: "broadcast",
                event: "participant_finished",
                payload: {
                    user_id: data.user.id,
                    status: "finished",
                    finished_at: finishedAt.toISOString(),
                    completion_time_ms: completionTimeMs
                }
            }).catch((err: unknown) => { if (dev) console.error("Broadcast failed:", err) });
        }
    }

    function formatTime(ms: number | null): string {
        if (!ms) return "Competing...";
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    const sortedParticipants = $derived(
        [...participants].sort((a, b) => {
            if (a.status === "finished" && b.status === "finished") {
                return (
                    (a.completion_time_ms || 0) - (b.completion_time_ms || 0)
                );
            }
            if (a.status === "finished") return -1;
            if (b.status === "finished") return 1;
            return 0;
        }),
    );

    const allFinished = $derived(
        participants.length > 0 && 
        participants.every(p => p.status === "finished")
    );

    $effect(() => {
        if (allFinished) {
            if (dev) console.log("All participants finished - redirecting to summary");
            setTimeout(() => {
                goto(`/battle/summary/${data.matchId}`);
            }, 2000);
        }
    });
</script>

<div class="arena-layout">

    <main class="ide">
        <section class="pane editor">
            <div class="toolbar">
                <span class="filename">{problemTitle || "solution.js"}</span>
                <div class="toolbar-actions">
                    <button
                        onclick={runCode}
                        disabled={!container || isRunning}
                    >
                        {isRunning ? "Running..." : "Run"}
                    </button>
                    <button
                        class="submit-btn"
                        onclick={submitSolution}
                        disabled={currentUserStatus === "finished"}
                    >
                        {currentUserStatus === "finished"
                            ? "Submitted"
                            : "Submit Solution"}
                    </button>
                </div>
            </div>
            <textarea bind:value={code} spellcheck="false"></textarea>
        </section>

        <section class="pane terminal">
            <div class="toolbar">Output</div>
            <div class="console-body">
                <pre><code>{output}</code></pre>
            </div>
        </section>
    </main>
    <aside class="leaderboard">
        <h3>Leaderboard</h3>
        <table>
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Participant</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                {#each sortedParticipants as participant, index}
                    <tr
                        class={participant.user_id === data.user.id
                            ? "current-user"
                            : ""}
                    >
                        <td>{index + 1}</td>
                        <td>{participant.username || 'Unknown'}</td>
                        <td>{formatTime(participant.completion_time_ms)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </aside>
</div>

<style>
    .arena-layout {
        display: flex;
        gap: 1rem;
        height: 100vh;
        padding: 1rem;
    }

    .leaderboard {
        width: 250px;
        background: var(--bg-inactive);
        border-radius: 8px;
        padding: 1rem;
        overflow-y: auto;
    }

    .leaderboard h3 {
        margin: 0 0 1rem 0;
        color: var(--accent);
    }

    .leaderboard table {
        width: 100%;
        border-collapse: collapse;
    }

    .leaderboard th {
        text-align: left;
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-dim);
        color: var(--comment);
        font-size: 0.8rem;
    }

    .leaderboard td {
        padding: 0.5rem;
        border-bottom: 1px solid var(--border-dim);
    }

    .leaderboard tr.current-user {
        background: rgba(180, 212, 207, 0.1);
    }

    .toolbar-actions {
        display: flex;
        gap: 0.5rem;
    }

    .submit-btn {
        background: var(--success);
        color: white;
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .ide {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2px;
    }

    .pane {
        display: grid;
        grid-template-rows: auto 1fr;
        background: var(--bg-main);
    }

    .toolbar {
        background: var(--bg-inactive);
        padding: 8px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-dim);
        font-size: 0.8rem;
        color: var(--comment);
    }

    textarea {
        background: transparent;
        color: var(--fg-main);
        font-family: "Fira Code", monospace;
        font-size: 1rem;
        padding: 20px;
        border: none;
        resize: none;
        outline: none;
        caret-color: var(--accent);
    }

    textarea::selection {
        background: var(--selection);
    }

    .console-body {
        padding: 20px;
        overflow-y: auto;
        background: var(--bg-main);
    }

    code {
        color: var(--accent);
        font-family: "Fira Code", monospace;
        white-space: pre-wrap;
    }
</style>
