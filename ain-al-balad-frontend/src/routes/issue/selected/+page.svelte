<script lang="ts">
    import { page } from "$app/state";
    import { user } from "@/stores/auth.store";
    import { issueStore } from "@/stores/issues.store";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import {
        MapPin,
        Calendar,
        User,
        Send,
        CheckCircle2,
        Clock,
    } from "lucide-svelte";
    import { baseUrl, default as api } from "@/lib/api/api";
    import Spinner from "@/lib/components/ui/spinner/spinner.svelte";
    import { onMount } from "svelte";
    import { ThumbsUp } from "lucide-svelte";

    let confirmCount = $state(0);
    let userConfirmed = $state(false);
    let confirmLoading = $state(false);

    async function fetchReactions() {
        if (!issuesId) return;
        try {
            const res = await api.get(`/issues/${issuesId}/reactions`);
            confirmCount = res.data.total;
            userConfirmed = res.data.userConfirmed;
        } catch {}
    }

    async function toggleConfirm() {
        if (!issuesId) return;
        confirmLoading = true;
        try {
            const res = await api.post(`/issues/${issuesId}/react`);
            userConfirmed = res.data.confirmed;
            confirmCount += userConfirmed ? 1 : -1;
        } catch {
            alert("حدث خطأ");
        } finally {
            confirmLoading = false;
        }
    }
    import Button from "@/lib/components/ui/button/button.svelte";

    const issuesId = page.url.searchParams.get("issuesId");

    let issue = $state(issueStore.getById(Number(issuesId)));
    let comments = $state<any[]>([]);
    let commentText = $state("");
    let loadingComments = $state(true);
    let postingComment = $state(false);

    async function fetchComments() {
        if (!issuesId) return;
        try {
            const res = await api.get(`/issues/${issuesId}/comments`);
            comments = res.data.data;
        } catch (err) {
            console.error("Failed to load comments", err);
        } finally {
            loadingComments = false;
        }
    }

    async function handlePostComment() {
        if (!commentText.trim() || !issuesId) return;
        postingComment = true;
        try {
            await api.post(`/issues/${issuesId}/comments`, {
                content: commentText,
            });
            commentText = "";
            await fetchComments();
        } catch (err) {
            alert("حدث خطأ أثناء إضافة التعليق");
        } finally {
            postingComment = false;
        }
    }

    async function toggleSolve() {
        if (!issue) return;
        try {
            const newStatus = !issue.solved;
            await api.patch(`/issues/${issuesId}`, { solved: newStatus });
            issue.solved = newStatus;
            await issueStore.refresh();
        } catch (err) {
            alert("فشل تحديث حالة البلاغ");
        }
    }

    onMount(async () => {
        if (!issuesId) return;
        if (!issue) {
            await issueStore.refresh();
            issue = issueStore.getById(Number(issuesId));
        }
        await fetchComments();
        await fetchReactions();
    });
</script>

<div class="container mx-auto max-w-5xl p-4 md:p-6" dir="rtl">
    {#if issue}
        <div class="overflow-hidden flex flex-col md:flex-row min-h-112 mb-8">
            {#if issue.image}
                <div class="w-full md:w-1/2 flex items-center justify-center">
                    <img
                        src={baseUrl + issue.image}
                        alt="Issue"
                        class="max-w-full max-h-130 object-contain rounded-2xl"
                    />
                </div>
            {/if}

            <div class="flex flex-1 flex-col p-6 md:p-8">
                <div class="flex items-start justify-between mb-6">
                    {#if $user?.role === "ADMIN" || $user?.role === "MUNICIPAL"}
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={toggleSolve}
                            class="gap-2 border-primary/20 hover:bg-primary/5 text-primary rounded-full"
                        >
                            <CheckCircle2 class="size-4" />
                            {issue?.solved
                                ? "إعادة فتح البلاغ"
                                : "تحديد كمكتمل"}
                        </Button>
                    {:else}
                        <div
                            class="transition-transform active:scale-95 disabled:cursor-default"
                        >
                            <Badge
                                variant={issue.solved ? "default" : "secondary"}
                                class="px-4 py-1.5 rounded-full {issue.solved
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : ''}"
                            >
                                {issue.solved ? "مكتمل" : "قيد المعالجة"}
                            </Badge>
                        </div>
                    {/if}

                    <!-- زر تأكيد وجود المشكلة -->
                    {#if $user?.role === "USER" && !issue.solved}
                        <button
                            onclick={toggleConfirm}
                            disabled={confirmLoading}
                            class="flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-sm font-medium
                                {userConfirmed
                                    ? 'bg-primary text-white border-primary'
                                    : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'}"
                        >
                            <ThumbsUp class="size-4" />
                            أؤكد وجود هذه المشكلة
                            {#if confirmCount > 0}
                                <span class="bg-white/20 px-2 py-0.5 rounded-full text-xs">{confirmCount}</span>
                            {/if}
                        </button>
                    {:else if confirmCount > 0}
                        <div class="flex items-center gap-1 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                            <ThumbsUp class="size-4" />
                            <span>{confirmCount} شخص يؤكد هذه المشكلة</span>
                        </div>
                    {/if}

                    <div
                        class="flex items-center text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full"
                    >
                        <Calendar class="size-3.5 ml-2" />
                        <span
                            >{new Date(issue.date).toLocaleDateString(
                                "ar-EG",
                            )}</span
                        >
                    </div>
                </div>

                <h2 class="text-xl font-bold text-slate-800 mb-4">
                    وصف البلاغ
                </h2>
                <p class="text-lg leading-relaxed text-slate-600 mb-8">
                    {issue.description}
                </p>

                <div
                    class="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100"
                >
                    <div class="flex items-center text-sm">
                        <MapPin class="size-5 ml-2 text-primary shrink-0" />
                        {#if issue.location.includes("http")}
                            <a
                                href={issue.location}
                                target="_blank"
                                class="text-blue-600 font-bold hover:underline truncate"
                            >
                                موقع البلاغ على الخريطة
                            </a>
                        {:else}
                            <a
                                href={"https://www.google.com/maps/search/?api=1&query=" +
                                    issue.location}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-blue-600 font-bold hover:underline truncate"
                            >
                                {issue.location}
                            </a>
                        {/if}
                    </div>
                    <div class="flex items-center text-sm text-slate-500">
                        <User class="size-5 ml-2 shrink-0" />
                        <span
                            >مقدم البلاغ: <b class="text-slate-700"
                                >{issue.username || "مستخدم مجهول"}</b
                            ></span
                        >
                    </div>
                </div>
            </div>
        </div>

        <div class=" p-6 md:p-8 max-w-3xl mx-auto">
            {#if issue.solved}
                <div
                    class="flex items-center gap-3 bg-green-50 border border-green-100 p-4 rounded-2xl mb-8 text-green-700 animate-in fade-in zoom-in-95 duration-300"
                >
                    <CheckCircle2 class="size-6 shrink-0" />
                    <div>
                        <p class="font-bold text-sm">تم حل هذا البلاغ</p>
                        <p class="text-xs opacity-90">
                            لقد تم إغلاق النقاش لهذا البلاغ من قبل الإدارة.
                        </p>
                    </div>
                </div>
            {/if}

            <h3 class="text-lg font-bold mb-8 flex items-center gap-2">
                التعليقات
                <span class="text-sm font-normal text-slate-400"
                    >({comments.length})</span
                >
            </h3>

            <div class="flex gap-3 mb-10">
                <input
                    readonly={issue.solved}
                    type="text"
                    bind:value={commentText}
                    placeholder={issue.solved
                        ? "التعليقات مغلقة"
                        : "اكتب تعليقاً..."}
                    class="flex-1 rounded-2xl border-slate-200 bg-slate-50 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:bg-slate-100"
                    onkeydown={(e) => e.key === "Enter" && handlePostComment()}
                />
                <button
                    onclick={handlePostComment}
                    disabled={postingComment ||
                        !commentText.trim() ||
                        issue.solved}
                    class="bg-primary text-white px-5 rounded-2xl disabled:opacity-50 transition-all hover:bg-primary/90 flex items-center justify-center shadow-md shadow-primary/20"
                >
                    {#if postingComment}
                        <Spinner class="size-5" />
                    {:else}
                        <Send class="size-5 -rotate-45" />
                    {/if}
                </button>
            </div>

            {#if loadingComments}
                <div class="flex justify-center py-10">
                    <Spinner class="size-8 text-primary" />
                </div>
            {:else if comments.length > 0}
                <div class="space-y-6">
                    {#each comments as comment}
                        <div class="flex gap-4 items-start group">
                            <div
                                class="size-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-100"
                            >
                                <User class="size-5 text-slate-400" />
                            </div>

                            <div
                                class="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tr-none border border-slate-100 transition-colors group-hover:bg-slate-100/50"
                            >
                                <div
                                    class="flex justify-between items-center mb-2"
                                >
                                    <p class="font-bold text-xs text-slate-800">
                                        {comment.username}
                                    </p>

                                    {#if comment.date}
                                        <div
                                            class="flex items-center gap-1 text-[10px] text-slate-400 font-medium"
                                        >
                                            <span
                                                >{new Date(
                                                    comment.date,
                                                ).toLocaleDateString("ar-EG", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}</span
                                            >
                                            <Clock class="size-3" />
                                        </div>
                                    {/if}
                                </div>

                                <p
                                    class="text-sm text-slate-600 leading-relaxed"
                                >
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="text-center py-10">
                    <p class="text-slate-400 text-sm">
                        لا توجد تعليقات بعد. كن أول من يشارك!
                    </p>
                </div>
            {/if}
        </div>
    {:else}
        <div class="flex flex-col items-center justify-center min-h-100">
            <Spinner class="size-10 text-primary mb-4" />
            <p class="text-slate-400 animate-pulse">
                جاري جلب بيانات البلاغ...
            </p>
        </div>
    {/if}
</div>
