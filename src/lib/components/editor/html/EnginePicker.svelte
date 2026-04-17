<script>
	/**
	 * EnginePicker — one-time choice at template creation.
	 *
	 * Two visual modes for two surfaces:
	 *   - modal  (used by dashboard "+ New template")
	 *            matches TemplateTypeSelector's dialect exactly so the
	 *            two modals feel like siblings: rounded-xl, colored
	 *            header strip, `font-black uppercase`, press-in hover
	 *            (translate-x/y + shadow shrink), #ff6b6b / #ffc480
	 *            accent colors.
	 *   - page   (used by /template-workspace/html/create direct route)
	 *            keeps the quieter editor dialect: sharp corners,
	 *            DynaPuff headings, brand accent on selection. This
	 *            surface sits next to the editor, so it should match
	 *            the editor aesthetic.
	 *
	 * Behavior:
	 *   - Emits `select` with the engine choice so parents can react.
	 *   - Emits `close` when the user dismisses (modal mode only).
	 *   - In page mode, also navigates to the next route so the same
	 *     component works as a standalone landing page.
	 */
	import { createEventDispatcher, onMount } from 'svelte';
	import { goto } from '$app/navigation';

	/** @type {'page' | 'modal'} */
	export let mode = 'page';

	const dispatch = createEventDispatcher();

	let selected = null;

	function choose(engine) {
		selected = engine;
		dispatch('select', { engine });
		// Only auto-navigate in page mode. Modal consumers own the next step
		// so they can stay on the dashboard for the Canvas case.
		if (mode === 'page') {
			if (engine === 'html') {
				goto('/template-workspace/html/create?engine=html');
			} else {
				goto('/template-workspace/create');
			}
		}
	}

	function close() {
		dispatch('close');
	}

	function onKey(event) {
		if (mode === 'modal' && event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	}

	// Trap escape + lock background scroll while the modal is open.
	onMount(() => {
		if (mode !== 'modal') return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener('keydown', onKey);
		};
	});
</script>

{#if mode === 'modal'}
	<!--
		Dashboard-dialect modal. Mirrors TemplateTypeSelector's structure
		(colored header strip, rounded-2xl shell, 3-column footer, press-in
		hover) so the two pickers feel sibling-like when users alternate
		between creating HTML and canvas templates.
	-->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Pick a template engine"
		on:click|self={close}
	>
		<div
			class="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[8px_8px_0_0_#1f2937]"
		>
			<!-- Header strip (accent background, same as sibling modal) -->
			<div class="border-b-[3px] border-gray-900 bg-[#ffc480] px-6 py-4">
				<h2 class="text-xl font-black uppercase tracking-wider text-gray-900">
					Create New Template
				</h2>
				<p class="mt-1 text-sm text-gray-700">
					Pick a design engine — one render pipeline, two ways in.
				</p>
			</div>

			<!-- Body -->
			<div class="space-y-6 overflow-y-auto p-6">
				<label
					class="text-xs font-black uppercase tracking-widest text-gray-900"
				>Design engine</label>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<!-- Canvas card -->
					<button
						type="button"
						class="relative rounded-xl border-[3px] p-5 text-left transition-all
							{selected === 'fabric'
								? 'border-gray-900 bg-[#ffc480]/20 shadow-[4px_4px_0_0_#1f2937] -translate-x-[2px] -translate-y-[2px]'
								: 'border-gray-900 bg-white hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-x-[2px] hover:-translate-y-[2px]'}"
						on:click={() => choose('fabric')}
					>
						{#if selected === 'fabric'}
							<div
								class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-900 bg-[#ffc480] shadow-[2px_2px_0_0_#1f2937]"
							>
								<i class="fa fa-check text-[10px] font-bold text-gray-900"></i>
							</div>
						{/if}
						<div class="flex items-start gap-4">
							<div
								class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-[3px] border-gray-900 bg-[#ffc480] text-xl shadow-[2px_2px_0_0_#1f2937]"
							>
								<i class="fa fa-object-group text-gray-900"></i>
							</div>
							<div>
								<div
									class="text-base font-black uppercase tracking-tight text-gray-900"
								>Canvas</div>
								<div class="mt-1 text-xs font-bold leading-relaxed text-gray-600">
									Visual drag-and-drop editor. Marketing assets, social posts,
									anything you'd want to design visually.
								</div>
								<div class="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
									Drag · Align · Snap
								</div>
							</div>
						</div>
					</button>

					<!-- HTML card -->
					<button
						type="button"
						class="relative rounded-xl border-[3px] p-5 text-left transition-all
							{selected === 'html'
								? 'border-gray-900 bg-[#ff6b6b]/10 shadow-[4px_4px_0_0_#1f2937] -translate-x-[2px] -translate-y-[2px]'
								: 'border-gray-900 bg-white hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-x-[2px] hover:-translate-y-[2px]'}"
						on:click={() => choose('html')}
					>
						<!-- NEW badge -->
						<div
							class="absolute right-3 top-3 flex items-center gap-1 rounded-lg border-2 border-gray-900 bg-[#ff6b6b] px-2 py-0.5 text-white shadow-[2px_2px_0_0_#1f2937]"
						>
							<span class="text-[10px] font-black uppercase tracking-widest">New</span>
						</div>

						<div class="flex items-start gap-4">
							<div
								class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-[3px] border-gray-900 bg-[#ff6b6b] text-white shadow-[2px_2px_0_0_#1f2937]"
							>
								<i class="fa fa-code text-xl"></i>
							</div>
							<div>
								<div
									class="text-base font-black uppercase tracking-tight text-gray-900"
								>HTML</div>
								<div class="mt-1 text-xs font-bold leading-relaxed text-gray-600">
									Write markup with Handlebars variables. Full CSS, custom fonts,
									SVG, and Tailwind. Rendered via Puppeteer.
								</div>
								<div class="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
									Code · CSS · SVG · Puppeteer
								</div>
							</div>
						</div>
					</button>
				</div>

				<!-- Quiet constraint notice -->
				<div
					class="flex items-start gap-3 rounded-lg border-[2px] border-dashed border-gray-300 bg-white/60 px-4 py-3"
				>
					<i class="fa fa-info-circle text-sm text-gray-500 mt-0.5"></i>
					<p class="text-[11px] font-bold leading-relaxed text-gray-600">
						Engine can't be changed later — <span class="text-gray-900">fork the template to switch</span>.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div
				class="flex shrink-0 justify-end gap-4 overflow-visible border-t-[3px] border-gray-900 bg-gray-50 px-6 py-4"
			>
				<button
					type="button"
					on:click={close}
					class="rounded-xl border-[3px] border-gray-900 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-900 shadow-[4px_4px_0_0_#1f2937] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1f2937]"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{:else}
	<!--
		Page mode. Quiet editor dialect — sharp corners, DynaPuff, brand
		accent. Matches the editor experience users are about to enter.
	-->
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
				<button
					type="button"
					class="group relative flex flex-col items-start gap-4 border-3 border-gray-800 bg-brand-bg p-8 text-left shadow-brutal-lg transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-xl focus-brutal"
					class:bg-brand-accent={selected === 'fabric'}
					on:click={() => choose('fabric')}
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-10 w-10 items-center justify-center border-2 border-gray-800 bg-white font-mono text-sm font-bold"
						>◧</span>
						<h2 class="font-heading text-2xl text-gray-900">Canvas</h2>
					</div>
					<p class="text-sm text-gray-800">
						Visual drag-and-drop editor. Best for marketing assets, social
						posts, and anyone who doesn't want to write code.
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
					>Drag · Align · Snap</span>
				</button>

				<button
					type="button"
					class="group relative flex flex-col items-start gap-4 border-3 border-gray-800 bg-brand-bg p-8 text-left shadow-brutal-lg transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-xl focus-brutal"
					class:bg-brand-accent={selected === 'html'}
					on:click={() => choose('html')}
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-10 w-10 items-center justify-center border-2 border-gray-800 bg-white font-mono text-sm font-bold"
						>{'</>'}</span>
						<h2 class="font-heading text-2xl text-gray-900">HTML</h2>
						<span
							class="ml-1 inline-flex items-center border-2 border-gray-800 bg-brand-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-900"
						>New</span>
					</div>
					<p class="text-sm text-gray-800">
						Write markup with Handlebars variables. Full CSS, custom fonts,
						SVG, and Tailwind support. Render via Puppeteer.
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
					>Code · CSS · SVG · Puppeteer</span>
				</button>
			</div>

			<p class="text-center text-[13px] italic text-gray-500">
				Engine can't be changed later — fork the template to switch.
			</p>
		</div>
	</div>
{/if}
