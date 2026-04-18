<script>
	/**
	 * HtmlEditorTour — four-step first-run walkthrough.
	 *
	 * Anchored callouts (Intercom/Driver.js style) pointing at the real
	 * UI elements via `data-tour-id` attributes the layout decorates on.
	 * Dismissing the tour sets a localStorage flag so it only runs once
	 * per browser — users who've seen it don't get pestered again.
	 *
	 * Four steps chosen for the highest-value first-encounter gaps:
	 *   1. What the editor is — Handlebars syntax pitch
	 *   2. Where the preview is + that it updates live
	 *   3. Variables tab + auto-declare behaviour
	 *   4. Snippet library shortcut for common patterns
	 *
	 * A fifth "Save" step would be valuable but I deliberately scope
	 * the tour to things visible on the editor surface; save discovery
	 * happens through the glowing green topbar button when dirty,
	 * which is its own signal.
	 */
	import { onMount, onDestroy, tick } from 'svelte';

	export let storageKey = 'pictify.html-editor.tour.v1';

	const STEPS = [
		{
			id: 'welcome',
			targetId: null, // no anchor — centered modal
			title: 'Write templates in HTML + Handlebars',
			body: 'Type regular HTML, then reference variables with {{name}}. Preview updates as you type. No JavaScript knowledge required — just markup.',
			icon: 'fa-hand-wave',
			cta: 'Show me around'
		},
		{
			id: 'preview',
			targetId: 'preview',
			placement: 'left',
			title: 'Live preview',
			body: 'Every keystroke renders through our Puppeteer engine. The image here is exactly what the API returns.',
			icon: 'fa-eye'
		},
		{
			id: 'variables',
			targetId: 'tab-variables',
			placement: 'bottom',
			title: 'Variables auto-declare',
			body: 'Type {{customerName}} in the editor and we add it here automatically. Click any token to edit its properties — type, default, required, raw HTML.',
			icon: 'fa-cube'
		},
		{
			id: 'snippets',
			targetId: 'snippets-button',
			placement: 'bottom',
			title: 'Starter snippets',
			body: 'Stuck? The snippet library has OG images, invoices, and certificates ready to insert. Press ⌘/ or click here.',
			icon: 'fa-wand-magic-sparkles',
			cta: 'Got it, let me try'
		}
	];

	let currentIndex = 0;
	let targetRect = null;
	let open = false;

	onMount(async () => {
		// Single-run flag. Using try/catch because private-browsing Safari
		// sometimes throws on localStorage access.
		try {
			if (localStorage.getItem(storageKey) === 'dismissed') return;
		} catch {
			/* continue */
		}
		// Defer so the layout has rendered before we measure anchors.
		await tick();
		// Extra frame — CodeMirror mounts async via its own onMount.
		await new Promise((r) => requestAnimationFrame(r));
		open = true;
		measureAnchor();

		window.addEventListener('resize', measureAnchor);
		window.addEventListener('keydown', onKey);
	});

	onDestroy(() => {
		window.removeEventListener('resize', measureAnchor);
		window.removeEventListener('keydown', onKey);
	});

	function onKey(e) {
		if (!open) return;
		if (e.key === 'Escape') dismiss();
		else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
		else if (e.key === 'ArrowLeft') prev();
	}

	function measureAnchor() {
		const step = STEPS[currentIndex];
		if (!step || !step.targetId) {
			targetRect = null;
			return;
		}
		const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
		if (!el) {
			targetRect = null;
			return;
		}
		targetRect = el.getBoundingClientRect();
	}

	async function goTo(i) {
		if (i < 0 || i >= STEPS.length) return;
		currentIndex = i;
		await tick();
		measureAnchor();
	}

	function next() {
		if (currentIndex === STEPS.length - 1) {
			dismiss();
			return;
		}
		goTo(currentIndex + 1);
	}

	function prev() {
		goTo(currentIndex - 1);
	}

	function dismiss() {
		try {
			localStorage.setItem(storageKey, 'dismissed');
		} catch {
			/* noop */
		}
		open = false;
	}

	$: currentStep = open ? STEPS[currentIndex] : null;

	// Compute the callout position from target rect + placement.
	$: calloutStyle = (() => {
		if (!currentStep) return '';
		if (!targetRect || !currentStep.targetId) {
			// Centered (welcome / fallback when anchor missing)
			return 'position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);';
		}
		const margin = 16;
		const calloutWidth = 360;
		const calloutHeight = 220;
		let top, left;

		switch (currentStep.placement) {
			case 'left':
				left = targetRect.left - calloutWidth - margin;
				top = targetRect.top + targetRect.height / 2 - calloutHeight / 2;
				break;
			case 'right':
				left = targetRect.right + margin;
				top = targetRect.top + targetRect.height / 2 - calloutHeight / 2;
				break;
			case 'top':
				left = targetRect.left + targetRect.width / 2 - calloutWidth / 2;
				top = targetRect.top - calloutHeight - margin;
				break;
			case 'bottom':
			default:
				left = targetRect.left + targetRect.width / 2 - calloutWidth / 2;
				top = targetRect.bottom + margin;
				break;
		}

		// Clamp to viewport
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		left = Math.max(margin, Math.min(left, vw - calloutWidth - margin));
		top = Math.max(margin, Math.min(top, vh - calloutHeight - margin));

		return `position: fixed; left: ${left}px; top: ${top}px;`;
	})();

	// Spotlight cutout rect around the target — 6px padding + 4px radius
	// to give each highlighted element a friendly halo.
	$: spotlight = (() => {
		if (!currentStep || !targetRect) return null;
		const pad = 6;
		return {
			top: Math.max(0, targetRect.top - pad),
			left: Math.max(0, targetRect.left - pad),
			width: targetRect.width + pad * 2,
			height: targetRect.height + pad * 2
		};
	})();
</script>

{#if open && currentStep}
	<!-- Dimmed backdrop with a rectangular cutout around the current target. -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="pointer-events-auto fixed inset-0 z-[140]"
		on:click|self={dismiss}
	>
		<!-- Full-viewport dim — SVG cutout keeps the target crisp without
		     needing a mask chain that browsers render inconsistently. -->
		<svg
			class="pointer-events-none absolute inset-0 h-full w-full"
			aria-hidden="true"
		>
			<defs>
				<mask id="spotlight-mask">
					<rect x="0" y="0" width="100%" height="100%" fill="white" />
					{#if spotlight}
						<rect
							x={spotlight.left}
							y={spotlight.top}
							width={spotlight.width}
							height={spotlight.height}
							rx="8"
							ry="8"
							fill="black"
						/>
					{/if}
				</mask>
			</defs>
			<rect
				x="0"
				y="0"
				width="100%"
				height="100%"
				fill="rgba(17, 24, 39, 0.55)"
				mask="url(#spotlight-mask)"
			/>
		</svg>

		<!-- Spotlight border highlight -->
		{#if spotlight}
			<div
				class="pointer-events-none absolute rounded-lg border-[3px] border-[#ffc480] shadow-[0_0_0_3px_rgba(255,196,128,0.35)]"
				style="left: {spotlight.left}px; top: {spotlight.top}px; width: {spotlight.width}px; height: {spotlight.height}px;"
			></div>
		{/if}

		<!-- Callout card -->
		<div
			class="w-[360px] overflow-hidden rounded-2xl border-[3px] border-gray-900 bg-[#FFFDF8] shadow-[8px_8px_0_0_#1f2937]"
			style={calloutStyle}
			role="dialog"
			aria-modal="true"
			aria-label={currentStep.title}
		>
			<!-- Header strip -->
			<div class="flex items-center justify-between gap-3 border-b-[3px] border-gray-900 bg-[#ffc480] px-4 py-3">
				<div class="flex items-center gap-2">
					<div class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white shadow-[2px_2px_0_0_#1f2937]">
						<i class="fa {currentStep.icon} text-[11px] text-gray-900"></i>
					</div>
					<span class="text-[10px] font-black uppercase tracking-widest text-gray-900">
						Tour · {currentIndex + 1} of {STEPS.length}
					</span>
				</div>
				<button
					type="button"
					on:click={dismiss}
					aria-label="Skip tour"
					class="flex h-7 w-7 items-center justify-center rounded-md border-[2px] border-gray-900 bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-900 hover:text-white hover:shadow-none"
				>
					<i class="fa fa-xmark text-[11px]"></i>
				</button>
			</div>

			<!-- Body -->
			<div class="px-4 py-4">
				<h3 class="text-base font-black uppercase tracking-wider text-gray-900">
					{currentStep.title}
				</h3>
				<p class="mt-2 text-[13px] font-semibold leading-relaxed text-gray-700">
					{currentStep.body}
				</p>
			</div>

			<!-- Footer controls -->
			<div class="flex items-center justify-between gap-2 border-t-[3px] border-gray-900 bg-gray-50 px-4 py-3">
				<!-- Progress dots -->
				<div class="flex items-center gap-1.5">
					{#each STEPS as _, i}
						<button
							type="button"
							on:click={() => goTo(i)}
							aria-label={`Step ${i + 1}`}
							class="h-2 w-2 rounded-full border-[1.5px] border-gray-900 transition-colors
								{i === currentIndex ? 'bg-gray-900' : 'bg-white hover:bg-gray-300'}"
						></button>
					{/each}
				</div>

				<div class="flex items-center gap-2">
					{#if currentIndex > 0}
						<button
							type="button"
							on:click={prev}
							class="rounded-md border-[2px] border-gray-900 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
						>Back</button>
					{/if}
					<button
						type="button"
						on:click={next}
						class="rounded-md border-[2px] border-gray-900 bg-gray-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#1f2937] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
					>
						{currentStep.cta || (currentIndex === STEPS.length - 1 ? 'Finish' : 'Next')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
