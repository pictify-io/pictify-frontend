<script>
	/**
	 * Numbered feature tiles — the reference's "Key Features" block, and the
	 * "Benefits of…" sections every other route hand-rolled.
	 *
	 * The number is decoration, not an ordered list: these are parallel points,
	 * so nothing here is a heading and the tiles carry no h3.
	 */

	/** [{ title, body? }] */
	export let items = [];
	/** 2 or 3 tiles per row above `sm`. Literal classes — Tailwind can't build these. */
	export let columns = 3;

	const COLUMN_CLASS = {
		2: 'grid grid-cols-1 gap-6 sm:grid-cols-2',
		3: 'grid grid-cols-1 gap-6 sm:grid-cols-3'
	};
	$: wrapper = COLUMN_CLASS[columns] || COLUMN_CLASS[3];
</script>

<div class={wrapper}>
	{#each items as item, i}
		<div class="border border-brand-ink bg-brand-subtle p-6 transition-all duration-200">
			<div class="flex flex-col items-start gap-4">
				<div
					class="flex h-10 w-10 items-center justify-center border-[2px] border-transparent bg-brand-ink text-lg font-semibold text-white"
				>
					{i + 1}
				</div>
				<div>
					<p class="text-lg font-bold leading-tight text-brand-ink">{item.title}</p>
					{#if item.body}
						<p class="mt-2 font-sans text-[15px] leading-[23px] text-brand-slate">{item.body}</p>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>
