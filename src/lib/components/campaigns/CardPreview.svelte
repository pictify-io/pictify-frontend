<script>
	/**
	 * FE-7 — the live design preview.
	 *
	 * Renders THE SELECTED REVISION'S HTML with sample values, not a picture of
	 * a preset. What the buyer sees here is the same markup the renderer will
	 * use, so a design that overflows here overflows in the real output — which
	 * is the whole point of showing it before any data is uploaded.
	 *
	 * SANDBOXED, deliberately. This markup is authored by the buyer or written
	 * by the AI agent; injecting it into the dashboard's DOM would let it run
	 * script in our origin, read the session cookie and call the API as the
	 * user. The iframe has no allow-scripts and no allow-same-origin, so the
	 * worst a hostile design can do is look wrong.
	 */
	import { SAMPLE_VALUES } from '$lib/campaigns/starters';
	import { previewDocument } from '$lib/components/studio/v2/preview-document.js';
	import { cleanHtml } from '$lib/components/studio/v2/stage.js';
	import { splitDocument } from '$lib/components/studio/v2/document-shell.js';

	export let html = '';
	export let width = 1200;
	export let height = 800;
	/** Overrides for the sample substitution, e.g. real metric labels. */
	export let values = {};
	/** Rendered width on screen; the design is scaled to fit it. */
	export let displayWidth = 320;

	$: scale = displayWidth / width;
	$: merged = { ...SAMPLE_VALUES, ...values };

	/**
	 * Substitute `{{token}}` only. Deliberately NOT a Handlebars runtime: the
	 * preview must not execute helpers or block expressions from untrusted
	 * markup, and a mismatch with the server's renderer is better than running
	 * an expression engine on the client.
	 */
	/*
	 * A whole-document design keeps its shell: the `<body>` style is where the
	 * background and the canvas size live, so a card that mounted only the body
	 * showed the right elements on the wrong page.
	 */
	$: shell = splitDocument(html);
	$: substituted = String(shell.body || '').replace(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g, (match, key) => {
		const value = merged[key];
		if (value === null || value === undefined) return '';
		// Escaped: a sample value is data, and a design that concatenates it into
		// markup must not be able to change the document's shape.
		return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	});

	/*
	 * Sanitised AND policed. `sandbox=""` already stops scripts from running, but
	 * it does not stop a remote image or an `@import` from being fetched — the
	 * markup here can come from an AI result or an imported file, so those
	 * requests would go to a host the buyer never chose. See preview-document.js.
	 */
	$: doc = previewDocument(cleanHtml(substituted), {
		css: 'html,body{margin:0;padding:0;overflow:hidden}',
		shell
	});
</script>

<div
	class="relative overflow-hidden border border-brand-rule bg-white"
	style="width:{displayWidth}px;height:{Math.round(height * scale)}px"
>
	{#if html}
		<iframe
			title="Design preview"
			sandbox=""
			srcdoc={doc}
			aria-label="Preview of the selected design with sample values"
			class="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
			style="width:{width}px;height:{height}px;transform:scale({scale})"
		/>
	{:else}
		<div class="flex h-full items-center justify-center px-4 text-center">
			<span class="font-sans text-[13px] text-brand-mute">No design chosen yet.</span>
		</div>
	{/if}
</div>
