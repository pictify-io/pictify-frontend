<script>
	/**
	 * The proof: the template rendered with the sample inputs, live.
	 *
	 * It is the answer to "does it work", so it never shows a stale image next
	 * to a failure — a proof you can't trust is worse than no proof. While a
	 * render is in flight the previous frame stays but dims; when one fails the
	 * frame is replaced outright by the error.
	 */
	export let dataUrl = null;
	export let totalMs = 0;
	/** 'idle' | 'loading' | 'ok' | 'error' */
	export let status = 'idle';
	export let error = null;
	/** Set while the agent is rewriting the template. */
	export let working = false;
	export let workingLabel = 'Applying your change…';
	/** Nothing to proof yet — fresh paste-HTML creation. */
	export let empty = false;

	let zoom = 'fit';
</script>

<section class="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 bg-brand-canvas px-8 py-10">
	<div class="flex items-center gap-3">
		<span class="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-ink">Proof</span>
		<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
			Filled with your sample inputs · updates live
		</span>
	</div>

	<div class="flex min-h-0 w-full flex-1 items-center justify-center">
		{#if status === 'error'}
			<div class="flex max-w-[560px] flex-col gap-2 rounded-tile border-[1.5px] border-brand-alarm bg-brand-paper px-6 py-5">
				<span class="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-alarm">
					Proof failed
				</span>
				<p class="whitespace-pre-wrap break-words font-mono text-xs leading-[18px] text-brand-slate">
					{error || 'The template could not be rendered.'}
				</p>
			</div>
		{:else if empty}
			<div class="flex flex-col items-center gap-2 opacity-70">
				<span class="flex h-[180px] w-[280px] items-center justify-center rounded-tile border-[1.5px] border-dashed border-brand-mute">
					<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
						Nothing to proof yet
					</span>
				</span>
				<span class="font-mono text-[10px] text-brand-mute">your HTML renders here as you type</span>
			</div>
		{:else if dataUrl}
			<div class="relative flex max-h-full items-center justify-center">
				<img
					src={dataUrl}
					alt="Proof of this template rendered with your sample inputs"
					class="max-h-[62vh] {zoom === 'fit' ? 'max-w-full' : ''} border border-black/5 bg-white object-contain shadow-[0_1px_0_rgba(0,0,0,0.06)] transition-opacity {working ||
					status === 'loading'
						? 'opacity-40'
						: 'opacity-100'}"
				/>
				{#if working}
					<span class="absolute inset-0 flex items-center justify-center">
						<span class="animate-pulse rounded-btn bg-brand-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-white">
							{workingLabel}
						</span>
					</span>
				{/if}
			</div>
		{:else}
			<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
				{status === 'loading' ? 'Rendering…' : 'No proof yet'}
			</span>
		{/if}
	</div>

	<div class="flex items-center gap-2">
		{#each ['fit', '100%'] as z (z)}
			<button
				type="button"
				on:click={() => (zoom = z)}
				class="rounded-btn border-[1.5px] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] {zoom === z
					? 'border-brand-ink bg-brand-paper text-brand-ink'
					: 'border-transparent text-brand-mute hover:border-brand-rule'}"
			>
				{z}
			</button>
		{/each}
		{#if totalMs > 0 && status === 'ok'}
			<span class="pl-1 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
				{Math.round(totalMs)} ms
			</span>
		{/if}
	</div>
</section>
