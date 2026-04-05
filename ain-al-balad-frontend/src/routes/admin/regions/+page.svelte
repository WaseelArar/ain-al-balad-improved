<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import AlertCircle from "lucide-svelte/icons/alert-circle";
    import MapPin from "lucide-svelte/icons/map-pin";
    import Trash2 from "lucide-svelte/icons/trash-2";
    import Loader2 from "lucide-svelte/icons/loader-2";
    import apiInstance from "$lib/api/api";

    // State
    let regions = $state<
        { regionsId: number; name: string; description: string }[]
    >([]);
    let name = $state("");
    let description = $state("");
    let error = $state("");
    let loading = $state(true);
    let submitting = $state(false);

    // Fetch regions
    const fetchRegions = async () => {
        loading = true;
        try {
            // Using the public endpoint you defined in step 1
            const res = await apiInstance.get("/regions");
            regions = res.data;
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في تحميل المناطق";
        } finally {
            loading = false;
        }
    };

    // Create region
    const handleCreate = async (e: SubmitEvent) => {
        e.preventDefault();
        submitting = true;
        error = "";
        try {
            await apiInstance.post("/admin/regions", { name, description });
            name = "";
            description = "";
            await fetchRegions();
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في إضافة المنطقة";
        } finally {
            submitting = false;
        }
    };

    // Delete region
    const handleDelete = async (id: number) => {
        if (
            !confirm(
                "هل أنت متأكد من حذف هذه المنطقة؟ لا يمكن التراجع عن هذا الإجراء.",
            )
        )
            return;

        try {
            await apiInstance.delete(`/admin/regions/${id}`);
            await fetchRegions();
        } catch (err: any) {
            error = err.response?.data?.message || "فشل في حذف المنطقة";
        }
    };

    onMount(fetchRegions);
</script>

<div class="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
    <div class="flex items-center gap-2 mb-4">
        <MapPin class="size-6 text-primary" />
        <h1 class="text-2xl font-black">إدارة المناطق</h1>
    </div>

    <Card.Root class="rounded-3xl border-none shadow-sm bg-slate-50/50">
        <Card.Header>
            <Card.Title>إضافة منطقة جديدة</Card.Title>
            <Card.Description
                >أضف منطقة سكنية جديدة ليتمكن المستخدمون من اختيارها عند
                التسجيل.</Card.Description
            >
        </Card.Header>
        <Card.Content>
            <form
                onsubmit={handleCreate}
                class="flex flex-col md:flex-row gap-4 items-end"
            >
                <div class="flex-1 w-full space-y-2">
                    <Field.Label for="reg-name">اسم المنطقة</Field.Label>
                    <Input
                        id="reg-name"
                        bind:value={name}
                        placeholder="مثال: الحي الشرقي"
                        required
                        class="bg-white rounded-xl h-11"
                    />
                </div>
                <div class="flex-1 w-full space-y-2">
                    <Field.Label for="reg-desc">الوصف (اختياري)</Field.Label>
                    <Input
                        id="reg-desc"
                        bind:value={description}
                        placeholder="وصف بسيط للمنطقة"
                        class="bg-white rounded-xl h-11"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={submitting}
                    class="rounded-xl h-11 px-8 font-bold"
                >
                    {#if submitting}
                        <Loader2 class="size-4 animate-spin mr-2" />
                    {/if}
                    إضافة
                </Button>
            </form>
        </Card.Content>
    </Card.Root>

    {#if error}
        <Alert.Root
            variant="destructive"
            class="rounded-2xl border-none bg-destructive/10 text-destructive"
        >
            <AlertCircle class="size-5" />
            <Alert.Title>تنبيه</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
    {/if}

    <Card.Root class="rounded-3xl border-none shadow-sm overflow-hidden">
        <Table.Root>
            <Table.Header class="bg-slate-100/50">
                <Table.Row>
                    <Table.Head class="text-right font-bold w-16">ID</Table.Head
                    >
                    <Table.Head class="text-right font-bold"
                        >اسم المنطقة</Table.Head
                    >
                    <Table.Head class="text-right font-bold">الوصف</Table.Head>
                    <Table.Head
                        class="text-center font-bold w-24 text-destructive"
                        >حذف</Table.Head
                    >
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if loading}
                    <Table.Row>
                        <Table.Cell colspan={4} class="text-center py-12">
                            <Loader2
                                class="size-8 animate-spin mx-auto text-muted-foreground"
                            />
                        </Table.Cell>
                    </Table.Row>
                {:else if regions.length === 0}
                    <Table.Row>
                        <Table.Cell
                            colspan={4}
                            class="text-center py-12 text-muted-foreground"
                        >
                            لا توجد مناطق مضافة حالياً.
                        </Table.Cell>
                    </Table.Row>
                {:else}
                    {#each regions as region}
                        <Table.Row>
                            <Table.Cell class="font-mono text-slate-400"
                                >#{region.regionsId}</Table.Cell
                            >
                            <Table.Cell class="font-bold"
                                >{region.name}</Table.Cell
                            >
                            <Table.Cell class="text-slate-500"
                                >{region.description || "—"}</Table.Cell
                            >
                            <Table.Cell class="text-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onclick={() =>
                                        handleDelete(region.regionsId)}
                                    class="hover:bg-destructive/10 hover:text-destructive rounded-full"
                                >
                                    <Trash2 class="size-4" />
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {/if}
            </Table.Body>
        </Table.Root>
    </Card.Root>
</div>
