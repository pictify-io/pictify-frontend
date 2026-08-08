<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { lookupDeviceCode, resolveDeviceCode } from '../../api/oauth';
	import { getUser } from '../../store/user.store';

	// Read once at mount, not reactively — this also feeds the bound
	// <input>, and a `$:` re-derivation from $page fights that binding
	// (every keystroke's bind:value invalidation also marks $page dirty,
	// re-running the block and wiping out what was just typed).
	let userCode = (get(page).url.searchParams.get('user_code') || '').toUpperCase();
	let request = null; // { client_name, scope, status }
	let loading = false;
	let looked = false;
	let error = null;
	let resolving = false;
	let resolvedAs = null; // 'approved' | 'denied'
	let isAuthenticated = false;

	onMount(async () => {
		try {
			const userData = await getUser();
			isAuthenticated = !!userData?.email;
		} catch {
			isAuthenticated = false;
		}

		if (userCode) await lookup();
	});

	function normalizeCode(raw) {
		const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
		if (cleaned.length !== 8) return raw.toUpperCase();
		return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
	}

	async function lookup() {
		loading = true;
		error = null;
		request = null;
		try {
			request = await lookupDeviceCode(userCode);
			looked = true;
		} catch (err) {
			error = err.message;
			looked = true;
		} finally {
			loading = false;
		}
	}

	async function handleSubmitCode() {
		userCode = normalizeCode(userCode);
		await lookup();
	}

	async function handleResolve(action) {
		if (!isAuthenticated) {
			goto(`/login?redirect=${encodeURIComponent(`/device?user_code=${userCode}`)}`);
			return;
		}

		resolving = true;
		error = null;
		try {
			const response = await resolveDeviceCode(userCode, action);
			resolvedAs = response.status;
		} catch (err) {
			error = err.message;
		} finally {
			resolving = false;
		}
	}
</script>

<svelte:head>
	<title>Authorize Agent | Pictify</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-brand-bg flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-8">
			<a href="/" class="inline-block">
				<img loading="lazy" src="/logo.svg" alt="Pictify" class="h-10 mx-auto" />
			</a>
		</div>

		<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-lg overflow-hidden">
			<div class="px-8 py-6 bg-brand-accent border-b-[3px] border-gray-900 text-center">
				<h1 class="text-2xl font-black text-gray-900">Authorize Agent</h1>
			</div>

			<div class="p-8">
				{#if resolvedAs === 'approved'}
					<div class="text-center">
						<svg
							class="w-16 h-16 mx-auto text-green-500 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<h2 class="text-xl font-black text-gray-900 mb-2">Access granted</h2>
						<p class="text-gray-600">
							{request?.client_name || 'This agent'} can now access your Pictify account. You can close
							this tab and return to it.
						</p>
					</div>
				{:else if resolvedAs === 'denied'}
					<div class="text-center">
						<h2 class="text-xl font-black text-gray-900 mb-2">Request denied</h2>
						<p class="text-gray-600">
							{request?.client_name || 'This agent'} was not granted access. You can close this tab.
						</p>
					</div>
				{:else if !looked && !loading}
					<p class="text-gray-600 text-center mb-6">
						Enter the code shown by the agent or app requesting access.
					</p>
					<form on:submit|preventDefault={handleSubmitCode} class="flex flex-col gap-3">
						<input
							type="text"
							bind:value={userCode}
							placeholder="XXXX-XXXX"
							maxlength="9"
							class="w-full text-center text-2xl font-black tracking-widest uppercase px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-900 focus:outline-none"
						/>
						<button
							type="submit"
							disabled={!userCode || loading}
							class="w-full px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl border-2 border-gray-900 shadow-[3px_3px_0_0_#374151] hover:shadow-[1px_1px_0_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
						>
							Continue
						</button>
					</form>
				{:else if loading}
					<div class="flex items-center justify-center py-4">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
					</div>
				{:else if error && !request}
					<div class="text-center">
						<p class="text-red-600 font-bold mb-4">{error}</p>
						<button
							on:click={() => {
								userCode = '';
								error = null;
								looked = false;
							}}
							class="text-sm font-bold text-gray-600 underline"
						>
							Try a different code
						</button>
					</div>
				{:else if request}
					<div class="text-center mb-6">
						<div
							class="w-16 h-16 mx-auto rounded-xl bg-gray-100 border-2 border-gray-300 flex items-center justify-center mb-4"
						>
							<span class="text-2xl font-black text-gray-600">
								{(request.client_name || '?').charAt(0).toUpperCase()}
							</span>
						</div>
						<h2 class="text-xl font-black text-gray-900 mb-1">
							{request.client_name || 'An unnamed app'}
						</h2>
						<p class="text-gray-600 text-sm">wants access to your Pictify account</p>
					</div>

					<div class="bg-gray-50 rounded-lg p-4 mb-6">
						<div class="flex justify-between text-sm">
							<span class="text-gray-500">Requested scope:</span>
							<span class="font-bold text-gray-900">{request.scope}</span>
						</div>
					</div>

					{#if error}
						<div class="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4 text-center">
							<p class="text-red-600 text-sm">{error}</p>
						</div>
					{/if}

					{#if request.status !== 'pending'}
						<p class="text-center text-gray-600 text-sm">
							This request has already been {request.status}.
						</p>
					{:else}
						{#if !isAuthenticated}
							<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-center">
								<p class="text-blue-800 text-sm font-bold">
									Log in to your Pictify account to approve or deny this request.
								</p>
							</div>
						{/if}

						<div class="flex gap-3">
							<button
								on:click={() => handleResolve('deny')}
								disabled={resolving}
								class="flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl border-2 border-gray-300 hover:bg-gray-200 transition-colors disabled:opacity-50"
							>
								Deny
							</button>
							<button
								on:click={() => handleResolve('approve')}
								disabled={resolving}
								class="flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl border-2 border-gray-900 shadow-[3px_3px_0_0_#374151] hover:shadow-[1px_1px_0_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
							>
								{#if resolving}
									Working...
								{:else if !isAuthenticated}
									Log in to Approve
								{:else}
									Approve
								{/if}
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<p class="text-center text-gray-600 text-sm mt-6">
			Only approve requests you started yourself, from a device or agent you trust.
		</p>
	</div>
</div>
