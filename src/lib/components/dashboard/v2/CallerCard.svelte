<script>
	/**
	 * One thing that renders through the account. Every caller gets the same
	 * anatomy — dot, name, glyph, detail, count, last-seen, footer — so the grid
	 * reads as one switchboard rather than five unrelated integrations, and a
	 * caller going quiet is visible by comparison instead of by hunting.
	 *
	 * The card only ever shows attributed renders. A caller with no attributed
	 * render on record is never "quiet": we cannot tell an integration that
	 * stopped from one that predates attribution.
	 *
	 * `connected` is about configuration, not traffic — a path you have already
	 * wired up shows its (possibly zero) count, not a "Set up" button. Only a
	 * caller with nothing behind it at all gets the dashed not-connected face.
	 */
	import { createEventDispatcher } from 'svelte';
	import { timeAgo } from '$lib/utils/format.js';

	const dispatch = createEventDispatcher();

	/** { source, name, detail, glyph, tint, connected, quiet, quietDays, renders, lastRenderAt, action, description } */
	export let caller = {};
	/** Label for the count row, e.g. "RENDERS SINCE AUG 15". */
	export let windowLabel = '';

	$: connected = Boolean(caller.connected);
	$: quiet = Boolean(caller.quiet);
	$: lastLabel = caller.lastRenderAt ? timeAgo(caller.lastRenderAt).toUpperCase() : null;
</script>

<div
	class="flex h-full w-full flex-col gap-1.5 rounded-card p-5 {connected
		? 'border border-brand-rule bg-brand-paper'
		: 'border border-dashed border-brand-mute bg-brand-subtle'}"
>
	<div class="flex items-center gap-2.5">
		<span
			class="block h-[9px] w-[9px] flex-shrink-0 {connected
				? quiet
					? 'bg-brand-alarm'
					: 'bg-brand-proof'
				: 'border border-brand-mute bg-brand-subtle'}"
			aria-hidden="true"
		></span>
		<span class="font-sans text-base font-semibold text-brand-ink">{caller.name}</span>
		<span class="flex-1"></span>
		<span
			class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-btn border {connected
				? 'border-brand-ink'
				: 'border-brand-mute bg-brand-paper'}"
			style={connected ? `background-color: ${caller.tint}` : ''}
			aria-hidden="true"
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
				<path
					d={caller.glyph}
					stroke={connected ? '#000000' : '#8A8A85'}
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</div>

	{#if connected}
		<span class="truncate font-mono text-xs tracking-[0.02em] text-brand-mute">{caller.detail}</span>
	{:else}
		<span class="font-sans text-[13px] leading-[18px] text-brand-slate">{caller.description}</span>
	{/if}

	<div class="flex flex-col gap-1 pb-3.5 {connected ? 'pt-[18px]' : 'pt-[26px]'}">
		{#if connected}
			<div class="flex items-end gap-2">
				<span
					class="font-mono text-[32px] font-semibold leading-[34px] {quiet
						? 'text-brand-mute'
						: 'text-brand-ink'}"
				>
					{caller.renders.toLocaleString()}
				</span>
				<span class="font-mono text-[11px] uppercase leading-[18px] tracking-[0.06em] text-brand-mute">
					{windowLabel}
				</span>
			</div>
			{#if quiet}
				<span class="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-brand-alarm">
					Quiet for {caller.quietDays} day{caller.quietDays === 1 ? '' : 's'}
				</span>
			{:else if lastLabel}
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
					Last — {lastLabel}
				</span>
			{:else}
				<!-- Set up, but nothing has come through it yet. Saying "ready" is
				     honest where "last — never" would read as a fault. -->
				<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
					Ready — nothing yet
				</span>
			{/if}
		{:else}
			<span class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">
				Not connected — no renders yet
			</span>
		{/if}
	</div>

	{#if connected}
		<div class="mt-auto flex items-center justify-between border-t border-brand-rule pt-4">
			<a
				href="/dashboard/renders?source={caller.source}"
				class="font-sans text-sm font-medium text-brand-blue hover:underline"
			>
				View renders
			</a>
			{#if caller.action}
				<button
					type="button"
					on:click={() => dispatch('action', { caller })}
					class="rounded-btn border border-brand-rule px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.06em] text-brand-slate hover:border-brand-ink hover:text-brand-ink"
				>
					{caller.action}
				</button>
			{/if}
		</div>
	{:else}
		<div class="mt-auto flex items-center pt-4">
			<button
				type="button"
				on:click={() => dispatch('action', { caller })}
				class="flex items-center gap-2 rounded-btn bg-brand-press px-3.5 py-2 font-sans text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
			>
				Set up
				<span class="block h-[7px] w-[7px] bg-brand-field" aria-hidden="true"></span>
			</button>
		</div>
	{/if}
</div>
