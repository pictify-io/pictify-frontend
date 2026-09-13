<script>
	/**
	 * The honest-disclosure pattern: a pink bar down the left.
	 *
	 * Pink is the product's "pay attention, this is the caveat" colour, and in
	 * these guides a blockquote is almost always the paragraph admitting a
	 * limitation. Giving it the loudest ink in the palette is the point.
	 */
</script>

<blockquote class="my-7 border-l-[3px] border-brand-pink py-1 pl-5">
	<slot />
</blockquote>

<style>
	blockquote :global(p) {
		margin: 0 0 0.75rem;
		font-style: italic;
		color: #383a42;
	}
	blockquote :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
