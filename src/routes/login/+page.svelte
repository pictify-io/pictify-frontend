<script>
	export let isLogin = false;

    import GoogleIcon from '$lib/assets/login/GoogleIcons.svg';
    import CheckboxEmpty from '$lib/assets/login/CheckboxEmpty.svg';
    import Checkbox from '$lib/assets/login/Checkbox.svg';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
	import { loginAction, signupAction, getUserAction, isLoggedIn } from '../../store/user.store';

	let email = '';
	let password = '';
	let errorMessage;

    onMount(async () => {
       await getUserAction();
         if (isLoggedIn) {
              goto('/dashboard');
         }
    });

    $: isPasswordLengthValid = password.length >= 8;
    $: isPasswordContainsNumber = /\d/.test(password);
    $: isPasswordContainsUpperCase = /[A-Z]/.test(password);



    function resetState() {
        email = '';
        password = '';
        errorMessage = '';
    }

	function toggleToLogin() {
		isLogin = true;
        resetState();
	}

	function toggleToSignUp() {
		isLogin = false;
        resetState();
	}

  

	async function handleSubmit() {
		try {
			if (isLogin) {
				await loginAction(email, password);
			} else {
				await signupAction(email, password);
			}

		} catch (e) {
            console.log(e);
			errorMessage = e.message;
		}
	}
</script>

<section class="flex justify-center items-center w-screen h-screen">
	<div class="sm:border-2 sm:min-w-[400px] border-gray-900 p-5 sm:p-10 max-w-sm">
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
			<input
				bind:value={email}
				type="text"
				placeholder="Email"
				class="border-2 border-gray-900 p-2 rounded-md w-full"
			/>
			<input
				bind:value={password}
				type="password"
				placeholder="Password"
				class="border-2 border-gray-900 p-2 rounded-md w-full mt-4"
			/>
			{#if isLogin}
				<div class="text-left w-full my-2 px-2">
					<a href="#" class="text-gray-700">Forgot password?</a>
				</div>
			{/if}

			{#if errorMessage}
				<div class="text-red-500 mt-2 w-full text-left px-2">{errorMessage}</div>
			{/if}
            {#if !isLogin}
                <div class="w-full">
                    <div class="flex mt-2 text-left w-full items-center">
                        {#if !isPasswordLengthValid}
                            <img src={CheckboxEmpty} alt="Checkbox empty" class="w-5 h-5 mr-2" />
                        {:else}
                            <img src={Checkbox} alt="Checkbox" class="w-5 h-5 mr-2" />
                        {/if} 
                        <div class="text-gray-900 text-xs">Password must be at least 8 characters</div>
                    </div>
                    <div class="flex mt-2 text-left w-full items-center">
                        {#if !isPasswordContainsNumber}
                            <img src={CheckboxEmpty} alt="Checkbox empty" class="w-5 h-5 mr-2" />
                        {:else}
                            <img src={Checkbox} alt="Checkbox" class="w-5 h-5 mr-2" />
                        {/if} 
                        <div class="text-gray-900 text-xs">Password must contain at least 1 number</div>
                    </div>
                    <div class="flex mt-2 text-left w-full items-center">
                        {#if !isPasswordContainsUpperCase}
                            <img src={CheckboxEmpty} alt="Checkbox empty" class="w-5 h-5 mr-2" />
                        {:else}
                            <img src={Checkbox} alt="Checkbox" class="w-5 h-5 mr-2" />
                        {/if} 
                        <div class="text-gray-900 text-xs">Password must contain at least 1 uppercase letter</div>
                    </div> 
                </div>
            {/if}
			<button on:click={handleSubmit} class="bg-gray-900 text-white w-full p-2 rounded-md mt-4">
				{#if isLogin}
					Login
				{:else}
					Sign Up
				{/if}
			</button>

			{#if !isLogin}
				<p class="text-gray-700 mt-4">
					Already have an account? <a href={null} class="text-gray-900" on:click={toggleToLogin}
						>Login</a
					>
				</p>
			{:else}
				<p class="text-gray-700 mt-4">
					Don't have an account? <a href={null} class="text-gray-900" on:click={toggleToSignUp}
						>Sign Up</a
					>
				</p>
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
			<a
				href="/auth/google"
				class="flex items-center justify-center bg-gray-900 text-white w-full p-2 rounded-md"
			>
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
