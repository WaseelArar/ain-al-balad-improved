<script lang="ts">
    import SignUpForm from "$lib/blocks/SignUpForm.svelte";
    import svgLogo from "$lib/assets/ainalbalad.svg";
    import apiInstance from "@/lib/api/api";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { setUser } from "@/stores/auth.store";
    const dest = page.url.searchParams.get("goto") ?? "/";
    console.log(dest);

    async function signup(
        username: string,
        phone: string,
        password: string,
        regionsId: string,
    ) {
        // Your authentication logic here
        console.log("Attempting SignUp for:", username);

        try {
            const res = await apiInstance.post("/signup", {
                username,
                phone,
                password,
                regionsId,
            });
            setUser(res.data.user);
            goto(dest);
        } catch (err: any) {
            throw err;
        }
    }
</script>

<div
    class="w-full min-h-fit h-screen overflow-scroll flex items-center justify-center"
>
    <div class="items-center w-full min-h-fit">
        <img src={svgLogo} alt="logo" class="h-20 fill-white mx-auto" />
        <SignUpForm {dest} {signup} />
    </div>
</div>
