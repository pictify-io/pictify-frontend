<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { user } from '../../store/user.store';
	import { getUser } from '../../store/user.store';
	import { getApiToken, createApiToken } from '../../api/user';
	import { createImage } from '../../api/image.js';
	import { getLastRender, clearLastRender } from '$lib/lastRender.js';
	import { analytics } from '$lib/analytics.js';

	let apiKey = '';
	let apiKeyLoading = true;
	let copied = false;
	let lastRender = null;

	let runState = 'idle'; // idle | running | success | error
	let runResultUrl = '';
	let runError = '';

	$: isLoggedIn = !!$user?.email;
	$: hasRender = !!lastRender && (lastRender.html || lastRender.url);

	$: curlCommand = buildCurlCommand({ apiKey, lastRender });

	function buildCurlCommand({ apiKey: key, lastRender: lr }) {
		const token = key || 'YOUR_API_KEY';
		const body = lr?.url
			? {
					url: lr.url,
					width: lr.width || 1280,
					height: lr.height || 720,
					fileExtension: lr.format || 'png'
			  }
			: {
					html: lr?.html || '<h1>Hello from Pictify</h1>',
					width: lr?.width || 1280,
					height: lr?.height || 720,
					fileExtension: lr?.format || 'png'
			  };
		const pretty = JSON.stringify(body, null, 2).split('\n').join('\n  ');
		return [
			`curl -X POST ${PUBLIC_BACKEND_URL}/image \\`,
			`  -H "Authorization: Bearer ${token}" \\`,
			`  -H "Content-Type: application/json" \\`,
			`  -d '${pretty}'`
		].join('\n');
	}

	onMount(async () => {
		if (!browser) return;

		// Ensure we have a current user session (refresh from server in case the
		// page is opened after the OAuth popup closes and the store isn't synced).
		await getUser();
		if (!isLoggedIn) {
			goto('/login?redirect=/welcome');
			return;
		}

		lastRender = getLastRender();

		// Get-or-create the user's primary API key. This is THE auto-issue moment:
		// every new signup leaves /welcome with a working key, no friction.
		try {
			const tokens = await getApiToken();
			if (tokens?.apiTokens?.length) {
				apiKey = tokens.apiTokens[0].token;
			} else {
				const created = await createApiToken();
				apiKey = created?.apiToken?.token || created?.token || '';
				if (apiKey) {
					analytics.track('api_key_created', { source: 'welcome_auto' });
				}
			}
		} catch {
			/* surface to user via empty key — they can still copy the cURL with placeholder */
		} finally {
			apiKeyLoading = false;
		}

		analytics.track('welcome_viewed', {
			has_last_render: hasRender,
			tool: lastRender?.tool || null,
			render_type: lastRender?.type || null
		});
	});

	function copyKey() {
		if (!apiKey) return;
		navigator.clipboard.writeText(apiKey);
		copied = true;
		analytics.track('content_copied', { content_type: 'api_key', context: 'welcome' });
		setTimeout(() => (copied = false), 2000);
	}

	function copyCurl() {
		navigator.clipboard.writeText(curlCommand);
		analytics.track('content_copied', { content_type: 'curl', context: 'welcome' });
	}

	async function runFromBrowser() {
		if (runState === 'running' || !apiKey) return;
		runState = 'running';
		runError = '';
		runResultUrl = '';

		analytics.track('welcome_curl_run', {
			tool: lastRender?.tool || null,
			render_type: lastRender?.type || null,
			has_last_render: hasRender
		});

		try {
			const payload = lastRender?.url
				? {
						url: lastRender.url,
						width: lastRender.width || 1280,
						height: lastRender.height || 720,
						fileExtension: lastRender.format || 'png',
						apiKey
				  }
				: {
						html: lastRender?.html || '<h1>Hello from Pictify</h1>',
						width: lastRender?.width || 1280,
						height: lastRender?.height || 720,
						fileExtension: lastRender?.format || 'png',
						apiKey
				  };

			const result = await createImage(payload);
			runResultUrl = result?.url || '';
			runState = 'success';
			analytics.track('welcome_curl_run_succeeded', {
				tool: lastRender?.tool || null,
				resulted_in_url: !!runResultUrl
			});
		} catch (err) {
			runState = 'error';
			runError = err?.message || 'Render failed — try from your terminal instead.';
			analytics.track('welcome_curl_run_failed', { error: runError });
		}
	}

	function ctaClicked() {
		analytics.track('welcome_cta_clicked', {
			tool: lastRender?.tool || null,
			ran_curl_first: runState === 'success'
		});
		clearLastRender();
	}

	function skipToDashboard() {
		analytics.track('welcome_skipped', { tool: lastRender?.tool || null });
		clearLastRender();
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Welcome to Pictify — Render this from your terminal</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="min-h-screen w-full bg-[#FFFDF8] relative overflow-hidden">
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-0 right-0 w-96 h-96 bg-[#ffc480]/30 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 left-0 w-96 h-96 bg-[#4ade80]/15 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>

	<div class="relative z-10 mx-auto max-w-5xl px-4 py-10 md:py-14">
		<div class="mb-8 flex items-center justify-between">
			<div
				class="inline-block px-5 py-1.5 bg-[#ffc480] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full -rotate-1"
			>
				<span class="text-xl font-black tracking-tight">Pictify</span>
			</div>
			<button
				on:click={skipToDashboard}
				class="text-sm font-bold text-gray-500 hover:text-black underline-offset-4 hover:underline"
			>
				Skip → Dashboard
			</button>
		</div>

		<h1 class="text-4xl md:text-5xl font-black leading-tight mb-3">
			You're in. Now render it <span class="bg-[#4ade80] px-2 border-[2px] border-black">from your terminal</span>.
		</h1>
		<p class="text-lg font-medium text-gray-700 max-w-3xl mb-8">
			The image you just made is one cURL away from being automated. Run it now, then put the same call inside the app you're actually building.
		</p>

		<div class="grid md:grid-cols-2 gap-6 mb-6">
			<!-- Left: render preview -->
			<div
				class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 flex flex-col"
			>
				<div class="flex items-center justify-between mb-3">
					<h2 class="font-black uppercase tracking-tight text-sm">What you just rendered</h2>
					{#if lastRender?.tool}
						<span class="text-xs font-bold text-gray-500">{lastRender.tool.replace(/_/g, ' ')}</span>
					{/if}
				</div>

				<div class="flex-1 min-h-[260px] border-[2px] border-black bg-gray-50 flex items-center justify-center overflow-hidden">
					{#if lastRender?.imageUrl}
						<img
							src={lastRender.imageUrl}
							alt="Your last render"
							class="max-w-full max-h-[360px] object-contain"
						/>
					{:else if lastRender?.url}
						<div class="text-center p-6">
							<div class="text-xs font-bold text-gray-500 uppercase mb-2">Source URL</div>
							<a
								href={lastRender.url}
								target="_blank"
								rel="noopener"
								class="text-sm font-mono break-all text-[#ff6b6b] hover:underline"
							>
								{lastRender.url}
							</a>
						</div>
					{:else}
						<div class="text-center px-6 py-10">
							<p class="text-sm font-bold text-gray-500 mb-2">
								No prior render found — we filled in a placeholder.
							</p>
							<a href="/tools" class="text-sm font-black text-[#ff6b6b] hover:underline"
								>Try a free tool first →</a
							>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right: API key + cURL -->
			<div
				class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 flex flex-col"
			>
				<h2 class="font-black uppercase tracking-tight text-sm mb-3">Your API key</h2>

				{#if apiKeyLoading}
					<div class="flex items-center gap-2 text-sm font-bold text-gray-500 mb-4">
						<div
							class="w-4 h-4 border-[2px] border-gray-400 border-t-transparent rounded-full animate-spin"
						/>
						Generating your key…
					</div>
				{:else}
					<div class="flex gap-2 mb-4">
						<div
							class="flex-grow bg-gray-50 border-[2px] border-black font-mono text-xs px-3 py-2 flex items-center overflow-hidden"
						>
							<span class="truncate">{apiKey || 'No key — refresh and try again'}</span>
						</div>
						<button
							on:click={copyKey}
							class="flex-shrink-0 px-3 py-2 border-[2px] border-black font-black text-xs uppercase
								{copied
								? 'bg-[#4ade80] text-black'
								: 'bg-black text-white shadow-[3px_3px_0_0_#4ade80] hover:shadow-[1px_1px_0_0_#4ade80] hover:translate-x-[2px] hover:translate-y-[2px] transition-all'}"
						>
							{copied ? 'Copied' : 'Copy'}
						</button>
					</div>
				{/if}

				<h2 class="font-black uppercase tracking-tight text-sm mb-2">Run this from your terminal</h2>
				<div class="relative flex-1 min-h-[140px]">
					<pre
						class="bg-[#1e1e1e] text-[#dcdcaa] text-xs font-mono p-4 overflow-auto border-[2px] border-black h-full max-h-[260px] whitespace-pre">{curlCommand}</pre>
					<button
						on:click={copyCurl}
						class="absolute top-2 right-2 px-2 py-1 bg-white border-[2px] border-black font-black text-[10px] uppercase tracking-wide hover:bg-[#ffc480] transition-colors"
					>
						Copy cURL
					</button>
				</div>
			</div>
		</div>

		<!-- Run from browser button (server-fires api_render_completed) -->
		<div
			class="bg-[#4ade80]/15 border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 md:p-6 mb-6"
		>
			<div class="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
				<div>
					<h3 class="font-black text-lg mb-1">Don't have a terminal open?</h3>
					<p class="text-sm font-medium text-gray-700 max-w-xl">
						Run the same call from your browser — it counts as your first real API render and we'll show you the result.
					</p>
				</div>
				<button
					on:click={runFromBrowser}
					disabled={runState === 'running' || !apiKey}
					class="flex-shrink-0 px-6 py-3 border-[3px] border-black font-black text-base uppercase tracking-wide whitespace-nowrap
						{runState === 'running' || !apiKey
						? 'bg-gray-200 text-gray-400 cursor-not-allowed'
						: 'bg-black text-white shadow-[4px_4px_0_0_#4ade80] hover:shadow-[2px_2px_0_0_#4ade80] hover:translate-x-[2px] hover:translate-y-[2px] transition-all'}"
				>
					{#if runState === 'running'}
						Rendering…
					{:else if runState === 'success'}
						✓ Rendered — run again
					{:else}
						▶ Run this now
					{/if}
				</button>
			</div>

			{#if runState === 'success' && runResultUrl}
				<div class="mt-4 border-[2px] border-black bg-white p-3 flex items-center gap-3">
					<img src={runResultUrl} alt="Result" class="w-20 h-20 object-contain border border-gray-300" />
					<div class="flex-1 min-w-0">
						<div class="text-xs font-bold uppercase text-gray-500 mb-1">Rendered via API</div>
						<a
							href={runResultUrl}
							target="_blank"
							rel="noopener"
							class="text-sm font-mono truncate block text-[#ff6b6b] hover:underline"
						>
							{runResultUrl}
						</a>
					</div>
				</div>
			{/if}
			{#if runState === 'error'}
				<div class="mt-4 border-[2px] border-[#ff6b6b] bg-[#ff6b6b]/10 p-3 text-sm font-bold text-[#ff6b6b]">
					{runError}
				</div>
			{/if}
		</div>

		<!-- Pricing CTA -->
		<div class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_black] p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
			<div>
				<h3 class="font-black text-lg mb-1">Render in production →</h3>
				<p class="text-sm font-medium text-gray-700 max-w-xl">
					Free tier covers your prototype. Upgrade when you're ready for higher limits, no watermarks, team workspaces, and faster renders.
				</p>
			</div>
			<a
				href="/pricing"
				on:click={ctaClicked}
				class="flex-shrink-0 px-6 py-3 border-[3px] border-black font-black text-base uppercase tracking-wide bg-[#ff6b6b] text-black shadow-[4px_4px_0_0_black] hover:shadow-[2px_2px_0_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				See pricing →
			</a>
		</div>

		<div class="mt-8 text-center text-sm font-medium text-gray-500">
			Already comfortable? <a href="/dashboard" on:click={skipToDashboard} class="font-black text-black hover:text-[#ff6b6b] hover:underline"
				>Jump to the dashboard</a
			>
		</div>
	</div>
</section>
