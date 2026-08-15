<script>
	/**
	 * API playground — six calls, three groups, every one ready to send.
	 *
	 * The v1 page listed every endpoint the API has, which made the surface a
	 * reference index: the reader had to already know which call they wanted
	 * before it was useful. This is task-first — "render a template as a PDF"
	 * is a row, not a URL you assemble — and the helpers are the point. Picking
	 * a template fetches its variables and fills the body, so the call in the
	 * pane is one you can send, not a shape to complete.
	 *
	 * Renders here are REAL: your key, your quota, and they land on the Renders
	 * page like any other. Nothing is faked, so nothing has to be caveated.
	 */
	import { onMount } from 'svelte';
	import { analytics } from '$lib/telemetry.js';
	import { showToast } from '../../../store/toast.store.js';
	import { activeApiToken, getAPITokenAction } from '../../../store/user.store';
	import { getTemplateVariables } from '../../../api/template.js';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';
	import CodeBlock from '$lib/components/studio/CodeBlock.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import backend from '../../../service/backend';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	const SAMPLE_HTML =
		'<div style="width:1200px;height:630px;display:flex;align-items:center;justify-content:center;background:#131417;color:#fff;font-family:Inter,sans-serif">\n  <h1 style="font-size:64px">Hello from Pictify</h1>\n</div>';

	/*
	 * The curated set. `/gif` (HTML→GIF) is deliberately absent: it is
	 * deprecated, and GIF output is the `format` parameter on the video render.
	 * Surfacing a deprecated endpoint in the place people come to learn the API
	 * is how it stays alive for another two years.
	 */
	const GROUPS = [
		{
			title: 'Render HTML',
			calls: [
				{
					id: 'html-image',
					name: 'HTML → Image',
					method: 'POST',
					path: '/image',
					needsTemplate: false,
					body: () => ({ html: SAMPLE_HTML, width: 1200, height: 630 })
				}
			]
		},
		{
			title: 'Render a template',
			calls: [
				{
					id: 'tpl-image',
					name: 'Template → Image',
					method: 'POST',
					path: (uid) => `/templates/${uid || ':uid'}/render`,
					needsTemplate: true,
					body: (vars) => ({ variables: vars, format: 'png' })
				},
				{
					id: 'tpl-pdf',
					name: 'Template → PDF',
					method: 'POST',
					path: () => '/pdf/render',
					needsTemplate: true,
					needsPreset: true,
					body: (vars, uid, preset) => ({
						templateUid: uid || ':uid',
						variables: vars,
						options: { preset: preset || 'A4' }
					})
				},
				{
					id: 'tpl-video',
					name: 'Template → Video / GIF',
					method: 'POST',
					path: (uid) => `/video/templates/${uid || ':uid'}/render`,
					needsTemplate: true,
					video: true,
					needsFormat: true,
					body: (vars, uid, preset, format) => ({ variables: vars, format: format || 'mp4' })
				}
			]
		},
		{
			title: 'Render many',
			calls: [
				{
					id: 'batch-rows',
					name: 'Batch from rows',
					method: 'POST',
					path: (uid) => `/templates/${uid || ':uid'}/batch-render`,
					needsTemplate: true,
					batch: true,
					body: (vars) => ({ variableSets: [vars, vars], format: 'png' })
				},
				{
					id: 'batch-csv',
					name: 'Batch from CSV',
					method: 'POST',
					path: (uid) => `/templates/${uid || ':uid'}/batch-render`,
					needsTemplate: true,
					batch: true,
					csv: true,
					body: () => ({ csv: 'name,title\nMika,Designer\nPriya,Engineer', format: 'png' })
				}
			]
		}
	];

	const LANGS = ['CURL', 'NODE', 'PYTHON'];

	let openId = 'html-image';
	let tab = 'CODE';
	let lang = 'CURL';
	let presets = [];
	let sending = false;
	let response = null;
	let batchId = null;

	// Per-call state, keyed by id so switching rows doesn't lose your selection.
	let selection = {};

	$: allCalls = GROUPS.flatMap((g) => g.calls);
	$: call = allCalls.find((c) => c.id === openId) || allCalls[0];
	$: state = selection[call.id] || {};
	$: key = $activeApiToken?.token || '';
	$: keyMasked = key ? `pic_live_••••${key.slice(-5)}` : 'YOUR_API_KEY';
	$: path = typeof call.path === 'function' ? call.path(state.uid) : call.path;
	$: bodyObj = call.body(state.variables || {}, state.uid, state.preset, state.format);
	$: bodyJson = JSON.stringify(bodyObj, null, 2);

	/**
	 * Every input is an explicit argument, and the reactive statements below
	 * pass them by name.
	 *
	 * Svelte tracks only the identifiers that appear IN a `$:` statement, not
	 * the ones a called function closes over — an earlier version read `path`,
	 * `call` and `bodyJson` from scope, so switching calls left the pane
	 * showing the previous request. Naming them here is what makes it reactive.
	 */
	const buildSnippet = (k, method, url, json, language) => {
		if (language === 'NODE') {
			return `await fetch('${url}', {\n  method: '${method}',\n  headers: {\n    Authorization: 'Bearer ${k}',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify(${json.replace(/\n/g, '\n  ')})\n})`;
		}
		if (language === 'PYTHON') {
			return `import requests\n\nrequests.post(\n  '${url}',\n  headers={'Authorization': 'Bearer ${k}'},\n  json=${json.replace(/\n/g, '\n  ')}\n)`;
		}
		return `curl -X ${method} ${url} \\\n  -H "Authorization: Bearer ${k}" \\\n  -H "Content-Type: application/json" \\\n  -d '${json}'`;
	};

	$: fullUrl = `${PUBLIC_BACKEND_URL}${path}`;
	$: shownSnippet = buildSnippet(keyMasked, call.method, fullUrl, bodyJson, lang);
	$: copyableSnippet = buildSnippet(key || 'YOUR_API_KEY', call.method, fullUrl, bodyJson, lang);

	/** Selecting a template pulls its variables in and fills the body with them. */
	async function pickTemplate(event) {
		const uid = event.detail.uid;
		const next = { ...(selection[call.id] || {}), uid, template: event.detail.template };
		try {
			const res = await getTemplateVariables(uid);
			const names = (res?.variables || []).map((v) => (typeof v === 'string' ? v : v?.name)).filter(Boolean);
			next.variables = Object.fromEntries(names.map((n) => [n, `sample ${n}`]));
		} catch {
			// No variables is a legitimate answer; the body just has none.
			next.variables = {};
		}
		selection = { ...selection, [call.id]: next };
	}

	function setField(field, value) {
		selection = { ...selection, [call.id]: { ...(selection[call.id] || {}), [field]: value } };
	}

	async function send() {
		if (call.needsTemplate && !state.uid) {
			showToast('Pick a template first.', 'error', 3000);
			return;
		}
		sending = true;
		response = null;
		batchId = null;
		try {
			const res = await backend.post(path, bodyObj);
			response = res;
			batchId = res?.batchId || null;
			analytics.track('playground_call_sent', { call: call.id });
			if (batchId) pollBatch(batchId);
		} catch (e) {
			response = { error: e?.message || 'That call failed.', code: e?.data?.code, status: e?.status };
		} finally {
			sending = false;
			tab = 'RESPONSE';
		}
	}

	/** A batch answers 202 and finishes later, so the status belongs with the response. */
	async function pollBatch(id) {
		for (let i = 0; i < 20; i++) {
			await new Promise((r) => setTimeout(r, 2000));
			try {
				const status = await backend.get(`/templates/batch/${id}/results`);
				response = { ...(response || {}), batchStatus: status };
				if (['completed', 'failed', 'cancelled'].includes(status?.status)) return;
			} catch {
				return;
			}
		}
	}

	async function cancelBatch() {
		if (!batchId) return;
		try {
			await backend.post(`/templates/batch/${batchId}/cancel`, {});
			showToast('Batch cancelled.', 'success', 3000);
		} catch (e) {
			showToast(e?.message || 'Could not cancel that batch.', 'error', 4000);
		}
	}

	$: resultUrl =
		response?.url || response?.image?.url || response?.results?.[0]?.url || response?.media?.url || null;

	onMount(async () => {
		getAPITokenAction().catch(() => {});
		try {
			const res = await backend.get('/pdf/presets');
			presets = (res?.presets || []).map((p) => p.name);
		} catch {
			presets = ['A4'];
		}
		analytics.track('playground_v2_viewed');
	});
</script>

<svelte:head><title>API playground | Pictify.io</title></svelte:head>

<Toast />

<div class="min-h-full w-full px-6 py-8 lg:px-11 lg:py-9">
	<div class="mx-auto flex max-w-page flex-col gap-6">
		<div class="flex flex-col justify-between gap-2 lg:flex-row lg:items-end">
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.02em] text-brand-ink">
				API playground
			</h1>
			<p class="font-sans text-sm text-brand-mute">Real calls, your key, ready to send.</p>
		</div>

		<div class="flex flex-col gap-6 lg:flex-row">
			<!-- Calls -->
			<div class="flex w-full flex-col gap-5 lg:w-[420px] lg:flex-shrink-0">
				{#each GROUPS as group (group.title)}
					<div class="flex flex-col">
						<div class="flex items-center gap-3 pb-2">
							<span class="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand-ink">
								{group.title}
							</span>
							<span class="h-0.5 flex-1 bg-brand-ink/[0.08]"></span>
						</div>
						{#each group.calls as c (c.id)}
							<button
								type="button"
								on:click={() => {
									openId = c.id;
									tab = 'CODE';
									response = null;
								}}
								class="flex items-center gap-3 border-b border-brand-rule py-3 text-left {openId === c.id
									? ''
									: 'opacity-70 hover:opacity-100'}"
							>
								<span class="w-[44px] flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
									{c.method}
								</span>
								<span class="min-w-0 flex-1 truncate font-sans text-[13.5px] {openId === c.id ? 'font-semibold text-brand-ink' : 'text-brand-slate'}">
									{c.name}
								</span>
								{#if openId === c.id}
									<span class="block h-2 w-2 flex-shrink-0 bg-brand-field" aria-hidden="true"></span>
								{/if}
							</button>
						{/each}
					</div>
				{/each}

				<a
					href="https://docs.pictify.io"
					target="_blank"
					rel="noopener noreferrer"
					class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-blue hover:underline"
				>
					API docs →
				</a>
			</div>

			<!-- Request + response -->
			<div class="flex min-w-0 flex-1 flex-col gap-3">
				<div class="flex flex-col gap-3 rounded-card border border-brand-rule p-5">
					<span class="font-mono text-[12px] text-brand-ink">
						<span class="text-brand-mute">{call.method}</span>
						{path}
					</span>

					{#if call.needsTemplate}
						<label class="flex flex-col gap-1.5">
							<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">
								From your account
							</span>
							<TemplateSelector
								value={state.uid || ''}
								placeholder={call.video ? 'Select a video template…' : 'Select a template…'}
								on:change={pickTemplate}
							/>
						</label>
					{/if}

					{#if call.needsPreset}
						<label class="flex flex-col gap-1.5">
							<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Preset</span>
							<select
								value={state.preset || 'A4'}
								on:change={(e) => setField('preset', e.currentTarget.value)}
								class="rounded-btn border-[1.5px] border-brand-rule px-3 py-2 font-sans text-[13px] text-brand-ink outline-none"
							>
								{#each presets as p (p)}<option value={p}>{p}</option>{/each}
							</select>
						</label>
					{/if}

					{#if call.needsFormat}
						<div class="flex gap-1.5">
							{#each ['mp4', 'gif'] as f (f)}
								<button
									type="button"
									on:click={() => setField('format', f)}
									class="rounded-btn border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] {(state.format || 'mp4') === f
										? 'border-brand-ink bg-brand-field text-brand-ink'
										: 'border-brand-rule text-brand-slate hover:border-brand-ink'}"
								>
									{f}
								</button>
							{/each}
						</div>
					{/if}

					<div class="flex items-center justify-between gap-3 pt-1">
						<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
							Counts as 1 render · your real key
						</span>
						<button
							type="button"
							on:click={send}
							disabled={sending}
							class="flex items-center gap-2 rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
						>
							{sending ? 'Sending…' : 'Send'}
							<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
						</button>
					</div>
				</div>

				<div class="flex items-center gap-2">
					{#each ['CODE', 'RESPONSE'] as t (t)}
						<button
							type="button"
							on:click={() => (tab = t)}
							class="rounded-btn border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] {tab === t
								? 'border-brand-ink bg-brand-field text-brand-ink'
								: 'border-brand-rule text-brand-slate hover:border-brand-ink'}"
						>
							{t}
						</button>
					{/each}
					{#if tab === 'CODE'}
						<span class="flex-1"></span>
						{#each LANGS as l (l)}
							<button
								type="button"
								on:click={() => (lang = l)}
								class="rounded-btn px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] {lang === l
									? 'bg-brand-subtle text-brand-ink'
									: 'text-brand-mute hover:text-brand-ink'}"
							>
								{l}
							</button>
						{/each}
					{/if}
				</div>

				{#if tab === 'CODE'}
					<CodeBlock code={shownSnippet} copyValue={copyableSnippet} maxHeight="max-h-[420px]" />
				{:else}
					<CodeBlock
						code={response ? JSON.stringify(response, null, 2) : 'Send the call to see its response.'}
						showCopy={Boolean(response)}
						maxHeight="max-h-[420px]"
					/>
					{#if resultUrl}
						<div class="flex items-center justify-between gap-3 rounded-card border border-brand-rule px-4 py-3">
							<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
								Also in your renders
							</span>
							<a
								href={resultUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="font-sans text-[13px] font-semibold text-brand-blue hover:underline"
							>
								Open the file →
							</a>
						</div>
					{/if}
					{#if batchId}
						<div class="flex items-center justify-between gap-3 rounded-card border border-brand-rule px-4 py-3">
							<span class="font-mono text-[11px] text-brand-mute">
								Batch {batchId} · {response?.batchStatus?.status || 'queued'}
							</span>
							<button
								type="button"
								on:click={cancelBatch}
								class="rounded-btn border border-brand-alarm px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-alarm hover:bg-brand-alarm hover:text-white"
							>
								Cancel
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
