<script>
	/**
	 * HtmlApiSnippetPanel — language-tabbed API snippet viewer.
	 *
	 * Dialect matches the dashboard: rounded-xl frames, press-in hover,
	 * font-black uppercase labels. Code block itself keeps its dark
	 * gray-900 fill + JetBrains Mono so it reads as "code" at a glance.
	 *
	 * Uses last-SAVED template uid + current sample variable values
	 * (lesson from commit 0fe1c32).
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
		? generateSnippet(activeLanguage, { uid: templateUid, variables, format })
		: '# Save the template first to generate a snippet with its uid.';

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(snippet);
			copied = true;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 600);
		} catch {
			/* noop — clipboard may be blocked */
		}
	}

	onDestroy(() => {
		if (copyTimer) clearTimeout(copyTimer);
	});
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]">
	<!-- Accent header strip -->
	<div
		class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4"
	>
		<div>
			<h2 class="text-lg font-black uppercase tracking-widest text-gray-900">API</h2>
			<p class="mt-0.5 text-[11px] font-bold text-gray-800">
				Render this template from your code.
			</p>
		</div>
		{#if isDirty && templateUid}
			<span
				class="inline-flex items-center gap-1.5 rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937]"
			>
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b6b] opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full border-[1.5px] border-gray-900 bg-[#ff5252]"></span>
				</span>
				Unsaved — snippet is stale
			</span>
		{/if}
	</div>

	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-3xl space-y-4">
			<!-- Language tabs — same dialect as the main editor tabs -->
			<div class="flex items-center gap-2">
				{#each SUPPORTED_LANGUAGES as lang}
					<button
						type="button"
						class="flex items-center gap-2 rounded-lg border-[2px] border-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all
							{activeLanguage === lang.key
								? 'bg-gray-900 text-white shadow-[3px_3px_0_0_#1f2937]'
								: 'bg-white text-gray-700 hover:shadow-[2px_2px_0_0_#1f2937] hover:-translate-x-[1px] hover:-translate-y-[1px]'}"
						on:click={() => (activeLanguage = lang.key)}
					>
						{lang.label}
					</button>
				{/each}

				<div class="flex-1"></div>

				<button
					type="button"
					on:click={copyToClipboard}
					class="flex items-center gap-2 rounded-lg border-[3px] border-gray-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest shadow-[3px_3px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none
						{copied ? 'bg-[#4ade80] text-gray-900' : 'bg-white text-gray-900'}"
				>
					<i class="fa {copied ? 'fa-check' : 'fa-copy'} text-[11px]"></i>
					{copied ? 'Copied!' : 'Copy'}
				</button>
			</div>

			<!-- Snippet body -->
			<div
				class="overflow-hidden rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
			>
				<div
					class="flex items-center justify-between border-b-[2px] border-gray-800 bg-gray-800 px-4 py-2"
				>
					<span class="text-[10px] font-black uppercase tracking-widest text-gray-400">
						{activeLanguage === 'curl' ? 'bash' : 'javascript'}
					</span>
					<span class="text-[10px] font-mono text-gray-500">
						POST /image
					</span>
				</div>
				<pre
					class="m-0 max-h-[50vh] overflow-auto bg-gray-900 p-5 font-mono text-[13px] leading-relaxed text-gray-100"
				><code>{snippet}</code></pre>
			</div>

			<!-- Footer hint card -->
			<div
				class="flex items-start gap-3 rounded-xl border-[2px] border-dashed border-gray-300 bg-white p-4"
			>
				<i class="fa fa-key mt-0.5 text-sm text-[#ffc480]"></i>
				<div class="flex-1 text-[11px] font-bold text-gray-600">
					Replace
					<code class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-1.5 py-0.5 font-mono text-[11px] text-[#ff6b6b]"
						>YOUR_API_TOKEN</code>
					with a real token.
				</div>
				<a
					href="/dashboard/api-token"
					class="rounded-lg border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				>
					Manage tokens →
				</a>
			</div>
		</div>
	</div>
</div>
