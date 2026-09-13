<script>
	/**
	 * /solutions — the shelf of use-case guides, on the v2 frame.
	 *
	 * Data is Sanity (see +page.js). The heading outline is the live one and
	 * stays byte-identical: the H1, the pillar guide as its own H2 ("Start
	 * here"), "Use-case guides", and one H3 per other guide. That is why the
	 * pillar keeps a section of its own rather than joining the card grid.
	 */
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import LinkCardGrid from '$lib/components/tools/v2/longform/LinkCardGrid.svelte';
	import ToolStamp from '$lib/components/tools/v2/ToolStamp.svelte';

	export let data;
	$: pillar = data.solutions.find((s) => s.isPillar);
	$: others = data.solutions.filter((s) => !s.isPillar);

	const title = 'Solutions: Documents & Videos Generated at Scale | Pictify';
	const description =
		'Guides for turning spreadsheet rows into branded documents: bulk certificates, badges, personalized PDFs and video, rendered one per row over an API.';
	const canonical = 'https://pictify.io/solutions';

	const crumbs = [{ label: 'SOLUTIONS' }];

	/**
	 * The format a guide produces, for its stamp. Sanity carries no format
	 * field, so it is read off the guide's own words: a video guide renders
	 * MP4, everything else in this cluster is a document.
	 */
	function outputsFor(solution) {
		const text = `${solution.slug} ${solution.keyword || ''}`;
		return /video/i.test(text) ? ['MP4'] : ['PDF'];
	}

	$: guideCards = others.map((s) => ({
		href: `/solutions/${s.slug}`,
		title: s.breadcrumbLabel,
		body: s.summary,
		outputs: outputsFor(s)
	}));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://pictify.io/og/v2/solutions.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Documents and videos generated at scale | Pictify Solutions"
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="https://pictify.io/og/v2/solutions.png" />
	<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
</svelte:head>

<ToolPageShell
	{crumbs}
	facts="ONE ROW IN · ONE RENDERED FILE OUT · OVER AN API"
	longform="column"
	showSignup={false}
	showRelated={false}
	showClosing={false}
>
	<HeroTitle slot="h1">
		Data in.<br />
		<span>Branded documents out.</span>
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Guides for every workflow that turns rows into documents: certificates, personalized PDFs,
		badges, and video, rendered one per row over an API.
	</HeroSub>

	<svelte:fragment slot="longform">
		{#if pillar}
			<LongformSection index="01" id="start-here" first title={pillar.breadcrumbLabel}>
				<a
					href="/solutions/{pillar.slug}"
					class="group flex flex-col gap-4 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper p-6 transition-[transform,box-shadow] duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_0_#000000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-royal motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-6 lg:p-8"
				>
					<ToolStamp outputs={outputsFor(pillar)} />
					<span class="flex flex-1 flex-col gap-1.5">
						<span class="font-mono text-[11px] tracking-[0.06em] text-brand-blue">START HERE</span>
						<span class="font-sans text-lg leading-[27px] text-brand-ink">{pillar.summary}</span>
					</span>
					<span
						class="font-mono text-xs tracking-[0.06em] text-brand-ink group-hover:underline"
						aria-hidden="true">READ THE GUIDE →</span
					>
				</a>
			</LongformSection>
		{/if}

		<LongformSection index={pillar ? '02' : '01'} id="guides" first={!pillar} title="Use-case guides">
			{#if guideCards.length}
				<LinkCardGrid items={guideCards} columns={3} toolName="solutions_index" />
			{:else if !pillar}
				<!-- Sanity returned nothing: say so rather than leave the section blank. -->
				<p
					class="border-y border-brand-rule py-4 font-mono text-xs tracking-[0.06em] text-brand-mute"
				>
					GUIDES ARE BEING WRITTEN
				</p>
			{/if}
		</LongformSection>
	</svelte:fragment>
</ToolPageShell>
