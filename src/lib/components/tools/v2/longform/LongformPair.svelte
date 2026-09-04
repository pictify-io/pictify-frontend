<script>
	/**
	 * Wrapper for the trailing `compact` sections. Below 900px they stack; above
	 * it they sit two-up, which is what gives the end of the column a different
	 * rhythm from the numbered spine above it.
	 *
	 * `columns={1}` keeps the stack at every width — for pairs whose content is
	 * too wide to halve (a comparison table, say).
	 */
	export let columns = 2;
</script>

<div
	class={columns === 2 ? 'grid grid-cols-1 gap-10 min-[900px]:grid-cols-2' : 'flex flex-col gap-10'}
>
	<slot />
</div>
