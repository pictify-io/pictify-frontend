<script>
	/**
	 * The caller contract, made editable.
	 *
	 * Every row here is a {{token}} in the html — this rail does not invent
	 * inputs, it reflects them. The sample value beside each one does double
	 * duty: it fills the proof, and it fills the snippet at the bottom, so the
	 * call the user copies is the exact call that produced the picture they are
	 * looking at.
	 */
	import { createEventDispatcher } from 'svelte';
	import CodeBlock from './CodeBlock.svelte';

	const dispatch = createEventDispatcher();

	/** [{ name, type, value }] — order follows the html. */
	export let inputs = [];
	export let templateUid = '';
	export let templateName = '';
	export let apiKey = '';
	/** Disables editing while the agent is mid-change. */
	export let busy = false;

	const TABS = ['API', 'AGENT', 'ZAPIER', 'SHEET'];
	let tab = 'API';

	const TYPE_LABEL = {
		text: 'TEXT',
		date: 'DATE',
		image: 'IMAGE URL',
		url: 'URL',
		number: 'NUMBER',
		color: 'COLOR'
	};

	$: sampleObject = Object.fromEntries(inputs.map((i) => [i.name, i.value ?? '']));
	$: slug = templateName ? templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) : templateUid;
	$: keyOrPlaceholder = apiKey || 'YOUR_API_KEY';
	// Shown masked, copied whole — same split NextStepCard uses. A live secret
	// rendered in full sits on screen for every passer-by and screenshot, and
	// the snippet is only useful if what lands on the clipboard is real.
	$: keyMasked = apiKey ? `pic_live_••••${apiKey.slice(-5)}` : 'YOUR_API_KEY';

	// Snippets carry the ACTUAL sample values, not placeholders — the point is
	// that you can paste this and get the file you just looked at.
	$: varsJson = inputs.length ? JSON.stringify(sampleObject, null, 2).replace(/\n/g, '\n  ') : null;
	const buildSnippets = (key) => ({
		API: `curl -X POST https://api.pictify.io/image \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "template": "${templateUid}"${varsJson ? `,\n  "variables": ${varsJson}` : ''}
}'`,
		AGENT: `Render my "${templateName || slug}" template${
			inputs.length ? ` with ${inputs.map((i) => `${i.name} "${i.value || '…'}"`).join(', ')}` : ''
		}`,
		ZAPIER: `Action: Pictify → Render template
Template: ${templateName || slug} (${templateUid})
${inputs.length ? inputs.map((i) => `  ${i.name} → map a field (e.g. "${i.value || '…'}")`).join('\n') : '  No inputs — renders the same file every time.'}`,
		SHEET: inputs.length
			? `${inputs.map((i) => i.name).join(',')}\n${inputs.map((i) => String(i.value ?? '').replace(/,/g, ' ')).join(',')}`
			: 'This template has no inputs, so a sheet has nothing to fill.'
	});

	// Two renderings of the same snippet: one safe to look at, one safe to run.
	$: snippets = buildSnippets(keyMasked);
	$: copyableSnippets = buildSnippets(keyOrPlaceholder);
</script>

<aside class="flex w-[320px] flex-shrink-0 flex-col overflow-y-auto border-l border-brand-rule bg-brand-paper">
	<div class="flex flex-col gap-1 border-b border-brand-rule px-5 py-4">
		<span class="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-ink">Inputs</span>
		<span class="font-sans text-[13px] text-brand-mute">What your caller sends. Try values here.</span>
	</div>

	<div class="flex flex-col gap-4 border-b border-brand-rule px-5 py-5">
		{#if inputs.length === 0}
			<!-- Honest empty: a template with no tokens is a legitimate thing to
			     have, not a setup step the user skipped. -->
			<p class="font-sans text-[13px] leading-[19px] text-brand-slate">
				No inputs yet — this template renders the same file every time. Add a
				<span class="font-mono text-[12px] text-brand-royal">&#123;&#123;token&#125;&#125;</span> in HTML, or ask for one in Say it.
			</p>
		{:else}
			{#each inputs as input (input.name)}
				<div class="flex flex-col gap-1.5">
					<div class="flex items-baseline justify-between gap-2">
						<span class="min-w-0 truncate font-mono text-[13px] font-medium text-brand-ink">{input.name}</span>
						<span class="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
							{TYPE_LABEL[input.type] || 'TEXT'}
						</span>
					</div>
					<input
						type="text"
						value={input.value ?? ''}
						disabled={busy}
						on:input={(e) => dispatch('change', { name: input.name, value: e.currentTarget.value })}
						placeholder="sample value"
						class="w-full rounded-btn border-[1.5px] border-brand-rule px-3 py-2 font-sans text-[13px] text-brand-ink outline-none focus:border-brand-ink disabled:opacity-60"
					/>
				</div>
			{/each}
		{/if}

		<div class="flex items-center gap-3">
			<button
				type="button"
				on:click={() => dispatch('addInput')}
				disabled={busy}
				class="flex-shrink-0 rounded-btn border-[1.5px] border-brand-ink px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand-ink hover:bg-brand-ink hover:text-white disabled:opacity-60"
			>
				+ Add input
			</button>
			<span class="font-mono text-[10px] leading-[13px] text-brand-mute">
				the template grows a slot for it
			</span>
		</div>
	</div>

	<div class="flex flex-col gap-3 px-5 py-5">
		<span class="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-ink">
			Use it — the call, with these inputs
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
	</div>
</aside>
