<script lang="ts">
    import { onMount } from "svelte";
    import { baseUrl } from "$lib/api/api";
    import { issueStore } from "@/stores/issues.store";
    import Spinner from "$lib/components/ui/spinner/spinner.svelte";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import {
        MapPin,
        Calendar,
        User,
        ChevronLeft,
        ChevronRight,
        Search,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { user } from "@/stores/auth.store";

    onMount(() => {
        if ($issueStore.items.length === 0) {
            issueStore.refresh();
        }
    });

    function handleSearch(e: Event) {
        const target = e.target as HTMLInputElement;
        issueStore.setSearch(target.value);
    }

    function handleFilter(status: boolean | undefined) {
        issueStore.setSolved(status);
    }

    function togglePrivate() {
        issueStore.setPrivate($issueStore.privateIssue ? false : true);
    }
</script>

<div class="container mx-auto max-w-4xl p-6" dir="rtl">
    <header class="mb-8 text-right">
        <h1 class="text-3xl font-bold">آخر البلاغات</h1>
        <p class="text-muted-foreground">متابعة حالة المشاكل في منطقتك</p>
    </header>

    <div
        class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div class="relative w-full md:w-72">
            <Search
                class="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                placeholder="بحث في البلاغات..."
                class="pr-10"
                value={$issueStore.search}
                oninput={handleSearch}
            />
        </div>

        <div class="flex gap-2">
            {#if $user?.role === "ADMIN" || $user?.role === "MUNICIPAL"}
                <Button
                    variant={$issueStore.privateIssue === true
                        ? "default"
                        : "outline"}
                    size="sm"
                    onclick={() => togglePrivate()}>خاص</Button
                >
            {/if}
            <Button
                variant={$issueStore.solved === undefined
                    ? "default"
                    : "outline"}
                size="sm"
                onclick={() => handleFilter(undefined)}>الكل</Button
            >

            <Button
                variant={$issueStore.solved === true ? "default" : "outline"}
                size="sm"
                onclick={() => handleFilter(true)}>مكتمل</Button
            >
            <Button
                variant={$issueStore.solved === false ? "default" : "outline"}
                size="sm"
                onclick={() => handleFilter(false)}>قيد المعالجة</Button
            >
        </div>
    </div>

    {#if $issueStore.loading}
        <div class="flex h-64 items-center justify-center">
            <Spinner class="size-10" />
        </div>
    {:else if $issueStore.error}
        <div
            class="rounded-lg bg-destructive/10 p-4 text-center text-destructive"
        >
            {$issueStore.error}
        </div>
    {:else if $issueStore.items.length === 0}
        <div class="py-20 text-center text-muted-foreground">
            لا يوجد بلاغات تطابق بحثك حالياً
        </div>
    {:else}
        <div class="grid gap-6">
            {#each $issueStore.items as issue (issue.issuesId)}
                <Card.Root
                    onclick={() =>
                        goto(`/issue/selected?issuesId=${issue.issuesId}`)}
                    class="cursor-pointer overflow-hidden transition-colors hover:bg-accent/50"
                >
                    <div class="flex flex-col md:flex-row">
                        {#if issue.image}
                            <div class="w-full md:w-48 lg:w-64 shrink-0">
                                <img
                                    src={baseUrl + issue.image}
                                    alt="Issue"
                                    class="w-full aspect-square object-cover md:h-full md:rounded-2xl md:mx-2"
                                />
                            </div>
                        {/if}

                        <div class="flex w-full flex-col p-6">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex space-x-2">
                                    <Badge
                                        variant={issue.solved
                                            ? "default"
                                            : "secondary"}
                                    >
                                        {issue.solved
                                            ? "مكتمل"
                                            : "قيد المعالجة"}
                                    </Badge>
                                    {#if issue.privateIssue}
                                        <Badge variant="default">خاص</Badge>
                                    {/if}
                                </div>
                                <div
                                    class="flex items-center text-sm text-muted-foreground"
                                >
                                    <span class="ml-2"
                                        >{new Date(
                                            issue.date,
                                        ).toLocaleDateString("ar-EG", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}</span
                                    >
                                    <Calendar class="size-4" />
                                </div>
                            </div>

                            <p
                                class="text-lg mb-4 leading-relaxed line-clamp-2"
                            >
                                {issue.description}
                            </p>

                            <div
                                class="mt-auto flex flex-wrap gap-4 text-sm text-muted-foreground"
                            >
                                <div class="flex items-center">
                                    <MapPin class="size-4 ml-1 text-primary" />
                                    <span class="max-w-50 truncate"
                                        >{issue.location}</span
                                    >
                                </div>
                                <div class="flex items-center">
                                    <User class="size-4 ml-1" />
                                    <span
                                        >{issue.username ||
                                            "مستخدم مجهول"}</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </Card.Root>
            {/each}
        </div>

        <div class="mt-10 flex items-center justify-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onclick={() => issueStore.nextPage()}
                disabled={$issueStore.meta.page >= $issueStore.meta.totalPages}
            >
                <ChevronRight class="size-4" />
            </Button>

            <span class="text-sm font-medium">
                صفحة {$issueStore.meta.page} من {$issueStore.meta.totalPages}
            </span>

            <Button
                variant="outline"
                size="icon"
                onclick={() => issueStore.prevPage()}
                disabled={$issueStore.meta.page <= 1}
            >
                <ChevronLeft class="size-4" />
            </Button>
        </div>
    {/if}
</div>
