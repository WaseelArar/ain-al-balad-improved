<script lang="ts">
    import { goto } from "$app/navigation";
    import Button from "@/lib/components/ui/button/button.svelte";
    import {
        adminUsers,
        fetchAdminUsers,
        adminActions,
    } from "@/stores/users.store";
    import type { ManagedUser, userRole } from "@/stores/users.store"; // Import the type
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import {
        Shield,
        User,
        Key,
        Trash2,
        Search,
        ShieldAlert,
        Loader2,
        UserCheck2,
        LogInIcon,
        LockIcon,
        LockOpenIcon,
        ShieldCheck,
        UserIcon,
        ChevronDown,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    //@ts-ignore
    import { toast } from "svelte-french-toast";

    onMount(() => fetchAdminUsers());
    let searchQuery = $state("");
    // Define the state with the ManagedUser type or null
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
    async function updateRole(user: ManagedUser, newRole: userRole) {
        if (user.role === newRole) return;

        try {
            await adminActions.changeRole(user.usersId, newRole);
            toast.success(
                `تم تغيير رتبة ${user.username} إلى ${roleConfig[newRole].label}`,
            );
            // Optimistic update or refresh
            fetchAdminUsers($adminUsers.meta.page);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "فشل تحديث الرتبة");
        }
    }

    async function handleUserDelete(user: ManagedUser) {
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

            // Refresh the current page
            fetchAdminUsers($adminUsers.meta.page, searchQuery);
        } catch (e: any) {
            toast.error(e.response?.data?.message || "فشل حذف المستخدم");
        }
    }

    async function handleUserAccessToggle(user: ManagedUser) {
        if (!confirm(`هل أنت متأكد من ايقاف حساب "${user.username}"؟.`)) {
            return;
        }

        try {
            await adminActions.toggleAccess(user.usersId);
            toast.success("تم ايقاف المستخدم بنجاح");

            // Refresh the current page
            fetchAdminUsers($adminUsers.meta.page, searchQuery);
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "فشل تغيير وصول المستخدم المستخدم",
            );
        }
    }

    async function handleSetPassword(
        e: SubmitEvent & { currentTarget: HTMLFormElement },
    ) {
        e.preventDefault();
        if (!selectedUser) return;

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;

        try {
            await adminActions.setPassword(selectedUser.usersId, password);
            toast.success("تم تغيير كلمة المرور بنجاح");
            isPasswordModalOpen = false;
        } catch (e: any) {
            toast.error(e.response?.data?.message || "فشل التغيير");
        }
    }
</script>

<div class="p-6 max-w-6xl mx-auto" dir="rtl">
    <header
        class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold flex items-center gap-2">
                <ShieldAlert class="text-primary" /> إدارة المستخدمين
            </h1>
            <p class="text-slate-500 text-sm">
                إدارة الرتب، كلمات المرور، وحسابات المواطنين
            </p>
        </div>

        <div class="relative w-full md:w-72">
            <Search
                class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
                type="text"
                placeholder="بحث بالاسم أو الهاتف او المنطقة..."
                class="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 ring-primary/20 outline-none"
                bind:value={searchQuery}
                oninput={() => fetchAdminUsers(1, searchQuery)}
            />
        </div>
    </header>

    <div
        class="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
    >
        <table class="w-full text-right border-collapse">
            <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                    <th class="p-4 font-bold text-slate-600">المستخدم</th>
                    <th class="p-4 font-bold text-slate-600">رقم الهاتف</th>
                    <th class="p-4 font-bold text-slate-600">المنطقة</th>
                    <th class="p-4 font-bold text-slate-600">الرتبة</th>
                    <th class="p-4 font-bold text-slate-600">الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                {#each $adminUsers.items as user}
                    <tr
                        class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                        <td class="p-4">
                            <div class="flex items-center gap-3">
                                <button
                                    title="عرض الملف الشخصي"
                                    onclick={() =>
                                        goto(
                                            `/admin/profile?usersId=${user.usersId}`,
                                        )}
                                    class="p-2 text-green-500"
                                >
                                    <LogInIcon />
                                </button>
                                <div
                                    class="size-9 rounded-full bg-slate-100 flex items-center justify-center"
                                >
                                    <User size={18} class="text-slate-500" />
                                </div>
                                <span class="font-medium text-slate-800"
                                    >{user.username}</span
                                >
                            </div>
                        </td>
                        <td class="p-4 text-slate-600 font-mono" dir="ltr"
                            >{user.phone}</td
                        >
                        <td class="p-4 text-slate-600 font-mono" dir="ltr"
                            >{user?.regionsName}</td
                        >
                        <td class="p-4">
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
                                                >{roleConfig[
                                                    user?.role ?? "USER"
                                                ].label}</span
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
                                                    updateRole(
                                                        user,
                                                        roleKey as userRole,
                                                    )}
                                            >
                                                <span
                                                    class={user?.role ===
                                                    roleKey
                                                        ? "font-bold text-primary"
                                                        : "text-slate-600"}
                                                >
                                                    {config.label}
                                                </span>
                                                <config.icon
                                                    size={16}
                                                    class={user?.role ===
                                                    roleKey
                                                        ? "text-primary"
                                                        : "text-slate-400"}
                                                />
                                            </DropdownMenu.Item>
                                        {/each}
                                    </DropdownMenu.Group>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </td>
                        <td class="p-4">
                            <div class="flex items-center gap-2">
                                <button
                                    title="تغيير كلمة المرور"
                                    onclick={() => {
                                        selectedUser = user;
                                        isPasswordModalOpen = true;
                                    }}
                                    class="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                >
                                    <Key size={18} />
                                </button>
                                {#if user.isActive}
                                    <button
                                        title="ايقاف تفعيل الحساب"
                                        onclick={() =>
                                            handleUserAccessToggle(user)}
                                        class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                    >
                                        <LockIcon size={18} />
                                    </button>
                                {:else}
                                    <button
                                        title="اعادة تفعيل الحساب"
                                        onclick={() =>
                                            handleUserAccessToggle(user)}
                                        class="p-2 hover:bg-red-50 text-blue-600 rounded-lg transition-colors"
                                    >
                                        <LockOpenIcon size={18} />
                                    </button>
                                {/if}
                                <button
                                    title="حذف الحساب"
                                    onclick={() => handleUserDelete(user)}
                                    class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        {#if $adminUsers.loading}
            <div class="p-12 flex justify-center">
                <Loader2 class="animate-spin text-primary" />
            </div>
        {/if}
    </div>
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
