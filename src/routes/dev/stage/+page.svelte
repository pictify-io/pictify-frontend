<script>
	/**
	 * DEV-ONLY harness for StudioStage (the v2 visual editor stage).
	 *
	 * The real stage sits behind auth and a running backend. This mounts the
	 * same component against a fixture so selection, inline editing and the
	 * Design ↔ Preview data switch can be exercised headlessly. Exposes the
	 * last selection and transaction on `window.__stage` for probes.
	 */
	import StudioStage from '$lib/components/studio/v2/StudioStage.svelte';
	import { ensureNodeIds } from '$lib/components/studio/v2/node-ids.js';

	const FIXTURE = `<style>.card{width:1200px;height:630px;padding:56px;font-family:Inter,sans-serif;background:#fff}.bar{height:10px;background:#1B3A6B}h1{font:800 52px/58px Inter,sans-serif;margin:24px 0 0}</style>
<div class="card"><div class="bar"></div><header><span class="brand">Pictify Blog</span> <span class="tag">{{category}}</span></header>
<section class="title-block"><p class="eyebrow">pictify.io/blog</p><h1>{{title}}</h1></section>
<div class="meta"><div><b>{{author}}</b> written by</div><div><b>{{read_time}}</b> minute read</div></div>
<footer>Templated media for developers</footer></div>`;

	// ?full=1 wraps the fixture as a complete document, the shape a template
	// written by hand or imported from the platform arrives in.
	const FULL = `<!doctype html><html><head><meta charset="utf-8"><title>OG</title>${FIXTURE.slice(0, FIXTURE.indexOf('</style>') + 8)}</head><body>${FIXTURE.slice(FIXTURE.indexOf('</style>') + 8)}</body></html>`;
	const full = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('full') === '1';
	let html = ensureNodeIds(full ? FULL : FIXTURE).html;
	let editable = true;
	let api = null;
	let last = { selection: null, transaction: null };
	const sampleValues = { category: 'Engineering', title: 'One template, every format', author: 'Suyash', read_time: '6' };

	$: if (typeof window !== 'undefined') window.__stage = { api, last, editable, html };
</script>

<div class="flex flex-col gap-3 p-4" data-v2>
	<div class="flex gap-2">
		<button type="button" data-test="design" class="rounded-btn border px-3 py-1 text-sm" on:click={() => (editable = true)}>Design</button>
		<button type="button" data-test="preview" class="rounded-btn border px-3 py-1 text-sm" on:click={() => (editable = false)}>Preview data</button>
		<span class="font-mono text-xs" data-test="mode">{editable ? 'design' : 'preview'}</span>
	</div>
	<StudioStage
		bind:api
		{html}
		width={1200}
		height={630}
		zoom="50%"
		{editable}
		{sampleValues}
		on:selection={(e) => (last = { ...last, selection: e.detail })}
		on:transaction={(e) => {
			last = { ...last, transaction: e.detail };
			html = e.detail.html;
		}}
	/>
</div>
