<script>
	/**
	 * EnginePicker — one-time choice at template creation.
	 *
	 * Two modes:
	 *   - page    (default) full-page layout, used by the
	 *             /template-workspace/html/create route.
	 *   - modal   fixed-overlay dialog, used by dashboard "+ New template"
	 *             where the user is still browsing the template list.
	 *
	 * Behavior:
	 *   - Emits `select` with the engine choice so parents can react
	 *     without re-navigating (dashboard uses this to show its own
	 *     next step after a Canvas pick).
	 *   - Emits `close` when the user dismisses (modal mode only).
	 *   - In page mode, also navigates to the next route so the same
	 *     component works as a standalone landing page.
	 *
	 * Design: neobrutalist — thick borders, brutal shadows, cream
	 * background, brand accent on the selected state only.
	 */
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
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
	<!-- Modal overlay. Click the backdrop or press Esc to dismiss. -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Pick a template engine"
		on:click|self={close}
	>
		<div
			class="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto border-3 border-gray-800 bg-brand-bg p-8 shadow-brutal-2xl"
		>
			<button
				type="button"
				on:click={close}
				aria-label="Close"
				class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border-2 border-gray-800 bg-white font-mono text-lg shadow-brutal-sm hover:shadow-brutal-md focus-brutal"
			>×</button>

			<header class="text-center">
				<h1 class="font-heading text-3xl text-gray-900 md:text-4xl">
					Start a new template
				</h1>
				<p class="mt-2 text-sm text-gray-700">
					Two ways to design, one render engine.
				</p>
			</header>

			<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- Canvas card -->
				<button
					type="button"
					class="group relative flex flex-col items-start gap-4 border-3 border-gray-800 bg-brand-bg p-6 text-left shadow-brutal-lg transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-xl focus-brutal"
					class:bg-brand-accent={selected === 'fabric'}
					on:click={() => choose('fabric')}
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-10 w-10 items-center justify-center border-2 border-gray-800 bg-white font-mono text-sm font-bold"
						>◧</span>
						<h2 class="font-heading text-xl text-gray-900">Canvas</h2>
					</div>
					<p class="text-sm text-gray-800">
						Visual drag-and-drop editor. Best for marketing assets, social
						posts, and anyone who doesn't want to write code.
					</p>
					<span
						class="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-900"
					>
						Drag · Align · Snap
					</span>
				</button>

				<!-- HTML card -->
				<button
					type="button"
					class="group relative flex flex-col items-start gap-4 border-3 border-gray-800 bg-brand-bg p-6 text-left shadow-brutal-lg transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-xl focus-brutal"
					class:bg-brand-accent={selected === 'html'}
					on:click={() => choose('html')}
				>
					<div class="flex items-center gap-3">
						<span
							class="flex h-10 w-10 items-center justify-center border-2 border-gray-800 bg-white font-mono text-sm font-bold"
						>{'</>'}</span>
						<h2 class="font-heading text-xl text-gray-900">HTML</h2>
						<span
							class="ml-1 inline-flex items-center border-2 border-gray-800 bg-brand-accent px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-900"
						>New</span>
					</div>
					<p class="text-sm text-gray-800">
						Write markup with Handlebars variables. Full CSS, custom fonts,
						SVG, and Tailwind. Rendered via Puppeteer.
					</p>
					<span
						class="mt-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-900"
					>
						Code · CSS · SVG · Puppeteer
					</span>
				</button>
			</div>

			<p class="mt-6 text-center text-[13px] italic text-gray-500">
				Engine can't be changed later — fork the template to switch.
			</p>
		</div>
	</div>
{:else}
	<!-- Full-page mode: standalone landing component. -->
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
