
<script>
	export let isLogin = false;

	import GoogleIcon from '$lib/assets/login/GoogleIcons.svg';
	import CheckboxEmpty from '$lib/assets/login/CheckboxEmpty.svg';
	import Checkbox from '$lib/assets/login/Checkbox.svg';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loginAction, signupAction, getUser, isLoggedIn } from '../../../store/user.store';
	import { forgotPassword } from '../../../api/user';
	import { analytics } from '$lib/analytics.js';

	let email = '';
	let password = '';
	let errorMessage;
	let isForgotPassword = false;
	let redirectUrl;

	/**
	 * Validate redirect URL to prevent open redirect attacks.
	 * Only allows relative paths or same-origin URLs.
	 */
	function validateRedirectUrl(url) {
		if (!url || url === 'null') return null;
		// Allow relative paths
		if (url.startsWith('/')) return url;
		// Reject absolute URLs to external domains
		try {
			const parsed = new URL(url, window.location.origin);
			if (parsed.origin === window.location.origin) return parsed.pathname + parsed.search + parsed.hash;
		} catch (e) {
			// Invalid URL
		}
		return null;
	}

	function safeRedirect() {
		const safeUrl = validateRedirectUrl(redirectUrl);
		if (safeUrl) {
			goto(safeUrl);
		} else {
			goto('/dashboard');
		}
	}

	onMount(async () => {
		redirectUrl = new URLSearchParams(window.location.search).get('redirect');
		if (!isLogin) {
			const emailFromParams = new URLSearchParams(window.location.search).get('email');
			if (emailFromParams) {
				email = emailFromParams;
			}
			// Track signup page viewed
			analytics.trackSignupStarted({ source: redirectUrl || 'direct' });
		}
		await getUser();
		if (isLoggedIn()) {
			safeRedirect();
		}
	});

	$: isPasswordLengthValid = password.length >= 8;
	$: isPasswordContainsNumber = /\d/.test(password);
	$: isPasswordContainsUpperCase = /[A-Z]/.test(password);

	async function handleSubmit() {
		try {
			if (isLogin) {
				await loginAction(email, password);
			} else {
				await signupAction(email, password);
			}
			if (isLoggedIn()) {
				safeRedirect();
			}
		} catch (e) {
			errorMessage = e.message;
		}
	}

	function handleGoogleLogin() {
		let newWindow = window.open(PUBLIC_BACKEND_URL + '/login/google', '_blank') || { closed: true };

		const interval = setInterval(async () => {
			if (newWindow.closed) {
				clearInterval(interval);
				newWindow = { closed: true };
				await getUser();
				if (isLoggedIn()) {
					safeRedirect();
				}
			}
		}, 1000);
	}

	function handleForgotPassword() {
		if (!email) {
			errorMessage = 'Please enter your email';
			return;
		}
		try {
			forgotPassword(email);
			errorMessage = `Password reset link sent to ${email}`;
		} catch (e) {
			errorMessage = e.message;
		}
	}
</script>

<section class="min-h-screen w-full bg-[#FFFDF8] flex items-center justify-center p-4 relative overflow-hidden">
	<!-- Background Pattern -->
	<div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
			 style="background-image: linear-gradient(#000 1px, transparent 1px), 
							linear-gradient(90deg, #000 1px, transparent 1px); 
							background-size: 40px 40px;">
	</div>

	<!-- Decorative Blobs -->
	<div class="absolute top-0 right-0 w-96 h-96 bg-[#ffc480]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
	<div class="absolute bottom-0 left-0 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

	<div class="bg-white border-[3px] border-black shadow-[8px_8px_0_0_black] rounded-3xl p-6 md:p-10 w-full max-w-md relative z-10 transition-all duration-300">
		<div class="flex flex-col items-center justify-center mb-8">
			<!-- Logo/Brand -->
			<div class="mb-6 inline-block px-6 py-2 bg-[#ffc480] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
				<span class="text-2xl font-black text-black tracking-tight">Pictify</span>
			</div>
			
			<h1 class="text-3xl md:text-4xl font-black text-center leading-tight mb-2">
				{#if isLogin}
					Welcome Back! 👋
				{:else}
					Start Creating 🚀
				{/if}
			</h1>
			
			<p class="text-gray-600 font-medium text-center">
				{#if isLogin}
					Login to continue your journey
				{:else}
					Join proactively and visualize more
				{/if}
			</p>
		</div>

		<div class="flex flex-col gap-4">
			<div class="space-y-1">
				<label class="font-bold text-sm ml-1" for="email">Email Address</label>
				<input
					id="email"
					bind:value={email}
					type="email"
					placeholder="name@example.com"
					class="w-full border-[3px] border-black p-3 rounded-xl focus:outline-none focus:shadow-[4px_4px_0_0_black] transition-shadow text-lg font-medium placeholder:text-gray-400"
				/>
			</div>

			<div class="space-y-1">
				<div class="flex justify-between items-center ml-1">
					<label class="font-bold text-sm" for="password">Password</label>
					{#if isLogin}
						<button 
							on:click={handleForgotPassword}
							class="text-sm font-bold text-[#ff6b6b] hover:text-black hover:underline transition-colors"
						>
							Forgot password?
						</button>
					{/if}
				</div>
				<input
					id="password"
					bind:value={password}
					type="password"
					placeholder="••••••••"
					class="w-full border-[3px] border-black p-3 rounded-xl focus:outline-none focus:shadow-[4px_4px_0_0_black] transition-shadow text-lg font-medium placeholder:text-gray-400"
				/>
			</div>

			{#if errorMessage}
				<div class="bg-[#ff6b6b]/10 border-2 border-[#ff6b6b] text-[#ff6b6b] p-3 rounded-xl font-bold flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
					<span>{errorMessage}</span>
				</div>
			{/if}

			{#if !isLogin}
				<div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-2">
					<p class="font-bold text-sm text-gray-500 mb-2 uppercase tracking-wider">Password Requirements</p>
					
					<div class="flex items-center gap-3 transition-colors duration-200 {isPasswordLengthValid ? 'text-green-600' : 'text-gray-400'}">
						<div class="w-5 h-5 border-2 {isPasswordLengthValid ? 'bg-green-500 border-green-600' : 'border-gray-300'} rounded-md flex items-center justify-center transition-all">
							{#if isPasswordLengthValid}
								<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
							{/if}
						</div>
						<span class="text-sm font-bold">At least 8 characters</span>
					</div>

					<div class="flex items-center gap-3 transition-colors duration-200 {isPasswordContainsNumber ? 'text-green-600' : 'text-gray-400'}">
						<div class="w-5 h-5 border-2 {isPasswordContainsNumber ? 'bg-green-500 border-green-600' : 'border-gray-300'} rounded-md flex items-center justify-center transition-all">
							{#if isPasswordContainsNumber}
								<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
							{/if}
						</div>
						<span class="text-sm font-bold">At least 1 number</span>
					</div>

					<div class="flex items-center gap-3 transition-colors duration-200 {isPasswordContainsUpperCase ? 'text-green-600' : 'text-gray-400'}">
						<div class="w-5 h-5 border-2 {isPasswordContainsUpperCase ? 'bg-green-500 border-green-600' : 'border-gray-300'} rounded-md flex items-center justify-center transition-all">
							{#if isPasswordContainsUpperCase}
								<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"></path></svg>
							{/if}
						</div>
						<span class="text-sm font-bold">At least 1 uppercase letter</span>
					</div>
				</div>
			{/if}

			<button 
				on:click={handleSubmit} 
				class="bg-[#ff6b6b] text-black w-full py-3 px-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-0.5 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-lg mt-2 uppercase tracking-wide"
			>
				{#if isLogin}
					Login
				{:else}
					Create Account
				{/if}
			</button>

			<div class="relative flex py-2 items-center">
				<div class="flex-grow border-t-2 border-gray-200"></div>
				<span class="flex-shrink-0 mx-4 text-gray-400 font-bold text-sm uppercase">Or continue with</span>
				<div class="flex-grow border-t-2 border-gray-200"></div>
			</div>

			<button
				on:click={handleGoogleLogin}
				class="bg-white text-black w-full py-3 px-4 rounded-xl border-[3px] border-black shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] hover:-translate-y-0.5 active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-bold text-lg flex items-center justify-center gap-3"
			>
				<img src={GoogleIcon} alt="Google" class="w-6 h-6" />
				<span>Google</span>
			</button>
		</div>

		<div class="mt-8 text-center">
			{#if !isLogin}
				<p class="text-gray-600 font-medium">
					Already have an account? <a href="/login?redirect={redirectUrl}" class="font-black text-black hover:text-[#ff6b6b] hover:underline decoration-[3px] underline-offset-4 transition-all">Login</a>
				</p>
				<div class="mt-6 text-xs text-gray-400 font-medium px-4">
					By signing up, you agree to our 
					<a href="/terms" class="text-gray-500 hover:text-black underline">Terms</a>
					and
					<a href="/privacy" class="text-gray-500 hover:text-black underline">Privacy Policy</a>.
				</div>
			{:else}
				<p class="text-gray-600 font-medium">
					Don't have an account? <a href="/signup?redirect={redirectUrl}" class="font-black text-black hover:text-[#ff6b6b] hover:underline decoration-[3px] underline-offset-4 transition-all">Sign Up</a>
				</p>
			{/if}
		</div>
	</div>
</section>
