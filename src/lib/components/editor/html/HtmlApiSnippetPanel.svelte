<script>
	/**
	 * HtmlApiSnippetPanel — language-tabbed API snippet viewer.
	 *
	 * Uses the LAST-SAVED template uid and the CURRENT sample variable
	 * values (lesson from commit 0fe1c32 — snippet must reflect what the
	 * user is actually testing with, not stale defaults).
	 *
	 * v1 ships curl + JS fetch. Additional languages live behind the
	 * SUPPORTED_LANGUAGES export in api-snippet-generator — add entries
	 * there without touching this component.
	 */
	import { onDestroy } from 'svelte';
	import {
		generateSnippet,
		SUPPORTED_LANGUAGES
	} from '../../../utils/api-snippet-generator';

	export let templateUid = null;
	export let variables = {};
	export let format = 'png';
	export let isDirty = false;

	let activeLanguage = 'curl';
	let copied = false;
	let copyTimer = null;

	$: snippet = templateUid
		? generateSnippet(activeLanguage, {
				uid: templateUid,
				variables,
				format
			})
		: '# Save the template first to generate a snippet with its uid.';

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(snippet);
			copied = true;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 600);
		} catch {
			/* noop — some browsers block clipboard without user gesture */
		}
	}

	onDestroy(() => {
		if (copyTimer) clearTimeout(copyTimer);
	});
</script>

<div class="flex h-full w-full flex-col bg-brand-bg">
	<div
		class="flex items-center justify-between border-b-3 border-gray-800 px-6 py-4"
	>
		<h2 class="font-heading text-xl text-gray-900">API</h2>
		{#if isDirty}
			<span
				class="border-2 border-gray-800 bg-brand-danger/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-900"
				>Unsaved · snippet reflects last save</span
			>
		{/if}
	</div>

	<!-- Language tabs -->
	<div class="flex gap-0 border-b-3 border-gray-800 bg-brand-bg">
		{#each SUPPORTED_LANGUAGES as lang}
			<button
				type="button"
				class="border-r-2 border-gray-800 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-150 hover:bg-brand-accent/30 focus-brutal"
				class:bg-brand-accent={activeLanguage === lang.key}
				class:bg-white={activeLanguage !== lang.key}
				on:click={() => (activeLanguage = lang.key)}
			>
				{lang.label}
			</button>
		{/each}
	</div>

	<!-- Snippet body -->
	<div class="relative flex-1 overflow-auto">
		<button
			type="button"
			on:click={copyToClipboard}
			class="absolute right-4 top-4 z-10 border-3 border-gray-800 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider shadow-brutal-sm transition-transform duration-150 hover:-translate-y-[1px] focus-brutal"
			class:bg-brand-accent={copied}
			class:bg-white={!copied}
		>
			{copied ? 'Copied' : 'Copy'}
		</button>
		<pre
			class="m-0 h-full overflow-auto border-3 border-gray-800 bg-gray-900 p-6 font-mono text-[13px] leading-relaxed text-gray-100"
		><code>{snippet}</code></pre>
	</div>

	<!-- Footer hint -->
	<div
		class="flex items-center justify-between border-t-3 border-gray-800 bg-brand-bg px-6 py-3 font-mono text-[11px] text-gray-600"
	>
		<span>Replace <code class="text-brand-danger">YOUR_API_TOKEN</code> with a real API token</span>
		<a
			href="/dashboard/api-token"
			class="font-semibold underline underline-offset-4 hover:text-gray-900"
		>Manage tokens →</a>
	</div>
</div>
