<script lang="ts">
    /**
     * Syntxbattle - coding Battle platform - Root Layout
     * * @description
     * This component lays the root layout and styles.
     * * @author: Chamal Mallawaarachchi
     */
    import favicon from "$lib/assets/favicon.svg";
    import Navbar from "$lib/components/Navbar.svelte";
    import "./app.css";

    let { children, data } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<Navbar user={data.user} />
{@render children()}
