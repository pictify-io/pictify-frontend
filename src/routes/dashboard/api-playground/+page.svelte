<script>
	/**
	 * API playground — a workbench, not a reference index.
	 *
	 * Three lanes on one screen: the calls you can make, the request you are
	 * about to send, and the answer. The request-as-code and the response are
	 * BOTH visible at once, which is the whole reason this page exists — the
	 * previous version made them tabs, so reading the answer hid the call that
	 * produced it, and comparing the two meant clicking back and forth.
	 *
	 * Everything here is real: your key, your quota, and the renders land on the
	 * Renders page like any other. The status is whatever the server said, taken
	 * off the raw Response — never off an api/* wrapper, which returns null on
	 * failure and is how the old page came to print "200 OK" above an error.
	 */
	import { onMount, tick } from 'svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { html as htmlLang } from '@codemirror/lang-html';
	import { json as jsonLang, jsonParseLinter } from '@codemirror/lang-json';
	import { linter } from '@codemirror/lint';
	import { EditorView, lineNumbers } from '@codemirror/view';
	import { analytics } from '$lib/telemetry.js';
	import { showToast } from '../../../store/toast.store.js';
	import { activeApiToken, getAPITokenAction } from '../../../store/user.store';
	import { usageWidget, initPLG } from '../../../store/plg.store.js';
	import { getTemplateVariables } from '../../../api/template.js';
	import { pressTheme } from '$lib/utils/press-highlight.js';
	import { SNIPPET_LANGS, buildSnippet } from '$lib/dashboard/playground-snippets.js';
	import { copyToClipboard } from '$lib/utils/format.js';
	import TemplateSelector from '$lib/components/TemplateSelector.svelte';
	import CodeBlock from '$lib/components/studio/CodeBlock.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';

	const DOCS = 'https://docs.pictify.io';
	const RECENT_KEY = 'pictify.playground.recent';
	const LANG_KEY = 'pictify.playground.lang';

	const SAMPLE_HTML = `<div style="width:1200px;height:630px;
  display:flex;align-items:center;
  justify-content:center;
  background:#131417;color:#fff;
  font-family:Inter,sans-serif">
  <h1 style="font-size:64px">
    Hello from Pictify
  </h1>
</div>`;

	/**
	 * The nine calls. `/gif` is deliberately absent — it is deprecated, and GIF
	 * output is the `format` parameter on the video render. Template CRUD is
	 * absent too: the studio owns it.
	 *
	 * `body` is a pure function of the lane's state, so the snippet, the
	 * validation and the fetch all read the same object.
	 */
	const GROUPS = [
		{
			title: 'RENDER HTML',
			calls: [
				{
					id: 'html-image',
					name: 'HTML → Image',
					method: 'POST',
					path: () => '/image',
					blurb: 'Render any HTML + CSS to a PNG, JPG or WebP. Fonts, images and JS all load.',
					docs: `${DOCS}/api-reference/image`,
					editor: 'html',
					size: true,
					formats: ['PNG', 'JPG', 'WEBP'],
					body: (s) => ({
						...(s.mode === 'URL' ? { url: s.url || '' } : { html: s.html ?? SAMPLE_HTML }),
						width: Number(s.width ?? 1200),
						height: Number(s.height ?? 630),
						...(s.selector ? { selector: s.selector } : {}),
						fileExtension: (s.format || 'PNG').toLowerCase()
					})
				},
				{
					id: 'html-pdf',
					name: 'HTML → PDF',
					method: 'POST',
					path: () => '/pdf/multi-page',
					blurb: 'One PDF page per row, rendered against a saved template.',
					docs: `${DOCS}/api-reference/pdf`,
					needsTemplate: true,
					editor: 'sets',
					body: (s) => ({
						templateUid: s.uid || ':uid',
						variableSets: s.sets ?? [{}],
						options: { preset: s.preset || 'A4' }
					})
				}
			]
		},
		{
			title: 'RENDER A TEMPLATE',
			calls: [
				{
					id: 'tpl-image',
					name: 'Template → Image',
					method: 'POST',
					path: (s) => `/templates/${s.uid || ':uid'}/render`,
					blurb:
						"Fill a saved template's variables and render it. Layout and size come from the template.",
					docs: `${DOCS}/api-reference/templates`,
					needsTemplate: true,
					editor: 'vars',
					formats: ['PNG', 'JPG', 'PDF'],
					layout: true,
					body: (s) => ({ variables: s.variables ?? {}, format: (s.format || 'PNG').toLowerCase() })
				},
				{
					id: 'tpl-pdf',
					name: 'Template → PDF',
					method: 'POST',
					/*
					 * The same render endpoint with format: 'pdf'. NOT /pdf/render —
					 * that path is FabricJS-only and answers "Template does not have
					 * FabricJS data" for every HTML template, which is all of them now.
					 */
					path: (s) => `/templates/${s.uid || ':uid'}/render`,
					blurb: 'The same template, rendered as a PDF. Page size comes from the template.',
					docs: `${DOCS}/api-reference/templates`,
					needsTemplate: true,
					editor: 'vars',
					layout: true,
					body: (s) => ({ variables: s.variables ?? {}, format: 'pdf' })
				},
				{
					id: 'tpl-video',
					name: 'Template → Video / GIF',
					method: 'POST',
					path: (s) => `/video/templates/${s.uid || ':uid'}/render`,
					blurb: 'Render a video template. GIF is a format on this call, not a separate endpoint.',
					docs: `${DOCS}/api-reference/video`,
					needsTemplate: true,
					editor: 'vars',
					formats: ['MP4', 'GIF'],
					body: (s) => ({ variables: s.variables ?? {}, format: (s.format || 'MP4').toLowerCase() })
				}
			]
		},
		{
			title: 'RENDER MANY',
			calls: [
				{
					id: 'batch-rows',
					name: 'Batch from rows',
					method: 'POST',
					path: (s) => `/templates/${s.uid || ':uid'}/batch-render`,
					blurb:
						'One render per row. Answers 202 with a batch id, then finishes in the background.',
					docs: `${DOCS}/api-reference/batch`,
					needsTemplate: true,
					editor: 'sets',
					batch: true,
					formats: ['PNG', 'JPG', 'PDF'],
					body: (s) => ({
						variableSets: s.sets ?? [{}],
						format: (s.format || 'PNG').toLowerCase()
					})
				},
				{
					id: 'batch-csv',
					name: 'Batch from CSV',
					method: 'POST',
					path: (s) => `/templates/${s.uid || ':uid'}/batch-render`,
					blurb: 'The same batch, fed by a CSV. The header row names the variables.',
					docs: `${DOCS}/api-reference/batch`,
					needsTemplate: true,
					editor: 'csv',
					batch: true,
					formats: ['PNG', 'JPG', 'PDF'],
					body: (s) => ({
						csv: s.csv ?? 'name,title\nMika,Designer\nPriya,Engineer',
						format: (s.format || 'PNG').toLowerCase()
					})
				}
			]
		},
		{
			title: 'LOOK UP',
			calls: [
				{
					id: 'tpl-vars',
					name: 'Template variables',
					method: 'GET',
					path: (s) => `/templates/${s.uid || ':uid'}/variables`,
					blurb: 'Which variables a template declares. This is what the FORM tab is built from.',
					docs: `${DOCS}/api-reference/templates`,
					needsTemplate: true,
					editor: 'none'
				},
				{
					id: 'batch-results',
					name: 'Batch results',
					method: 'GET',
					path: (s) => `/templates/batch/${s.batchId || ':id'}/results`,
					blurb: 'Where a batch got to, and a URL per finished row.',
					docs: `${DOCS}/api-reference/batch`,
					editor: 'none',
					idField: { key: 'batchId', label: 'BATCH ID', placeholder: 'bat_…' }
				}
			]
		}
	];

	const ALL = GROUPS.flatMap((g) => g.calls);

	let openId = 'html-image';
	let selection = {};
	let sending = false;
	let response = null;
	let showHeaders = false;
	let keyRevealed = false;
	let revealTimer = null;
	let lang = 'NODE';
	let recent = [];
	let expanded = false;
	let previewDims = '';
	let editorView = null;
	let batchTimer = null;

	$: call = ALL.find((c) => c.id === openId) || ALL[0];
	$: state = selection[call.id] || {};
	$: key = $activeApiToken?.token || '';
	$: keyMasked = key ? `pic_live_••••${key.slice(-5)}` : 'YOUR_API_KEY';
	$: rendersLeft = Math.max(0, ($usageWidget?.limit ?? 0) - ($usageWidget?.current ?? 0));

	/**
	 * The request object. Everything downstream — the four snippets, the
	 * validation line and `send()` — reads THIS, so the page cannot show one
	 * call and make another.
	 */
	function buildRequest(c, s, k) {
		const url = `${PUBLIC_BACKEND_URL}${c.path(s)}`;
		const headers = { Authorization: `Bearer ${k}` };
		if (c.method !== 'GET') headers['Content-Type'] = 'application/json';
		const body = c.method === 'GET' || !c.body ? undefined : c.body(s);
		return { method: c.method, url, headers, body };
	}

	$: request = buildRequest(call, state, keyMasked);
	$: sendableRequest = buildRequest(call, state, key || 'YOUR_API_KEY');
	$: shownSnippet = buildSnippet(lang, request);
	$: copyableSnippet = buildSnippet(lang, sendableRequest);
	$: snippetMode = (SNIPPET_LANGS.find((l) => l.id === lang) || SNIPPET_LANGS[0]).hl;

	// ── Editor plumbing ────────────────────────────────────────────────────
	const grabView = EditorView.updateListener.of((u) => {
		editorView = u.view;
	});
	$: editorExtensions =
		call.editor === 'html'
			? [...pressTheme, lineNumbers(), EditorView.lineWrapping, htmlLang(), grabView]
			: [
					...pressTheme,
					lineNumbers(),
					EditorView.lineWrapping,
					jsonLang(),
					linter(jsonParseLinter()),
					grabView
			  ];

	/** The text in the editor for this call, as a string. */
	$: editorValue =
		call.editor === 'html'
			? state.html ?? SAMPLE_HTML
			: call.editor === 'csv'
			? state.csv ?? 'name,title\nMika,Designer\nPriya,Engineer'
			: call.editor === 'sets'
			? state.setsText ?? JSON.stringify(state.sets ?? [{}], null, 2)
			: state.varsText ?? JSON.stringify(state.variables ?? {}, null, 2);

	function onEditorChange(value) {
		if (call.editor === 'html') return setField('html', value);
		if (call.editor === 'csv') return setField('csv', value);
		if (call.editor === 'sets') {
			setField('setsText', value);
			try {
				setField('sets', JSON.parse(value));
			} catch {
				/* the validation line reports it; the body keeps its last good value */
			}
			return;
		}
		setField('varsText', value);
		try {
			setField('variables', JSON.parse(value));
		} catch {
			/* same */
		}
	}

	/**
	 * One line under the editor. It tells, it does not block: Send stays enabled
	 * so the server's own answer is always reachable, which is the point of a
	 * playground.
	 */
	$: validation = validate(call, state);
	function validate(c, s) {
		if (c.editor === 'vars' || c.editor === 'sets') {
			const text = c.editor === 'sets' ? s.setsText : s.varsText;
			if (text != null) {
				try {
					JSON.parse(text);
				} catch (e) {
					const at = /position (\d+)/.exec(e.message);
					const line = at ? text.slice(0, Number(at[1])).split('\n').length : null;
					return {
						text: `${e.message.replace(/ in JSON.*$/, '')}${line ? ` · line ${line}` : ''}`,
						line
					};
				}
			}
		}
		if (c.editor === 'vars' && Array.isArray(s.required)) {
			const vars = s.variables || {};
			const missing = s.required.find((n) => !vars[n]);
			if (missing) {
				const text = s.varsText || '';
				const idx = text.split('\n').findIndex((l) => l.includes(`"${missing}"`));
				return {
					text: `${missing} is required · line ${idx + 1}`,
					line: idx >= 0 ? idx + 1 : null
				};
			}
		}
		if (c.size) {
			const w = Number(s.width ?? 1200);
			const h = Number(s.height ?? 630);
			if (!(w >= 1 && w <= 4000) || !(h >= 1 && h <= 4000))
				return { text: 'width and height must be between 1 and 4000', line: null };
		}
		if (c.needsTemplate && !s.uid)
			return { text: 'Pick a template to fill this call.', line: null };
		return null;
	}

	function setField(field, value) {
		selection = { ...selection, [call.id]: { ...(selection[call.id] || {}), [field]: value } };
	}

	/** Move the cursor to a line the error named, and focus the editor. */
	async function jumpToLine(line) {
		if (!editorView || !line) return;
		await tick();
		const doc = editorView.state.doc;
		const target = Math.min(Math.max(1, line), doc.lines);
		const pos = doc.line(target).from;
		editorView.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
		editorView.focus();
	}

	/** Selecting a template pulls its variables in and fills the editor. */
	async function pickTemplate(event) {
		const uid = event.detail.uid;
		const next = { ...(selection[call.id] || {}), uid, template: event.detail.template };
		try {
			const res = await getTemplateVariables(uid);
			const names = (res?.variables || [])
				.map((v) => (typeof v === 'string' ? v : v?.name))
				.filter(Boolean);
			next.required = names;
			next.variables = Object.fromEntries(names.map((n) => [n, `sample ${n}`]));
			next.varsText = JSON.stringify(next.variables, null, 2);
			next.sets = [next.variables, next.variables];
			next.setsText = JSON.stringify(next.sets, null, 2);
		} catch {
			// No variables is a legitimate answer; the body just has none.
			next.required = [];
			next.variables = {};
			next.varsText = '{}';
		}
		selection = { ...selection, [call.id]: next };
	}

	function refillFromTemplate() {
		if (!state.uid) return;
		const dirty = state.varsText && state.varsText !== JSON.stringify(state.variables, null, 2);
		if (dirty && !confirm('Replace your edits with the template values?')) return;
		pickTemplate({ detail: { uid: state.uid, template: state.template } });
	}

	// ── Send ───────────────────────────────────────────────────────────────
	/**
	 * The raw fetch stays raw.
	 *
	 * Bearer, not cookies: the render endpoints sit behind verifyApiToken, and
	 * the pane says "your real key", so it should be the key that authenticates.
	 * The status, headers and latency come straight off the Response — an
	 * api/* wrapper would swallow the failure and hand back null.
	 */
	async function send() {
		if (!key) {
			showToast('No API key on this account yet — create one in Settings.', 'error', 4000);
			return;
		}
		sending = true;
		response = null;
		showHeaders = false;
		previewDims = '';
		clearTimeout(batchTimer);

		const req = sendableRequest;
		const started = performance.now();
		try {
			const raw = await fetch(req.url, {
				method: req.method,
				headers: req.headers,
				...(req.body === undefined ? {} : { body: JSON.stringify(req.body) })
			});
			const latencyMs = performance.now() - started;
			const text = await raw.text();
			let body;
			try {
				body = JSON.parse(text);
			} catch {
				body = { raw: text };
			}
			response = {
				status: raw.status,
				ok: raw.ok,
				headers: Object.fromEntries(raw.headers.entries()),
				latencyMs,
				body
			};
			analytics.track('playground_call_sent', {
				call_id: call.id,
				status: raw.status,
				latency_ms: Math.round(latencyMs),
				lang_shown: lang
			});
			if (raw.ok) {
				// Optimistic: the render is already counted server-side.
				usageWidget.update((u) => ({ ...u, current: (u.current || 0) + 1 }));
			}
			pushRecent(raw.status, latencyMs);
			const id = body?.batchId || body?.batch?.id;
			if (raw.status === 202 && id) pollBatch(id);
		} catch (e) {
			// A transport failure is not an HTTP status, and must not be dressed
			// up as one.
			response = {
				status: 0,
				ok: false,
				headers: {},
				latencyMs: performance.now() - started,
				body: { error: e?.message || 'The request never reached the server.' }
			};
			pushRecent(0, response.latencyMs);
		} finally {
			sending = false;
		}
	}

	async function pollBatch(id) {
		for (let i = 0; i < 20; i++) {
			await new Promise((r) => {
				batchTimer = setTimeout(r, 2000);
			});
			try {
				const raw = await fetch(`${PUBLIC_BACKEND_URL}/templates/batch/${id}/results`, {
					headers: { Authorization: `Bearer ${key}` }
				});
				const body = await raw.json();
				response = { ...response, status: raw.status, body };
				if (['completed', 'failed', 'cancelled'].includes(body?.status)) return;
			} catch {
				return;
			}
		}
	}

	async function cancelBatch() {
		const id = response?.body?.batchId || response?.body?.batch?.id;
		if (!id) return;
		clearTimeout(batchTimer);
		try {
			await fetch(`${PUBLIC_BACKEND_URL}/templates/batch/${id}/cancel`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
				body: '{}'
			});
			showToast('Batch cancelled.', 'success', 3000);
		} catch (e) {
			showToast(e?.message || 'Could not cancel that batch.', 'error', 4000);
		}
	}

	// ── Recent ─────────────────────────────────────────────────────────────
	function pushRecent(status, latencyMs) {
		const entry = {
			callId: call.id,
			path: call.path(state),
			status,
			latencyMs: Math.round(latencyMs),
			at: Date.now(),
			body: selection[call.id] || {}
		};
		recent = [entry, ...recent.filter((r) => r.at !== entry.at)].slice(0, 5);
		try {
			localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
		} catch {
			/* a private window is allowed to refuse; the list is a convenience */
		}
	}

	function restoreRecent(entry) {
		openId = entry.callId;
		selection = { ...selection, [entry.callId]: { ...entry.body } };
	}

	const shortPath = (p) => (p.length > 22 ? `${p.slice(0, 10)}…${p.slice(-10)}` : p);
	const clock = (ms) =>
		new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

	// ── Response reading ───────────────────────────────────────────────────
	$: resultUrl =
		response?.body?.url ||
		response?.body?.image?.url ||
		response?.body?.media?.url ||
		response?.body?.results?.[0]?.url ||
		null;
	$: statusColor =
		!response || response.status === 0
			? 'var(--tw-pink)'
			: response.status >= 200 && response.status < 300
			? '#00BE43'
			: response.status < 400
			? '#D8F34A'
			: '#FF48B0';
	$: latencyText = !response
		? ''
		: response.latencyMs >= 10000
		? `${Math.round(response.latencyMs / 1000)} s`
		: `${(response.latencyMs / 1000).toFixed(2)} s`;
	$: responseJson = response ? JSON.stringify(response.body, null, 2) : '';
	$: errorField = findErrorField(response);

	/** The field an error names, so the hint can offer to jump to it. */
	function findErrorField(r) {
		if (!r || r.ok) return null;
		const raw = r.body?.details?.field || r.body?.field || '';
		const named = String(raw).split('.').pop();
		if (named) return named;
		const m = /variable:?\s*([A-Za-z_][\w]*)/i.exec(r.body?.message || '');
		return m ? m[1] : null;
	}
	$: errorLine = (() => {
		if (!errorField) return null;
		const text = call.editor === 'sets' ? state.setsText : state.varsText;
		if (!text) return null;
		const idx = text.split('\n').findIndex((l) => l.includes(`"${errorField}"`));
		return idx >= 0 ? idx + 1 : null;
	})();

	function revealKey() {
		keyRevealed = true;
		analytics.track('playground_key_reveal');
		clearTimeout(revealTimer);
		revealTimer = setTimeout(() => (keyRevealed = false), 10000);
	}

	function copySnippet() {
		copyToClipboard(copyableSnippet, 'Snippet copied');
		analytics.track('playground_snippet_copied', {
			call_id: call.id,
			lang,
			key_revealed: keyRevealed
		});
	}

	function resultAction(action) {
		analytics.track('playground_result_action', { action });
	}

	function onImageLoad(e) {
		const img = e.currentTarget;
		const bytes = Number(response?.headers?.['content-length']) || response?.body?.size || 0;
		previewDims = `${img.naturalWidth}×${img.naturalHeight}${
			bytes ? ` · ${Math.round(bytes / 1024)} KB` : ''
		}`;
	}

	function onKeydown(e) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
			e.preventDefault();
			if (!sending) send();
		}
	}

	onMount(() => {
		getAPITokenAction().catch(() => {});
		initPLG().catch(() => {});
		try {
			recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
			lang = localStorage.getItem(LANG_KEY) || 'NODE';
		} catch {
			/* fine — both are conveniences */
		}
		analytics.track('playground_v2_viewed');
		return () => {
			clearTimeout(revealTimer);
			clearTimeout(batchTimer);
		};
	});

	$: if (typeof localStorage !== 'undefined' && lang) {
		try {
			localStorage.setItem(LANG_KEY, lang);
		} catch {
			/* ignore */
		}
	}
</script>

<svelte:head><title>API playground | Pictify.io</title></svelte:head>
<svelte:window on:keydown={onKeydown} />

<Toast />

<div
	class="flex h-full w-full flex-col gap-[22px] bg-brand-paper px-6 pb-8 pt-6 lg:px-11 lg:pb-8 lg:pt-9"
>
	<!-- ── Header ──────────────────────────────────────────────────── -->
	<div
		class="flex flex-shrink-0 flex-col gap-3 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between"
	>
		<div class="flex flex-wrap items-baseline gap-3.5">
			<h1
				class="font-display text-[44px] font-bold leading-[48px] tracking-[-0.02em] text-brand-ink"
			>
				API playground
			</h1>
			<p class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">
				REAL CALLS · YOUR KEY · LANDS IN RENDERS
			</p>
		</div>
		<div class="flex h-[34px] w-fit items-center gap-2 rounded-btn border border-brand-rule px-3">
			<span class="font-mono text-[11px] tracking-[0.06em] text-brand-mute">KEY</span>
			<span class="font-mono text-xs text-brand-ink">{keyMasked}</span>
			<button
				type="button"
				class="font-mono text-[11px] tracking-[0.06em] text-brand-blue hover:underline"
				on:click={() => copyToClipboard(key, 'API key copied')}>COPY</button
			>
			<span class="h-3.5 w-px bg-brand-rule" aria-hidden="true" />
			<a
				href="/dashboard/settings"
				class="font-mono text-[11px] tracking-[0.06em] text-brand-blue hover:underline">ROTATE</a
			>
		</div>
	</div>

	<!-- ── Workbench ───────────────────────────────────────────────── -->
	<div class="flex min-h-0 flex-1 flex-col gap-4 min-[1200px]:flex-row">
		<!-- Calls lane -->
		<div class="flex flex-shrink-0 flex-col gap-0.5 min-[1200px]:w-[216px]">
			<!-- Below 900 the lane collapses to a select; the rows would push the
			     request off the screen on a phone. -->
			<label class="flex flex-col gap-1.5 min-[900px]:hidden">
				<span class="font-mono text-[10px] tracking-[0.08em] text-brand-mute">CALL</span>
				<select
					bind:value={openId}
					class="h-9 rounded-btn border border-brand-ink bg-brand-paper px-2.5 font-mono text-xs text-brand-ink"
				>
					{#each GROUPS as g (g.title)}
						<optgroup label={g.title}>
							{#each g.calls as c (c.id)}<option value={c.id}>{c.method} · {c.name}</option>{/each}
						</optgroup>
					{/each}
				</select>
			</label>

			<div class="hidden flex-col gap-0.5 min-[900px]:flex min-[1200px]:h-full">
				{#each GROUPS as group, gi (group.title)}
					<div class="flex items-center gap-2.5 pb-1 {gi === 0 ? 'h-7' : 'h-[42px] pt-3.5'}">
						<span class="flex-shrink-0 font-mono text-[11px] tracking-[0.08em] text-brand-ink">
							{group.title}
						</span>
						<span class="h-px flex-1 bg-brand-rule" aria-hidden="true" />
					</div>
					{#each group.calls as c (c.id)}
						<button
							type="button"
							on:click={() => (openId = c.id)}
							class="flex h-10 items-center gap-2.5 rounded-btn px-2.5 text-left transition-colors {openId ===
							c.id
								? 'bg-brand-field'
								: 'hover:bg-brand-subtle'}"
						>
							<span
								class="w-9 flex-shrink-0 font-mono text-[10px] tracking-[0.06em] {openId === c.id
									? 'text-brand-ink'
									: 'text-brand-mute'}"
							>
								{c.method}
							</span>
							<span
								class="flex-1 font-sans text-[13.5px] leading-[18px] {openId === c.id
									? 'font-semibold text-brand-ink'
									: 'text-brand-slate'}"
							>
								{c.name}
							</span>
						</button>
					{/each}
				{/each}

				<div class="flex-1" aria-hidden="true" />

				<div class="flex flex-col gap-2 border-t border-brand-rule pt-3.5">
					<p class="font-mono text-[11px] tracking-[0.08em] text-brand-mute">
						RECENT · THIS BROWSER
					</p>
					{#each recent as r (r.at)}
						<button
							type="button"
							on:click={() => restoreRecent(r)}
							class="flex h-6 items-center gap-2 text-left hover:opacity-70"
						>
							<span
								class="h-2 w-2 flex-shrink-0"
								style="background-color: {r.status >= 200 && r.status < 300
									? '#00BE43'
									: '#FF48B0'}"
								aria-hidden="true"
							/>
							<span class="flex-1 truncate font-mono text-[11.5px] text-brand-slate">
								{shortPath(r.path)} · {r.status || 'ERR'} · {(r.latencyMs / 1000).toFixed(1)}s
							</span>
							<span class="font-mono text-[10px] text-brand-mute">{clock(r.at)}</span>
						</button>
					{:else}
						<p class="font-mono text-[11px] text-brand-mute">Nothing sent yet.</p>
					{/each}
					<a
						href={DOCS}
						target="_blank"
						rel="noopener"
						class="pt-1.5 font-mono text-[11px] tracking-[0.06em] text-brand-blue hover:underline"
					>
						MORE ENDPOINTS IN THE DOCS →
					</a>
				</div>
			</div>
		</div>

		<!-- Request lane -->
		<div
			class="flex min-h-0 flex-shrink-0 flex-col overflow-hidden rounded-card border border-brand-rule min-[1200px]:w-[372px]"
		>
			<div class="flex flex-col gap-1.5 border-b border-brand-rule px-5 pb-3.5 pt-4">
				<div class="flex items-center justify-between gap-3">
					<div class="flex min-w-0 items-baseline gap-2">
						<span class="flex-shrink-0 font-mono text-xs text-brand-mute">{call.method}</span>
						<span class="truncate font-mono text-[13px] text-brand-ink">{call.path(state)}</span>
					</div>
					<a
						href={call.docs}
						target="_blank"
						rel="noopener"
						class="flex-shrink-0 font-mono text-[11px] tracking-[0.06em] text-brand-blue hover:underline"
					>
						DOCS ↗
					</a>
				</div>
				<p class="font-sans text-[13px] leading-[19px] text-brand-slate">{call.blurb}</p>
			</div>

			<!-- Body field -->
			<div class="flex min-h-0 flex-1 flex-col gap-2 px-5 pt-4">
				{#if call.needsTemplate}
					<p class="font-mono text-[10px] tracking-[0.08em] text-brand-mute">
						TEMPLATE · FROM YOUR ACCOUNT
					</p>
					<TemplateSelector
						value={state.uid || ''}
						selectedTemplate={state.template || null}
						placeholder="Pick a template…"
						on:change={pickTemplate}
					/>
				{/if}

				{#if call.idField}
					<p class="font-mono text-[10px] tracking-[0.08em] text-brand-mute">
						{call.idField.label}
					</p>
					<input
						value={state[call.idField.key] || ''}
						on:input={(e) => setField(call.idField.key, e.currentTarget.value)}
						placeholder={call.idField.placeholder}
						class="h-9 rounded-btn border border-brand-ink px-3 font-mono text-[12.5px] text-brand-ink outline-none"
					/>
				{/if}

				{#if call.editor === 'none'}
					<p class="pt-2 font-sans text-[13px] leading-[19px] text-brand-mute">
						This call has no body.
					</p>
				{:else}
					<div class="flex items-center justify-between pt-2.5">
						<div class="flex gap-3.5">
							{#if call.editor === 'html'}
								{#each ['HTML', 'URL'] as t (t)}
									<button
										type="button"
										on:click={() => setField('mode', t)}
										class="pb-1 font-mono text-[11px] tracking-[0.08em] {(state.mode || 'HTML') ===
										t
											? 'border-b-2 border-brand-ink text-brand-ink'
											: 'text-brand-mute'}">{t}</button
									>
								{/each}
							{:else if call.editor === 'vars'}
								{#each ['VARIABLES', 'FORM'] as t (t)}
									<button
										type="button"
										on:click={() => setField('varsTab', t)}
										class="pb-1 font-mono text-[11px] tracking-[0.08em] {(state.varsTab ||
											'VARIABLES') === t
											? 'border-b-2 border-brand-ink text-brand-ink'
											: 'text-brand-mute'}">{t}</button
									>
								{/each}
							{:else}
								<span class="pb-1 font-mono text-[11px] tracking-[0.08em] text-brand-ink">
									{call.editor === 'csv' ? 'CSV' : 'VARIABLE SETS'}
								</span>
							{/if}
						</div>
						<div class="flex gap-3">
							{#if call.editor === 'html'}
								<button
									type="button"
									on:click={() => setField('html', SAMPLE_HTML)}
									class="font-mono text-[11px] tracking-[0.06em] text-brand-blue hover:underline"
									>SAMPLE</button
								>
							{:else if call.needsTemplate}
								<button
									type="button"
									on:click={refillFromTemplate}
									class="font-mono text-[11px] tracking-[0.06em] text-brand-blue hover:underline"
									>REFILL FROM TEMPLATE</button
								>
							{/if}
							<button
								type="button"
								on:click={() => (expanded = true)}
								title="Expand the editor"
								class="font-mono text-[11px] text-brand-blue hover:underline">⤢</button
							>
						</div>
					</div>

					{#if call.editor === 'html' && (state.mode || 'HTML') === 'URL'}
						<input
							value={state.url || ''}
							on:input={(e) => setField('url', e.currentTarget.value)}
							placeholder="https://example.com"
							class="h-9 rounded-btn border border-brand-ink px-3 font-mono text-[12.5px] text-brand-ink outline-none"
						/>
						<div class="flex-1" />
					{:else if call.editor === 'vars' && state.varsTab === 'FORM'}
						<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pt-1">
							{#each state.required || [] as name (name)}
								<label class="flex flex-col gap-1">
									<span class="font-mono text-[10px] tracking-[0.08em] text-brand-mute">{name}</span
									>
									<input
										value={state.variables?.[name] ?? ''}
										on:input={(e) => {
											const next = { ...(state.variables || {}), [name]: e.currentTarget.value };
											setField('variables', next);
											setField('varsText', JSON.stringify(next, null, 2));
										}}
										class="h-8 rounded-btn border border-brand-rule px-2.5 font-mono text-xs text-brand-ink outline-none focus:border-brand-ink"
									/>
								</label>
							{:else}
								<p class="font-sans text-[13px] text-brand-mute">
									Pick a template to see its variables.
								</p>
							{/each}
						</div>
					{:else}
						<div class="min-h-0 flex-1 overflow-hidden rounded-lg pg-editor">
							<CodeMirror
								value={editorValue}
								extensions={editorExtensions}
								on:change={(e) => onEditorChange(e.detail)}
							/>
						</div>
					{/if}

					{#if validation}
						<div class="flex items-center gap-2 pt-0.5">
							<span class="h-2 w-2 flex-shrink-0 bg-brand-pink" aria-hidden="true" />
							<span class="font-mono text-[11px] text-brand-slate">{validation.text}</span>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Options -->
			{#if call.size || call.formats || call.layout}
				<div class="flex flex-col gap-3 px-5 pb-4 pt-4">
					{#if call.size}
						<div class="flex items-center gap-2.5">
							<span
								class="w-[60px] flex-shrink-0 font-mono text-[10px] tracking-[0.08em] text-brand-mute"
							>
								WIDTH
							</span>
							<div class="flex h-8 flex-1 items-center rounded-btn border border-brand-rule px-2.5">
								<input
									value={state.width ?? 1200}
									on:input={(e) => setField('width', e.currentTarget.value)}
									class="w-full bg-transparent font-mono text-xs text-brand-ink outline-none"
								/>
								<span class="font-mono text-[10px] text-brand-mute">PX</span>
							</div>
							<span
								class="w-[54px] flex-shrink-0 font-mono text-[10px] tracking-[0.08em] text-brand-mute"
							>
								HEIGHT
							</span>
							<div class="flex h-8 flex-1 items-center rounded-btn border border-brand-rule px-2.5">
								<input
									value={state.height ?? 630}
									on:input={(e) => setField('height', e.currentTarget.value)}
									class="w-full bg-transparent font-mono text-xs text-brand-ink outline-none"
								/>
								<span class="font-mono text-[10px] text-brand-mute">PX</span>
							</div>
						</div>
					{/if}

					{#if call.formats}
						<div class="flex items-center gap-2.5">
							<span
								class="w-[60px] flex-shrink-0 font-mono text-[10px] tracking-[0.08em] text-brand-mute"
							>
								FORMAT
							</span>
							<div class="flex gap-1.5">
								{#each call.formats as f (f)}
									<button
										type="button"
										on:click={() => setField('format', f)}
										class="flex h-7 items-center rounded-btn px-3 font-mono text-[11px] tracking-[0.06em] {(state.format ||
											call.formats[0]) === f
											? 'bg-brand-ink text-white'
											: 'border border-brand-rule text-brand-slate'}">{f}</button
									>
								{/each}
							</div>
						</div>
					{/if}

					{#if call.layout}
						<div class="flex items-center gap-2.5">
							<span
								class="w-[60px] flex-shrink-0 font-mono text-[10px] tracking-[0.08em] text-brand-mute"
							>
								LAYOUT
							</span>
							<div
								class="flex h-8 flex-1 items-center justify-between rounded-btn border border-brand-rule px-2.5"
							>
								<span class="font-mono text-xs text-brand-ink">
									{state.template?.width && state.template?.height
										? `default · ${state.template.width}×${state.template.height}`
										: 'default · from the template'}
								</span>
							</div>
						</div>
					{/if}

					{#if call.size}
						<div class="flex items-center gap-2.5">
							<span
								class="w-[60px] flex-shrink-0 font-mono text-[10px] tracking-[0.08em] text-brand-mute"
							>
								SELECTOR
							</span>
							<input
								value={state.selector || ''}
								on:input={(e) => setField('selector', e.currentTarget.value)}
								placeholder="optional · #main"
								class="h-8 flex-1 rounded-btn border border-brand-rule px-2.5 font-mono text-xs text-brand-ink outline-none"
							/>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Send bar -->
			<div
				class="flex flex-shrink-0 items-center justify-between border-t border-brand-rule bg-brand-subtle px-5 pb-4 pt-3.5"
			>
				<div class="flex flex-col gap-[3px]">
					<span class="font-mono text-[10px] tracking-[0.08em] text-brand-mute">
						COUNTS AS 1 RENDER · {rendersLeft.toLocaleString()} LEFT
					</span>
					<span class="font-mono text-[10px] tracking-[0.08em] text-brand-mute">⌘⏎ TO SEND</span>
				</div>
				<button
					type="button"
					on:click={send}
					disabled={sending}
					class="flex h-10 items-center gap-2.5 rounded-btn bg-brand-ink px-4 font-sans text-sm font-semibold text-white disabled:opacity-60"
				>
					{sending ? 'Sending…' : 'Send'}
					<span class="h-2 w-2 bg-brand-field" aria-hidden="true" />
				</button>
			</div>
		</div>

		<!-- Output lane -->
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card bg-brand-press-deep">
			<!-- Code strip -->
			<div
				class="flex h-11 flex-shrink-0 items-center justify-between px-3.5"
				class:pg-rule-b={true}
			>
				<div class="flex items-center gap-1.5">
					<span class="pr-2 font-mono text-[11px] tracking-[0.08em]" class:pg-dim={true}>
						REQUEST AS
					</span>
					{#each SNIPPET_LANGS as l (l.id)}
						<button
							type="button"
							on:click={() => (lang = l.id)}
							class="flex h-[26px] items-center rounded-btn px-2.5 font-mono text-[11px] tracking-[0.06em]"
							class:bg-brand-field={lang === l.id}
							class:text-brand-ink={lang === l.id}
							class:text-brand-press-text={lang !== l.id}>{l.id}</button
						>
					{/each}
				</div>
				<div class="flex items-center gap-3.5">
					<button
						type="button"
						on:click={revealKey}
						class="font-mono text-[11px] tracking-[0.06em]"
						class:pg-dim={true}>KEY: {keyRevealed ? 'SHOWN' : 'MASKED'}</button
					>
					<button
						type="button"
						on:click={copySnippet}
						class="font-mono text-[11px] tracking-[0.06em] text-white">COPY</button
					>
				</div>
			</div>

			<!-- Request as code -->
			<div class="min-h-0 shrink-0 overflow-auto px-3.5 pb-4 pt-3.5" style="max-height: 45%">
				<CodeBlock
					code={keyRevealed ? copyableSnippet : shownSnippet}
					lang={snippetMode}
					bare
					showCopy={false}
					maxHeight="max-h-none"
				/>
			</div>

			<!-- Status line -->
			<div class="flex h-11 flex-shrink-0 items-center justify-between px-3.5">
				<div class="flex min-w-0 items-center gap-3">
					<span class="flex-shrink-0 font-mono text-[11px] tracking-[0.08em]" class:pg-dim={true}>
						RESPONSE
					</span>
					{#if sending}
						<span class="pg-pulse font-mono text-xs" class:text-brand-press-text={true}
							>sending…</span
						>
					{:else if response}
						<span class="flex items-center gap-1.5">
							<span class="h-2 w-2 flex-shrink-0" style="background-color: {statusColor}" />
							<span class="font-mono text-xs font-semibold" style="color: {statusColor}">
								{response.status || 'ERR'}
							</span>
						</span>
						<span class="flex-shrink-0 font-mono text-xs" class:text-brand-press-text={true}
							>{latencyText}</span
						>
						{#if previewDims}
							<span class="truncate font-mono text-xs" class:text-brand-press-text={true}
								>{previewDims}</span
							>
						{:else if response.body?.code}
							<span class="truncate font-mono text-xs" class:text-brand-press-text={true}
								>{response.body.code}</span
							>
						{/if}
					{:else}
						<span class="font-mono text-xs" class:pg-dim={true}>
							send the call to see its answer
						</span>
					{/if}
				</div>
				{#if response}
					<div class="flex flex-shrink-0 gap-3 pl-3">
						<button
							type="button"
							on:click={() => (showHeaders = !showHeaders)}
							class="font-mono text-[11px] tracking-[0.06em]"
							class:pg-dim={true}>HEADERS</button
						>
						<button
							type="button"
							on:click={() => copyToClipboard(responseJson, 'Response copied')}
							class="font-mono text-[11px] tracking-[0.06em] text-white">COPY JSON</button
						>
					</div>
				{/if}
			</div>

			<!-- Response body -->
			<div class="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto px-3.5 pb-4">
				{#if showHeaders && response}
					<div class="rounded-lg p-3" class:pg-rule={true}>
						{#each Object.entries(response.headers) as [k, v] (k)}
							<div class="flex gap-3 font-mono text-[11px] leading-[18px]">
								<span class="w-40 flex-shrink-0" class:pg-dim={true}>{k}</span>
								<span class="min-w-0 break-all" class:text-brand-press-text={true}>{v}</span>
							</div>
						{/each}
					</div>
				{/if}

				{#if response}
					<div class="flex gap-3.5">
						{#if resultUrl}
							<div class="flex w-[196px] flex-shrink-0 flex-col gap-2">
								<div
									class="flex h-[110px] items-center justify-center overflow-hidden rounded-lg"
									class:pg-rule={true}
								>
									{#if /\.(png|jpe?g|webp|gif)(\?|$)/i.test(resultUrl)}
										<img
											src={resultUrl}
											alt="The render this call produced"
											on:load={onImageLoad}
											class="max-h-full max-w-full object-contain"
										/>
									{:else}
										<span class="font-mono text-[11px]" class:pg-dim={true}>
											{resultUrl.split('.').pop()?.slice(0, 4).toUpperCase()} FILE
										</span>
									{/if}
								</div>
								<div class="flex flex-col gap-1 font-mono text-[11px] tracking-[0.06em]">
									<a
										href={resultUrl}
										target="_blank"
										rel="noopener"
										on:click={() => resultAction('open')}
										class:text-brand-field={true}>OPEN ↗</a
									>
									<a
										href={resultUrl}
										download
										on:click={() => resultAction('download')}
										class:text-brand-press-text={true}>DOWNLOAD</a
									>
									<a href="/dashboard/renders" class:pg-dim={true}>ALSO IN YOUR RENDERS</a>
								</div>
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<CodeBlock
								code={responseJson}
								lang="json"
								bare
								showCopy={false}
								maxHeight="max-h-none"
							/>
						</div>
					</div>

					{#if !response.ok}
						<div
							class="flex items-center justify-between gap-4 rounded-lg px-3.5 py-3"
							class:pg-rule={true}
						>
							<div class="flex min-w-0 flex-col gap-[3px]">
								<p class="font-sans text-[13px] font-semibold text-white">
									{#if errorField}
										The template needs {errorField}.
									{:else if response.status === 403}
										Verify your email to render.
									{:else if response.status === 0}
										The request never reached the server.
									{:else}
										{response.body?.message || `That call answered ${response.status}.`}
									{/if}
								</p>
								<p class="font-sans text-[12.5px]" class:text-brand-press-text={true}>
									{#if response.status >= 500 || response.status === 0}
										Try again; if it repeats, the request id above is what support needs.
									{:else}
										Nothing was rendered and nothing was counted.
									{/if}
								</p>
							</div>
							{#if response.status === 403}
								<a
									href="/dashboard/settings"
									class="flex-shrink-0 font-mono text-[11px] tracking-[0.06em]"
									class:text-brand-field={true}>RESEND LINK</a
								>
							{:else if errorLine}
								<button
									type="button"
									on:click={() => jumpToLine(errorLine)}
									class="flex-shrink-0 font-mono text-[11px] tracking-[0.06em]"
									class:text-brand-field={true}>JUMP TO LINE {errorLine} →</button
								>
							{:else}
								<a
									href={call.docs}
									target="_blank"
									rel="noopener"
									class="flex-shrink-0 font-mono text-[11px] tracking-[0.06em]"
									class:text-brand-field={true}>OPEN DOCS ↗</a
								>
							{/if}
						</div>
					{:else if response.status === 202}
						<div
							class="flex items-center justify-between gap-4 rounded-lg px-3.5 py-3"
							class:pg-rule={true}
						>
							<div class="flex flex-col gap-[3px]">
								<p class="font-sans text-[13px] font-semibold text-white">The batch is queued.</p>
								<p class="font-sans text-[12.5px]" class:text-brand-press-text={true}>
									This pane follows it and flips to the results when it finishes.
								</p>
							</div>
							<button
								type="button"
								on:click={cancelBatch}
								class="flex-shrink-0 font-mono text-[11px] tracking-[0.06em]"
								class:text-brand-field={true}>CANCEL</button
							>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- The expanded editor is the same value and the same change handler, so
     there is no second copy of the state to keep in step. -->
{#if expanded}
	<div class="fixed inset-0 z-50 flex flex-col p-6" style="background-color: rgba(0,0,0,0.6)">
		<div class="flex items-center justify-between pb-3">
			<span class="font-mono text-[11px] tracking-[0.08em] text-white">
				{call.method}
				{call.path(state)}
			</span>
			<button
				type="button"
				on:click={() => (expanded = false)}
				class="font-mono text-[11px] tracking-[0.06em] text-white hover:underline">CLOSE ✕</button
			>
		</div>
		<div class="min-h-0 flex-1 overflow-hidden rounded-card pg-editor">
			<CodeMirror
				value={editorValue}
				extensions={editorExtensions}
				on:change={(e) => onEditorChange(e.detail)}
			/>
		</div>
	</div>
{/if}

<style>
	/* CodeMirror sizes itself from its host, and svelte-codemirror-editor puts
	   its own .codemirror-wrapper in between. That wrapper is height:auto, so
	   styling only .cm-editor resolves 100% against auto and the pane collapses
	   to its first line — every editor here has to be told to fill twice. */
	.pg-editor :global(.codemirror-wrapper),
	.pg-editor :global(.cm-editor) {
		height: 100%;
	}
	.pg-editor :global(.cm-scroller) {
		overflow: auto;
	}

	/* Two greys the brand palette does not name: the dark lane's hairline and
	   its dimmest label. Declared once here rather than inlined per element. */
	.pg-rule {
		border: 1px solid #2c2f33;
	}

	.pg-rule-b {
		border-bottom: 1px solid #2c2f33;
	}

	.pg-dim {
		color: #8b95a0;
	}

	.pg-pulse {
		animation: pg-pulse 1.1s ease-in-out infinite;
	}

	@keyframes pg-pulse {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		/* Two greys the brand palette does not name: the dark lane's hairline and
	   its dimmest label. Declared once here rather than inlined per element. */
		.pg-rule {
			border: 1px solid #2c2f33;
		}

		.pg-rule-b {
			border-bottom: 1px solid #2c2f33;
		}

		.pg-dim {
			color: #8b95a0;
		}

		.pg-pulse {
			animation: none;
		}
	}
</style>
