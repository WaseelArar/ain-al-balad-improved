<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import type { HTMLAttributes } from "svelte/elements";
    import apiInstance from "$lib/api/api";
    //@ts-ignore
    import imageCompression from "browser-image-compression";
    import Spinner from "$lib/components/ui/spinner/spinner.svelte";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import AlertCircle from "@lucide/svelte/icons/alert-circle";
    import {
        ForwardIcon,
        ImageIcon,
        LocateIcon,
        LocationEdit,
        Trash2,
    } from "lucide-svelte";
    import Textarea from "@/lib/components/ui/textarea/textarea.svelte";
    import svgLogo from "$lib/assets/ainalbalad.svg";
    import { onDestroy } from "svelte";
    import Switch from "@/lib/components/ui/switch/switch.svelte";
    import Label from "@/lib/components/ui/label/label.svelte";

    let { class: className, ...restProps }: HTMLAttributes<HTMLFormElement> =
        $props();

    const handleImageUpload = async () => {
        try {
            if (!image) throw new Error("تعذر ايجاد الصورة");
            const formData = new FormData();
            formData.append("file", image);
            const res = await apiInstance.post("/upload", formData);
            const imageUrl = res.data.path;
            return imageUrl;
        } catch (err: any) {
            error = err.message ?? "image upload failed";
        }
    };

    const handleSubmit = async (event: Event) => {
        event.preventDefault(); // Here you can send { image, name, description } to your backend
        try {
            loading = true;
            let imageUrl: string = "";
            if (attachImage && image) {
                imageUrl = await handleImageUpload();
            }
            const res = await apiInstance.post("/issues", {
                location,
                altLocation,
                description,
                privateIssue: !publicIssue,
                image: imageUrl,
            });
            console.log(res);
            image = undefined;
            location = { longitude: 0, latitude: 0 };
            altLocation = "";
            description = "";
        } catch (err: any) {
            error =
                err.response?.data?.message ??
                err.message ??
                "خطأ: تعذر تحميل الطلب";
        } finally {
            loading = false;
        }
    };

    const handleImagePick = async (event: any) => {
        const file = event.target.files[0];
        loadingimage = true;

        try {
            const imageFile = file;
            console.log(
                "originalFile instanceof Blob",
                imageFile instanceof Blob,
            ); // true
            console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

            const options = {
                maxSizeMB: 1,
                //maxWidthOrHeight: 1080,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(imageFile, options);
            console.log(
                "compressedFile instanceof Blob",
                compressedFile instanceof Blob,
            ); // true
            console.log(
                `compressedFile size ${compressedFile.size / 1024 / 1024} MB`,
            ); // smaller than maxSizeMB
            //image = compressedFile; // write your own logic
            image = new File([compressedFile], file.name, {
                type: compressedFile.type,
            });
            previewUrl = URL.createObjectURL(image); // Set the new preview
        } catch (err: any) {
            error = err?.message ?? "خطأ: تعذر تحميل الصورة";
        } finally {
            loadingimage = false;
        }
    };

    const pickImage = () => {
        const hiddenInput = document.getElementById("hiddenInput");
        if (hiddenInput) {
            hiddenInput.click();
        }
    };

    const getLocation = () => {
        if (navigator.geolocation) {
            try {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (!position)
                            throw new Error(
                                "Geolocation is not supported by your browser.",
                            );
                        location = {
                            longitude: position.coords.longitude,
                            latitude: position.coords.latitude,
                        };

                        loading = false;
                    },
                    (err) => {
                        error = err.message;
                        loading = false;
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
                );
            } catch (error) {
                error = "Geolocation is not supported by your browser.";
                loading = false;
            }
        } else {
            error = "Geolocation is not supported by your browser.";
            loading = false;
        }
    };

    let image = $state<File | Blob | undefined>();
    let previewUrl = $state(""); // Store the preview string here
    let location: { longitude: number; latitude: number } = $state({
        longitude: 0,
        latitude: 0,
    });
    let altLocation = $state("");
    let description = $state("");
    let publicIssue = $state(false);
    let loadingimage = $state(false);
    let loading = $state(false);
    let error = $state("");
    let attachImage = $state(false);

    // Cleanup URLs to prevent memory leaks
    const revokePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };

    onDestroy(revokePreview);
</script>

<div class=" w-full h-full">
    {#if loading}
        <div class="w-full h-screen flex justify-center items-center">
            <Spinner class="size-8" />
        </div>
    {:else}
        <div class="m-12 mx-auto px-12 flex flex-wrap">
            <div class="hidden lg:flex justify-center items-center mx-auto">
                <img src={svgLogo} alt="logo" class="h-80 fill-white mx-auto" />
            </div>
            <div class="w-sm min-w-fit lg:w-1/2 mx-auto pt-12">
                <div class="max-w-sm">
                    <h1 class="text-3xl font-bold">تقديم بلاغك</h1>
                    <h2>ادخل معلومات البلاغ ادناه</h2>

                    <form onsubmit={handleSubmit}>
                        <Field.Group>
                            <Field.Field>
                                <Field.Label for="location">الموقع</Field.Label>
                                <Button onclick={getLocation}
                                    >تحديد تلقائي
                                    <LocateIcon /><LocationEdit /></Button
                                >
                                <Field.Label for="location"
                                    >ادخل الموقع بشكل يدوي في حال عدم توفر GPS
                                    في جهازك</Field.Label
                                >
                                {#if location.longitude != 0 || location.longitude != 0}
                                    <Field.Label for="location"
                                        >تم تحديد موقعك الحالي بنجاح</Field.Label
                                    >

                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                        ><Button
                                            variant="secondary"
                                            class="w-full"
                                        >
                                            <span> عرض على الخارطة </span>
                                            <ForwardIcon />
                                        </Button></a
                                    >
                                    <Button
                                        variant="secondary"
                                        class="w-full"
                                        onclick={() =>
                                            (location = {
                                                longitude: 0,
                                                latitude: 0,
                                            })}
                                    >
                                        <span>تراجع</span>
                                        <Trash2 />
                                    </Button>
                                {:else}
                                    <Input
                                        id="location"
                                        type="text"
                                        placeholder="اكتب الموقع"
                                        bind:value={altLocation}
                                        required
                                    />
                                {/if}
                            </Field.Field>
                            <Field.Field>
                                <Field.Label for="decription"
                                    >وصف المشكلة</Field.Label
                                >
                                <Textarea
                                    id="decription"
                                    placeholder="اضف وصفك هنا"
                                    required
                                    bind:value={description}
                                />
                            </Field.Field>
                            <Field.Field>
                                <Field.Label for="hiddenFileInput"
                                    >صورة المشكلة</Field.Label
                                >

                                <div class="flex items-center space-x-2">
                                    <Switch
                                        id="airplane-mode"
                                        bind:checked={attachImage}
                                    />
                                    <Label for="airplane-mode">ارفاق صورة</Label
                                    >
                                </div>
                                {#if attachImage}
                                    <input
                                        id="hiddenInput"
                                        class="hidden"
                                        type="file"
                                        onchange={(event: any) => {
                                            handleImagePick(event);
                                        }}
                                        accept="image/*"
                                    />
                                    <button type="button" onclick={pickImage}>
                                        {#if image}
                                            <img
                                                class="rounded-md p-2 aspect-square w-full object-cover"
                                                src={previewUrl}
                                                alt="category cover"
                                            />
                                        {:else}
                                            <div
                                                class="bg-white dark:bg-black rounded-md flex aspect-square w-full items-center justify-center border-2 border-dashed"
                                            >
                                                {#if loadingimage}
                                                    <Spinner />
                                                {:else}
                                                    <ImageIcon />
                                                {/if}
                                            </div>
                                        {/if}
                                    </button>

                                    <Field.Description
                                        >اختر صورة مرفقة توضح المشكلة</Field.Description
                                    >
                                {/if}
                            </Field.Field>

                            <Field.Field>
                                <Field.Label for="hiddenFileInput"
                                    >مشكلة عامة ؟</Field.Label
                                >

                                <div class="flex items-center space-x-2">
                                    <Switch
                                        id="airplane-mode"
                                        bind:checked={publicIssue}
                                    />
                                    <Label for="airplane-mode"
                                        >تفعيل هذا الخيار يسمح للمستخدمين
                                        الاخرين بروئية البلاغ والتفاعل معه
                                    </Label>
                                </div>
                            </Field.Field>
                            <Field.Group>
                                {#if error}
                                    <Field.Field>
                                        <Alert.Root
                                            variant="destructive"
                                            class="bg-destructive/10 text-destructive rounded-2xl border-none"
                                        >
                                            <AlertCircle class="size-5" />
                                            <Alert.Title class="font-bold"
                                                >خطأ</Alert.Title
                                            >
                                            <Alert.Description
                                                >{error}</Alert.Description
                                            >
                                        </Alert.Root>
                                    </Field.Field>
                                {/if}
                                <Field.Field>
                                    <Button type="submit">ارفع الشكوى</Button>
                                </Field.Field>
                            </Field.Group>
                        </Field.Group>
                    </form>
                </div>
            </div>
        </div>
    {/if}
</div>
