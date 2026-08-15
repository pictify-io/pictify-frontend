<script>
	/**
	 * The line, newest first. The listening slot leads because that's where
	 * the next render lands; the newest real render gets the ink frame and
	 * lime shadow — just off the press. Overflows sideways on purpose: a
	 * cropped card at the edge is the scroll affordance.
	 */
	import { timeAgo } from '$lib/utils/format.js';

	/** Renders: { url, format, createdAt } newest first. */
	export let renders = [];
	/** S0: nothing has printed; the strip is one honest dashed slot. */
	export let empty = false;

	// The raster tick only claims "live" when something actually printed.
	$: live = !empty && renders.length > 0;

	const isPdf = (r) => (r.format || '').toUpperCase() === 'PDF';
</script>

<section class="flex flex-col gap-3.5">
	<div class="flex items-center gap-2.5">
		<h2 class="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-mute">
			{empty ? 'No renders yet' : 'Recent renders'}
		</h2>
		{#if live}
			<span class="flex" aria-hidden="true">
				<span class="block h-1.5 w-1.5 animate-pulse bg-brand-field"></span>
				<span class="block h-1.5 w-1.5"></span>
				<span class="block h-1.5 w-1.5 bg-brand-field"></span>
				<span class="block h-1.5 w-1.5 bg-brand-field"></span>
			</span>
		{/if}
		{#if !empty}
			<a
				href="/dashboard/renders"
				class="ml-auto font-sans text-[12.5px] font-semibold text-brand-slate underline underline-offset-[3px]"
			>
				All renders
			</a>
		{/if}
	</div>

	{#if empty}
		<div class="flex w-[172px] flex-col gap-1.5">
			<span class="flex h-[104px] items-center justify-center rounded-[6px] border-[1.5px] border-dashed border-brand-mute opacity-50">
				<span class="font-mono text-[10px] text-brand-mute">waiting…</span>
			</span>
			<span class="font-mono text-[10px] text-brand-mute opacity-70">your first render lands here</span>
		</div>
	{:else}
		<div class="flex gap-3 overflow-x-auto pb-1" style="scrollbar-width: thin;">
			<div class="flex w-[172px] flex-shrink-0 flex-col gap-1.5 opacity-50">
				<span class="flex h-[104px] items-center justify-center rounded-[6px] border-[1.5px] border-dashed border-brand-mute">
					<span class="font-mono text-[10px] text-brand-mute">waiting…</span>
				</span>
				<span class="font-mono text-[10px] text-brand-mute">next render lands here</span>
			</div>
			{#each renders as r, i (r.url)}
				<a
					href={r.url}
					target="_blank"
					rel="noopener noreferrer"
					class="flex w-[172px] flex-shrink-0 flex-col gap-1.5"
					title="Open render"
				>
					<span
						class="block h-[104px] overflow-hidden rounded-[6px] {i === 0
							? 'border-2 border-brand-ink shadow-[3px_3px_0_theme(colors.brand.field)]'
							: 'border-[1.5px] border-brand-rule'}"
					>
						{#if isPdf(r)}
							<span class="flex h-full flex-col items-center justify-center gap-1 bg-white">
								<span class="font-display text-[13px] font-extrabold text-brand-ink">PDF</span>
								<span class="block h-0.5 w-8 bg-brand-rose"></span>
							</span>
						{:else}
							<img loading="lazy" src={r.url} alt="Render" class="h-full w-full bg-brand-canvas object-cover object-top" />
						{/if}
					</span>
					<span class="flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-[0.06em] text-brand-slate">{(r.format || 'PNG').toUpperCase()}</span>
						<span class="font-mono text-[10px] {i === 0 ? 'text-brand-proof' : 'text-brand-mute'}">
							{timeAgo(r.createdAt)}
						</span>
					</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
