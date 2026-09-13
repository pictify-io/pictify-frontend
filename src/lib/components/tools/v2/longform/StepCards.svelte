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

	import JumpLink from './JumpLink.svelte';

	/** [{ title, body? }] */
	export let steps = [];
	/**
	 * 'h3' by default. Pass 'p' where the steps being replaced were not headings
	 * — adding six h3s to a page whose outline is frozen is a change nobody
	 * asked for.
	 */
	export let titleTag = 'h3';
	/** e.g. '#input' — renders the mono jump link under the cards when set. */
	export let jumpTo = null;
	export let jumpLabel = 'JUMP TO EDITOR ↑';
</script>

<div class="flex flex-col gap-6">
	<!--
		A grid, not a flex row: six steps in one row are unreadable, and at three
		steps the equal columns render identically to the flex version.
	-->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		{#each steps as step, i}
			<div class="relative border border-brand-ink bg-brand-subtle p-6">
				<div
					class="absolute -left-4 -top-4 flex h-10 w-10 items-center justify-center border border-brand-rule bg-brand-ink text-xl font-semibold text-white"
				>
					{i + 1}
				</div>
				<svelte:element this={titleTag} class="mb-2 mt-2 text-xl font-semibold"
					>{step.title}</svelte:element
				>
				{#if step.body}
					<p class="font-bold text-brand-slate">{step.body}</p>
				{/if}
			</div>
		{/each}
	</div>

	{#if jumpTo}
		<JumpLink href={jumpTo}>{jumpLabel}</JumpLink>
	{/if}
</div>
