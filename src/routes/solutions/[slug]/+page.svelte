<script>
	/**
	 * /solutions/[slug] — one use-case guide, rendered from its Sanity blocks
	 * onto the v2 long-form primitives.
	 *
	 * Every heading is the live one: the H1 (headline + accent), one H2 per
	 * block with its H3 sub-points, the closing block's H2 and six H3s, and the
	 * FAQ H2. Only the containers changed.
	 */
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import Lead from '$lib/components/tools/v2/longform/Lead.svelte';
	import CheckList from '$lib/components/tools/v2/longform/CheckList.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';

	export let data;
	$: solution = data.solution;

	$: canonical = `https://pictify.io/solutions/${solution.slug}`;

	// Not stored in Sanity — boilerplate derivable from fields the schema
	// already has, so editors don't hand-maintain a near-duplicate of title/description.
	$: webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: `Pictify: ${solution.breadcrumbLabel}`,
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

	/** Section numbers are decoration; they count the blocks that render a heading. */
	$: numbered = solution.body.filter((b) => b._type !== 'richTextBlock' || b.heading);
	const pad = (n) => String(n).padStart(2, '0');
	$: indexOf = (block) => pad(numbered.indexOf(block) + 1);
	$: closingIndex = pad(numbered.length + 1);
	$: faqIndex = pad(numbered.length + 2);

	const ctaClass = {
		primary:
			'bg-brand-ink text-white shadow-[3px_3px_0_0_#FF48B0] hover:opacity-90',
		secondary: 'border-[1.5px] border-brand-ink bg-brand-paper text-brand-ink hover:bg-brand-subtle'
	};
</script>

<SolutionPageShell
	title={solution.title}
	description={solution.metaDescription}
	{canonical}
	breadcrumbLabel={solution.breadcrumbLabel}
	eyebrow={solution.eyebrow}
	ogImage={solution.ogImage}
	ogImageAlt={solution.ogImageAlt}
	{webApplicationSchema}
	{howToSteps}
	{howToMeta}
	faqs={solution.faqs}
	{faqIndex}
>
	<HeroTitle slot="h1"
		>{solution.headline}{#if solution.headlineAccent}<br /><span class="text-brand-blue"
				>{solution.headlineAccent}</span
			>{/if}</HeroTitle
	>

	<HeroSub slot="hero-sub">{solution.subhead}</HeroSub>

	<svelte:fragment slot="hero-actions">
		{#if solution.ctaButtons && solution.ctaButtons.length > 0}
			<div class="flex flex-wrap gap-3">
				{#each solution.ctaButtons as cta}
					<a
						href={cta.href}
						class="rounded-lg px-6 py-3.5 font-sans text-[15px] font-semibold transition-[opacity,background-color] {ctaClass[
							cta.style
						] || ctaClass.secondary}"
					>
						{cta.label}
					</a>
				{/each}
			</div>
		{/if}
	</svelte:fragment>

	{#each solution.body as block, i (block._key)}
		{#if block._type === 'receiptsBlock'}
			<LongformSection index={indexOf(block)} first={i === 0} title={block.heading}>
				{#if block.subheading}
					<Lead>{block.subheading}</Lead>
				{/if}
				<div class="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
					{#each block.items as r}
						<div class="flex flex-col gap-2 border-t border-brand-rule pt-4">
							<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
								<h3 class="font-sans text-lg font-medium leading-6 text-brand-ink">{r.tool}</h3>
								<span
									class="bg-brand-rose px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-brand-ink"
									>{r.wall}</span
								>
							</div>
							<p class="font-sans text-[15px] leading-[23px] text-brand-slate">{r.detail}</p>
						</div>
					{/each}
				</div>
			</LongformSection>
		{:else if block._type === 'flipBlock'}
			<LongformSection index={indexOf(block)} first={i === 0}>
				<h2
					slot="heading"
					class="font-display text-[32px] font-bold leading-[42px] tracking-[-0.02em] text-brand-ink"
				>
					<!-- Explicit {' '}: a bare leading space inside {#if} survives SSR but is
					     dropped on hydration, so the browser showed "Startdelivering." -->
					{block.heading}{#if block.headingAccent}{' '}<span class="text-brand-blue"
							>{block.headingAccent}</span
						>{/if}
				</h2>
				<Lead>{block.body}</Lead>
				{#if block.bullets?.length}
					<CheckList items={block.bullets} />
				{/if}
			</LongformSection>
		{:else if block._type === 'stepsBlock'}
			<LongformSection index={indexOf(block)} first={i === 0} title={block.heading}>
				<StepCards steps={block.steps.map((step) => ({ title: step.name, body: step.text }))} />
			</LongformSection>
		{:else if block._type === 'richTextBlock'}
			{#if block.heading}
				<LongformSection index={indexOf(block)} first={i === 0} title={block.heading}>
					<div class="flex flex-col gap-4 font-sans text-[15px] leading-[23px] text-brand-slate [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-[30px] [&_h2]:tracking-[-0.02em] [&_h2]:text-brand-ink [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-6 [&_h3]:tracking-[-0.02em] [&_h3]:text-brand-ink [&_a]:text-brand-ink [&_a]:underline [&_strong]:font-semibold [&_strong]:text-brand-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-brand-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-brand-ink [&_blockquote]:pl-3.5 [&_blockquote]:text-brand-ink">
						<SvelteMarkdown source={block.content} />
					</div>
				</LongformSection>
			{:else}
				<div class="border-t border-brand-rule pt-8 flex flex-col gap-4 font-sans text-[15px] leading-[23px] text-brand-slate [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-[30px] [&_h2]:tracking-[-0.02em] [&_h2]:text-brand-ink [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-6 [&_h3]:tracking-[-0.02em] [&_h3]:text-brand-ink [&_a]:text-brand-ink [&_a]:underline [&_strong]:font-semibold [&_strong]:text-brand-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-brand-subtle [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-brand-ink [&_blockquote]:pl-3.5 [&_blockquote]:text-brand-ink">
					<SvelteMarkdown source={block.content} />
				</div>
			{/if}
		{/if}
	{/each}

	<SolutionClosingCta
		slot="closing-block"
		index={closingIndex}
		toolName={solution.slug}
		isPillar={solution.isPillar}
	/>
</SolutionPageShell>
