<script>
    import { goto } from "$app/navigation";

    // Svelte 5 Runes

    const features = [
        {
            title: "تقديم البلاغات",
            description:
                "ارفع شكواك بخصوص الطرق، النظافة، أو الإنارة في ثوانٍ معدودة.",
            icon: "📝",
        },
        {
            title: "تحديد الموقع الذكي",
            description:
                "نستخدم خرائط دقيقة لضمان وصول فرق الصيانة للمكان الصحيح فوراً.",
            icon: "📍",
        },
        {
            title: "متابعة مباشرة",
            description:
                'تتبع حالة طلبك من "قيد المراجعة" إلى "تم التنفيذ" لحظة بلحظة.',
            icon: "🔔",
        },
    ];
</script>

<div
    class="min-h-screen bg-white text-slate-950 font-sans selection:bg-slate-900 selection:text-white"
    dir="rtl"
>
    <header class="relative pt-40 pb-24 overflow-hidden">
        <div class="container mx-auto px-6 relative z-10">
            <div class="max-w-3xl text-right">
                <div
                    class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-900 mb-8"
                >
                    <span class="flex h-2 w-2 rounded-full bg-slate-900 ml-2"
                    ></span>
                    نظام البلاغات والخدمات البلدية المتكامل
                </div>
                <h1
                    class="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
                >
                    عينك على بلدك، <br />
                    <span class="text-slate-400 font-medium"
                        >وصوتك واصل للبلدية.</span
                    >
                </h1>
                <p
                    class="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl"
                >
                    منصة رقمية موحدة تمنح المواطن دوراً ريادياً في تطوير الخدمات
                    البلدية. أبلغ عن أي خلل، تابع التقدم، وساهم في جعل بلدك
                    أجمل.
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <button
                        onclick={() => goto("issue/new")}
                        class="inline-flex items-center justify-center rounded-lg text-base font-bold transition-all bg-slate-900 text-slate-50 shadow-lg hover:bg-slate-800 h-14 px-10"
                    >
                        تقديم بلاغ الآن
                    </button>
                    <button
                        onclick={() => goto("issue/feed")}
                        class="inline-flex items-center justify-center rounded-lg text-base font-bold transition-all border border-slate-200 bg-white hover:bg-slate-50 h-14 px-10"
                    >
                        تصفح الشكاوى
                    </button>
                </div>
            </div>
        </div>

        <div
            class="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-[0.03] pointer-events-none"
        >
            <svg viewBox="0 0 400 400" class="w-full h-full fill-slate-950">
                <path
                    d="m158.72 176.05l-0.14 0.14q0.54-0.54 0.54-1.34 0-1.61-1.88-1.61-0.67 0-1.87 0.4-7.51 1.88-16.75 3.49-9.11 1.6-18.36 1.6-0.54 0-0.8 0-0.14 0-0.81 0-23.45 0-35.51-13.53-0.67-0.8-1.2-1.88-0.54-1.2-0.54-2.54 0-2.28 1.21-4.83 3.35-7.1 8.97-13.66 5.63-6.57 11.39-11.66v0.13l4.02-3.75q1.34-1.21 2.55-2.28 1.21-1.2 2.41-2.14 0.94-0.81 2.01-1.61 1.07-0.94 2.15-1.88 3.08-2.41 6.56-5.09 3.49-2.81 4.96-6.56l5.9-15.01q0.26-0.94-0.27-1.48-0.54-0.67-1.34-0.67-0.4 0-0.94 0.54-2.95 2.81-6.3 5.09-3.35 2.28-7.23 4.29v-0.13q-1.75 0.8-3.35 1.34-1.48 0.4-2.68 0.4-2.55 0-4.43-1.61-2.81-2.41-4.28-4.56-1.48-2.14-2.28-5.89 5.36 0.8 11.12 2.41 1.47 0.4 2.01-0.94l5.36-16.88q0.27-0.81-0.13-1.34-0.27-0.54-0.94-0.67l-2.55-0.54q-2.54-0.67-5.09-1.07-2.41-0.54-5.36-0.67-4.29 0-7.37 2.55-2.95 2.54-4.82 6.29-1.88 3.62-2.82 7.37-0.94 3.89-0.94 8.18 0 6.43 1.61 10.99 1.74 4.55 4.69 8.17 0.67 0.94 1.34 1.74 0.67 0.81 1.21 1.61-5.76 4.96-10.59 11.79-4.69 6.84-8.44 14.47-2.55 5.5-4.69 11.93-2.14 6.3-2.14 13.4 0 5.9 1.47 10.59 1.61 4.69 4.15 8.17 4.29 5.63 12.2 8.84 8.04 3.22 17.02 3.22 10.72 0 20.63-3.22 10.05-3.35 18.23-8.57 8.17-5.36 13.13-11.53z"
                />
            </svg>
        </div>
    </header>

    <section id="features" class="py-24 bg-slate-50/50">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-3 gap-8">
                {#each features as feature}
                    <div
                        class="group relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                    >
                        <div
                            class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors"
                        >
                            {feature.icon}
                        </div>
                        <h3 class="text-xl font-bold mb-3">{feature.title}</h3>
                        <p class="text-slate-600 leading-relaxed text-sm">
                            {feature.description}
                        </p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <section class="py-24">
        <div class="container mx-auto px-6 text-center">
            <div
                class="bg-slate-900 rounded-4xl p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-slate-200"
            >
                <div class="relative z-10 max-w-2xl mx-auto">
                    <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
                        مستعد للمساهمة؟
                    </h2>
                    <p class="text-slate-400 text-lg mb-10">
                        تحتاج فقط لدقيقتين لإرسال بلاغك ومساعدتنا في تحسين خدمات
                        مدينتك.
                    </p>
                    <button
                        onclick={() => goto("issue/new")}
                        class="bg-white text-slate-900 font-bold px-12 py-4 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        ابدأ بلاغك الأول
                    </button>
                </div>
                <div
                    class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[20px_20px]"
                ></div>
            </div>
        </div>
    </section>

    <footer class="border-t border-slate-200 py-12">
        <div
            class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm"
        >
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 grayscale brightness-0 opacity-50">
                    <svg viewBox="0 0 400 400">
                        <path
                            d="m158.72 176.05l-0.14 0.14q0.54-0.54 0.54-1.34 0-1.61-1.88-1.61-0.67 0-1.87 0.4-7.51 1.88-16.75 3.49-9.11 1.6-18.36 1.6-0.54 0-0.8 0-0.14 0-0.81 0-23.45 0-35.51-13.53-0.67-0.8-1.2-1.88-0.54-1.2-0.54-2.54 0-2.28 1.21-4.83 3.35-7.1 8.97-13.66 5.63-6.57 11.39-11.66v0.13l4.02-3.75q1.34-1.21 2.55-2.28 1.21-1.2 2.41-2.14 0.94-0.81 2.01-1.61 1.07-0.94 2.15-1.88 3.08-2.41 6.56-5.09 3.49-2.81 4.96-6.56l5.9-15.01q0.26-0.94-0.27-1.48-0.54-0.67-1.34-0.67-0.4 0-0.94 0.54-2.95 2.81-6.3 5.09-3.35 2.28-7.23 4.29v-0.13q-1.75 0.8-3.35 1.34-1.48 0.4-2.68 0.4-2.55 0-4.43-1.61-2.81-2.41-4.28-4.56-1.48-2.14-2.28-5.89 5.36 0.8 11.12 2.41 1.47 0.4 2.01-0.94l5.36-16.88q0.27-0.81-0.13-1.34-0.27-0.54-0.94-0.67l-2.55-0.54q-2.54-0.67-5.09-1.07-2.41-0.54-5.36-0.67-4.29 0-7.37 2.55-2.95 2.54-4.82 6.29-1.88 3.62-2.82 7.37-0.94 3.89-0.94 8.18 0 6.43 1.61 10.99 1.74 4.55 4.69 8.17 0.67 0.94 1.34 1.74 0.67 0.81 1.21 1.61-5.76 4.96-10.59 11.79-4.69 6.84-8.44 14.47-2.55 5.5-4.69 11.93-2.14 6.3-2.14 13.4 0 5.9 1.47 10.59 1.61 4.69 4.15 8.17 4.29 5.63 12.2 8.84 8.04 3.22 17.02 3.22 10.72 0 20.63-3.22 10.05-3.35 18.23-8.57 8.17-5.36 13.13-11.53z"
                        />
                    </svg>
                </div>
                <span
                    >© {new Date().getFullYear()} عين ع البلد. جميع الحقوق محفوظة.</span
                >
            </div>
            <div class="flex gap-6">
                <a href="/" class="hover:text-slate-900 transition-colors"
                    >سياسة الخصوصية</a
                >
                <a href="/" class="hover:text-slate-900 transition-colors"
                    >اتصل بنا</a
                >
            </div>
        </div>
    </footer>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }
</style>
