<script lang="ts">
    /**
     * Syntxbattle - coding Battle platform - Root Layout
     * * @description
     * This component lays the root layout and styles.
     * * @author: Chamal Mallawaarachchi
     */
    import { page } from "$app/stores";
    import favicon from "$lib/assets/favicon.svg";
    import Navbar from "$lib/components/Navbar.svelte";
    import CustomCursor from "$lib/components/CustomCursor.svelte";
    import "./app.css";

    let { children, data } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<CustomCursor />

{#if $page.url.pathname !== '/'}
    <Navbar user={data.user} />
{/if}
{@render children()}
