<script>
	/**
	 * HtmlApiSnippetPanel — interactive API playground for this template.
	 *
	 * Redesigned to behave like a tight, docs-style "try it" widget
	 * (Stripe Workbench / Scalar) rather than a brutalist slab stack.
	 * Key moves:
	 *   - Sticky POST bar with the yellow-accent Send button as the single
	 *     primary CTA; ⌘↵ sends from anywhere in the panel.
	 *   - Inline Auth + Format pill row (no more full card for one select).
	 *   - Variables default to a type-aware Form view (from
	 *     variableDefinitions) with a Raw JSON tab as an opt-in fallback.
	 *   - One dominant response card with Image | Body | cURL | JS tabs —
	 *     snippets live WITH the response, where developers reach for them.
	 *
	 * Edits to the request body here are sandboxed — they do NOT sync back
	 * to the Variables tab. This is a render sandbox: fire-and-forget.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { generateSnippet } from '../../../utils/api-snippet-generator';
	import { user, getAPITokenAction } from '../../../../store/user.store';
	import { renderTemplate } from '../../../../api/template';
	import { toast } from '../../../../store/toast.store';

	export let templateUid = null;
	export let variableDefinitions = [];
	export let variables = {};
	export let format = 'png';
	export let isDirty = false;

	const FORMATS = ['png', 'jpeg', 'pdf'];

	// --- local request state ---------------------------------------------
	// `localVars` is a sandboxed overlay. We seed from the upstream
	// `variables` map whenever the user hasn't started editing — once they
	// touch a field, we freeze so their in-progress values aren't stomped.
	let localVars = {};
	let localFormat = format;
	let bodyMode = 'form'; // form | raw
	let rawBodyText = '';
	let rawDirty = false;
	let jsonParseError = null;
	let varsDirty = false;

	// --- response state --------------------------------------------------
	let isSending = false;
	let response = null; // { url, width, height, format }
	let rawResponseText = '';
	let responseError = null;
	let lastRenderMs = null;
	let statusCode = null;
	let responseTab = 'image'; // image | body | curl | js

	let copiedKey = null;
	let copyTimer = null;

	// --- image-ready polling ---------------------------------------------
	// The render API returns a CDN/S3 URL immediately, but the upload is
	// async — for a beat the URL 404s. Same pattern as the API playground:
	// start with previewSrc = url, <img> onerror → retry with a cachebust
	// query after a delay, up to PREVIEW_MAX_RETRIES. Each retry doubles
	// the delay up to a cap so we don't hammer S3 during propagation.
	const PREVIEW_MAX_RETRIES = 12;
	const PREVIEW_BASE_DELAY = 800;
	const PREVIEW_MAX_DELAY = 3000;
	let previewSrc = '';
	let previewRetryCount = 0;
	let previewReady = false;
	let previewGaveUp = false;
	let previewRetryTimer = null;
	let lastPreviewUrl = '';

	// Reset polling state whenever response URL actually changes. Scoping
	// this to a URL diff (not response identity) means a second Send with
	// the same URL doesn't relitigate the retry counter.
	$: {
		const nextUrl = response?.url || '';
		if (nextUrl !== lastPreviewUrl) {
			lastPreviewUrl = nextUrl;
			clearTimeout(previewRetryTimer);
			previewRetryCount = 0;
			previewReady = false;
			previewGaveUp = false;
			previewSrc = nextUrl;
		}
	}

	function handleImgLoad() {
		previewReady = true;
		previewGaveUp = false;
		previewRetryCount = 0;
	}

	function handleImgError() {
		const url = response?.url;
		if (!url) return;
		if (previewRetryCount >= PREVIEW_MAX_RETRIES) {
			previewGaveUp = true;
			return;
		}
		previewRetryCount++;
		// Exponential-ish backoff with a cap. Adds jitter-free cachebust
		// so the browser re-requests instead of returning cached 404.
		const delay = Math.min(
			PREVIEW_BASE_DELAY * Math.pow(1.5, previewRetryCount - 1),
			PREVIEW_MAX_DELAY
		);
		clearTimeout(previewRetryTimer);
		previewRetryTimer = setTimeout(() => {
			const sep = url.includes('?') ? '&' : '?';
			previewSrc = `${url}${sep}_r=${previewRetryCount}`;
		}, delay);
	}

	function retryImgManually() {
		if (!response?.url) return;
		previewGaveUp = false;
		previewRetryCount = 0;
		const sep = response.url.includes('?') ? '&' : '?';
		previewSrc = `${response.url}${sep}_r=manual_${Date.now()}`;
	}

	// --- auth ------------------------------------------------------------
	let apiTokens = [];
	let selectedToken = '';
	let hasTriedFetch = false;

	$: userState = $user;
	$: if (userState?.apiTokens) {
		apiTokens = userState.apiTokens;
		if (!selectedToken && apiTokens.length > 0) {
			selectedToken = apiTokens[0].token;
		}
	}

	onMount(async () => {
		if (
			userState?.email &&
			(!userState.apiTokens || userState.apiTokens.length === 0) &&
			!hasTriedFetch
		) {
			hasTriedFetch = true;
			try {
				await getAPITokenAction();
			} catch {
				/* non-fatal — user can still use the Manage tokens link */
			}
		}
	});

	// Seed localVars from upstream until user edits them. Detection is a
	// shallow "did any key change value from the upstream snapshot" — not
	// deep, but correct for our use (users edit atomic fields, not deep
	// trees, from this panel).
	$: if (!varsDirty) {
		localVars = { ...(variables || {}) };
	}
	$: if (!rawDirty) {
		localFormat = format;
	}

	// --- body assembly ---------------------------------------------------
	// In form mode, the body is derived live from localVars / localFormat.
	// In raw mode, the body is whatever the user typed. Flipping from
	// form → raw seeds the editor with the current form-derived JSON;
	// raw → form re-parses and feeds values back if still valid.
	$: derivedBody = {
		template: templateUid || 'YOUR_TEMPLATE_ID',
		variables: localVars || {},
		format: localFormat
	};

	function setBodyMode(next) {
		if (next === bodyMode) return;
		if (next === 'raw') {
			rawBodyText = JSON.stringify(derivedBody, null, 2);
			rawDirty = false;
			jsonParseError = null;
		} else {
			// Coming back to form: try to reconcile, otherwise keep whatever
			// the user had. We never discard their typing silently.
			try {
				const parsed = JSON.parse(rawBodyText);
				if (parsed?.variables && typeof parsed.variables === 'object') {
					localVars = { ...parsed.variables };
					varsDirty = true;
				}
				if (parsed?.format) localFormat = parsed.format;
				jsonParseError = null;
			} catch {
				/* invalid JSON — leave form state alone; user can fix & retry */
			}
		}
		bodyMode = next;
	}

	function handleRawEdit(e) {
		rawBodyText = e.target.value;
		rawDirty = true;
		try {
			JSON.parse(rawBodyText);
			jsonParseError = null;
		} catch (err) {
			jsonParseError = err.message;
		}
	}

	function handleVarEdit(name, value) {
		localVars = { ...localVars, [name]: value };
		varsDirty = true;
	}

	function resetAll() {
		localVars = { ...(variables || {}) };
		localFormat = format;
		varsDirty = false;
		rawDirty = false;
		rawBodyText = JSON.stringify(derivedBody, null, 2);
		jsonParseError = null;
	}

	// The request the Send button will actually send, given the active
	// body mode. In raw mode we feed the parsed JSON; in form mode we use
	// the derived body directly.
	$: requestBody = (() => {
		if (bodyMode === 'raw') {
			try {
				return JSON.parse(rawBodyText);
			} catch {
				return null;
			}
		}
		return derivedBody;
	})();

	$: canSend = !!templateUid && !!requestBody && !isSending;

	// --- snippets --------------------------------------------------------
	$: snippetCtx = {
		uid: requestBody?.template || templateUid,
		variables: requestBody?.variables || {},
		format: requestBody?.format || localFormat
	};
	$: curlSnippet = templateUid
		? generateSnippet('curl', snippetCtx)
		: '# Save the template first to generate a snippet.';
	$: jsSnippet = templateUid
		? generateSnippet('js', snippetCtx)
		: '// Save the template first to generate a snippet.';

	// --- network ---------------------------------------------------------
	async function sendRequest() {
		if (!templateUid) {
			toast.set({
				message: 'Save the template first.',
				type: 'warning',
				duration: 2500
			});
			return;
		}
		if (!requestBody) {
			toast.set({ message: 'Fix the JSON body first.', type: 'error', duration: 2500 });
			return;
		}

		isSending = true;
		response = null;
		rawResponseText = '';
		responseError = null;
		statusCode = null;
		const t0 = Date.now();

		try {
			const body = requestBody;
			const renderOptions = {
				format: body.format || 'png',
				quality: 0.9,
				headers: selectedToken ? { Authorization: `Bearer ${selectedToken}` } : {}
			};
			const uid = body.template || templateUid;
			const vars = body.variables || {};
			const result = await renderTemplate(uid, vars, renderOptions);
			lastRenderMs = Date.now() - t0;
			statusCode = 200;

			const first =
				(Array.isArray(result?.results) && result.results[0]) ||
				(result?.url ? result : null);
			response = first
				? {
						url: first.url,
						width: first.width,
						height: first.height,
						format: first.format || body.format || 'png'
					}
				: null;
			rawResponseText = JSON.stringify(result, null, 2);
			responseTab = 'image';
		} catch (err) {
			lastRenderMs = Date.now() - t0;
			statusCode = err?.response?.status || err?.status || null;
			responseError = err?.response?.data?.message || err?.message || 'Request failed';
			try {
				rawResponseText = err?.response?.data
					? JSON.stringify(err.response.data, null, 2)
					: JSON.stringify({ error: responseError }, null, 2);
			} catch {
				rawResponseText = String(responseError);
			}
			responseTab = 'body';
		} finally {
			isSending = false;
		}
	}

	// --- clipboard -------------------------------------------------------
	async function copy(key, text) {
		try {
			await navigator.clipboard.writeText(text);
			copiedKey = key;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copiedKey = null), 900);
		} catch {
			/* clipboard may be blocked */
		}
	}

	// --- keyboard: ⌘/Ctrl + Enter to send anywhere in the panel ---------
	let rootEl;
	function onKey(e) {
		const mod = e.metaKey || e.ctrlKey;
		if (mod && e.key === 'Enter' && canSend) {
			e.preventDefault();
			sendRequest();
		}
	}
	onMount(() => {
		rootEl?.addEventListener('keydown', onKey);
	});

	onDestroy(() => {
		rootEl?.removeEventListener('keydown', onKey);
		if (copyTimer) clearTimeout(copyTimer);
		if (previewRetryTimer) clearTimeout(previewRetryTimer);
	});

	// --- helpers ---------------------------------------------------------
	function truncateToken(t) {
		if (!t) return '';
		return t.length > 20 ? `${t.slice(0, 10)}…${t.slice(-4)}` : t;
	}

	// Preview a likely-large variable value inline without breaking layout.
	function previewValue(val) {
		if (val === null || val === undefined) return '';
		if (typeof val === 'string') return val;
		if (typeof val === 'number' || typeof val === 'boolean') return String(val);
		try {
			const s = JSON.stringify(val);
			return s.length > 36 ? s.slice(0, 33) + '…' : s;
		} catch {
			return String(val);
		}
	}

	function humanSize(n) {
		if (!n) return null;
		if (n < 1024) return `${n}B`;
		if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
		return `${(n / 1024 / 1024).toFixed(1)}MB`;
	}

	// Type coercion when writing a variable back into localVars. We keep
	// "text" values verbatim so handlebars sees the raw string; numbers
	// and booleans are coerced so the backend type guard accepts them.
	function coerce(type, raw) {
		if (type === 'number') {
			if (raw === '' || raw === '-') return raw;
			const n = parseFloat(raw);
			return Number.isNaN(n) ? raw : n;
		}
		if (type === 'boolean') {
			return raw === true || raw === 'true';
		}
		return raw;
	}

	// JSON-shape variables (array / object) get a textarea editor that
	// parses on blur. We show parse errors inline so the Send button's
	// disabled state isn't mystifying.
	let jsonVarErrors = {};
	function handleJsonVarInput(name, text) {
		try {
			const parsed = JSON.parse(text);
			delete jsonVarErrors[name];
			jsonVarErrors = { ...jsonVarErrors };
			handleVarEdit(name, parsed);
		} catch (e) {
			jsonVarErrors[name] = e.message;
			jsonVarErrors = { ...jsonVarErrors };
			// Hold onto the raw string so we don't erase user input mid-edit
			handleVarEdit(name, text);
		}
	}

	// The definition list we render in form mode. If the template has no
	// declared variables, fall back to the keys currently in localVars so
	// users can still see & edit whatever was seeded from upstream.
	$: renderableDefs = (() => {
		const defs = Array.isArray(variableDefinitions) ? variableDefinitions : [];
		if (defs.length > 0) return defs;
		return Object.keys(localVars).map((name) => ({ name, type: 'text' }));
	})();
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
	bind:this={rootEl}
	on:keydown={onKey}
	role="region"
	aria-label="API playground"
	class="flex h-full w-full flex-col bg-[#FFFDF8]"
>
	<!-- Slim header strip — label + shortcut hint only. -->
	<header
		class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-5 py-3"
	>
		<div class="flex items-center gap-3">
			<h2 class="text-[13px] font-black uppercase tracking-widest text-gray-900">API</h2>
			{#if isDirty && templateUid}
				<span
					class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-gray-900"
				>
					<span class="relative flex h-1.5 w-1.5">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b6b] opacity-75"
						></span>
						<span
							class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff5252]"
						></span>
					</span>
					Unsaved · renders last saved
				</span>
			{/if}
		</div>
		<kbd
			class="hidden items-center gap-1 rounded-md border-[2px] border-gray-900 bg-white px-1.5 py-0.5 font-mono text-[9px] font-black text-gray-900 md:inline-flex"
		>
			⌘↵ Send
		</kbd>
	</header>

	<!-- Scrollable body -->
	<div class="flex min-h-0 flex-1 flex-col overflow-auto">
		<!-- Sticky request bar + inline config row -->
		<div class="sticky top-0 z-10 border-b-[2px] border-gray-900 bg-[#FFFDF8]">
			<!-- POST bar -->
			<div class="flex items-stretch gap-0 px-5 pt-5">
				<div
					class="flex flex-1 items-stretch overflow-hidden rounded-lg border-[2px] border-gray-900 bg-white"
				>
					<span
						class="flex items-center bg-gray-900 px-3 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]"
					>
						POST
					</span>
					<span
						class="flex flex-1 items-center px-3 py-2 font-mono text-[12px] font-bold text-gray-900 truncate"
					>
						https://api.pictify.io/image
					</span>
				</div>
				<button
					type="button"
					on:click={sendRequest}
					disabled={!canSend}
					class="ml-2 inline-flex items-center gap-2 rounded-lg border-[2px] border-gray-900 px-5 text-[11px] font-black uppercase tracking-widest transition-all
						{isSending
							? 'bg-gray-200 text-gray-600'
							: canSend
								? 'bg-[#ffc480] text-gray-900 shadow-[3px_3px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_#1f2937] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
								: 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
				>
					{#if isSending}
						<i class="fa fa-spinner fa-spin text-[11px]"></i>
						Sending
					{:else}
						<i class="fa fa-paper-plane text-[11px]"></i>
						Send
						<span class="ml-1 font-mono text-[9px] font-black opacity-60">⌘↵</span>
					{/if}
				</button>
			</div>

			<!-- Inline auth + format row -->
			<div class="flex flex-wrap items-center gap-3 px-5 py-3 text-[11px]">
				<!-- Auth -->
				<div class="flex items-center gap-2">
					<span class="text-[9px] font-black uppercase tracking-widest text-gray-500">
						Auth
					</span>
					{#if apiTokens.length > 0}
						<div
							class="inline-flex items-center overflow-hidden rounded-md border-[2px] border-gray-900 bg-white"
						>
							<span class="px-2 text-[10px] font-black text-gray-500">
								<i class="fa fa-key text-[#ffc480]"></i>
							</span>
							<select
								bind:value={selectedToken}
								aria-label="API token"
								class="border-0 bg-white px-1 py-1 font-mono text-[11px] font-black text-gray-900 focus:outline-none"
							>
								{#each apiTokens as token}
									<option value={token.token}>{truncateToken(token.token)}</option>
								{/each}
							</select>
						</div>
					{:else}
						<span
							class="rounded-md border-[2px] border-dashed border-gray-400 bg-white px-2 py-1 text-[10px] font-bold text-gray-600"
						>
							No token
						</span>
					{/if}
				</div>

				<span class="text-gray-300">·</span>

				<!-- Format -->
				<div class="flex items-center gap-2">
					<span class="text-[9px] font-black uppercase tracking-widest text-gray-500">
						Format
					</span>
					<div
						class="inline-flex overflow-hidden rounded-md border-[2px] border-gray-900 bg-white"
					>
						{#each FORMATS as f}
							<button
								type="button"
								on:click={() => {
									localFormat = f;
									varsDirty = true;
								}}
								class="px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest transition-colors
									{localFormat === f
										? 'bg-gray-900 text-white'
										: 'bg-white text-gray-700 hover:bg-gray-100'}"
							>
								{f}
							</button>
						{/each}
					</div>
				</div>

				<span class="text-gray-300">·</span>

				<a
					href="/dashboard/api-token"
					target="_blank"
					rel="noopener"
					class="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900"
				>
					Manage tokens →
				</a>

				<div class="flex-1"></div>

				{#if varsDirty || rawDirty}
					<button
						type="button"
						on:click={resetAll}
						class="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#ff5252]"
					>
						<i class="fa fa-rotate-left mr-1 text-[9px]"></i>Reset
					</button>
				{/if}
			</div>

			{#if !templateUid}
				<div
					class="mx-5 mb-3 flex items-center gap-2 rounded-md border-[2px] border-dashed border-gray-900 bg-[#fff7e0] px-3 py-2 text-[11px] font-bold text-gray-800"
				>
					<i class="fa fa-circle-info text-gray-900"></i>
					Save the template first — the render API needs a template uid.
				</div>
			{/if}
		</div>

		<!-- Variables card — Form / Raw JSON tabs -->
		<section class="px-5 pt-5">
			<div
				class="overflow-hidden rounded-lg border-[2px] border-gray-900 bg-white"
			>
				<div
					class="flex items-center justify-between border-b-[2px] border-gray-900 bg-[#FFFDF8] px-3 py-2"
				>
					<span class="text-[9px] font-black uppercase tracking-widest text-gray-600">
						Variables
					</span>
					<div class="inline-flex overflow-hidden rounded-md border-[1.5px] border-gray-900">
						<button
							type="button"
							on:click={() => setBodyMode('form')}
							class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors
								{bodyMode === 'form'
									? 'bg-gray-900 text-white'
									: 'bg-white text-gray-700 hover:bg-gray-100'}"
						>
							Form
						</button>
						<button
							type="button"
							on:click={() => setBodyMode('raw')}
							class="border-l-[1.5px] border-gray-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors
								{bodyMode === 'raw'
									? 'bg-gray-900 text-white'
									: 'bg-white text-gray-700 hover:bg-gray-100'}"
						>
							Raw JSON
						</button>
					</div>
				</div>

				{#if bodyMode === 'form'}
					{#if renderableDefs.length === 0}
						<div class="px-3 py-4 text-center text-[11px] font-bold text-gray-500">
							No variables yet. Add one in the Variables tab.
						</div>
					{:else}
						<div class="divide-y-[1.5px] divide-gray-200">
							{#each renderableDefs as def (def.name)}
								{@const v = localVars[def.name]}
								{@const isJson = def.type === 'array' || def.type === 'object'}
								<div class="flex items-start gap-3 px-3 py-2">
									<div class="w-32 flex-shrink-0 pt-1">
										<div class="font-mono text-[11px] font-black text-gray-900 truncate">
											{def.name}
										</div>
										<div class="mt-0.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
											{def.type || 'text'}
										</div>
									</div>
									<div class="min-w-0 flex-1">
										{#if def.type === 'boolean'}
											<label class="inline-flex cursor-pointer items-center gap-2">
												<input
													type="checkbox"
													checked={v === true || v === 'true'}
													on:change={(e) => handleVarEdit(def.name, e.target.checked)}
													class="h-4 w-4 accent-[#ffc480]"
												/>
												<span class="text-[11px] font-bold text-gray-700">
													{v ? 'true' : 'false'}
												</span>
											</label>
										{:else if def.type === 'color'}
											<div class="flex items-center gap-2">
												<input
													type="color"
													value={typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000'}
													on:input={(e) => handleVarEdit(def.name, e.target.value)}
													class="h-7 w-10 cursor-pointer rounded border-[1.5px] border-gray-900"
												/>
												<input
													type="text"
													value={typeof v === 'string' ? v : ''}
													on:input={(e) => handleVarEdit(def.name, e.target.value)}
													placeholder="#000000"
													class="w-28 rounded border-[1.5px] border-gray-300 bg-white px-2 py-1 font-mono text-[11px] text-gray-900 focus:border-gray-900 focus:outline-none"
												/>
											</div>
										{:else if def.type === 'number'}
											<input
												type="number"
												value={v ?? ''}
												on:input={(e) => handleVarEdit(def.name, coerce('number', e.target.value))}
												class="w-full rounded border-[1.5px] border-gray-300 bg-white px-2 py-1 font-mono text-[11px] text-gray-900 focus:border-gray-900 focus:outline-none"
											/>
										{:else if def.type === 'image' || def.type === 'url'}
											<input
												type="url"
												value={v ?? ''}
												on:input={(e) => handleVarEdit(def.name, e.target.value)}
												placeholder="https://…"
												class="w-full rounded border-[1.5px] border-gray-300 bg-white px-2 py-1 font-mono text-[11px] text-gray-900 focus:border-gray-900 focus:outline-none"
											/>
										{:else if isJson}
											<textarea
												value={typeof v === 'string'
													? v
													: JSON.stringify(v ?? (def.type === 'array' ? [] : {}), null, 2)}
												on:input={(e) => handleJsonVarInput(def.name, e.target.value)}
												spellcheck="false"
												rows="3"
												class="w-full resize-y rounded border-[1.5px] bg-gray-900 px-2 py-1.5 font-mono text-[11px] text-gray-100 focus:outline-none
													{jsonVarErrors[def.name]
														? 'border-[#ff5252]'
														: 'border-gray-900'}"
											></textarea>
											{#if jsonVarErrors[def.name]}
												<p
													class="mt-1 font-mono text-[10px] text-[#ff5252]"
												>
													<i class="fa fa-triangle-exclamation"></i> {jsonVarErrors[def.name]}
												</p>
											{/if}
										{:else}
											<input
												type="text"
												value={v ?? ''}
												on:input={(e) => handleVarEdit(def.name, e.target.value)}
												placeholder={def.defaultValue ?? ''}
												class="w-full rounded border-[1.5px] border-gray-300 bg-white px-2 py-1 font-mono text-[11px] text-gray-900 focus:border-gray-900 focus:outline-none"
											/>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="relative">
						<textarea
							value={rawBodyText}
							on:input={handleRawEdit}
							spellcheck="false"
							rows="12"
							class="block w-full resize-y bg-gray-900 p-4 font-mono text-[12px] leading-relaxed text-gray-100 focus:outline-none"
						></textarea>
						{#if jsonParseError}
							<div
								class="flex items-center gap-2 border-t-[1.5px] border-gray-800 bg-[#3a1a1a] px-3 py-1.5 font-mono text-[10px] text-[#ffb4b4]"
							>
								<i class="fa fa-triangle-exclamation"></i>
								{jsonParseError}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		<!-- Response card — dominant, tabbed -->
		<section class="px-5 pb-6 pt-4">
			<div
				class="overflow-hidden rounded-lg border-[3px] border-gray-900 bg-white shadow-[4px_4px_0_0_#1f2937]"
			>
				<!-- Tab bar + status -->
				<div
					class="flex items-center justify-between gap-3 border-b-[2px] border-gray-900 bg-[#FFFDF8] px-3 py-2"
				>
					<div class="flex items-center gap-1">
						{#each [
							{ k: 'image', label: 'Image', icon: 'fa-image' },
							{ k: 'body', label: 'Body', icon: 'fa-code' },
							{ k: 'curl', label: 'cURL', icon: 'fa-terminal' },
							{ k: 'js', label: 'JS', icon: 'fa-brands fa-js' }
						] as tab}
							<button
								type="button"
								on:click={() => (responseTab = tab.k)}
								class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-colors
									{responseTab === tab.k
										? 'bg-gray-900 text-white'
										: 'bg-transparent text-gray-600 hover:bg-gray-100'}"
							>
								<i class="fa {tab.icon} text-[9px]"></i>
								{tab.label}
							</button>
						{/each}
					</div>

					<div class="flex items-center gap-2">
						{#if statusCode !== null}
							<span
								class="inline-flex items-center rounded-md border-[1.5px] border-gray-900 px-1.5 py-0.5 font-mono text-[10px] font-black
									{statusCode < 300
										? 'bg-[#4ade80] text-gray-900'
										: statusCode < 500
											? 'bg-[#fbbf24] text-gray-900'
											: 'bg-[#ff6b6b] text-white'}"
							>
								{statusCode}
							</span>
						{/if}
						{#if lastRenderMs !== null}
							<span class="font-mono text-[10px] font-bold text-gray-500">
								{lastRenderMs}ms
							</span>
						{/if}
					</div>
				</div>

				<!-- Tab content -->
				{#if isSending}
					<div class="relative">
						<div class="flex h-[260px] items-center justify-center bg-gray-50">
							<div class="flex flex-col items-center gap-2">
								<i class="fa fa-spinner fa-spin text-lg text-gray-700"></i>
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-600">
									Rendering template…
								</p>
							</div>
						</div>
						<div
							class="absolute left-0 right-0 top-0 h-0.5 overflow-hidden bg-gray-200"
						>
							<div class="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] bg-[#ffc480]"></div>
						</div>
					</div>
				{:else if responseError && responseTab !== 'curl' && responseTab !== 'js'}
					<div
						class="border-l-[4px] border-[#ff5252] bg-[#ff6b6b]/10 px-4 py-3"
					>
						<div class="flex items-start gap-2">
							<i class="fa fa-triangle-exclamation mt-0.5 text-[#ff5252]"></i>
							<div class="flex-1">
								<p class="text-[10px] font-black uppercase tracking-widest text-gray-900">
									Request failed
								</p>
								<p class="mt-0.5 text-[12px] font-bold text-gray-800">{responseError}</p>
							</div>
						</div>
						{#if rawResponseText}
							<pre
								class="mt-3 max-h-[36vh] overflow-auto rounded border-[1.5px] border-gray-900 bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-gray-100"><code>{rawResponseText}</code></pre>
						{/if}
					</div>
				{:else if responseTab === 'image'}
					{#if response?.url}
						{#if response.format === 'pdf'}
							<iframe
								title="PDF response"
								src={response.url}
								class="h-[60vh] w-full border-0"
							></iframe>
						{:else}
							<div
								class="relative flex min-h-[260px] items-center justify-center bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)_0_0/20px_20px] p-3"
							>
								<!-- Image is hidden until it successfully loads, to
								     suppress the broken-image glyph while S3 is
								     still propagating. -->
								<img
									src={previewSrc}
									alt="Rendered template"
									on:load={handleImgLoad}
									on:error={handleImgError}
									class="max-h-[52vh] max-w-full object-contain transition-opacity duration-200
										{previewReady ? 'opacity-100' : 'opacity-0'}"
								/>
								{#if !previewReady && !previewGaveUp}
									<div
										class="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-[1px]"
									>
										<i class="fa fa-spinner fa-spin text-lg text-gray-700"></i>
									</div>
								{:else if previewGaveUp}
									<div
										class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/95 p-4 text-center"
									>
										<div
											class="flex h-9 w-9 items-center justify-center rounded-md border-[2px] border-gray-900 bg-[#ff6b6b] text-white"
										>
											<i class="fa fa-triangle-exclamation text-[13px]"></i>
										</div>
										<p class="text-[11px] font-black uppercase tracking-widest text-gray-800">
											Image not ready
										</p>
										<p class="max-w-xs text-[10px] font-bold text-gray-500">
											The CDN hasn't served the file yet. It should finish shortly — retry or
											open the URL directly.
										</p>
										<button
											type="button"
											on:click={retryImgManually}
											class="inline-flex items-center gap-1 rounded-md border-[2px] border-gray-900 bg-[#ffc480] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#1f2937]"
										>
											<i class="fa fa-rotate-right text-[9px]"></i>
											Retry
										</button>
									</div>
								{/if}
							</div>
						{/if}
						<!-- Meta + actions strip -->
						<div
							class="flex flex-wrap items-center justify-between gap-2 border-t-[2px] border-gray-900 bg-[#FFFDF8] px-3 py-2"
						>
							<div
								class="flex items-center gap-2 font-mono text-[10px] font-bold text-gray-700"
							>
								{#if response.width && response.height}
									<span>{response.width} × {response.height}</span>
									<span class="text-gray-300">·</span>
								{/if}
								<span class="uppercase">{response.format}</span>
								<span class="text-gray-300">·</span>
								<span>{lastRenderMs}ms</span>
							</div>
							<div class="flex items-center gap-1">
								<button
									type="button"
									on:click={() => copy('url', response.url)}
									class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-900 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-gray-50"
								>
									<i class="fa {copiedKey === 'url' ? 'fa-check text-[#16a34a]' : 'fa-copy'} text-[9px]"></i>
									{copiedKey === 'url' ? 'Copied' : 'URL'}
								</button>
								<a
									href={response.url}
									target="_blank"
									rel="noopener"
									class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-900 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-gray-50"
								>
									<i class="fa fa-arrow-up-right-from-square text-[9px]"></i>
									Open
								</a>
							</div>
						</div>
					{:else}
						<!-- Empty state -->
						<div
							class="flex h-[220px] flex-col items-center justify-center gap-2 bg-gray-50 px-4 text-center"
						>
							<div
								class="flex h-9 w-9 items-center justify-center rounded-md border-[2px] border-gray-900 bg-[#ffc480]"
							>
								<i class="fa fa-paper-plane text-[13px] text-gray-900"></i>
							</div>
							<p class="text-[11px] font-black uppercase tracking-widest text-gray-800">
								Press Send to render
							</p>
							<p class="max-w-sm text-[10px] font-bold text-gray-500">
								Your sample variables are pre-filled. Edit above or switch to Raw JSON,
								then Send.
							</p>
						</div>
					{/if}
				{:else if responseTab === 'body'}
					{#if rawResponseText}
						<div class="relative">
							<button
								type="button"
								on:click={() => copy('body', rawResponseText)}
								class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-200 hover:border-gray-400 hover:text-white"
							>
								<i
									class="fa {copiedKey === 'body' ? 'fa-check text-[#4ade80]' : 'fa-copy'} text-[9px]"
								></i>
								{copiedKey === 'body' ? 'Copied' : 'Copy'}
							</button>
							<pre
								class="m-0 max-h-[50vh] overflow-auto bg-gray-900 p-4 pr-16 font-mono text-[12px] leading-relaxed text-gray-100"><code>{rawResponseText}</code></pre>
						</div>
					{:else}
						<div class="px-4 py-6 text-center text-[11px] font-bold text-gray-500">
							No response yet. Press Send.
						</div>
					{/if}
				{:else if responseTab === 'curl'}
					<div class="relative">
						<button
							type="button"
							on:click={() => copy('curl', curlSnippet)}
							class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-200 hover:border-gray-400 hover:text-white"
						>
							<i
								class="fa {copiedKey === 'curl' ? 'fa-check text-[#4ade80]' : 'fa-copy'} text-[9px]"
							></i>
							{copiedKey === 'curl' ? 'Copied' : 'Copy'}
						</button>
						<pre
							class="m-0 max-h-[50vh] overflow-auto bg-gray-900 p-4 pr-16 font-mono text-[12px] leading-relaxed text-gray-100"><code>{curlSnippet}</code></pre>
					</div>
				{:else if responseTab === 'js'}
					<div class="relative">
						<button
							type="button"
							on:click={() => copy('js', jsSnippet)}
							class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border-[1.5px] border-gray-600 bg-gray-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-200 hover:border-gray-400 hover:text-white"
						>
							<i
								class="fa {copiedKey === 'js' ? 'fa-check text-[#4ade80]' : 'fa-copy'} text-[9px]"
							></i>
							{copiedKey === 'js' ? 'Copied' : 'Copy'}
						</button>
						<pre
							class="m-0 max-h-[50vh] overflow-auto bg-gray-900 p-4 pr-16 font-mono text-[12px] leading-relaxed text-gray-100"><code>{jsSnippet}</code></pre>
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>

<style>
	@keyframes slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}
</style>
