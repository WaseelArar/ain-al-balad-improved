<script lang="ts">
    import { onMount } from "svelte";
    import api from "@/lib/api/api";
    import { BarChart3, Users, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-svelte";

    let stats = $state<any>(null);
    let loading = $state(true);

    onMount(async () => {
        try {
            const res = await api.get("/admin/stats");
            stats = res.data;
        } catch (err) {
            console.error(err);
        } finally {
            loading = false;
        }
    });
</script>

<div class="container mx-auto max-w-6xl p-6" dir="rtl">
    <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 class="text-primary" />
            لوحة الإحصائيات
        </h1>
        <p class="text-slate-500 mt-1">نظرة شاملة على أداء النظام</p>
    </div>

    {#if loading}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each [1,2,3,4] as _}
                <div class="bg-slate-100 rounded-2xl h-28 animate-pulse"></div>
            {/each}
        </div>
    {:else if stats}
        <!-- بطاقات الإحصائيات -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                    <div class="size-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <AlertCircle class="size-5 text-blue-600" />
                    </div>
                    <span class="text-sm text-slate-500">إجمالي البلاغات</span>
                </div>
                <p class="text-3xl font-bold text-slate-800">{stats.issues?.total ?? 0}</p>
            </div>

            <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                    <div class="size-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <CheckCircle2 class="size-5 text-green-600" />
                    </div>
                    <span class="text-sm text-slate-500">تم حلها</span>
                </div>
                <p class="text-3xl font-bold text-green-600">{stats.issues?.solved ?? 0}</p>
            </div>

            <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                    <div class="size-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Clock class="size-5 text-orange-600" />
                    </div>
                    <span class="text-sm text-slate-500">قيد المعالجة</span>
                </div>
                <p class="text-3xl font-bold text-orange-600">{stats.issues?.pending ?? 0}</p>
            </div>

            <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div class="flex items-center gap-3 mb-3">
                    <div class="size-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Users class="size-5 text-purple-600" />
                    </div>
                    <span class="text-sm text-slate-500">المستخدمون</span>
                </div>
                <p class="text-3xl font-bold text-slate-800">{stats.users?.total ?? 0}</p>
            </div>
        </div>

        <!-- هذا الشهر -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp class="size-5 text-primary" />
                    هذا الشهر
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-sm">بلاغات جديدة</span>
                        <span class="font-bold text-slate-800">{stats.issues?.thisMonth ?? 0}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-sm">مستخدمون جدد</span>
                        <span class="font-bold text-slate-800">{stats.users?.newThisMonth ?? 0}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-sm">نسبة الحل</span>
                        <span class="font-bold text-green-600">
                            {stats.issues?.total > 0
                                ? Math.round((stats.issues.solved / stats.issues.total) * 100)
                                : 0}%
                        </span>
                    </div>
                </div>
            </div>

            <!-- أكثر المناطق -->
            <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 class="font-bold text-slate-700 mb-4">أكثر المناطق بلاغات</h3>
                <div class="space-y-3">
                    {#each (stats.topRegions ?? []) as region, i}
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <span class="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                                    {i + 1}
                                </span>
                                <span class="text-slate-700 text-sm">{region.name || "غير محدد"}</span>
                            </div>
                            <span class="font-bold text-slate-500">{region.issueCount}</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- آخر 7 أيام -->
        {#if stats.last7Days?.length > 0}
            <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 class="font-bold text-slate-700 mb-4">البلاغات - آخر 7 أيام</h3>
                <div class="flex items-end gap-2 h-32">
                    {#each stats.last7Days as day}
                        {@const max = Math.max(...stats.last7Days.map((d: any) => d.count), 1)}
                        <div class="flex-1 flex flex-col items-center gap-1">
                            <span class="text-xs text-slate-500">{day.count}</span>
                            <div class="w-full bg-primary rounded-t-lg transition-all"
                                style="height: {(day.count / max) * 100}%"></div>
                            <span class="text-[10px] text-slate-400">
                                {new Date(day.day).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>
