<script lang="ts">
    import "./layout.css";
    import favicon from "$lib/assets/favicon.svg";
    import Navbar from "@/lib/blocks/Navbar.svelte";
    import { page } from "$app/state";
    import { user } from "@/stores/auth.store";
    import { goto } from "$app/navigation";

    let { children } = $props();

    let currentPath = $derived(page.url.pathname);

    $effect(() => {
        if ($user?.role !== "ADMIN" && currentPath.includes("admin")) goto("/");
    });

    $effect(() => {
        const dest = currentPath;
        if (!$user && dest !== "/" && !dest.includes("auth")) {
            goto(`/auth/login?goto=${dest}`);
        }
    });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<main dir="rtl">
    {#if !page.url.pathname.includes("auth")}
        <Navbar />
        <div class="mt-20">
            {@render children()}
        </div>
    {:else}
        {@render children()}
    {/if}
</main>
