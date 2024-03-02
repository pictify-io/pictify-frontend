<script>
  import { onMount } from 'svelte';
  import { toast } from '../../../store/toast.store';
  import Toast from "$lib/components/Toast.svelte";
  import CheckboxEmpty from '$lib/assets/login/CheckboxEmpty.svg';
	import Checkbox from '$lib/assets/login/Checkbox.svg';
  import { resetPassword } from '../../../api/user';
	import { goto } from '$app/navigation'; 
  import { page } from '$app/stores';

  let token = '';
  let password = '';
  let confirmPassword = '';
  let isLoading = false;

  $: isPasswordLengthValid = password.length >= 8;
	$: isPasswordContainsNumber = /\d/.test(password);
	$: isPasswordContainsUpperCase = /[A-Z]/.test(password);
  $: isPasswordMatch = password === confirmPassword && password.length > 0;

  onMount(() => {
    console.log($page.params.token);
    token = $page.params.token;
  });

  async function handleSubmit() {
    if (password !== confirmPassword) {
      toast.set({ message: 'Passwords do not match', duration: 1500 });
      return;
    }
    isLoading = true;
    try {
      await resetPassword({ token, password });
      toast.set({ message: 'Password reset successfully', duration: 1500 });
      goto('/login');
    } catch (e) {
      console.log(e);
      toast.set({ message: e.response.data.message, duration: 1500 });
    }
    isLoading = false;
  }
</script>

<section>
  <Toast  />
  <div class="flex justify-center items-center w-screen h-screen">
    <div class="sm:border-2 sm:min-w-[400px] border-gray-900 p-5 sm:p-10 max-w-sm">
      <div class="flex flex-col items-center justify-center">
        <div class="my-5">
          <span class="text-4xl font-bold font-heading text-shadow">Pictify </span>
          <span class="text-xs font-heading text-gray-700">beta</span>
        </div>
      </div>
      <hr class="border-gray-900 w-full" />
      <p class="text-gray-700 text-center mt-2">Reset your password</p>
      <div class="flex flex-col items-center justify-center mt-10">
        <input
          bind:value={password}
          type="password"
          placeholder="New Password"
          class="border-2 border-gray-900 p-2 rounded-md w-full"
        />
        <input
          bind:value={confirmPassword}
          type="password"
          placeholder="Confirm Password"
          class="border-2 border-gray-900 p-2 rounded-md w-full mt-4"
        />
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
						<div class="text-gray-900 text-xs">
							Password must contain at least 1 uppercase letter
						</div>
					</div>
          <div class="flex mt-2 text-left w-full items-center">
            {#if !isPasswordMatch}
              <img src={CheckboxEmpty} alt="Checkbox empty" class="w-5 h-5 mr-2" />
            {:else}
              <img src={Checkbox} alt="Checkbox" class="w-5 h-5 mr-2" />
            {/if}
            <div class="text-gray-900 text-xs">Passwords must match</div>
            </div>
				</div>

        <button
          class="mt-4 text-sm text-gray-900 hover:text-gray-900 font-bold py-1 px-4 rounded border-2 border-black disabled:opacity-50"
          on:click={handleSubmit}
          disabled={!isPasswordLengthValid || !isPasswordContainsNumber || !isPasswordContainsUpperCase || !isPasswordMatch}
        >
          {#if isLoading}
            <div class="flex items-center justify-center">
              <div class="w-4 h-4 border-2 border-t-2 border-gray-900 rounded-full animate-spin"></div>
              </div>
          {:else}
            Reset Password
          {/if}
        </div>
    </div>
  </div>
</section>
