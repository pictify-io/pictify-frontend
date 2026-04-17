<script>
	/**
	 * EnginePicker — one-time choice at template creation.
	 *
	 * Two landscape cards (Canvas vs HTML). Equal weight — neither is
	 * presented as "advanced". A quiet line underneath names the only
	 * sharp-edged constraint: engine can't be changed after creation
	 * (fork-to-switch, per plan decision #8a).
	 *
	 * Matches the neobrutalist system: thick borders, hard brutal shadow,
	 * cream background, brand accent on the selected state only.
	 */
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher();

	/**
	 * Which engine is hovered / focused. The visual lift happens on hover,
	 * and confirmed selection is stored on click (see `selected`).
	 */
	let hovered = null;
	let selected = null;

	function choose(engine) {
		selected = engine;
		dispatch('select', { engine });
		if (engine === 'html') {
			goto('/template-workspace/html/create?engine=html');
		} else {
			goto('/template-workspace/create');
		}
	}
</script>

<div
	class="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-brand-bg p-6"
>
	<div class="flex w-full max-w-5xl flex-col gap-10">
		<header class="text-center">
			<h1 class="font-heading text-4xl text-gray-900 md:text-5xl">
				Start a new template
			</h1>
			<p class="mt-3 text-base text-gray-700">
				Two ways to design, one render engine. Pick what fits your workflow.
			</p>
		</header>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Canvas card -->
			<button
				type="button"
				class="group relative flex flex-col items-start gap-4 border-3 border-gray-800 bg-brand-bg p-8 text-left shadow-brutal-lg transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-xl focus-brutal"
				class:bg-brand-accent={selected === 'fabric'}
				on:click={() => choose('fabric')}
				on:mouseenter={() => (hovered = 'fabric')}
				on:mouseleave={() => (hovered = null)}
			>
				<div class="flex items-center gap-3">
					<span
						class="flex h-10 w-10 items-center justify-center border-2 border-gray-800 bg-white font-mono text-sm font-bold"
					>
						◧
					</span>
					<h2 class="font-heading text-2xl text-gray-900">Canvas</h2>
				</div>
				<p class="text-sm text-gray-800">
					Visual drag-and-drop editor. Best for marketing assets, social posts,
					and anyone who doesn't want to write code.
				</p>
				<pre
					class="mt-2 w-full overflow-hidden border-2 border-gray-800 bg-white p-3 font-mono text-[11px] leading-relaxed text-gray-700"
				><code>{`{
  "fabricJSData": {
    "version": "5.0",
    "objects": [
      { "type": "text",
        "text": "{{title}}" }
    ]
  }
}`}</code></pre>
				<span
					class="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-900"
				>
					Drag · Align · Snap
				</span>
			</button>

			<!-- HTML card -->
			<button
				type="button"
				class="group relative flex flex-col items-start gap-4 border-3 border-gray-800 bg-brand-bg p-8 text-left shadow-brutal-lg transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-xl focus-brutal"
				class:bg-brand-accent={selected === 'html'}
				on:click={() => choose('html')}
				on:mouseenter={() => (hovered = 'html')}
				on:mouseleave={() => (hovered = null)}
			>
				<div class="flex items-center gap-3">
					<span
						class="flex h-10 w-10 items-center justify-center border-2 border-gray-800 bg-white font-mono text-sm font-bold"
					>
						{'</>'}
					</span>
					<h2 class="font-heading text-2xl text-gray-900">HTML</h2>
					<span
						class="ml-1 inline-flex items-center border-2 border-gray-800 bg-brand-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-900"
					>
						New
					</span>
				</div>
				<p class="text-sm text-gray-800">
					Write markup with Handlebars variables. Full CSS, custom fonts, SVG,
					and Tailwind support. Render via Puppeteer.
				</p>
				<pre
					class="mt-2 w-full overflow-hidden border-2 border-gray-800 bg-white p-3 font-mono text-[11px] leading-relaxed text-gray-700"
				><code>{`<div class="invoice">
  <h1>{{title}}</h1>
  <p>{{amount | currency}}</p>
  {{#each items}}
    <li>{{this.name}}</li>
  {{/each}}
</div>`}</code></pre>
				<span
					class="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-900"
				>
					Code · CSS · SVG · Puppeteer
				</span>
			</button>
		</div>

		<p class="text-center text-[13px] italic text-gray-500">
			Engine can't be changed later — fork the template to switch.
		</p>
	</div>
</div>
