<script>
	/**
	 * Rail nav icons — heroicons outline path data, the project's existing icon
	 * convention. Stroke follows the row's text color, so active/inactive needs
	 * no logic here.
	 */
	export let name = 'home';

	const PATHS = {
		// Home: the house.
		home: [
			'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		],
		// Renders: a photograph — the output.
		renders: [
			'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
		],
		// Templates: the layout blocks.
		templates: [
			'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z'
		],
		// Callers: traffic in and out.
		callers: ['M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'],
		// Campaigns: a stack of summaries, one per account.
		campaigns: [
			'M8 4h11a1 1 0 011 1v11a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1zM4 8v11a1 1 0 001 1h11'
		],
		// API playground: code brackets — the call you write, not the render.
		playground: ['M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'],
		// Usage & billing: the bar chart.
		usage: [
			'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
		],
		// Team & invites: people.
		team: [
			'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
		],
		// Settings: the cog.
		settings: [
			'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
			'M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		]
	};

	$: paths = PATHS[name] || PATHS.home;
</script>

<svg
	class="h-4 w-4 flex-shrink-0"
	fill="none"
	viewBox="0 0 24 24"
	stroke="currentColor"
	stroke-width="1.8"
	aria-hidden="true"
>
	{#each paths as d (d)}
		<path stroke-linecap="round" stroke-linejoin="round" {d} />
	{/each}
</svg>
