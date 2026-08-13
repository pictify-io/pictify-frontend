<script>
	/**
	 * The wait, doing work.
	 *
	 * A spinner would be a wasted eight seconds. The product's whole claim is that
	 * a template declares variables — this is the one moment we can show that
	 * happening instead of asserting it, so the HTML types out and the variables
	 * land one at a time beside it.
	 */
	import { createEventDispatcher, onDestroy } from 'svelte';
	import DitherField from '$lib/components/DitherField.svelte';

	export let prompt = '';
	/** Lines of the template as they arrive. Replace with the copilot stream. */
	export let lines = [];
	/** Variables detected so far; the last one renders as still-arriving. */
	export let variables = [];
	/** 0 = writing, 1 = declaring, 2 = rendering. */
	export let stage = 0;
	/** Agent pipeline progress keyed by stage id — {plan: {status, detail}, …}. */
	export let agentStages = {};

	const dispatch = createEventDispatcher();

	/**
	 * The run feed. An agent's steps can't be pre-listed — it decides them as
	 * it goes — so this is an append-only feed, not a checklist: rows arrive
	 * when the server narrates a tool call (label and detail come from the
	 * event, so new tools need no frontend change), and the client's own
	 * declaring/rendering steps append after the stream. Skipped work never
	 * shows. Without agent events (single-shot fallback) the feed synthesizes
	 * the classic three steps so the layout is one code path.
	 */
	const mountedAt = Date.now();
	let now = Date.now();
	const tick = setInterval(() => (now = Date.now()), 1000);

	$: agentFeed = Object.values(agentStages)
		// The 'thinking' id narrates silent model turns: live while the turn
		// runs, gone as soon as concrete work takes over. Skipped work and
		// finished thinking never show.
		.filter((s) => s.status !== 'skipped' && !(s.id === 'thinking' && s.status === 'done'))
		.map((s) => ({
			id: s.id,
			label: s.label || s.id,
			detail: s.detail,
			state: s.status === 'done' ? 'done' : 'active',
			at: s.at || mountedAt,
			tookMs: s.tookMs
		}));

	$: feed = [
		...(agentFeed.length
			? agentFeed
			: [{ id: 'client-write', label: 'Writing the template', state: stage >= 1 ? 'done' : 'active', at: mountedAt }]),
		...(stage >= 1
			? [{ id: 'client-declare', label: 'Declaring variables', state: stage >= 2 ? 'done' : 'active', at: now }]
			: []),
		...(stage >= 2 ? [{ id: 'client-render', label: 'Rendering your first file', state: 'active', at: now }] : [])
	];

	$: anyActive = feed.some((f) => f.state === 'active');

	$: runStart = agentFeed[0]?.at ?? mountedAt;
	const pad = (n) => String(n).padStart(2, '0');
	$: elapsed = (() => {
		const s = Math.max(0, Math.floor((now - runStart) / 1000));
		return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
	})();
	const rowSeconds = (item) => `${Math.max(0, Math.floor((now - item.at) / 1000))}s`;
	const rowTook = (item) => {
		if (!item.tookMs) return '';
		const s = Math.round(item.tookMs / 1000);
		return s >= 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${s}s`;
	};

	// Caret blink is decorative; it stops with the component.
	let caret = true;
	const blink = setInterval(() => (caret = !caret), 520);
	onDestroy(() => {
		clearInterval(blink);
		clearInterval(tick);
	});

	/**
	 * The same three colours the landing's Contract pane uses: grey ink for
	 * structure, green for strings, lime for mustache tokens. Escaped before
	 * any spans go in, so the generated HTML is only ever displayed, never run.
	 */
	const escapeHtml = (s) =>
		s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	const highlight = (line) =>
		escapeHtml(line)
			.replace(/"[^"\n]*"/g, (m) => `<span class="text-[#9BE3B8]">${m}</span>`)
			.replace(/\{\{[^{}]*\}\}/g, (m) => `<span class="font-medium text-brand-field">${m}</span>`)
			.replace(
				/(&lt;\/?)([a-zA-Z][\w-]*)/g,
				(_, bracket, tag) => `${bracket}<span class="text-brand-press-text">${tag}</span>`
			);

	$: highlighted = lines.map(highlight).join('\n');
</script>

<div class="flex w-full flex-col gap-6 px-5 py-8 lg:flex-row lg:gap-7 lg:px-10">
	<!--
		The run rail: what the agent decided to do, as it decides it. An
		append-only feed, not a checklist — steps can't be pre-listed for an
		agent. The ticking seconds on the active row and the ghost "listening"
		row are the anti-hang devices: time visibly moving says "working",
		not "dead".
	-->
	<div class="flex w-full flex-col gap-4 self-start rounded-btn bg-brand-canvas p-5 lg:w-[360px] lg:flex-shrink-0">
		<div class="flex items-center justify-between border-b border-black/10 pb-3">
			<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B6B68]">The run</span>
			<span class="font-mono text-[11px] text-brand-mute">{elapsed}</span>
		</div>

		<div class="flex flex-col gap-3.5">
			{#each feed as item (item.id)}
				<div class="flex items-start gap-2.5">
					{#if item.state === 'done'}
						<span class="mt-[5px] block h-2.5 w-2.5 flex-shrink-0 bg-brand-proof" aria-hidden="true"></span>
					{:else}
						<span class="mt-[5px] block h-2.5 w-2.5 flex-shrink-0 animate-pulse bg-brand-field" aria-hidden="true"></span>
					{/if}
					<div class="flex min-w-0 flex-1 flex-col gap-0.5">
						<span class="font-sans text-sm font-semibold text-brand-ink">{item.label}</span>
						{#if item.detail}
							<span class="truncate font-mono text-[11px] text-brand-mute">{item.detail}</span>
						{/if}
					</div>
					{#if item.state === 'active'}
						<span class="flex-shrink-0 font-mono text-[11px] text-brand-mute">{rowSeconds(item)}</span>
					{:else if rowTook(item)}
						<span class="flex-shrink-0 font-mono text-[11px] text-brand-mute">{rowTook(item)}</span>
					{/if}
				</div>
			{/each}

			{#if !anyActive}
				<div class="flex items-center gap-2.5 opacity-55">
					<span class="block h-2.5 w-2.5 flex-shrink-0 border-2 border-brand-mute" aria-hidden="true"></span>
					<span class="font-mono text-xs text-brand-mute">listening for the next move…</span>
				</div>
			{/if}
		</div>

		{#if variables.length}
			<div class="flex flex-col border-t border-black/10 pt-3">
				<span class="pb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Declared</span>
				{#each variables as v, i (v.name)}
					{@const pending = i === variables.length - 1 && stage < 2}
					<div
						class="flex items-center justify-between py-[6px] {i < variables.length - 1
							? 'border-b border-black/[0.08]'
							: ''}"
					>
						<span class="font-mono text-xs {pending ? 'text-[#C9CBD1]' : 'text-brand-royal'}">
							&#123;&#123;{v.name}&#125;&#125;
						</span>
						<span class="font-mono text-[11px] {pending ? 'text-[#C9CBD1]' : 'text-brand-mute'}">
							{pending ? '…' : v.type}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col gap-4">
		<div class="flex flex-col gap-1">
			<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">You asked for</span>
			<p class="font-display text-2xl font-bold leading-[30px] tracking-[-0.03em] text-brand-ink">
				“{prompt}”
				<button
					type="button"
					on:click={() => dispatch('edit')}
					class="align-baseline font-sans text-sm font-semibold text-brand-slate underline underline-offset-[3px]"
				>
					Edit
				</button>
			</p>
		</div>

		<div class="flex w-full min-w-0 flex-col overflow-hidden rounded-card bg-brand-press">
			<div class="flex w-full items-center gap-2.5 border-b border-white/10 px-5 py-3.5">
				<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
				<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-press-text">
					Writing the template
				</span>
			</div>
			<!--
				Generated HTML carries long inline-style attributes — single lines
				run to several hundred characters. Wrapping keeps the pane inside
				its column; a horizontal scrollbar would just hide the work this
				screen exists to show. Fixed height so the layout holds while the
				stream fills it.
			-->
			<pre
				class="h-[400px] w-full overflow-y-auto whitespace-pre-wrap break-all p-5 font-mono text-[13px] leading-6 text-[#7D8494]">{@html highlighted}{caret
					? '▌'
					: ' '}</pre>
		</div>

		<!--
			The running indicator: the live dither shader, laying raster while
			the run is real. No caption — motion is the message, and it exists
			only on this screen because only this screen is doing work.
		-->
		<DitherField
			colorFront="#D8F34A"
			shape="simplex"
			type="4x4"
			pxSize={4}
			speed={0.4}
			class="relative h-9 w-full"
		/>
	</div>
</div>
