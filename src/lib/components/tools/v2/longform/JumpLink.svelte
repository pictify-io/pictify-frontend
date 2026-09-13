<script>
	/**
	 * The mono link that closes a section — "jump to editor", "start a run".
	 *
	 * Its own component because several sections end in one and the class string
	 * would otherwise be copied into each route, which is the drift these
	 * primitives exist to stop.
	 */
	export let href = '';
	/** Analytics is opt-in: most of these are in-page jumps worth no event. */
	export let onClick = null;
</script>

<a
	{href}
	on:click={onClick}
	class="w-fit font-mono text-xs tracking-[0.06em] text-brand-royal underline-offset-4 hover:underline"
>
	<slot />
</a>
