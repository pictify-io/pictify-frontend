<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import ReceiptsBlock from '$lib/components/solutions/blocks/ReceiptsBlock.svelte';
	import FlipBlock from '$lib/components/solutions/blocks/FlipBlock.svelte';
	import StepsBlock from '$lib/components/solutions/blocks/StepsBlock.svelte';
	import RichTextBlock from '$lib/components/solutions/blocks/RichTextBlock.svelte';

	export let data;
	$: solution = data.solution;

	$: canonical = `https://pictify.io/solutions/${solution.slug}`;

	// Not stored in Sanity — boilerplate derivable from fields the schema
	// already has, so editors don't hand-maintain a near-duplicate of title/description.
	$: webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: `Pictify — ${solution.breadcrumbLabel}`,
		url: canonical,
		description: solution.metaDescription,
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify', url: 'https://pictify.io' }
	};

	// A page could carry more than one stepsBlock (e.g. two audiences) — the
	// schema doesn't cap it, so fold every block's steps into one HowTo
	// rather than silently dropping all but the first from structured data.
	$: stepsBlocks = solution.body.filter((b) => b._type === 'stepsBlock');
	$: howToSteps = stepsBlocks.length ? stepsBlocks.flatMap((b) => b.steps) : null;
	$: howToMeta = stepsBlocks.length
		? {
				name: solution.keyword ? `How to ${solution.keyword}` : solution.breadcrumbLabel,
				description: solution.metaDescription
		  }
		: null;

	const ctaStyles = {
		primary:
			'bg-data-green text-gray-900 border-[3px] border-gray-900 rounded-xl shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all',
		secondary:
			'bg-white text-gray-900 border-[3px] border-gray-900 rounded-xl shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all'
	};
</script>

<SolutionPageShell
	title={solution.title}
	description={solution.metaDescription}
	{canonical}
	breadcrumbLabel={solution.breadcrumbLabel}
	ogImage={solution.ogImage}
	ogImageAlt={solution.ogImageAlt}
	{webApplicationSchema}
	{howToSteps}
	{howToMeta}
	faqs={solution.faqs}
>
	<header class="text-center mb-14">
		{#if solution.eyebrow}
			<div
				class="inline-block bg-gray-900 text-brand-accent border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
			>
				<span class="font-black uppercase tracking-widest text-sm">{solution.eyebrow}</span>
			</div>
		{/if}
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			{solution.headline}{#if solution.headlineAccent}<br /><span class="text-brand-danger"
					>{solution.headlineAccent}</span
				>{/if}
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			{solution.subhead}
		</p>
		{#if solution.ctaButtons && solution.ctaButtons.length > 0}
			<div class="mt-8 flex flex-wrap justify-center gap-4">
				{#each solution.ctaButtons as cta}
					<a
						href={cta.href}
						class="px-8 py-4 font-black uppercase tracking-widest {ctaStyles[cta.style] ||
							ctaStyles.secondary}"
					>
						{cta.label}
					</a>
				{/each}
			</div>
		{/if}
	</header>

	{#each solution.body as block (block._key)}
		{#if block._type === 'receiptsBlock'}
			<ReceiptsBlock heading={block.heading} subheading={block.subheading} items={block.items} />
		{:else if block._type === 'flipBlock'}
			<FlipBlock
				heading={block.heading}
				headingAccent={block.headingAccent}
				body={block.body}
				bullets={block.bullets}
			/>
		{:else if block._type === 'stepsBlock'}
			<StepsBlock heading={block.heading} steps={block.steps} />
		{:else if block._type === 'richTextBlock'}
			<RichTextBlock heading={block.heading} content={block.content} />
		{/if}
	{/each}

	<SolutionClosingCta toolName={solution.slug} isPillar={solution.isPillar} />
</SolutionPageShell>
