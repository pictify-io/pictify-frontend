<script>
	export let isLogin = false;

	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loginAction, signupAction, getUser, isLoggedIn } from '../../../store/user.store';
	import { forgotPassword } from '../../../api/user';
	import { analytics } from '$lib/telemetry.js';
	import RenderWall from './RenderWall.svelte';
	import SignupPanel from './SignupPanel.svelte';

	let email = '';
	let password = '';
	let errorMessage;
	let redirectUrl;
	let showPassword = false;
	let submitting = false;
	/** Recovery is its own view now — it used to hijack the email field and
	 *  report success through the error box, which read as a failure. */
	let view = 'credentials';

	/**
	 * Validate redirect URL to prevent open redirect attacks.
	 * Only allows relative paths, same-origin URLs, or trusted Pictify domains.
	 */
	function validateRedirectUrl(url) {
		if (!url || url === 'null') return null;
		// Allow relative paths
		if (url.startsWith('/')) return url;
		// Allow absolute URLs to trusted domains
		try {
			const parsed = new URL(url);
			if (parsed.origin === window.location.origin)
				return parsed.pathname + parsed.search + parsed.hash;
			// Allow OAuth redirects back to the Pictify API
			if (parsed.hostname === 'api.pictify.io') return url;
		} catch (e) {
			// Invalid URL
		}
		return null;
	}

	async function safeRedirect({ justSignedUp = false } = {}) {
		/*
		 * New accounts go straight into onboarding. This replaces the /welcome
		 * PostHog experiment (`welcome-experiment-a`) rather than running beside
		 * it — two competing post-signup destinations would make both unreadable.
		 * Remember to stop that experiment before this ships, or its results will
		 * quietly become nonsense.
		 *
		 * `redirect` still wins when present: someone sent to sign up from a
		 * specific page meant to end up back there, and hijacking that to show
		 * onboarding would lose whatever they were actually doing.
		 */
		if (justSignedUp) {
			const pending = validateRedirectUrl(redirectUrl);
			if (!pending) {
				analytics.track('onboarding_entered', { from: 'signup' });
				goto('/onboarding');
				return;
			}
		}

		const safeUrl = validateRedirectUrl(redirectUrl);
		if (safeUrl) {
			// External trusted redirect (e.g. OAuth flow back to API)
			if (safeUrl.startsWith('http')) {
				window.location.href = safeUrl;
			} else {
				goto(safeUrl);
			}
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
	$: passwordMeetsRules =
		isPasswordLengthValid && isPasswordContainsNumber && isPasswordContainsUpperCase;
	// Submit stays shut on signup until the rules pass, so the form can't be
	// failed by the server for something the page already knows about.
	$: canSubmit = !submitting && email.trim() && password && (isLogin || passwordMeetsRules);

	$: rules = [
		{ label: '8 characters', ok: isPasswordLengthValid },
		{ label: 'a number', ok: isPasswordContainsNumber },
		{ label: 'a capital', ok: isPasswordContainsUpperCase }
	];

	$: altHref = isLogin
		? `/signup${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`
		: `/login${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`;

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		errorMessage = undefined;
		try {
			let justSignedUp = false;
			if (isLogin) {
				await loginAction(email, password);
			} else {
				await signupAction(email, password);
				justSignedUp = true;
				// Flag for post-signup welcome on tool pages
				if (typeof sessionStorage !== 'undefined') {
					sessionStorage.setItem('pictify_just_signed_up', '1');
				}
			}
			if (isLoggedIn()) {
				safeRedirect({ justSignedUp });
			}
		} catch (e) {
			errorMessage = e.message;
		} finally {
			submitting = false;
		}
	}

	function handleGoogleLogin() {
		let newWindow = window.open(PUBLIC_BACKEND_URL + '/login/google', '_blank') || { closed: true };

		const interval = setInterval(async () => {
			if (newWindow.closed) {
				clearInterval(interval);
				newWindow = { closed: true };
				const wasLoggedIn = isLoggedIn();
				await getUser();
				if (isLoggedIn()) {
					// If user wasn't logged in before, this is a new signup via Google
					const isFreshSignup = !wasLoggedIn && !isLogin;
					if (isFreshSignup && typeof sessionStorage !== 'undefined') {
						sessionStorage.setItem('pictify_just_signed_up', '1');
					}
					safeRedirect({ justSignedUp: isFreshSignup });
				}
			}
		}, 1000);
	}

	async function handleForgotPassword() {
		if (!email.trim()) {
			errorMessage = 'Enter the email you signed up with.';
			return;
		}
		submitting = true;
		errorMessage = undefined;
		try {
			await forgotPassword(email);
			view = 'sent';
		} catch (e) {
			errorMessage = e.message || 'Could not send the reset link. Try again.';
		} finally {
			submitting = false;
		}
	}

	function openForgot() {
		errorMessage = undefined;
		view = 'forgot';
	}

	function backToCredentials() {
		errorMessage = undefined;
		view = 'credentials';
	}
</script>

<!-- auth-v2 opts this page out of the app-wide root font-size down-scale (see app.css). -->
<div class="auth-v2 flex min-h-screen w-full bg-brand-paper">
	<div
		class="flex w-full flex-shrink-0 flex-col justify-between px-5 py-8 lg:w-[660px] lg:px-[88px] lg:py-11"
	>
		<a href="/" class="flex items-center gap-2.5" aria-label="Pictify home">
			<span class="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-brand-ink">
				<span class="block h-2.5 w-2.5 bg-brand-field"></span>
			</span>
			<span class="font-display text-[21px] font-extrabold tracking-[-0.03em] text-brand-ink">
				Pictify
			</span>
		</a>

		<div class="flex w-full flex-col gap-[22px] py-10 lg:py-0">
			{#if view === 'sent'}
				<div class="flex flex-col gap-2">
					<h1 class="font-display text-[46px] font-extrabold leading-[46px] tracking-[-0.04em] text-brand-ink">
						Check your inbox.
					</h1>
					<p class="font-sans text-base leading-6 text-brand-slate lg:w-[400px]">
						A reset link is on its way to <span class="font-semibold text-brand-ink">{email}</span>.
						It expires in an hour.
					</p>
				</div>
				<button
					type="button"
					on:click={backToCredentials}
					class="flex h-14 w-full items-center justify-center rounded-btn bg-brand-ink font-sans text-[17px] font-bold text-brand-paper transition-opacity hover:opacity-90"
				>
					Back to log in
				</button>
			{:else}
				<div class="flex flex-col gap-2">
					<h1 class="font-display text-[46px] font-extrabold leading-[46px] tracking-[-0.04em] text-brand-ink">
						{#if view === 'forgot'}Reset your password.{:else if isLogin}Welcome back.{:else}Start rendering.{/if}
					</h1>
					<p class="font-sans text-base leading-6 text-brand-slate lg:w-[400px]">
						{#if view === 'forgot'}
							Tell us the email you signed up with and we'll send a link.
						{:else if isLogin}
							Pick up where the renders left off.
						{:else}
							Free tier, no credit card. Your first render is about ninety seconds away.
						{/if}
					</p>
				</div>

				{#if view === 'credentials'}
					<button
						type="button"
						on:click={handleGoogleLogin}
						class="flex h-[54px] w-full items-center justify-center gap-3 rounded-btn border-2 border-brand-ink bg-brand-paper font-sans text-base font-semibold text-brand-ink transition-colors hover:bg-brand-canvas"
					>
						<svg width="19" height="19" viewBox="0 0 48 48" fill="none" aria-hidden="true">
							<path d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" fill="#4285F4" />
							<path d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" fill="#34A853" />
							<path d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" fill="#FBBC05" />
							<path d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" fill="#EA4335" />
						</svg>
						Continue with Google
					</button>

					<div class="flex w-full items-center gap-4">
						<span class="h-px flex-1 bg-brand-rule"></span>
						<span class="font-mono text-[11px] tracking-[0.1em] text-brand-mute">or</span>
						<span class="h-px flex-1 bg-brand-rule"></span>
					</div>
				{/if}

				<form class="flex w-full flex-col gap-[22px]" on:submit|preventDefault={view === 'forgot' ? handleForgotPassword : handleSubmit}>
					<div class="flex w-full flex-col gap-[7px]">
						<label for="email" class="font-mono text-[11px] uppercase tracking-[0.09em] text-[#6B6B68]">
							Email
						</label>
						<input
							id="email"
							bind:value={email}
							type="email"
							autocomplete="email"
							placeholder="you@yourcompany.com"
							class="h-[54px] w-full rounded-btn border-2 border-brand-ink bg-brand-paper px-4 font-sans text-base text-brand-ink outline-none placeholder:text-brand-mute focus-visible:ring-2 focus-visible:ring-brand-royal"
						/>
					</div>

					{#if view === 'credentials'}
						<div class="flex w-full flex-col gap-[7px]">
							<div class="flex items-center justify-between">
								<label for="password" class="font-mono text-[11px] uppercase tracking-[0.09em] text-[#6B6B68]">
									Password
								</label>
								{#if isLogin}
									<button
										type="button"
										on:click={openForgot}
										class="font-sans text-[13px] font-semibold text-brand-ink underline underline-offset-[3px]"
									>
										Forgot password?
									</button>
								{/if}
							</div>
							<div class="flex h-[54px] w-full items-center rounded-btn border-2 border-brand-ink bg-brand-paper px-4 focus-within:ring-2 focus-within:ring-brand-royal">
								<!-- Split rather than a dynamic `type`: Svelte forbids that with bind:value. -->
								{#if showPassword}
									<input
										id="password"
										bind:value={password}
										type="text"
										autocomplete={isLogin ? 'current-password' : 'new-password'}
										placeholder="••••••••••"
										class="h-full flex-1 bg-transparent font-sans text-base text-brand-ink outline-none placeholder:text-brand-mute"
									/>
								{:else}
									<input
										id="password"
										bind:value={password}
										type="password"
										autocomplete={isLogin ? 'current-password' : 'new-password'}
										placeholder="••••••••••"
										class="h-full flex-1 bg-transparent font-sans text-base text-brand-ink outline-none placeholder:text-brand-mute"
									/>
								{/if}
								<button
									type="button"
									on:click={() => (showPassword = !showPassword)}
									class="font-mono text-[11px] tracking-[0.06em] text-[#6B6B68] hover:text-brand-ink"
								>
									{showPassword ? 'hide' : 'show'}
								</button>
							</div>

							{#if !isLogin}
								<div class="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-[3px]">
									{#each rules as rule (rule.label)}
										<span class="flex items-center gap-1.5">
											<span
												class="block h-2 w-2 {rule.ok ? 'bg-brand-proof' : 'bg-[#D3D5CE]'}"
												aria-hidden="true"
											></span>
											<span class="font-mono text-[11px] {rule.ok ? 'text-[#3F5B47]' : 'text-brand-mute'}">
												{rule.label}
											</span>
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if errorMessage}
						<p
							role="alert"
							class="flex items-start gap-2.5 rounded-btn border-2 border-brand-ink bg-brand-rose px-4 py-3 font-sans text-[15px] leading-[21px] text-brand-ink"
						>
							<span class="mt-[6px] block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
							{errorMessage}
						</p>
					{/if}

					<button
						type="submit"
						disabled={view === 'forgot' ? submitting : !canSubmit}
						class="flex h-14 w-full items-center justify-center rounded-btn bg-brand-ink font-sans text-[17px] font-bold text-brand-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
					>
						{#if view === 'forgot'}
							{submitting ? 'Sending…' : 'Send reset link'}
						{:else if isLogin}
							{submitting ? 'Logging in…' : 'Log in'}
						{:else}
							{submitting ? 'Creating account…' : 'Create account'}
						{/if}
					</button>
				</form>

				{#if view === 'forgot'}
					<button
						type="button"
						on:click={backToCredentials}
						class="self-start font-sans text-[15px] font-semibold text-brand-ink underline underline-offset-[3px]"
					>
						Back to log in
					</button>
				{/if}
			{/if}
		</div>

		<div class="flex flex-col gap-3">
			<p class="flex items-center gap-1.5">
				<span class="font-sans text-[15px] text-brand-slate">
					{isLogin ? 'New to Pictify?' : 'Already have an account?'}
				</span>
				<a
					href={altHref}
					class="font-sans text-[15px] font-bold text-brand-ink underline underline-offset-[3px]"
				>
					{isLogin ? 'Create an account' : 'Log in'}
				</a>
			</p>
			{#if !isLogin}
				<p class="font-sans text-[13px] leading-[19px] text-brand-mute lg:w-[380px]">
					By creating an account you agree to the
					<a href="/terms" class="underline">Terms</a> and the
					<a href="/privacy" class="underline">Privacy Policy</a>.
				</p>
			{/if}
		</div>
	</div>

	<div class="hidden flex-1 lg:block">
		{#if isLogin}
			<RenderWall />
		{:else}
			<SignupPanel {email} />
		{/if}
	</div>
</div>
