<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import Wordmark from '$lib/components/landing/Wordmark.svelte';
	import { lookupConsentRequest, resolveConsentRequest } from '../../../api/oauth';
	import { getUser } from '../../../store/user.store';

	// Read once at mount. The handle is a one-shot secret from the /oauth/authorize
	// redirect, not something the user edits, so there is nothing to stay reactive to.
	const handle = get(page).url.searchParams.get('request') || '';

	let request = null; // { client_name, scope, redirect_host }
	let account = null;
	let loading = true;
	let error = null;
	let resolving = null; // 'approve' | 'deny'
	let denied = false;

	// The scopes we issue today. Anything we haven't got words for is still shown,
	// so a new scope can never render as a blank promise.
	const SCOPE_COPY = {
		'mcp:tools': 'Create and manage images, GIFs, videos, PDFs and templates on your behalf'
	};

	$: scopes = (request?.scope || '').split(/\s+/).filter(Boolean);

	onMount(async () => {
		if (!handle) {
			error = 'This link is missing its authorization request.';
			loading = false;
			return;
		}

		try {
			const userData = await getUser();
			account = userData?.email || null;
		} catch {
			account = null;
		}

		try {
			request = await lookupConsentRequest(handle);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	});

	async function resolve(action) {
		if (!account) {
			goto(`/login?redirect=${encodeURIComponent(`/oauth/consent?request=${handle}`)}`);
			return;
		}

		resolving = action;
		error = null;
		try {
			const response = await resolveConsentRequest(handle, action);
			if (action === 'deny') denied = true;
			// Hand the browser back to the client either way — a denial is an
			// answer the client is entitled to, and it carries error=access_denied.
			window.location.href = response.redirect_uri;
		} catch (err) {
			error = err.message;
			resolving = null;
		}
	}
</script>

<svelte:head>
	<title>Authorize access | Pictify</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- auth-v2 opts this page out of the app-wide root font-size down-scale (see app.css). -->
<div class="auth-v2 flex min-h-screen w-full flex-col items-center bg-brand-paper px-5 py-8 lg:py-16">
	<a href="/" class="flex items-center self-start lg:self-center" aria-label="Pictify home">
		<Wordmark size={26} text="lg" />
	</a>

	<div class="flex w-full max-w-[460px] flex-1 flex-col justify-center py-10">
		{#if loading}
			<div class="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.09em] text-brand-mute">
				<span class="h-4 w-4 animate-spin rounded-full border-2 border-brand-rule border-t-brand-ink" />
				Checking this request
			</div>
		{:else if error && !request}
			<div class="flex flex-col gap-3">
				<h1 class="font-display text-[38px] font-extrabold leading-[40px] tracking-[-0.04em] text-brand-ink">
					This request expired.
				</h1>
				<p class="font-sans text-base leading-6 text-brand-slate">
					{error} Start the connection again from the app that sent you here.
				</p>
			</div>
		{:else if denied}
			<div class="flex flex-col gap-3">
				<h1 class="font-display text-[38px] font-extrabold leading-[40px] tracking-[-0.04em] text-brand-ink">
					Not authorized.
				</h1>
				<p class="font-sans text-base leading-6 text-brand-slate">
					{request?.client_name || 'That app'} was not given access to your account.
				</p>
			</div>
		{:else if request}
			<div class="flex flex-col gap-[22px]">
				<div class="flex flex-col gap-2">
					<span class="font-mono text-[11px] uppercase tracking-[0.09em] text-brand-mute">
						Authorize access
					</span>
					<h1
						class="font-display text-[38px] font-extrabold leading-[40px] tracking-[-0.04em] text-brand-ink"
					>
						{request.client_name || 'An unnamed app'} wants into your Pictify account.
					</h1>
				</div>

				<ul class="flex flex-col gap-3 border-y-2 border-brand-rule py-5">
					{#each scopes as scope}
						<li class="flex gap-3 font-sans text-base leading-6 text-brand-slate">
							<span aria-hidden="true" class="mt-[9px] h-1.5 w-1.5 flex-shrink-0 bg-brand-blue" />
							<span>{SCOPE_COPY[scope] || scope}</span>
						</li>
					{/each}
					<li class="flex gap-3 font-sans text-base leading-6 text-brand-slate">
						<span aria-hidden="true" class="mt-[9px] h-1.5 w-1.5 flex-shrink-0 bg-brand-blue" />
						<span>
							Renders it makes count against your quota, and it can spend until you revoke it in
							<a
								href="/dashboard/api-token"
								class="font-semibold text-brand-ink underline underline-offset-[3px]"
							>
								your dashboard
							</a>.
						</span>
					</li>
				</ul>

				<dl class="flex flex-col gap-2 font-sans text-sm">
					<div class="flex justify-between gap-4">
						<dt class="text-brand-mute">Signed in as</dt>
						<dd class="truncate font-semibold text-brand-ink">{account || 'Not signed in'}</dd>
					</div>
					<div class="flex justify-between gap-4">
						<dt class="text-brand-mute">Sends you back to</dt>
						<dd class="truncate font-mono text-[13px] text-brand-ink">{request.redirect_host}</dd>
					</div>
				</dl>

				{#if error}
					<p class="font-sans text-sm text-brand-alarm">{error}</p>
				{/if}

				<div class="flex flex-col gap-3">
					<button
						type="button"
						on:click={() => resolve('approve')}
						disabled={!!resolving}
						class="flex h-14 w-full items-center justify-center rounded-btn bg-brand-ink font-sans text-[17px] font-bold text-brand-paper transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						{#if resolving === 'approve'}
							Authorizing…
						{:else if !account}
							Log in to continue
						{:else}
							Authorize
						{/if}
					</button>
					<button
						type="button"
						on:click={() => resolve('deny')}
						disabled={!!resolving || !account}
						class="flex h-14 w-full items-center justify-center rounded-btn border-2 border-brand-ink bg-brand-paper font-sans text-base font-semibold text-brand-ink transition-colors hover:bg-brand-canvas disabled:opacity-50"
					>
						{resolving === 'deny' ? 'Cancelling…' : 'Cancel'}
					</button>
				</div>

				<p class="font-sans text-[13px] leading-5 text-brand-mute">
					Only authorize an app you started this from yourself. Pictify will never ask you to
					approve a request someone else sent you.
				</p>
			</div>
		{/if}
	</div>
</div>
