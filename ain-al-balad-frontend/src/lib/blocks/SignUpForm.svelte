<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import apiInstance from "$lib/api/api";
    import * as Select from "$lib/components/ui/select/index.js";

    // 1. Component State
    let username = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let phone = $state("");
    let selectedRegionId = $state("");
    let regions = $state<{ regionsId: number; name: string }[]>([]);
    let error = $state("");
    let loadingRegions = $state(true);

    // Derived label for the Select Trigger
    let triggerContent = $derived(
        regions.find((r) => String(r.regionsId) === selectedRegionId)?.name ??
            "اختر منطقتك...",
    );

    let {
        dest = "/",
        signup = $bindable(
            (
                username: string,
                phone: string,
                password: string,
                regionsId: string,
            ) => console.log(username, phone, password, regionsId),
        ),
    }: {
        dest?: string;
        signup?: (
            username: string,
            phone: string,
            password: string,
            regionsId: string,
        ) => void | Promise<void>;
    } = $props();

    // 3. Fetch Regions on Mount
    onMount(async () => {
        try {
            const res = await apiInstance.get("/regions");
            regions = res.data;
        } catch (err: any) {
            error = err.response?.data?.message || "تعذر تحميل قائمة المناطق";
        } finally {
            loadingRegions = false;
        }
    });

    // 4. Form Submission
    const handleSubmit = async (event: SubmitEvent) => {
        error = "";
        event.preventDefault();

        if (!selectedRegionId) {
            error = "الرجاء اختيار المنطقة السكنية";
            return;
        }

        if (password !== confirmPassword) {
            error = "كلمات المرور غير متطابقة";
            return;
        }

        if (password.length < 8) {
            error = "يجب أن تكون كلمة المرور 8 حروف على الأقل";
            return;
        }

        try {
            await signup(username, phone, password, selectedRegionId);
        } catch (err: any) {
            error =
                err.response?.data?.message ||
                "فشل انشاء الحساب، تأكد من البيانات";
        }
    };
</script>

<Card.Root class="mx-auto w-full max-w-sm h-fit" dir="rtl">
    <Card.Header>
        <Card.Title>انشئ حسابك</Card.Title>
        <Card.Description>ادخل معلوماتك ادناه لانشاء حساب</Card.Description>
    </Card.Header>
    <Card.Content>
        <form onsubmit={handleSubmit}>
            <Field.Group>
                <Field.Field>
                    <Field.Label for="name">اسم المستخدم</Field.Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="امير سامر"
                        required
                        bind:value={username}
                    />
                </Field.Field>

                <Field.Field>
                    <Field.Label>المنطقة</Field.Label>
                    <Select.Root type="single" bind:value={selectedRegionId}>
                        <Select.Trigger
                            class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-right"
                        >
                            {triggerContent}
                        </Select.Trigger>
                        <Select.Content
                            class="rounded-xl shadow-xl border-slate-100"
                        >
                            {#each regions as region}
                                <Select.Item
                                    value={String(region.regionsId)}
                                    label={region.name}
                                    class="text-right flex-row-reverse justify-end"
                                >
                                    {region.name}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </Field.Field>

                <Field.Field>
                    <Field.Label for="phone">رقم الهاتف</Field.Label>
                    <Input
                        id="phone"
                        type="phone"
                        placeholder="972xxxxxxxxx+"
                        required
                        bind:value={phone}
                    />
                    <Field.Description>
                        سنستخدم رقم الهاتف للتواصل معك ولن نقوم بمشاركته مع احد.
                    </Field.Description>
                </Field.Field>

                <div class="flex gap-1">
                    <Field.Field>
                        <Field.Label for="password">كلمة المرور</Field.Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            bind:value={password}
                        />
                        <Field.Description>8 حروف على الاقل.</Field.Description>
                    </Field.Field>
                    <Field.Field>
                        <Field.Label for="confirm-password"
                            >تأكيد كلمة المرور</Field.Label
                        >
                        <Input
                            id="confirm-password"
                            type="password"
                            required
                            bind:value={confirmPassword}
                        />
                        <Field.Description
                            >الرجاء تاكيد كلمة المرور.</Field.Description
                        >
                    </Field.Field>
                </div>

                <Field.Group>
                    {#if error}
                        <Field.Field>
                            <Alert.Root
                                variant="destructive"
                                class="bg-destructive/10 text-destructive rounded-2xl border-none"
                            >
                                <AlertCircle class="size-5" />
                                <Alert.Title class="font-bold">خطأ</Alert.Title>
                                <Alert.Description>{error}</Alert.Description>
                            </Alert.Root>
                        </Field.Field>
                    {/if}
                    <Field.Field>
                        <Button type="submit">انشاء حساب</Button>
                        <Field.Description class="px-6 text-center">
                            لديك حساب بالفعل?
                            <a href={`/auth/login?goto=${dest}`}>سجل الدخول</a>
                        </Field.Description>
                    </Field.Field>
                </Field.Group>
            </Field.Group>
        </form>
    </Card.Content>
</Card.Root>
