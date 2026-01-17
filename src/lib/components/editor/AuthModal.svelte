<script>
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';
	import { loginAction, signupAction, getUser, user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	export let isOpen = false;
	export let onSuccess = () => {};

	const dispatch = createEventDispatcher();

	let activeTab = 'signup'; // 'login' or 'signup'
	let email = '';
	let password = '';
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';

	// Password validation
	$: isPasswordLengthValid = password.length >= 8;
	$: isPasswordContainsNumber = /\d/.test(password);
	$: isPasswordContainsUpperCase = /[A-Z]/.test(password);
	$: isPasswordValid = isPasswordLengthValid && isPasswordContainsNumber && isPasswordContainsUpperCase;
	$: isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	function closeModal() {
		isOpen = false;
		dispatch('close');
		// Reset form with delay
		setTimeout(() => {
			email = '';
			password = '';
			errorMessage = '';
			successMessage = '';
			activeTab = 'signup';
		}, 300);
	}

	async function handleSubmit() {
		if (!email || !password) {
			errorMessage = 'Please fill in all fields';
			return;
		}

		if (!isEmailValid) {
			errorMessage = 'Please enter a valid email';
			return;
		}

		if (activeTab === 'signup' && !isPasswordValid) {
			errorMessage = 'Password must meet all requirements';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			if (activeTab === 'login') {
				await loginAction(email, password);
				successMessage = 'Welcome back! Redirecting...';
			} else {
				await signupAction(email, password);
				successMessage = 'Account created successfully!';
			}

			// Refresh user data
			await getUser();

			// Show success message
			toast.set({
				message: successMessage,
				duration: 2000
			});

			// Clean up localStorage draft if exists
			const DRAFT_KEY = 'pictify_template_draft_v1';
			if (localStorage.getItem(DRAFT_KEY)) {
				// We'll keep the draft for now - the user might want to continue with it
				// The template creation flow should handle this appropriately
			}

			// Call success callback
			setTimeout(() => {
				onSuccess();
				closeModal();
			}, 500);

		} catch (e) {
			errorMessage = e.message || 'An error occurred. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleGoogleAuth() {
		const authWindow = window.open(
			`${PUBLIC_BACKEND_URL}/login/google`,
			'_blank',
			'width=500,height=600'
		);

		const checkInterval = setInterval(async () => {
			if (authWindow?.closed) {
				clearInterval(checkInterval);

				// Check if login was successful
				await getUser();
				if ($user?.email) {
					successMessage = 'Login successful!';
					toast.set({
						message: 'Successfully logged in with Google!',
						duration: 2000
					});

					setTimeout(() => {
						onSuccess();
						closeModal();
					}, 500);
				}
			}
		}, 1000);
	}

	// Close on escape key
	function handleKeydown(e) {
		if (e.key === 'Escape' && isOpen) {
			closeModal();
		}
	}

	// Prevent modal body clicks from closing modal
	function handleModalClick(e) {
		e.stopPropagation();
	}

	function switchTab(tab) {
		activeTab = tab;
		errorMessage = '';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60"
		transition:fade={{ duration: 200 }}
		on:click={closeModal}
	>
		<div
			class="relative w-full max-w-md"
			transition:fly={{ y: 30, duration: 300, easing: quintOut }}
			on:click={handleModalClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<!-- Main Modal -->
			<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
				<!-- Close Button -->
				<button
					class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg border-[2px] border-gray-900 bg-white hover:bg-gray-100 transition-colors z-20"
					on:click={closeModal}
					aria-label="Close modal"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				<!-- Header -->
				<div class="bg-[#FFFDF8] p-6 text-center border-b-[3px] border-gray-900">
					<h2 id="modal-title" class="text-2xl font-black text-gray-900 mb-2">
						{activeTab === 'signup' ? 'Create Your Account' : 'Welcome Back'}
					</h2>
					<p class="text-sm text-gray-600 font-medium">
						{activeTab === 'signup'
							? 'Start creating dynamic media in seconds'
							: 'Sign in to access your templates'}
					</p>
				</div>

				<!-- Tabs -->
				<div class="flex border-b-[3px] border-gray-900">
					<button
						class="flex-1 py-3 px-4 font-bold text-sm uppercase tracking-wider transition-colors relative
							{activeTab === 'signup'
								? 'bg-white text-gray-900'
								: 'bg-gray-100 text-gray-500 hover:text-gray-700'}"
						on:click={() => switchTab('signup')}
					>
						Sign Up
						{#if activeTab === 'signup'}
							<div class="absolute bottom-0 left-0 w-full h-[3px] bg-[#ffc480]"></div>
						{/if}
					</button>
					<div class="w-[3px] bg-gray-900"></div>
					<button
						class="flex-1 py-3 px-4 font-bold text-sm uppercase tracking-wider transition-colors relative
							{activeTab === 'login'
								? 'bg-white text-gray-900'
								: 'bg-gray-100 text-gray-500 hover:text-gray-700'}"
						on:click={() => switchTab('login')}
					>
						Log In
						{#if activeTab === 'login'}
							<div class="absolute bottom-0 left-0 w-full h-[3px] bg-[#ff6b6b]"></div>
						{/if}
					</button>
				</div>

				<!-- Form -->
				<form class="p-6 space-y-4" on:submit|preventDefault={handleSubmit}>
					<!-- Google Auth -->
					<button
						type="button"
						class="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm"
						on:click={handleGoogleAuth}
						disabled={isLoading}
					>
						<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5" />
						<span>Continue with Google</span>
					</button>

					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t-2 border-gray-200"></div>
						</div>
						<div class="relative flex justify-center">
							<span class="px-3 bg-white text-xs font-bold text-gray-500 uppercase">Or</span>
						</div>
					</div>

					<!-- Email Input -->
					<div>
						<label for="email" class="block text-sm font-bold text-gray-700 mb-1">
							Email Address
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all text-sm font-medium"
							disabled={isLoading}
							required
						/>
						{#if email && !isEmailValid}
							<p class="mt-1 text-xs text-red-600 font-medium">Please enter a valid email</p>
						{/if}
					</div>

					<!-- Password Input -->
					<div>
						<label for="password" class="block text-sm font-bold text-gray-700 mb-1">
							Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							class="w-full px-4 py-3 border-[3px] border-gray-900 rounded-xl focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all text-sm font-medium"
							disabled={isLoading}
							required
						/>
					</div>

					<!-- Password Requirements (Signup only) -->
					{#if activeTab === 'signup'}
						<div class="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 rounded-full {isPasswordLengthValid ? 'bg-green-500' : 'bg-gray-300'}"></div>
								<span class="font-medium {isPasswordLengthValid ? 'text-gray-900' : 'text-gray-500'}">
									At least 8 characters
								</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 rounded-full {isPasswordContainsNumber ? 'bg-green-500' : 'bg-gray-300'}"></div>
								<span class="font-medium {isPasswordContainsNumber ? 'text-gray-900' : 'text-gray-500'}">
									Contains a number
								</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-4 h-4 rounded-full {isPasswordContainsUpperCase ? 'bg-green-500' : 'bg-gray-300'}"></div>
								<span class="font-medium {isPasswordContainsUpperCase ? 'text-gray-900' : 'text-gray-500'}">
									Contains an uppercase letter
								</span>
							</div>
						</div>
					{/if}

					<!-- Error Message -->
					{#if errorMessage}
						<div class="bg-red-50 border-[2px] border-red-500 rounded-xl p-3">
							<p class="text-sm font-medium text-red-700">{errorMessage}</p>
						</div>
					{/if}

					<!-- Success Message -->
					{#if successMessage}
						<div class="bg-green-50 border-[2px] border-green-500 rounded-xl p-3">
							<p class="text-sm font-medium text-green-700">{successMessage}</p>
						</div>
					{/if}

					<!-- Submit Button -->
					<button
						type="submit"
						class="w-full py-3 px-6 bg-gray-900 text-white font-bold text-base uppercase tracking-wider rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isLoading || !email || !password || (activeTab === 'signup' && !isPasswordValid)}
					>
						{#if isLoading}
							<span class="flex items-center justify-center gap-2">
								<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Processing...
							</span>
						{:else}
							{activeTab === 'signup' ? 'Create Account' : 'Log In'}
						{/if}
					</button>

					<!-- Footer Text -->
					<p class="text-center text-sm text-gray-600">
						{#if activeTab === 'signup'}
							Already have an account?
							<button
								type="button"
								class="font-bold text-gray-900 hover:text-[#ff6b6b] transition-colors"
								on:click={() => switchTab('login')}
							>
								Log in
							</button>
						{:else}
							Don't have an account?
							<button
								type="button"
								class="font-bold text-gray-900 hover:text-[#ffc480] transition-colors"
								on:click={() => switchTab('signup')}
							>
								Sign up
							</button>
						{/if}
					</p>
				</form>
			</div>
		</div>
	</div>
{/if}