<script>
	/**
	 * The result card — the conversion moment on every tool page.
	 *
	 * Three states, all of which hand over the finished file:
	 *   B1  guest with renders left   download + copy-the-API-call + save-as-template
	 *   B2  guest who just spent the last free render   signup leads, download demoted
	 *   B3  signed in   render is saved, the real API key is inline
	 *
	 * The render is never blurred, watermarked away, or hidden behind signup.
	 * A visitor who cannot get their file back has no reason to trust the API.
	 *
	 * Replaces GenerationLimitBanner (B2 says it in place) and PostSignupWelcome
	 * (B3 carries the key).
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import { toast } from '../../../../store/toast.store';
	import { downloadFile } from '$lib/utils/download.js';
	import { getApiToken, createApiToken } from '../../../../api/user';
	import ShareResultButton from '../ShareResultButton.svelte';

	export let imageUrl = '';
	/** Display name of the output, e.g. "PNG". Used in every headline. */
	export let formatLabel = 'PNG';
	/** File extension for the saved file. */
	export let fileExtension = 'png';
	export let width = null;
	export let height = null;
	export let loggedIn = false;
	/** True when this render was the guest's last free one today. */
	export let lastFree = false;
	export let toolName = '';
	export let toolPath = '';
	/** Source markup, so the card can offer a template draft and a real curl. */
	export let html = '';
	/** Monthly allowance copy for signed-in users; null hides the counter. */
	export let monthlyRemaining = null;
	export let monthlyLimit = 50;

	const DRAFT_KEY = 'pictify_template_draft_v1';

	let apiKey = '';
	let fileSize = '';
	let copiedApi = false;
	/** Set after COPY API REQUEST so the "paste your key" nudge appears in place. */
	let showKeyNudge = false;

	$: state = loggedIn ? 'saved' : lastFree ? 'limit' : 'guest';
	$: signupHref = `/signup?redirect=${encodeURIComponent(toolPath)}`;
	$: dimensions = width && height ? `${width}×${height}` : '';

	// Weight is read from the response headers rather than guessed, and stays
	// blank if the CDN does not report it.
	$: if (browser && imageUrl) readFileSize(imageUrl);

	async function readFileSize(url) {
		fileSize = '';
		try {
			const res = await fetch(url, { method: 'HEAD' });
			const bytes = Number(res.headers.get('content-length'));
			if (bytes > 0) fileSize = `${Math.round(bytes / 1024)} KB`;
		} catch {
			// Non-critical: the line reads fine without it.
		}
	}

	onMount(async () => {
		if (!browser || !loggedIn) return;
		try {
			const data = await getApiToken();
			if (data?.apiTokens?.length) {
				apiKey = data.apiTokens[0].token;
			} else {
				const created = await createApiToken();
				apiKey = created?.token || '';
				if (apiKey) {
					analytics.track('api_key_created', { source: 'result_card', tool_name: toolName });
				}
			}
		} catch {
			// The user can still get a key from the dashboard.
		}
	});

	$: maskedKey = apiKey ? `${apiKey.slice(0, 12)}…${apiKey.slice(-2)}` : 'YOUR_API_KEY';
	$: curl =
		`curl -X POST https://api.pictify.io/image \\\n` +
		`  -H "Authorization: Bearer ${loggedIn && apiKey ? apiKey : '$PICTIFY_KEY'}" \\\n` +
		`  -H "Content-Type: application/json" \\\n` +
		`  -d '{"html": "…", "width": ${width || 1200}, "height": ${
			height || 630
		}, "fileExtension": "${fileExtension}"}'`;

	async function handleDownload() {
		await downloadFile(imageUrl, `pictify-render.${fileExtension}`, {
			tool_name: toolName,
			content_type: 'image'
		});
	}

	async function copyApiRequest() {
		try {
			await navigator.clipboard.writeText(curl);
			copiedApi = true;
			showKeyNudge = !loggedIn;
			analytics.trackCopy({
				content_type: 'api_request',
				context: 'result_card',
				tool_name: toolName
			});
			setTimeout(() => (copiedApi = false), 2000);
		} catch {
			toast.set({ message: 'Failed to copy', type: 'error', duration: 2000 });
		}
	}

	function saveAsTemplate() {
		analytics.track('tool_signup_click', {
			tool_name: toolName,
			cta_location: 'result_card_template'
		});
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify({ html, width, height, source: toolName }));
		} catch {
			// Storage can be full or blocked; the route below still works.
		}
		if (loggedIn) {
			goto('/template-workspace/html/create');
		} else {
			goto(`/signup?redirect=${encodeURIComponent(toolPath)}&draft=1`);
		}
	}

	function openInStudio() {
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify({ html, width, height, source: toolName }));
		} catch {
			// As above.
		}
		goto('/template-workspace/html/create');
	}

	function trackLimitSignup() {
		analytics.track('tool_signup_click', {
			tool_name: toolName,
			cta_location: 'result_card_limit'
		});
	}

	function trackApiSignup() {
		analytics.track('tool_signup_click', { tool_name: toolName, cta_location: 'result_card_api' });
	}
</script>

<div
	class="flex w-full flex-col gap-5 rounded-tile border-[1.5px] bg-brand-paper p-5 lg:flex-row lg:items-stretch lg:gap-6 lg:p-6 {state ===
	'limit'
		? 'border-brand-ink shadow-[4px_4px_0_0_#0078BF]'
		: 'border-brand-proof'}"
>
	<!-- Preview. Fixed box, so the card's height does not jump between renders. -->
	<div
		class="flex h-[180px] w-full flex-shrink-0 items-center justify-center overflow-hidden border border-brand-rule bg-brand-subtle lg:w-[280px]"
	>
		{#if imageUrl}
			<img src={imageUrl} alt="" class="h-full w-full object-contain" />
		{:else}
			<span class="font-mono text-[10px] tracking-[0.06em] text-brand-mute"
				>{formatLabel.toUpperCase()}</span
			>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col justify-between gap-4">
	<div class="flex min-w-0 flex-col gap-1">
		{#if state === 'limit'}
			<p
				class="font-display text-[21px] font-bold leading-[26px] tracking-[-0.02em] text-brand-ink"
			>
				Pressed — and that was your last free one today.
			</p>
			<p class="font-sans text-sm leading-5 text-brand-slate">
				Download it below. A free account keeps you rendering: 50 a month, no card, and this file is
				saved to your renders.
			</p>
			<div class="mt-1 flex flex-wrap gap-1.5">
				<span
					class="border border-brand-ink bg-brand-field px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] text-brand-ink"
					>NO WATERMARK</span
				>
				<span
					class="border border-brand-ink bg-brand-powder px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] text-brand-ink"
					>API KEY INCLUDED</span
				>
				<span
					class="border border-brand-ink bg-brand-rose px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] text-brand-ink"
					>KEEPS THIS RENDER</span
				>
			</div>
		{:else if state === 'saved'}
			<p
				class="font-display text-[21px] font-bold leading-[26px] tracking-[-0.02em] text-brand-ink"
			>
				Your {formatLabel} is pressed. Saved to your renders.
			</p>
			<p class="font-sans text-sm leading-5 text-brand-slate">
				{#if monthlyRemaining != null}{monthlyRemaining} of {monthlyLimit} left this month ·
				{/if}Same call from your code:
			</p>
			<div
				class="mt-1 flex items-center gap-2 overflow-hidden rounded bg-brand-press px-3 py-2 font-mono text-[11px] text-[#ADB9C6]"
			>
				<span class="truncate"
					>curl -H "Authorization: Bearer <span class="text-brand-field">{maskedKey}</span>" …</span
				>
				<button
					type="button"
					on:click={copyApiRequest}
					class="ml-auto flex-shrink-0 border border-[#383A42] px-2 py-0.5 font-mono text-[10px] tracking-[0.04em] text-white hover:bg-[#383A42]"
				>
					{copiedApi ? 'COPIED' : 'COPY'}
				</button>
			</div>
		{:else}
			<p
				class="font-display text-[21px] font-bold leading-[26px] tracking-[-0.02em] text-brand-ink"
			>
				Your {formatLabel} is pressed.
			</p>
			<p class="font-sans text-sm leading-5 text-brand-slate">
				{#if dimensions}{dimensions} · {/if}{#if fileSize}{fileSize} · {/if}The link stays live —
				share it or download it.
			</p>
			{#if showKeyNudge}
				<p class="font-sans text-sm leading-5 text-brand-slate">
					Paste your key —
					<a
						href={signupHref}
						on:click={trackApiSignup}
						class="font-medium text-brand-royal underline underline-offset-2">get one free →</a
					>
				</p>
			{:else}
				<p class="font-sans text-sm leading-5 text-brand-mute">
					Need this for every post? Save it as a template and render variants by API. Free tier: 50
					renders a month, no card.
				</p>
			{/if}
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		{#if state === 'limit'}
			<button
				type="button"
				on:click={handleDownload}
				class="h-[42px] whitespace-nowrap border border-brand-ink bg-brand-paper px-4 font-mono text-[11px] tracking-[0.04em] text-brand-ink transition-colors hover:bg-brand-subtle"
			>
				DOWNLOAD {formatLabel.toUpperCase()}
			</button>
			<a
				href={signupHref}
				on:click={trackLimitSignup}
				class="flex h-[42px] items-center whitespace-nowrap rounded-lg bg-brand-blue px-5 font-sans text-[15px] font-semibold text-white shadow-[2px_2px_0_0_#000000] transition-opacity hover:opacity-90"
			>
				Sign up · keep rendering
			</a>
		{:else if state === 'saved'}
			<button
				type="button"
				on:click={saveAsTemplate}
				class="h-[42px] whitespace-nowrap border border-brand-ink bg-brand-paper px-4 font-mono text-[11px] tracking-[0.04em] text-brand-ink transition-colors hover:bg-brand-subtle"
			>
				SAVE AS TEMPLATE
			</button>
			<button
				type="button"
				on:click={openInStudio}
				class="h-[42px] whitespace-nowrap border border-brand-ink bg-brand-paper px-4 font-mono text-[11px] tracking-[0.04em] text-brand-ink transition-colors hover:bg-brand-subtle"
			>
				OPEN IN STUDIO
			</button>
			<button
				type="button"
				on:click={handleDownload}
				class="flex h-[42px] items-center whitespace-nowrap rounded bg-brand-proof px-5 font-sans text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
			>
				Download {formatLabel}
			</button>
		{:else}
			<button
				type="button"
				on:click={copyApiRequest}
				class="h-[42px] whitespace-nowrap border border-brand-ink bg-brand-paper px-4 font-mono text-[11px] tracking-[0.04em] text-brand-ink transition-colors hover:bg-brand-subtle"
			>
				{copiedApi ? 'COPIED' : 'COPY API REQUEST'}
			</button>
			<button
				type="button"
				on:click={saveAsTemplate}
				class="h-[42px] whitespace-nowrap border border-brand-ink bg-brand-paper px-4 font-mono text-[11px] tracking-[0.04em] text-brand-ink transition-colors hover:bg-brand-subtle"
			>
				SAVE AS TEMPLATE
			</button>
			<button
				type="button"
				on:click={handleDownload}
				class="flex h-[42px] items-center whitespace-nowrap rounded bg-brand-proof px-5 font-sans text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
			>
				Download {formatLabel}
			</button>
		{/if}
		{#if imageUrl && state !== 'limit'}
			<ShareResultButton
				assetUrl={imageUrl}
				contentType="image"
				{width}
				{height}
				format={fileExtension}
				source="tool"
				{toolName}
				variant="small"
			/>
		{/if}
	</div>
	</div>
</div>
