<script>
	/**
	 * A template shown as what it renders: last render as the face, liveness
	 * underneath, and the contract — its {{variables}} — along the foot, so
	 * you can tell what a template needs without opening it. Hover surfaces
	 * the three actions that don't deserve a page: Open, Render, Copy ID.
	 */
	import { createEventDispatcher } from 'svelte';
	import { timeAgo } from '$lib/utils/format.js';

	const dispatch = createEventDispatcher();

	/** { uid, name, thumbnail, outputFormat, usageCount, variables, lastRenderedAt?, isVideo? } */
	export let template = {};

	let copied = false;
	let menuOpen = false;

	$: format = (template.outputFormat === 'image' ? 'PNG' : template.outputFormat || 'PNG').toUpperCase();
	$: varNames = (template.variables || [])
		.map((v) => (typeof v === 'string' ? v : v?.name))
		.filter(Boolean);
	$: openHref = template.isVideo
		? `/dashboard/video-templates/${template.uid}`
		: `/template-workspace/html/${template.uid}`;
	$: renderHref = template.isVideo
		? `/dashboard/video-templates/${template.uid}`
		: `/dashboard/template/${template.uid}/render`;
	$: liveness = template.usageCount
		? `${template.usageCount.toLocaleString()} renders${template.lastRenderedAt ? ` · ${timeAgo(template.lastRenderedAt)}` : ''}`
		: 'no renders yet — try a test render';

	async function copyId() {
		try {
			await navigator.clipboard.writeText(template.uid);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			// Clipboard denied — the id is still visible in the workspace URL.
		}
	}
</script>

<div class="group relative flex flex-col overflow-hidden rounded-[10px] border-[1.5px] border-brand-rule transition-all hover:border-brand-ink hover:shadow-[4px_4px_0_theme(colors.brand.field)]">
	<a href={openHref} class="relative block h-[150px] overflow-hidden bg-brand-canvas" aria-label="Open {template.name}">
		{#if template.thumbnail}
			<img loading="lazy" src={template.thumbnail} alt="Last render of {template.name}" class="h-full w-full object-cover object-top" />
		{:else}
			<span class="flex h-full items-center justify-center font-mono text-[10px] tracking-[0.12em] text-brand-mute">
				NO RENDERS YET
			</span>
		{/if}
		<span class="absolute inset-0 hidden items-center justify-center gap-2 bg-brand-press-deep/55 group-hover:flex">
			<span class="rounded-btn bg-brand-field px-3.5 py-[7px] font-sans text-xs font-bold text-brand-ink">Open</span>
			<a
				href={renderHref}
				on:click|stopPropagation
				class="rounded-btn border-[1.5px] border-white/60 px-3 py-1.5 font-sans text-xs font-semibold text-white hover:bg-white/10"
			>
				Render
			</a>
			<button
				type="button"
				on:click|preventDefault|stopPropagation={copyId}
				class="rounded-btn border-[1.5px] border-white/60 px-2.5 py-[7px] font-mono text-[10px] text-white hover:bg-white/10"
			>
				{copied ? 'COPIED' : 'COPY ID'}
			</button>
		</span>
	</a>

	<div class="flex items-center justify-between px-3.5 pb-2 pt-2.5">
		<a href={openHref} class="min-w-0 truncate font-sans text-[13.5px] font-bold text-brand-ink hover:underline">
			{template.name || 'Untitled'}
		</a>
		<div class="relative ml-2 flex flex-shrink-0 items-center gap-2">
			<span class="rounded-[3px] bg-brand-powder px-[7px] py-0.5 font-mono text-[9px] tracking-[0.06em] text-brand-royal">
				{format}
			</span>
			<button
				type="button"
				on:click={() => (menuOpen = !menuOpen)}
				class="px-1 font-sans text-sm text-brand-mute hover:text-brand-ink"
				aria-label="Template actions"
				aria-expanded={menuOpen}
			>
				⋯
			</button>
			{#if menuOpen}
				<div class="absolute right-0 top-full z-20 mt-1 flex w-[140px] flex-col overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
					<button
						type="button"
						on:click={() => {
							menuOpen = false;
							copyId();
						}}
						class="px-3 py-2 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
					>
						Copy ID
					</button>
					<button
						type="button"
						on:click={() => {
							menuOpen = false;
							dispatch('duplicate', { template });
						}}
						class="px-3 py-2 text-left font-sans text-[13px] text-brand-ink hover:bg-brand-canvas"
					>
						Duplicate
					</button>
					<button
						type="button"
						on:click={() => {
							menuOpen = false;
							dispatch('delete', { template });
						}}
						class="border-t border-black/[0.08] px-3 py-2 text-left font-sans text-[13px] text-[#B0483A] hover:bg-brand-canvas"
					>
						Delete
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="px-3.5 pb-2.5">
		<span class="font-mono text-[10px] text-brand-mute">{liveness}</span>
	</div>

	{#if varNames.length}
		<div class="flex flex-wrap gap-x-1.5 gap-y-0.5 border-t border-brand-rule bg-[#F4F6F4] px-3.5 py-[7px]">
			{#each varNames.slice(0, 3) as name (name)}
				<span class="font-mono text-[9.5px] text-brand-royal">&#123;&#123;{name}&#125;&#125;</span>
			{/each}
			{#if varNames.length > 3}
				<span class="font-mono text-[9.5px] text-brand-mute">+{varNames.length - 3}</span>
			{/if}
		</div>
	{/if}
</div>
