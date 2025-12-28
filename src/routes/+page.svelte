<script lang="ts">
   
    // Stores the code and the handler
    let code = $state("No folder is connected yet!");
    let directoryHandle: FileSystemDirectoryHandle;


    async function connectFolder() {
        try {
            directoryHandle = await window.showDirectoryPicker();

            setInterval( async() => {
                try {
                    const fileHandle = await directoryHandle.getFileHandle("solution.ts");
                    const file = await fileHandle.getFile();
                    code = await file.text();
                } catch(e) {
                    code = "make sure 'solution.ts' exisits in the selected folder!";
                }
            }, 1000);
        } catch (err) {
            console.error("User cancelled or browser blocked the picker", err);
        }
    }

</script>

<h1>BitSip v0.1.0-alpha</h1>

<button onclick={connectFolder}> Connect Local Folder </button>

<div>
    <h3 class="code-container">Live Preview</h3>
    <pre><code>{code}</code></pre>
</div>

<style>
    .code-container { 
    background: #1e1e1e;
    color #d4d4d4;
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 8px;
    }
    pre { white-space: pre-wrap }
</style>

