<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import svgLogo from "$lib/assets/ain-al-balad-landscape.svg";
    import { clearUser, user } from "@/stores/auth.store";
    import { notificationsStore } from "@/stores/notifications.store";
    import { onMount } from "svelte";
    import {
        ChevronRight, List, LogOutIcon, MessageCircleCheckIcon,
        UserIcon, Menu, X, Home, Users, Map, Bell, BarChart3,
    } from "lucide-svelte";
    import Button from "../components/ui/button/button.svelte";

    let scrolled = $state(false);
    let mobileMenuOpen = $state(false);
    let showNotifications = $state(false);

    onMount(() => {
        if ($user) notificationsStore.fetch();
        // تحديث الإشعارات كل دقيقة
        const interval = setInterval(() => {
            if ($user) notificationsStore.fetch();
        }, 60000);
        return () => clearInterval(interval);
    });

    if (typeof window !== "undefined") {
        window.addEventListener("scroll", () => { scrolled = window.scrollY > 20; });
    }

    function toggleMenu() { mobileMenuOpen = !mobileMenuOpen; }
    function toggleNotifications() {
        showNotifications = !showNotifications;
        if (showNotifications && $notificationsStore.unreadCount > 0) {
            notificationsStore.markAllRead();
        }
    }

    const nonAdminNavItems = [
        { id: 4, name: "الرئيسية", path: "/", icon: Home },
        { id: 1, name: "الشكاوى", path: "/issue/feed", icon: List },
        { id: 2, name: "تقديم بلاغ", path: "/issue/new", icon: MessageCircleCheckIcon },
        { id: 3, name: "المستخدم", path: "/profile", icon: UserIcon },
    ];
    const adminNavItems = [
        { id: 20, name: "ادارة الحسابات", path: "/admin/users", icon: Users },
        { id: 21, name: "ادارة المناطق", path: "/admin/regions", icon: Map },
        { id: 22, name: "الإحصائيات", path: "/admin/stats", icon: BarChart3 },
    ];
    const navItems = $user?.role === "ADMIN"
        ? [...nonAdminNavItems, ...adminNavItems]
        : nonAdminNavItems;
</script>

<nav class="fixed top-0 w-full z-50 transition-all duration-300 border-b {scrolled
    ? 'bg-white/80 backdrop-blur-md border-slate-200 py-0 shadow-sm'
    : 'bg-transparent border-transparent py-1'}">
    <div class="container mx-auto px-6 h-20 flex justify-between items-center">
        <div class="flex items-center h-full p-6 gap-2">
            {#if page.url.pathname !== "/"}
                <Button onclick={() => history.back()} class="p-2 rounded-full size-10">
                    <ChevronRight class="text-background" />
                </Button>
            {/if}
            <img src={svgLogo} alt="logo" class="h-full" />
            {#if $user?.regionsName}
                <Button>{$user?.regionsName}</Button>
            {/if}
        </div>

        <div class="hidden md:flex items-center gap-8 text-sm font-medium">
            {#if !$user}
                <Button variant="default" onclick={() => goto(`/auth/login?goto=${page.url.pathname}${page.url.search}`)}>
                    تسجيل الدخول
                </Button>
                <Button variant="secondary" onclick={() => goto(`/auth/signup?goto=${page.url.pathname}${page.url.search}`)}>
                    انشاء حساب
                </Button>
            {:else}
                {#each navItems as item (item.id)}
                    <button class="items-center flex flex-col gap-1 hover:text-primary transition-colors"
                        onclick={() => goto(item.path)}>
                        <item.icon size={20} />
                        <span class="text-md">{item.name}</span>
                    </button>
                {/each}

                <!-- 🔔 زر الإشعارات -->
                <div class="relative">
                    <button onclick={toggleNotifications}
                        class="items-center flex flex-col gap-1 hover:text-primary transition-colors relative">
                        <div class="relative">
                            <Bell size={20} />
                            {#if $notificationsStore.unreadCount > 0}
                                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full size-4 flex items-center justify-center font-bold">
                                    {$notificationsStore.unreadCount > 9 ? "9+" : $notificationsStore.unreadCount}
                                </span>
                            {/if}
                        </div>
                        <span class="text-md">إشعارات</span>
                    </button>

                    {#if showNotifications}
                        <div class="absolute left-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                            <div class="p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 class="font-bold text-slate-800">الإشعارات</h3>
                                <button onclick={toggleNotifications} class="text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>
                            <div class="max-h-80 overflow-y-auto">
                                {#if $notificationsStore.items.length === 0}
                                    <div class="p-6 text-center text-slate-400 text-sm">لا توجد إشعارات</div>
                                {:else}
                                    {#each $notificationsStore.items as notif}
                                        <button
                                            class="w-full text-right p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors {!notif.isRead ? 'bg-blue-50/50' : ''}"
                                            onclick={() => { if (notif.issuesId) goto(`/issue/selected?issuesId=${notif.issuesId}`); showNotifications = false; }}>
                                            <p class="text-sm text-slate-700 font-medium">{notif.message}</p>
                                            <p class="text-xs text-slate-400 mt-1">
                                                {new Date(notif.createdAt).toLocaleDateString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </button>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <button onclick={clearUser}
                    class="items-center flex flex-col gap-1 text-red-600 hover:opacity-80 transition-opacity">
                    <LogOutIcon size={20} />
                    <span class="text-[10px]">خروج</span>
                </button>
            {/if}
        </div>

        <div class="md:hidden flex items-center gap-2">
            {#if $user && $notificationsStore.unreadCount > 0}
                <button onclick={toggleNotifications} class="relative p-2">
                    <Bell size={22} />
                    <span class="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full size-4 flex items-center justify-center">
                        {$notificationsStore.unreadCount}
                    </span>
                </button>
            {/if}
            <button onclick={toggleMenu} class="p-2 text-slate-900 outline-none">
                {#if mobileMenuOpen}<X size={28} />{:else}<Menu size={28} />{/if}
            </button>
        </div>
    </div>

    <!-- Mobile Notifications Panel -->
    {#if showNotifications}
        <div class="md:hidden bg-white border-b border-slate-100 shadow-lg">
            <div class="max-h-60 overflow-y-auto">
                {#each $notificationsStore.items.slice(0, 5) as notif}
                    <button class="w-full text-right p-3 border-b border-slate-50 text-sm"
                        onclick={() => { if (notif.issuesId) goto(`/issue/selected?issuesId=${notif.issuesId}`); showNotifications = false; }}>
                        {notif.message}
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    {#if mobileMenuOpen}
        <div class="md:hidden bg-white border-b border-slate-200 absolute w-full left-0 shadow-xl animate-in slide-in-from-top duration-300">
            <div class="flex flex-col p-6 gap-6">
                {#if !$user}
                    <Button variant="default" onclick={() => goto(`/auth/login?goto=${page.url.pathname}${page.url.search}`)}>تسجيل الدخول</Button>
                    <Button variant="secondary" onclick={() => goto(`/auth/signup?goto=${page.url.pathname}${page.url.search}`)}>انشاء حساب</Button>
                {:else}
                    {#each navItems as item (item.id)}
                        <button class="flex items-center gap-4 text-right p-2 hover:bg-slate-50 rounded-lg transition-colors"
                            onclick={() => { goto(item.path); toggleMenu(); }}>
                            <item.icon class="text-slate-500" />
                            <span class="font-medium">{item.name}</span>
                        </button>
                    {/each}
                    <hr class="border-slate-100" />
                    <button onclick={() => { clearUser(); toggleMenu(); }}
                        class="flex items-center gap-4 text-red-600 font-bold p-2">
                        <LogOutIcon />
                        <span>تسجيل الخروج</span>
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</nav>
