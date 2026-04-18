<script>
	/**
	 * HtmlSnippetLibrary — insert-ready Handlebars snippets.
	 *
	 * Opens from the editor's left sidebar (mirrors the canvas editor's
	 * LeftSidebar → ShapesIconsLibrary / TextPresetLibrary pattern). Click
	 * a snippet → dispatches `insert` with the snippet body for the parent
	 * HtmlEditorLayout to thread into CodeMirror.
	 */
	import { createEventDispatcher } from 'svelte';
	import { SNIPPETS, SNIPPET_CATEGORIES } from '../../../utils/html-snippets';

	const dispatch = createEventDispatcher();

	let searchQuery = '';
	let activeCategory = 'all';

	$: filtered = SNIPPETS.filter((s) => {
		if (activeCategory !== 'all' && s.category !== activeCategory) return false;
		if (!searchQuery.trim()) return true;
		const q = searchQuery.trim().toLowerCase();
		return (
			s.label.toLowerCase().includes(q) ||
			s.description.toLowerCase().includes(q) ||
			s.body.toLowerCase().includes(q)
		);
	});

	function insert(snippet) {
		dispatch('insert', { snippet });
	}

	function close() {
		dispatch('close');
	}
</script>

<div class="flex h-full w-full flex-col bg-[#FFFDF8]">
	<!-- Header -->
	<div class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffe066] px-4 py-3">
		<div class="flex items-center gap-2">
			<div class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
				<i class="fa fa-wand-magic-sparkles text-[11px] text-gray-900"></i>
			</div>
			<h3 class="text-[11px] font-black uppercase tracking-widest text-gray-900">
				Snippets
			</h3>
		</div>
		<button
			type="button"
			on:click={close}
			aria-label="Close snippets"
			class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
		>
			<i class="fa fa-xmark text-[11px]"></i>
		</button>
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-1.5 overflow-x-auto border-b-[2px] border-gray-900 bg-white px-4 py-2">
		<button
			type="button"
			on:click={() => (activeCategory = 'all')}
			class="flex-shrink-0 rounded-md border-[2px] border-gray-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-all
				{activeCategory === 'all'
					? 'bg-gray-900 text-white shadow-[2px_2px_0_0_#1f2937]'
					: 'bg-white text-gray-700 hover:shadow-[1px_1px_0_0_#1f2937]'}"
		>All</button>
		{#each SNIPPET_CATEGORIES as cat}
			<button
				type="button"
				on:click={() => (activeCategory = cat.key)}
				class="flex-shrink-0 rounded-md border-[2px] border-gray-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-all
					{activeCategory === cat.key
						? 'bg-gray-900 text-white shadow-[2px_2px_0_0_#1f2937]'
						: 'bg-white text-gray-700 hover:shadow-[1px_1px_0_0_#1f2937]'}"
			>{cat.label}</button>
		{/each}
	</div>

	<!-- Search -->
	<div class="relative border-b-[2px] border-gray-900 bg-white px-4 py-2">
		<i class="fa fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"></i>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="SEARCH SNIPPETS..."
			class="w-full rounded-md border-[2px] border-gray-900 bg-white py-1.5 pl-7 pr-2 text-[10px] font-black uppercase tracking-widest text-gray-900 placeholder-gray-400 focus:-translate-y-0.5 focus:shadow-[2px_2px_0_0_#ffc480] focus:outline-none"
		/>
	</div>

	<!-- Snippets list -->
	<div class="flex-1 overflow-auto p-3 space-y-2">
		{#if filtered.length === 0}
			<p class="mt-4 text-center text-[11px] font-bold text-gray-500">
				No snippets match.
			</p>
		{/if}

		{#each filtered as snippet (snippet.id)}
			<button
				type="button"
				on:click={() => insert(snippet)}
				class="group w-full rounded-lg border-[2px] border-gray-900 bg-white p-3 text-left transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_0_#1f2937]"
			>
				<div class="flex items-center justify-between gap-2">
					<span class="text-xs font-black uppercase tracking-wider text-gray-900">
						{snippet.label}
					</span>
					<span
						class="inline-flex items-center rounded border-[1.5px] border-gray-900 bg-white px-1 py-0.5 text-[8px] font-black uppercase tracking-widest text-gray-700"
					>
						{snippet.category}
					</span>
				</div>
				<p class="mt-1 text-[10px] font-bold text-gray-500">{snippet.description}</p>
				<pre
					class="mt-2 max-h-16 overflow-hidden rounded border-[1.5px] border-gray-900 bg-gray-900 px-2 py-1 font-mono text-[10px] leading-tight text-[#ffc480]"
				><code>{snippet.body.slice(0, 140).replace(/\$0/g, '')}{snippet.body.length > 140 ? '…' : ''}</code></pre>
			</button>
		{/each}
	</div>
</div>
