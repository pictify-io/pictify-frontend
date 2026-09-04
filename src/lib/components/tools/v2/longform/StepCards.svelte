<script>
	/**
	 * Numbered how-to cards. The step titles are real <h3>s — unlike
	 * FeatureGrid's tiles these are sequential content a crawler should see as
	 * sub-points of the section.
	 *
	 * `jumpTo` is opt-in and off by default: internal links on these pages are
	 * frozen for search, so a route only grows a "jump to editor" link if it
	 * already has one.
	 */

	/** [{ title, body }] */
	export let steps = [];
	/** e.g. '#input' — renders the mono jump link under the cards when set. */
	export let jumpTo = null;
	export let jumpLabel = 'JUMP TO EDITOR ↑';
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-6 md:flex-row">
		{#each steps as step, i}
			<div class="relative flex-1 border border-brand-ink bg-brand-subtle p-6">
				<div
					class="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center border border-brand-rule bg-brand-ink text-xl font-semibold text-white"
				>
					{i + 1}
				</div>
				<h3 class="mb-2 mt-2 text-xl font-semibold">{step.title}</h3>
				<p class="font-bold text-brand-slate">{step.body}</p>
			</div>
		{/each}
	</div>

	{#if jumpTo}
		<a
			href={jumpTo}
			class="font-mono text-xs tracking-[0.06em] text-brand-royal underline-offset-4 hover:underline"
		>
			{jumpLabel}
		</a>
	{/if}
</div>
