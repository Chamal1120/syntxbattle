<script lang="ts">
    /**
     * Bitsip coding Battle platform
     * * @description
     * Code editor and runner component
     * This component initializes a WebContainer, provides a two-pane
     * IDE layout, and executes code in a sandboxed Node.js environment.
     * * @author Chamal Mallawaarachchi
     */
    import { onMount } from "svelte";
    import { WebContainer } from "@webcontainer/api";

    let container = $state<WebContainer | null>(null);
    let code = $state(
        `function multiply(a, b) {\n  return a * b;\n}\n\nconsole.log(multiply(3, 5));`,
    );
    let output = $state("initializing...");
    let isRunning = $state(false);

    onMount(async () => {
        if (!window.crossOriginIsolated) {
            output = "Error: Isolation Headers Missing";
            return;
        }

        try {
            const win = window as any;

            if (!win.__wc) {
                win.__wc = await WebContainer.boot();
            }

            container = win.__wc as WebContainer;
            output = "ENGINE ONLINE";
        } catch (e) {
            output = "Boot failed!";
        }
    });

    /**
     * Runs the code inside the Webcontainer.
     * @description
     * This function peforms following,
     * 1. Writes the current `code` state to a `index.js` file inside the WebContainer.
     * 2. Spawns a node.js process and execute the `index.js`.
     * 3. Takes the output and writes to `output`.
     * 4. Updates the `isRunning` state.
     */
    async function runCode(): Promise<void> {
        if (!container) return;
        isRunning = true;
        output = "";

        try {
            await container.fs.writeFile("index.js", code);
            const process = await container.spawn("node", ["index.js"]);
            process.output.pipeTo(
                new WritableStream({
                    write(data) {
                        // Clean ANSI colors and update state
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

<!-- Renders the code editor UI -->
<!-- Refer globals css @app.css for styles  -->
<main class="ide">
    <section class="pane editor">
        <div class="toolbar">
            <span class="filename">solution.js</span>
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
