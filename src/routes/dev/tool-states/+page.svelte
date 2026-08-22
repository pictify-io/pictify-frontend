<script>
	// Preview harness for the v2 tool page's PLG states. Not linked from
	// anywhere. Lets the three result-card states and the quota ladder be
	// reviewed without spending real renders.
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import RailSignupCard from '$lib/components/tools/v2/RailSignupCard.svelte';

	const SAMPLE = 'https://media.pictify.io/gre6p-1775406841745.png';
	const common = {
		imageUrl: SAMPLE,
		formatLabel: 'PNG',
		fileExtension: 'png',
		width: 1200,
		height: 630,
		toolName: 'html_to_png',
		toolPath: '/tools/html-to-png',
		html: '<html><body><h1>Ship day.</h1></body></html>'
	};
</script>

<svelte:head>
	<title>Tool PLG states</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="landing-v2 min-h-screen w-full bg-brand-canvas px-10 py-14">
	<div class="mx-auto flex w-full max-w-page flex-col gap-10">
		<h1 class="font-display text-[32px] font-bold tracking-[-0.02em] text-brand-ink">
			Tool page v2 — PLG states
		</h1>

		<section class="flex flex-col gap-4">
			<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">A · TOOLBAR QUOTA LADDER</p>
			{#each [5, 2, 0] as left}
				<div
					class="flex items-center justify-between gap-4 rounded-card border-[1.5px] border-brand-ink bg-brand-paper px-6 py-3"
				>
					<QuotaMeter remaining={left} toolName="html_to_png" toolPath="/tools/html-to-png" />
					<GenerateButton
						label="Generate PNG"
						remaining={left}
						toolName="html_to_png"
						toolPath="/tools/html-to-png"
					/>
				</div>
			{/each}
		</section>

		<section class="flex flex-col gap-4">
			<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">B · RESULT CARD</p>
			<ResultCard {...common} />
			<ResultCard {...common} lastFree />
			<ResultCard {...common} loggedIn monthlyRemaining={47} />
		</section>

		<section class="flex max-w-[360px] flex-col gap-4">
			<p class="font-mono text-xs tracking-[0.06em] text-brand-mute">RAIL SIGNUP CARD</p>
			<RailSignupCard toolName="html_to_png" toolPath="/tools/html-to-png" />
		</section>
	</div>
</div>
