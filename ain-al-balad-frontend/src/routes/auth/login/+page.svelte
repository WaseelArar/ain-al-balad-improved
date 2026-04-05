<script lang="ts">
    import LoginForm from "$lib/blocks/LoginForm.svelte";
    import svgLogo from "$lib/assets/ainalbalad.svg";
    import apiInstance from "$lib/api/api";
    import { setUser } from "@/stores/auth.store";
    import { goto } from "$app/navigation";

    import { page } from "$app/state";
    const dest = page.url.searchParams.get("goto") ?? "/";
    console.log(dest);

    async function login(username: string, password: string) {
        // Your authentication logic here
        console.log("Attempting login for:", username);

        try {
            const res = await apiInstance.post("/login", {
                username,
                password,
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
    <div class="items-center w-full">
        <img src={svgLogo} alt="logo" class="h-20 fill-white mx-auto" />
        <LoginForm {dest} {login} />
    </div>
</div>
