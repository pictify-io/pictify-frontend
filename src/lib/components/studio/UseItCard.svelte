<script>
	/**
	 * "Use it" — the call that produces the thing on screen, with the values
	 * currently on screen.
	 *
	 * Extracted from InputsRail so the video studio can show the same card. A
	 * template is only worth making if something else can call it, and the
	 * moment that is worth saying is when nothing is selected — the user is
	 * looking at the template as a whole rather than at one piece of it.
	 *
	 * The two studios differ only in the endpoint and the noun, so those are
	 * props rather than two copies of the same four snippets.
	 */
	import CodeBlock from './CodeBlock.svelte';

	/** [{ name, value }] — the inputs, in the order the template declares them. */
	export let inputs = [];
	export let templateUid = '';
	export let templateName = '';
	export let apiKey = '';
	/** 'image' | 'video' — picks the endpoint and the wording. */
	export let kind = 'image';
	export let heading = 'Use it — the call, with these inputs';
	/**
	 * What the call gives back, in a sentence. Board PS-03.
	 *
	 * Opt-in, because only a context that knows the revision can say "exactly
	 * what Rendered proof shows for rev n" truthfully — the v1 studio and the
	 * video studio have no proof to point at, and a claim they cannot back is
	 * worse than no claim.
	 */
	export let returnsNote = null;
	/** `[{ label, href }]` — the next things to do with the call. */
	export let alsoLinks = [];

	const TABS = ['API', 'AGENT', 'ZAPIER', 'SHEET'];
	let tab = 'API';

	$: endpoint =
		kind === 'video'
			? `https://api.pictify.io/video/templates/${templateUid}/render`
			: 'https://api.pictify.io/image';
	// The image endpoint takes the uid in the body; the video one takes it in
	// the path, so its body carries only the variables.
	$: bodyLines =
		kind === 'video'
			? varsJson
				? `{\n  "variables": ${varsJson}\n}`
				: '{}'
			: `{\n  "template": "${templateUid}"${varsJson ? `,\n  "variables": ${varsJson}` : ''}\n}`;

	$: sampleObject = Object.fromEntries(inputs.map((i) => [i.name, i.value ?? '']));
	$: slug = templateName
		? templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
		: templateUid;
	$: keyOrPlaceholder = apiKey || 'YOUR_API_KEY';
	// Shown masked, copied whole: a live secret rendered in full sits on screen
	// for every passer-by and screenshot, and the snippet is only useful if what
	// lands on the clipboard is real.
	$: keyMasked = apiKey ? `pic_live_••••${apiKey.slice(-5)}` : 'YOUR_API_KEY';
	$: varsJson = inputs.length ? JSON.stringify(sampleObject, null, 2).replace(/\n/g, '\n  ') : null;

	$: noun = kind === 'video' ? 'video' : 'image';

	const build = (key, url, body, n, name, list, id) => ({
		API: `curl -X POST ${url} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`,
		AGENT: `Render my "${name || id}" ${n} template${
			list.length ? ` with ${list.map((i) => `${i.name} "${i.value || '…'}"`).join(', ')}` : ''
		}`,
		ZAPIER: `Action: Pictify → Render ${n} template
Template: ${name || id} (${id})
${
	list.length
		? list.map((i) => `  ${i.name} → map a field (e.g. "${i.value || '…'}")`).join('\n')
		: `  No inputs — renders the same ${n} every time.`
}`,
		SHEET: list.length
			? `${list.map((i) => i.name).join(',')}\n${list
					.map((i) => String(i.value ?? '').replace(/,/g, ' '))
					.join(',')}`
			: 'This template has no inputs, so a sheet has nothing to fill.'
	});

	// Every dependency is named in the statement: a `$:` that calls a helper
	// reading component scope does not re-run when that scope changes.
	$: snippets = build(keyMasked, endpoint, bodyLines, noun, templateName, inputs, templateUid);
	$: copyableSnippets = build(
		keyOrPlaceholder,
		endpoint,
		bodyLines,
		noun,
		templateName,
		inputs,
		templateUid
	);
</script>

<div class="flex flex-col gap-3">
	<span class="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-ink">
		{heading}
	</span>
	<div class="flex flex-wrap gap-1.5">
		{#each TABS as t (t)}
			<button
				type="button"
				on:click={() => (tab = t)}
				class="rounded-btn border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] {tab === t
					? 'border-brand-ink bg-brand-field text-brand-ink'
					: 'border-brand-rule text-brand-slate hover:border-brand-ink'}"
			>
				{t}
			</button>
		{/each}
	</div>
	<CodeBlock
		code={snippets[tab]}
		copyValue={copyableSnippets[tab]}
		copyLabel="Copy full snippet"
		maxHeight="max-h-[200px]"
	/>

	{#if returnsNote}
		<!-- Under the snippet, because it answers the question the snippet
		     raises: "and then what do I get back?" -->
		<div class="flex flex-col gap-1">
			<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">Returns</span>
			<p class="font-sans text-[12.5px] leading-[17px] text-brand-slate">{returnsNote}</p>
		</div>
	{/if}

	{#if alsoLinks.length}
		<div class="flex flex-col gap-1">
			<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">Also</span>
			{#each alsoLinks as link (link.href)}
				<a
					href={link.href}
					target={link.href.startsWith('http') ? '_blank' : null}
					rel={link.href.startsWith('http') ? 'noopener' : null}
					class="font-sans text-[12.5px] leading-[18px] text-brand-royal hover:underline">{link.label}</a
				>
			{/each}
		</div>
	{/if}
</div>
