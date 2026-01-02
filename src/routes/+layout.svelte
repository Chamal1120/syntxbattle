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
    import { onNavigate } from '$app/navigation';
    import "./app.css";

    let { children, data } = $props();

    onNavigate((navigation) => {
    // Check if the browser supports the View Transition API
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<CustomCursor />

{#if $page.url.pathname !== '/'}
    <Navbar user={data.user} />
{/if}

<main class="body-content">
    {@render children()}
</main>

