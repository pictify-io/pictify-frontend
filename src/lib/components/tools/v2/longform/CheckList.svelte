<script>
	/**
	 * The one checklist style. The page used to carry three (pink stroke check,
	 * ink box check, square bullet); this is the ink box, which is the only one
	 * that reads as deliberate next to the ink rules of the column.
	 */

	/** string[] */
	export let items = [];
</script>

<ul class="space-y-4 text-lg font-medium text-brand-ink">
	{#each items as item}
		<li class="flex items-start gap-4">
			<div
				class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center bg-brand-ink text-white"
			>
				<svg
					class="h-4 w-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/></svg
				>
			</div>
			<span>{item}</span>
		</li>
	{/each}
</ul>
