<script>
	// Code-first template editor: an HTML source panel + live preview iframe.
	// The HTML here is exactly what gets POSTed to /image/public, so the
	// preview is a truthful render of what the API returns.
	export let html = '';
	export let width = 1200;
	export let height = 630;

	let currentHtml = html;
	let lastTemplate = html;
	let previewHtml = html;
	let activeTab = 'preview';
	let containerWidth = 0;
	let debounceTimer;

	// Reset editor state when the page navigates to a different use case
	// (SvelteKit reuses this component instance across [usecase] params).
	$: if (html !== lastTemplate) {
		lastTemplate = html;
		currentHtml = html;
		previewHtml = html;
		activeTab = 'preview';
	}

	$: scale = containerWidth ? Math.min(1, containerWidth / width) : 1;

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			previewHtml = currentHtml;
		}, 400);
	}

	function resetTemplate() {
		currentHtml = html;
		previewHtml = html;
	}

	export function getHtml() {
		return currentHtml;
	}
</script>

<div class="w-full">
	<!-- Tab switcher -->
	<div class="flex items-center justify-between mb-3">
		<div class="flex gap-2">
			<button
				type="button"
				on:click={() => (activeTab = 'preview')}
				class="px-4 py-2 text-xs font-black uppercase tracking-wide border-2 rounded-lg transition-all
					{activeTab === 'preview'
					? 'border-gray-900 bg-brand-accent text-gray-900 shadow-brutal-md'
					: 'border-gray-300 bg-white text-gray-500 hover:border-gray-500'}"
			>
				Preview
			</button>
			<button
				type="button"
				on:click={() => (activeTab = 'code')}
				class="px-4 py-2 text-xs font-black uppercase tracking-wide border-2 rounded-lg transition-all
					{activeTab === 'code'
					? 'border-gray-900 bg-brand-accent text-gray-900 shadow-brutal-md'
					: 'border-gray-300 bg-white text-gray-500 hover:border-gray-500'}"
			>
				Edit HTML
			</button>
		</div>
		{#if currentHtml !== html}
			<button
				type="button"
				on:click={resetTemplate}
				class="text-xs font-bold text-gray-500 underline underline-offset-2 hover:text-gray-900"
			>
				Reset template
			</button>
		{/if}
	</div>

	{#if activeTab === 'preview'}
		<div
			bind:clientWidth={containerWidth}
			class="w-full overflow-hidden bg-white border-[3px] border-gray-900 shadow-brutal-xl rounded-lg"
			style="height: {Math.round(height * scale)}px;"
		>
			<iframe
				title="Template preview"
				srcdoc={previewHtml}
				scrolling="no"
				style="width: {width}px; height: {height}px; border: 0; transform: scale({scale}); transform-origin: top left; pointer-events: none;"
			/>
		</div>
	{:else}
		<textarea
			bind:value={currentHtml}
			on:input={handleInput}
			spellcheck="false"
			rows="18"
			class="w-full font-mono text-xs leading-relaxed bg-gray-900 text-gray-100 border-[3px] border-gray-900 rounded-lg p-4 shadow-brutal-xl focus:outline-none focus:ring-2 focus:ring-brand-accent resize-y"
			style="min-height: 320px;"
		/>
		<p class="mt-2 text-xs font-medium text-gray-500">
			This exact HTML is what the API renders — swap the sample values for
			<code class="font-mono bg-gray-100 px-1 rounded">{'{{variables}}'}</code> when you automate it.
		</p>
	{/if}
</div>
