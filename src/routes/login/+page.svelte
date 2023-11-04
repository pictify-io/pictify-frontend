<script>
    export let isLogin = true;
    import GoogleIcon from '$lib/assets/login/GoogleIcons.svg';

    function handleLogin() {
        isLogin = true;
    }

    function handleSignUp() {
        isLogin = false;
    }
</script>

<section class="flex justify-center items-center w-screen h-screen">
    <div class="sm:border-2 sm:min-w-[400px] border-gray-900 p-10  max-w-sm ">
        <div class="flex flex-col items-center justify-center">
            <div class="my-5">
                <span class="text-4xl font-bold font-heading text-shadow">Medify </span> 
                <span class="text-xs font-heading text-gray-700">beta</span>
            </div>
            <hr class="border-gray-900 w-full" />
            <h1 class="text-xl font-bold my-5">Welcome 👋</h1>
            {#if isLogin}
            <p class="text-gray-700">Login to your account</p>
            {:else}
            <p class="text-gray-700">Create your account and start using medify now</p>
            {/if}
        </div>
        <div class="flex flex-col items-center justify-center mt-10">
            <input type="text" placeholder="Email" class="border-2 border-gray-900 p-2 rounded-md w-full" />
            <input type="password" placeholder="Password" class="border-2 border-gray-900 p-2 rounded-md w-full mt-4" />
            {#if isLogin}
            <div class="text-left w-full my-2 px-2">
                <a href="#" class="text-gray-700">Forgot password?</a>
            </div>
            {/if}

           <button class="bg-gray-900 text-white w-full p-2 rounded-md mt-4">
                {#if isLogin}
                Login
                {:else}
                Sign Up
                {/if}
            </button>


            {#if !isLogin}
            <p class="text-gray-700 mt-4">Already have an account? <a href={null} class="text-gray-900" on:click={handleLogin}>Login</a></p>
            {:else}
            <p class="text-gray-700 mt-4">Don't have an account? <a href={null} class="text-gray-900" on:click={handleSignUp}>Sign Up</a></p>
            {/if}
            <div class="flex w-full justify-center items-center my-5">
                <div class="flex-grow">
                    <hr class="border-gray-900" />
                </div>
                <p class="text-gray-700 mx-2">or</p>
                <div class="flex-grow">
                    <hr class="border-gray-900" />
                </div>
            </div>
            <a href="/auth/google" class="flex items-center justify-center bg-gray-900 text-white w-full p-2 rounded-md">
                <img src={GoogleIcon} alt="Google icon" class="w-5 h-5 mr-2" />
                <span>
                    {#if isLogin}
                    Login
                    {:else}
                    Sign Up
                    {/if}
                    with Google
                </span>
            </a>
        </div>
    </div>
</section>