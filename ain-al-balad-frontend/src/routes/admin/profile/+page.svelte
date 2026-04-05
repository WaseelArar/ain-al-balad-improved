<script lang="ts">
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import apiInstance from "$lib/api/api";
    import type { ManagedUser, userRole } from "@/stores/users.store";
    import { adminActions } from "@/stores/users.store";
    import {
        User as UserIcon,
        Phone,
        Calendar,
        Shield,
        Clock,
        ChevronRight,
        Trash2,
        Key,
        LockIcon,
        LockOpenIcon,
        ChevronDown,
        ShieldCheck,
    } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    //@ts-ignore
    import { toast } from "svelte-french-toast";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

    let user = $state<(ManagedUser & { stats: any }) | null>(null);
    let loading = $state(true);
    const userId = page.url.searchParams.get("usersId");

    const loadUser = async () => {
        try {
            const res = await apiInstance.get(`/admin/users/${userId}`);
            user = res.data;
        } catch (e) {
            toast.error("تعذر تحميل بيانات المستخدم");
        } finally {
            loading = false;
        }
    };

    onMount(loadUser);

    let selectedUser = $state<ManagedUser | null>(null);
    let isPasswordModalOpen = $state(false);

    const roleConfig: Record<
        userRole,
        { label: string; color: string; icon: any }
    > = {
        ADMIN: {
            label: "مدير",
            color: "text-purple-700 bg-purple-50 border-purple-200",
            icon: ShieldCheck,
        },
        MUNICIPAL: {
            label: "مشرف",
            color: "text-blue-700 bg-blue-50 border-blue-200",
            icon: Shield,
        },
        USER: {
            label: "مواطن",
            color: "text-slate-600 bg-slate-50 border-slate-200",
            icon: UserIcon,
        },
    };

    async function updateRole(newRole: userRole) {
        if (!user) return;
        if (user.role === newRole) return;

        try {
            await adminActions.changeRole(user.usersId, newRole);
            toast.success(
                `تم تغيير رتبة ${user.username} إلى ${roleConfig[newRole].label}`,
            );
            // Optimistic update or refresh
            loadUser();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "فشل تحديث الرتبة");
        }
    }

    async function handleUserAccessToggle() {
        if (!user) return;
        if (!confirm(`هل أنت متأكد من ايقاف حساب "${user.username}"؟.`)) {
            return;
        }

        try {
            await adminActions.toggleAccess(user.usersId);
            toast.success("تم ايقاف المستخدم بنجاح");

            // Refresh the current page
            loadUser();
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "فشل تغيير وصول المستخدم المستخدم",
            );
        }
    }

    async function handleUserDelete() {
        if (!user) return;
        if (
            !confirm(
                `هل أنت متأكد من حذف حساب "${user.username}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`,
            )
        ) {
            return;
        }

        try {
            await adminActions.deleteUser(user.usersId);
            toast.success("تم حذف المستخدم بنجاح");
        } catch (e: any) {
            toast.error(e.response?.data?.message || "فشل حذف المستخدم");
        }
    }

    async function handleSetPassword(
        e: SubmitEvent & { currentTarget: HTMLFormElement },
    ) {
        e.preventDefault();
        if (!user) return;

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;

        try {
            await adminActions.setPassword(user.usersId, password);
            toast.success("تم تغيير كلمة المرور بنجاح");
            isPasswordModalOpen = false;
        } catch (e: any) {
            toast.error(e.response?.data?.message || "فشل التغيير");
        }
    }
</script>

<div class="container mx-auto max-w-3xl p-6" dir="rtl">
    <div class="mb-6">
        <Button variant="ghost" onclick={() => history.back()} class="gap-2">
            <ChevronRight size={20} /> العودة للقائمة
        </Button>
    </div>

    {#if loading}
        <div class="flex justify-center py-20">
            <Clock class="animate-spin text-primary" />
        </div>
    {:else if user}
        <div
            class="bg-white border border-slate-200 rounded-4xl overflow-hidden shadow-sm"
        >
            <div
                class="bg-slate-50 p-8 flex flex-col items-center border-b border-slate-100"
            >
                <div
                    class="size-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center mb-4"
                >
                    <UserIcon size={48} class="text-slate-400" />
                </div>
                <h1 class="text-2xl font-bold text-slate-900">
                    {user.username}
                </h1>
                <p class="text-md text-slate-900">
                    {user?.regionsName}
                </p>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                variant="outline"
                                class="mt-2 h-8 gap-2 rounded-full border-slate-200 font-bold text-[11px] {roleConfig[
                                    user?.role ?? 'USER'
                                ].color}"
                            >
                                <ChevronDown size={14} />
                                <span
                                    >{roleConfig[user?.role ?? "USER"]
                                        .label}</span
                                >
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Content
                        align="center"
                        class="w-40 bg-white shadow-xl border-slate-200"
                    >
                        <DropdownMenu.Label
                            class="text-right text-xs text-slate-500"
                        >
                            تعديل الرتبة
                        </DropdownMenu.Label>
                        <DropdownMenu.Separator />

                        <DropdownMenu.Group>
                            {#each Object.entries(roleConfig) as [roleKey, config]}
                                <DropdownMenu.Item
                                    class="flex items-center justify-end gap-2 cursor-pointer py-2 px-3 focus:bg-slate-50 transition-colors"
                                    onclick={() =>
                                        updateRole(roleKey as userRole)}
                                >
                                    <span
                                        class={user?.role === roleKey
                                            ? "font-bold text-primary"
                                            : "text-slate-600"}
                                    >
                                        {config.label}
                                    </span>
                                    <config.icon
                                        size={16}
                                        class={user?.role === roleKey
                                            ? "text-primary"
                                            : "text-slate-400"}
                                    />
                                </DropdownMenu.Item>
                            {/each}
                        </DropdownMenu.Group>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>

            <div class="grid grid-cols-2 border-b border-slate-100">
                <div class="p-6 text-center border-l border-slate-100">
                    <p class="text-2xl font-black text-primary">
                        {user.stats?.totalIssues || 0}
                    </p>
                    <p class="text-xs text-slate-500 font-bold uppercase">
                        إجمالي البلاغات
                    </p>
                </div>
                <div class="p-6 text-center">
                    <p class="text-2xl font-black text-green-600">
                        {user.stats?.solvedIssues || 0}
                    </p>
                    <p class="text-xs text-slate-500 font-bold uppercase">
                        بلاغات مكتملة
                    </p>
                </div>
            </div>

            <div class="p-8 space-y-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Phone size={20} />
                        </div>
                        <div>
                            <p class="text-xs text-slate-400">رقم الهاتف</p>
                            <p class="font-bold" dir="ltr">{user.phone}</p>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="p-2 bg-slate-100 rounded-lg text-slate-500">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p class="text-xs text-slate-400">تاريخ الانضمام</p>
                            <p class="font-bold">
                                {new Date(user.createdAt!).toLocaleDateString(
                                    "ar-EG",
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <hr class="border-slate-100" />

                <div class="space-y-3">
                    <h3
                        class="text-sm font-bold text-slate-400 uppercase tracking-widest"
                    >
                        إجراءات سريعة
                    </h3>
                    <div class="flex flex-wrap gap-3">
                        <Button
                            onclick={() =>
                                (isPasswordModalOpen = !isPasswordModalOpen)}
                            variant="secondary"
                            class="flex-1"
                        >
                            <Key size={18} class="ml-2" /> تغيير كلمة المرور
                        </Button>
                        {#if user.isActive}
                            <Button
                                variant="destructive"
                                onclick={handleUserAccessToggle}
                                class="flex-1 border-slate-200"
                            >
                                <LockIcon size={18} class="ml-2" />
                                ايقاف تفعيل الحساب
                            </Button>
                        {:else}
                            <Button
                                variant="default"
                                onclick={handleUserAccessToggle}
                                class="flex-1 border-slate-200"
                            >
                                <LockOpenIcon size={18} class="ml-2" />
                                اعادة تفعيل الحساب
                            </Button>
                        {/if}
                        <Button
                            onclick={handleUserDelete}
                            variant="destructive"
                            class="flex-1"
                        >
                            <Trash2 size={18} class="ml-2" /> حذف الحساب
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
{#if isPasswordModalOpen}
    <div
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100 flex items-center justify-center p-4"
    >
        <div
            class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
            dir="rtl"
        >
            <h3 class="text-xl font-bold mb-2">تغيير كلمة المرور</h3>
            <p class="text-slate-500 text-sm mb-6">
                تغيير كلمة مرور المستخدم: <span class="text-slate-900 font-bold"
                    >{selectedUser?.username}</span
                >
            </p>

            <form onsubmit={handleSetPassword} class="space-y-4">
                <input
                    name="password"
                    type="password"
                    placeholder="كلمة المرور الجديدة (8 أحرف+)"
                    class="w-full p-3 border rounded-xl outline-none focus:ring-2 ring-primary/20"
                    required
                    minlength="8"
                />
                <div class="flex gap-3">
                    <button
                        type="submit"
                        class="flex-1 bg-primary text-white py-2 rounded-xl font-bold"
                        >حفظ</button
                    >
                    <button
                        type="button"
                        onclick={() => (isPasswordModalOpen = false)}
                        class="flex-1 bg-slate-100 py-2 rounded-xl"
                        >إلغاء</button
                    >
                </div>
            </form>
        </div>
    </div>
{/if}
