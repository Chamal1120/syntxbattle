<script lang="ts">
    /**
     * Battle Arena - WebContainer environmet for the coding battle
     * @description
     * Code editor and runner component for competitive coding battles.
     * Initializes a WebContainer, provides a two-pane IDE layout,
     * and executes code in a sandboxed Node.js environment.
     */
    import { onMount } from "svelte";
    import { WebContainer } from "@webcontainer/api";
    import { supabase } from "$lib/supabaseClient";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let container = $state<WebContainer | null>(null);
    let code = $state("");
    let output = $state("Initializing battle arena...");
    let isRunning = $state(false);
    let problemTitle = $state("");

    onMount(async () => {
        // Fetch match and problem data
        const { data: match, error: matchError } = await supabase
            .from("matches")
            .select("*, problems(*)")
            .eq("id", data.matchId)
            .single();

        if (matchError) {
            console.error("Error fetching match:", matchError.message);
            output = "Error loading match data";
            return;
        }

        problemTitle = match.problems.title;
        code = match.problems.starter_code || "// Write your solution here\n";

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
            output = "🚀 ENGINE ONLINE - Ready to battle!";
        } catch (e) {
            output = "Boot failed!";
            console.error(e);
        }
    });

    /**
     * Runs the code inside the WebContainer.
     */
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
</script>

<main class="ide">
    <section class="pane editor">
        <div class="toolbar">
            <span class="filename">{problemTitle || 'solution.js'}</span>
            <button onclick={runCode} disabled={!container || isRunning}>
                {isRunning ? "Running..." : "Run"}
            </button>
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
