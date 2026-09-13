<script>
	/**
	 * The payoff, plus refinement on demand.
	 *
	 * Refining is a state of this screen rather than a screen of its own: most
	 * people are happy with what comes back, and making them dismiss a correction
	 * UI they never wanted is a small insult. The default view has no refine
	 * controls at all.
	 */
	import { createEventDispatcher } from 'svelte';

	/** 'ai' changes the timing claim and offers refinement; 'template' does not. */
	export let source = 'template';
	export let variables = [];
	export let url = '';
	/** Wall-clock ms the user actually waited. Null hides the timing chip — a
	 *  missing measurement must never become an invented number. */
	export let elapsedMs = null;

	const dispatch = createEventDispatcher();

	let refining = false;
	let change = '';
	let copied = false;
	let loaded = false;
	let failed = false;

	// A new URL is a new attempt: clear the failure and load again.
	let lastUrl = url;
	$: if (url !== lastUrl) {
		lastUrl = url;
		failed = false;
		loaded = false;
	}

	$: seconds = elapsedMs == null ? null : (elapsedMs / 1000).toFixed(1);

	// Derived from the URL rather than passed in, so the caption can never claim
	// a format the file isn't.
	$: format = (url.split('?')[0].split('.').pop() || '').toUpperCase();
	$: meta = format && format.length <= 4 ? format : '';

	/** Design-only changes — nothing here implies knowledge we don't have. */
	const quickFixes = ['Make it landscape', 'Bigger name', 'Add a border', 'More formal'];

	function copyUrl() {
		navigator.clipboard?.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function redraw() {
		dispatch('redraw', { change });
		change = '';
	}
</script>

<div class="flex w-full flex-col items-center gap-10 px-5 py-10 lg:flex-row lg:gap-14 lg:px-20 lg:py-12">
	<div class="flex w-full flex-col gap-6 lg:w-[540px] lg:flex-shrink-0">
		<div class="flex flex-col gap-2.5">
			{#if failed}
				<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">
					Render failed
				</span>
			{:else if seconds}
				<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-proof">
					{source === 'ai' ? `Written and rendered in ${seconds}s` : `Rendered in ${seconds}s`}
				</span>
			{/if}
			<h1 class="font-display text-[44px] font-extrabold leading-[44px] tracking-[-0.04em] text-brand-ink">
				{failed ? "That one didn't come out." : "Here's your first file."}
			</h1>
			<p class="max-w-[440px] font-sans text-base leading-[25px] text-brand-slate">
				{#if failed}
					A hiccup on our side, most likely. Your template and the row that fills it are safe — run
					the same render again.
				{:else if source === 'ai'}
					{variables.length} variables were declared from your description. Change any of them and it
					re-renders.
				{:else}
					Nothing was designed by hand. A template declared its variables and one row filled them.
				{/if}
			</p>
		</div>

		{#if refining}
			<!-- Takes the place of the row and URL: while iterating you're judging
			     the design, not copying links. They come back on the way out. -->
			<div class="flex w-full flex-col gap-3.5 rounded-card bg-brand-canvas p-5">
				<div class="flex flex-col gap-[3px]">
					<h2 class="font-display text-[19px] font-bold tracking-[-0.02em] text-brand-ink">
						Not quite? Say what to change.
					</h2>
					<p class="font-sans text-sm leading-[21px] text-brand-slate">
						It keeps your description and the variables — only the design moves.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each quickFixes as fix (fix)}
						<button
							type="button"
							on:click={() => (change = fix)}
							class="flex h-8 items-center rounded-full bg-brand-paper px-[13px] font-sans text-[13px] text-brand-ink transition-colors hover:bg-brand-powder"
						>
							{fix}
						</button>
					{/each}
				</div>
				<div class="flex w-full items-center gap-2.5">
					<input
						bind:value={change}
						placeholder="Or describe the change…"
						class="h-12 flex-1 rounded-btn border border-brand-rule bg-brand-paper px-3.5 font-sans text-[15px] text-brand-ink outline-none placeholder:text-brand-mute focus-visible:ring-2 focus-visible:ring-brand-royal"
					/>
					<button
						type="button"
						disabled={!change.trim()}
						on:click={redraw}
						class="flex h-12 items-center rounded-btn bg-brand-ink px-5 font-sans text-[15px] font-bold text-brand-paper transition-colors hover:bg-brand-plum disabled:cursor-not-allowed disabled:opacity-30"
					>
						Redraw
					</button>
				</div>
			</div>
		{:else}
			<div class="flex w-full flex-col gap-3.5 rounded-card bg-brand-press p-[22px]">
				<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-press-text">
					The row that filled it
				</span>
				<div class="flex flex-col">
					{#each variables as v, i (v.name)}
						<div
							class="flex items-center justify-between gap-4 py-[9px] {i < variables.length - 1
								? 'border-b border-white/10'
								: ''}"
						>
							<span class="flex-shrink-0 font-mono text-[13px] text-brand-field">
								&#123;&#123;{v.name}&#125;&#125;
							</span>
							<!--
								Sample images arrive as inline SVG data URIs, a few hundred
								characters long. Printing one raw turns the row that is meant to
								read as "a spreadsheet filled this in" into a wall of escaped
								markup, so name the thing rather than quoting it.
							-->
							<span class="truncate text-right font-mono text-[13px] text-white" title={v.value}>
								{v.value?.startsWith('data:image/') ? 'Sample image' : v.value}
							</span>
						</div>
					{/each}
				</div>
			</div>

			{#if !failed}
				<div class="flex h-[52px] w-full items-center justify-between rounded-btn bg-brand-canvas pl-4 pr-1.5">
					<span class="truncate font-mono text-[13px] text-brand-slate">{url}</span>
					<button
						type="button"
						on:click={copyUrl}
						class="flex h-[38px] flex-shrink-0 items-center rounded-btn bg-brand-ink px-4 font-sans text-[13px] font-bold text-brand-paper transition-colors hover:bg-brand-plum"
					>
						{copied ? 'Copied' : 'Copy URL'}
					</button>
				</div>
			{/if}
		{/if}

		<div class="flex flex-col gap-3">
			{#if failed}
				<div class="flex items-center gap-5">
					<button
						type="button"
						on:click={() => dispatch('retry')}
						class="flex h-14 w-fit items-center rounded-btn bg-brand-ink px-7 font-sans text-base font-bold text-brand-paper transition-colors hover:bg-brand-plum"
					>
						Run it again
					</button>
					{#if source === 'ai'}
						<button
							type="button"
							on:click={() => dispatch('edit')}
							class="w-fit font-sans text-[15px] font-semibold text-brand-ink underline underline-offset-[3px]"
						>
							Change the description instead
						</button>
					{/if}
				</div>
			{:else}
				<button
					type="button"
					on:click={() => dispatch('next')}
					class="flex h-14 w-fit items-center rounded-btn bg-brand-ink px-7 font-sans text-base font-bold text-brand-paper transition-colors hover:bg-brand-plum"
				>
					{refining ? "This one's good — run it from my stack →" : 'Now run it from your stack →'}
				</button>
			{/if}

			{#if source === 'ai' && !failed}
				<button
					type="button"
					on:click={() => (refining = !refining)}
					class="w-fit font-sans text-[15px] font-semibold {refining
						? 'text-brand-slate'
						: 'text-brand-ink'} underline underline-offset-[3px]"
				>
					<!-- "Leave it as it is" rather than Cancel: the render you already
					     have is still good, which is the state you'd return to. -->
					{refining ? '← Leave it as it is' : 'Change something'}
				</button>
			{/if}
		</div>
	</div>

	<div class="flex min-w-0 flex-1 flex-col gap-3.5">
		<!--
			The actual rendered file, not a mock-up of one. This screen's entire
			claim is "here's your first file" — showing a hand-built lookalike of
			the artifact would make the one moment that has to be true a fake.
		-->
		<div
			class="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-card bg-brand-canvas p-4 lg:h-[460px] lg:p-6"
		>
			{#if failed}
				<!-- A raster with one cell missing: the motif, honestly interrupted. -->
				<div class="flex flex-col items-center gap-[18px]">
					<div class="flex flex-col" aria-hidden="true">
						<div class="flex">
							<span class="block h-[22px] w-[22px] bg-brand-blue"></span>
							<span class="block h-[22px] w-[22px] bg-brand-ink"></span>
							<span class="block h-[22px] w-[22px]"></span>
						</div>
						<div class="flex">
							<span class="block h-[22px] w-[22px] bg-brand-ink"></span>
							<span class="block h-[22px] w-[22px]"></span>
							<span class="block h-[22px] w-[22px] bg-brand-blue"></span>
						</div>
						<div class="flex">
							<span class="block h-[22px] w-[22px]"></span>
							<span class="block h-[22px] w-[22px] bg-brand-blue"></span>
							<span class="block h-[22px] w-[22px] border border-dashed border-brand-mute"></span>
						</div>
					</div>
					<span class="font-mono text-xs uppercase tracking-[0.1em] text-brand-mute">
						Nothing came back
					</span>
				</div>
			{:else if url}
				<img
					src={url}
					alt="Your first render"
					class="max-h-full max-w-full object-contain"
					on:load={() => (loaded = true)}
					on:error={() => (failed = true)}
				/>
			{:else}
				<span class="font-mono text-xs text-brand-mute">Waiting for the render…</span>
			{/if}
		</div>
		<div class="flex w-full items-center justify-between gap-4 px-1">
			<span class="truncate font-mono text-xs text-brand-mute">{failed ? '' : url}</span>
			{#if meta && !failed}
				<span class="flex-shrink-0 font-mono text-xs text-brand-mute">{meta}</span>
			{/if}
		</div>
	</div>
</div>
