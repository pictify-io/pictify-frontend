<script>
	/**
	 * Template studio — say · try · ship.
	 *
	 * A template is a function: inputs in, file out. The studio answers the three
	 * questions that follow from that, side by side and at the same time — what
	 * do I want (left), does it work (centre), how do I call it (right). The old
	 * workspace scattered those across fifteen panels and a separate render page.
	 *
	 * The token set in the html is the single source of truth for the contract:
	 * the Inputs rail is derived from it on every change, in both modes, so the
	 * code and the rail can never drift apart.
	 */
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import { notify, showToast } from '../../../store/toast.store.js';
	import StudioTopBar from './StudioTopBar.svelte';
	import SayItRail from './SayItRail.svelte';
	import HtmlPane from './HtmlPane.svelte';
	import ProofStage from './ProofStage.svelte';
	import InputsRail from './InputsRail.svelte';
	import {
		updateTemplate,
		renderTemplate,
		editTemplateBySaying,
		undoTemplateEdit,
		previewTemplateHtml
	} from '../../../api/template.js';
	import { activeApiToken, getAPITokenAction } from '../../../store/user.store';
	import { extractInputs as tokensIn } from '$lib/utils/template-tokens.js';

	/** Loaded template, or null while creating a brand new one. */
	export let template = null;
	/** 'say' | 'html' — which side of the toggle opens first. */
	export let initialMode = 'say';
	/** QA hatch: forces a state without needing the account to be in it. */
	export let preview = null;

	const PREVIEW_DEBOUNCE_MS = 350;
	const SAVE_DEBOUNCE_MS = 900;

	let mode = initialMode;
	let html = template?.html || '';
	let name = template?.name || 'Untitled';
	let outputFormat = template?.outputFormat || 'image';
	let width = template?.width || 1080;
	let height = template?.height || 1080;
	let pdfPreset = template?.pdfPreset || 'A4';

	let sampleValues = {};
	let history = [];
	let stages = [];
	let busy = false;
	let canUndo = false;
	let saveState = 'saved';
	let rendering = false;

	let proof = { dataUrl: null, totalMs: 0, status: 'idle', error: null };
	let htmlPane;

	let previewTimer = null;
	let saveTimer = null;
	let previewSeq = 0;

	$: uid = template?.uid || null;
	$: creating = !uid;

	// ── QA hatches ─────────────────────────────────────────────────────────
	$: forceGenerating = preview === 'generating';
	$: forceHtmlEmpty = preview === 'html-empty';
	$: forceProofFailed = preview === 'proof-failed';
	$: forceNoInputs = preview === 'no-inputs';

	// The contract, derived from the html on every change — never stored
	// separately, so the rail cannot claim an input the template doesn't have.
	/** Guess a sensible type so the rail's chips aren't all TEXT. */
	function typeFor(tokenName) {
		const n = tokenName.toLowerCase();
		if (/(^|_)(date|issued_on|expires|day)($|_)/.test(n)) return 'date';
		if (/(image|img|logo|photo|avatar|signature)_?url$|^(image|img|logo|photo|avatar)$/.test(n)) return 'image';
		if (/url$|^link$/.test(n)) return 'url';
		if (/(count|total|amount|price|qty|number)$/.test(n)) return 'number';
		if (/colou?r$/.test(n)) return 'color';
		return 'text';
	}

	// `tokensIn` is a regex approximation, used because the rail has to stay
	// live while you type and half-finished HTML does not parse. The server
	// derives the real contract from the Handlebars AST; whenever it tells us
	// what it stored, that wins.
	let serverTokens = null;
	$: tokenNames = forceNoInputs ? [] : serverTokens || tokensIn(html);
	$: inputs = tokenNames.map((n) => ({
		name: n,
		type: typeFor(n),
		value: sampleValues[n] ?? ''
	}));

	$: proofFailed = forceProofFailed || proof.status === 'error';
	$: working = forceGenerating || busy;

	function seedSampleValues(defs, names) {
		const next = { ...sampleValues };
		// Stored studio values win; variableDefinitions defaults are the fallback
		// for templates that predate sampleValues.
		for (const [key, value] of Object.entries(template?.sampleValues || {})) {
			if (next[key] === undefined) next[key] = value;
		}
		for (const d of defs || []) {
			if (d?.name && next[d.name] === undefined) {
				next[d.name] = d.sampleValue ?? d.defaultValue ?? d.value ?? '';
			}
		}
		for (const n of names) if (next[n] === undefined) next[n] = '';
		sampleValues = next;
	}

	// ── Live proof ─────────────────────────────────────────────────────────
	function queuePreview() {
		clearTimeout(previewTimer);
		previewTimer = setTimeout(runPreview, PREVIEW_DEBOUNCE_MS);
	}

	async function runPreview() {
		if (!html.trim()) {
			proof = { dataUrl: null, totalMs: 0, status: 'idle', error: null };
			return;
		}
		const seq = ++previewSeq;
		proof = { ...proof, status: 'loading' };
		try {
			const res = await previewTemplateHtml({
				html,
				variableDefinitions: [],
				variables: Object.fromEntries(inputs.map((i) => [i.name, i.value])),
				jsEnabled: Boolean(template?.jsEnabled),
				strictVariables: false,
				width,
				height,
				format: outputFormat === 'pdf' ? 'pdf' : 'png'
			});
			// A stale response must never overwrite a newer proof.
			if (seq !== previewSeq) return;
			proof = {
				dataUrl: res?.dataUrl || null,
				totalMs: res?.totalMs || 0,
				status: res?.dataUrl ? 'ok' : 'error',
				error: res?.dataUrl ? null : res?.error || 'The renderer returned nothing.'
			};
		} catch (err) {
			if (seq !== previewSeq) return;
			proof = {
				dataUrl: null,
				totalMs: 0,
				status: 'error',
				error: err?.data?.error || err?.message || 'The template could not be rendered.'
			};
		}
	}

	// ── Persistence ────────────────────────────────────────────────────────
	function queueSave() {
		if (!uid) return;
		saveState = 'saving';
		clearTimeout(saveTimer);
		saveTimer = setTimeout(save, SAVE_DEBOUNCE_MS);
	}

	async function save(extra = {}) {
		if (!uid) return;
		saveState = 'saving';
		try {
			// updateTemplate takes ONE object and reads uid off it — and it swallows
			// errors, returning null. Both matter: called wrongly it PUTs to
			// /templates/undefined, and the null return means the failure is silent
			// unless it is checked, which is how the header can claim SAVED while
			// nothing is being written.
			const saved = await updateTemplate({
				uid,
				html,
				name,
				variables: tokenNames,
				// Test data, persisted so the proof and the snippet still show the
				// user's own values next time they open the studio.
				sampleValues: Object.fromEntries(
					tokenNames.map((n) => [n, String(sampleValues[n] ?? '')])
				),
				width,
				height,
				outputFormat,
				pdfPreset,
				...extra
			});
			if (!saved) throw new Error('Could not save that change.');
			saveState = 'saved';
		} catch (err) {
			/*
			 * The pill owns save (board S1 `GTP-0`): SAVE FAILED · RETRY, in the
			 * top bar, where the state already lives. A toast as well would be
			 * the same sentence twice for something that autosaves — and it
			 * would fire on every debounce while a backend is down.
			 */
			saveState = 'error';
		}
	}

	// ── Handlers ───────────────────────────────────────────────────────────
	function onHtmlChange(event) {
		html = event.detail.html;
		// Hand-editing invalidates whatever the server last told us.
		serverTokens = null;
		seedSampleValues([], tokensIn(html));
		queuePreview();
		queueSave();
	}

	function onSampleChange(event) {
		sampleValues = { ...sampleValues, [event.detail.name]: event.detail.value };
		queuePreview();
		queueSave();
	}

	function onAddInput() {
		if (mode === 'html') {
			// Land the token where the caret is — the user is pointing at the spot.
			htmlPane?.insertAtCursor('{{new_input}}');
			return;
		}
		// In Say it, adding a slot is itself an instruction: the agent decides
		// where it belongs, which is the whole reason to be in this mode.
		submitInstruction('Add a new input to this template and use it somewhere sensible.');
	}

	async function submitInstruction(text) {
		if (!uid) {
			showToast('Save this template first.', 'error', 2500);
			return;
		}
		history = [...history, { role: 'you', text }];
		busy = true;
		stages = [];
		analytics.track('studio_say_it_submitted');

		await editTemplateBySaying(uid, text, {
			onStage: (stage) => {
				// The agent narrates itself; the rail shows the live tail of that
				// rather than one pulse held for twenty-five seconds.
				const label = stage?.label || stage?.id;
				if (!label) return;
				if (stage.status === 'start') {
					stages = [...stages.filter((s) => s.id !== stage.id), { id: stage.id, label, done: false }];
				} else {
					stages = stages.map((s) => (s.id === stage.id ? { ...s, done: true } : s));
				}
			},
			onDone: (res) => {
				html = res.html;
				serverTokens = res.variables || null;
				// The server pruned values for tokens the edit removed; take its map
				// rather than keeping ours, which still holds the dead ones.
				if (res.sampleValues) sampleValues = { ...res.sampleValues };
				seedSampleValues([], serverTokens || tokensIn(html));
				canUndo = (res.versionCount || 0) > 0;
				// Derived facts are the receipt. The agent's sentence rides above
				// them when it wrote one, and nothing stands in for it when it did not.
				history = [
					...history,
					{
						role: 'receipt',
						note: res.note || '',
						added: res.addedVariables || [],
						removed: res.removedVariables || [],
						htmlChanged: res.htmlChanged !== false,
						lineDelta: res.lineDelta || 0,
						version: res.versionCount || 0
					}
				];
				for (const w of res.warnings || []) showToast(w.message, 'error', 5000);
				saveState = 'saved';
				runPreview();
			},
			onError: (err) => {
				history = [
					...history,
					{
						role: 'receipt',
						failed: true,
						note: err?.message || "That change didn't go through — nothing was changed."
					}
				];
			}
		});

		stages = [];
		busy = false;
	}

	async function onUndo() {
		if (!uid) return;
		busy = true;
		try {
			const res = await undoTemplateEdit(uid);
			html = res.html;
			serverTokens = res.variables || null;
			if (res.sampleValues) sampleValues = { ...res.sampleValues };
			canUndo = (res.versionCount || 0) > 0;
			history = [...history, { role: 'receipt', text: 'Reverted to the previous version.' }];
			await runPreview();
		} catch (err) {
			showToast(err?.message || 'Nothing to undo.', 'error', 2500);
		} finally {
			busy = false;
		}
	}

	function onFormat(event) {
		({ outputFormat, width, height, pdfPreset } = event.detail);
		queuePreview();
		queueSave();
	}

	function onRename(event) {
		name = event.detail.name;
		save();
	}

	async function onRender() {
		if (!uid) return;
		rendering = true;
		try {
			const res = await renderTemplate(
				uid,
				Object.fromEntries(inputs.map((i) => [i.name, i.value])),
				{ format: outputFormat === 'pdf' ? 'pdf' : 'png', width, height }
			);
			const url = res?.url || res?.image?.url || res?.results?.[0]?.url;
			analytics.track('studio_rendered', { format: outputFormat });
			notify.done('RENDERED', url ? 'Opened in a new tab, and saved to Renders.' : 'Saved to Renders.');
			if (url) window.open(url, '_blank', 'noopener');
		} catch (err) {
			notify.fail('Render', err, { retry: () => onRender(), id: `studio-render:${uid}` });
		} finally {
			rendering = false;
		}
	}

	function pickMode(next) {
		mode = next;
		analytics.track('studio_mode_switched', { mode: next });
	}

	onMount(async () => {
		// The studio sits outside the dashboard rail, so nothing else on this
		// page loads the key — without this the Use it snippet would hand the
		// user YOUR_API_KEY to paste.
		getAPITokenAction().catch(() => {});

		if (forceHtmlEmpty) {
			mode = 'html';
			html = '';
		}
		serverTokens = Array.isArray(template?.variables) && template.variables.length
			? template.variables
			: null;
		seedSampleValues(template?.variableDefinitions || [], serverTokens || tokensIn(html));
		canUndo = (template?.versions?.length || 0) > 0;
		await tick();
		if (html.trim() && !forceProofFailed) runPreview();
		analytics.track('studio_viewed', { creating, mode });

		// A starter picked on the Templates page arrives as a seeded prompt. The
		// template it lands on is empty by construction, so submitting the seed
		// as the first instruction is what "pick a starter" was always promising.
		if (browser && uid && !html.trim() && !preview) {
			const seed = sessionStorage.getItem('pictify_seed_prompt');
			if (seed) {
				sessionStorage.removeItem('pictify_seed_prompt');
				mode = 'say';
				submitInstruction(seed);
			}
		}
	});
</script>

<div class="flex h-screen min-h-0 w-full flex-col bg-brand-paper">
	<StudioTopBar
		{name}
		{saveState}
		{outputFormat}
		{width}
		{height}
		{pdfPreset}
		{rendering}
		renderDisabled={proofFailed || creating}
		on:rename={onRename}
		on:format={onFormat}
		on:render={onRender}
		on:renderMany={() => goto(`/dashboard/template/${uid}/bulk-render`)}
	/>

	<div class="flex min-h-0 flex-1">
		<section
			class="flex flex-shrink-0 flex-col border-r border-brand-rule {mode === 'html'
				? 'w-[460px]'
				: 'w-[300px]'}"
		>
			<div class="flex flex-col gap-1.5 border-b border-brand-rule px-4 py-3">
				<div class="flex gap-2">
					{#each [{ id: 'say', label: 'SAY IT' }, { id: 'html', label: 'HTML' }] as t (t.id)}
						<button
							type="button"
							on:click={() => pickMode(t.id)}
							aria-pressed={mode === t.id}
							class="rounded-btn border px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] {mode === t.id
								? 'border-brand-ink bg-brand-field font-medium text-brand-ink'
								: 'border-brand-rule text-brand-slate hover:border-brand-ink'}"
						>
							{t.label}
						</button>
					{/each}
				</div>
				<span class="font-sans text-[12.5px] text-brand-mute">
					{mode === 'html'
						? 'Type or paste — the proof updates as you type.'
						: 'Say it — the template updates.'}
				</span>
			</div>

			{#if mode === 'say'}
				<SayItRail {history} {stages} busy={working} {canUndo} {creating} on:submit={(e) => submitInstruction(e.detail.text)} on:undo={onUndo} />
			{:else}
				<HtmlPane bind:this={htmlPane} {html} busy={working} on:change={onHtmlChange} />
			{/if}
		</section>

		<ProofStage
			dataUrl={proof.dataUrl}
			totalMs={proof.totalMs}
			status={forceProofFailed ? 'error' : proof.status}
			error={forceProofFailed ? 'Unexpected token at line 7 — the renderer could not parse this template.' : proof.error}
			working={working && !forceProofFailed}
			empty={!html.trim()}
		/>

		<InputsRail
			{inputs}
			templateUid={uid || ''}
			templateName={name}
			apiKey={$activeApiToken?.token || ''}
			busy={working}
			on:change={onSampleChange}
			on:addInput={onAddInput}
		/>
	</div>
</div>
