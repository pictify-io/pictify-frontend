<script>
	/**
	 * SEO head for /tools/* pages.
	 *
	 * Renders <svelte:head> with:
	 *   - Always: <title>, meta description, canonical, WebApplication JSON-LD.
	 *   - Always (but small — only if prop is non-empty): og/twitter title/description/url/image.
	 *   - Opt-in (only when the corresponding prop is set):
	 *       * robots meta (richerSeo = true)
	 *       * og:site_name, twitter:site, twitter:creator (richerSeo = true)
	 *       * og:image:width/height/alt, twitter:image:alt (richerSeo = true)
	 *       * FAQPage JSON-LD (faqs prop)
	 *       * BreadcrumbList JSON-LD (breadcrumbLabel prop)
	 *       * HowTo JSON-LD (howToSteps prop)
	 *
	 * Why opt-in: cert-gen and online-invoice ship today with leaner SEO (no robots,
	 * no image dimensions, invoice has no FAQ/breadcrumb schema). Opt-in defaults
	 * mean this component can be introduced without silently upgrading their rankings
	 * surface — which could churn current rankings. A separate Step-5 PR in the
	 * scaffold plan explicitly enables the richer stack on those pages.
	 *
	 * See plan: docs/plans/2026-04-15-002-refactor-tool-scaffold-plan.md
	 */

	// Always-emitted props
	export let title = '';
	export let description = '';
	export let canonical = '';

	// OG/Twitter — the URL + title + description + image are always emitted if provided.
	export let ogTitle = '';
	export let ogDescription = '';
	export let ogImage = '';
	export let twitterTitle = '';
	export let twitterDescription = '';
	export let twitterImage = '';

	// Legacy keywords meta — opt-in because Google ignores it and newer pages omit it.
	// Kept for backwards compat while cert-gen/invoice still emit it today.
	export let keywords = '';

	// Richer SEO opt-ins (per-tag)
	export let robots = '';                 // e.g. "index,follow,max-image-preview:large,max-snippet:-1"
	export let ogSiteName = '';             // e.g. "Pictify"
	export let twitterSite = '';            // e.g. "@pictify_io"
	export let twitterCreator = '';         // e.g. "@pictify_io"
	export let ogImageWidth = null;         // number
	export let ogImageHeight = null;        // number
	export let ogImageAlt = '';
	export let twitterImageAlt = '';

	// JSON-LD schema props — each emits its script tag only when non-empty/truthy.
	/**
	 * WebApplication schema. Pass the full object (consumer controls shape exactly)
	 * to preserve existing per-page schemas byte-identically. Must be a plain JS object.
	 */
	export let webApplicationSchema = null;
	/**
	 * FAQs for FAQPage schema. Array of { q, a }. Emits only when at least one entry.
	 */
	export let faqs = null;
	/**
	 * Label for the third breadcrumb item (the current page). Home → Tools → label.
	 * When set, emits BreadcrumbList JSON-LD.
	 */
	export let breadcrumbLabel = '';
	/**
	 * Parent breadcrumb (position 2 in the BreadcrumbList). Tools pages default
	 * to "Tools" / "/tools"; solutions pages pass "Solutions" / "/solutions" so
	 * Google sees the correct structural trail.
	 */
	export let breadcrumbParentLabel = 'Tools';
	export let breadcrumbParentPath = '/tools';
	/**
	 * Array of HowTo steps. Each: { name, text, url? }. Plus optional overall meta
	 * via `howToMeta` prop. Emits HowTo JSON-LD when at least one step.
	 */
	export let howToSteps = null;
	export let howToMeta = null; // { name, description, totalTime, supply, tool }

	// Root URL used for the BreadcrumbList items. Derived from canonical when absent.
	function rootFromCanonical(c) {
		try {
			const u = new URL(c);
			return `${u.protocol}//${u.host}`;
		} catch {
			return 'https://pictify.io';
		}
	}

	$: _webAppJson = webApplicationSchema ? JSON.stringify(webApplicationSchema) : '';
	$: _faqJson =
		Array.isArray(faqs) && faqs.length > 0
			? JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: faqs.map((f) => ({
						'@type': 'Question',
						name: f.q,
						acceptedAnswer: { '@type': 'Answer', text: f.a }
					}))
				})
			: '';
	$: _breadcrumbJson = breadcrumbLabel
		? JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: `${rootFromCanonical(canonical)}/` },
					{
						'@type': 'ListItem',
						position: 2,
						name: breadcrumbParentLabel,
						item: `${rootFromCanonical(canonical)}${breadcrumbParentPath}`
					},
					{ '@type': 'ListItem', position: 3, name: breadcrumbLabel }
				]
			})
		: '';
	$: _howToJson =
		Array.isArray(howToSteps) && howToSteps.length > 0
			? JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'HowTo',
					...(howToMeta || {}),
					step: howToSteps.map((s, i) => ({
						'@type': 'HowToStep',
						position: i + 1,
						name: s.name,
						text: s.text,
						...(s.url ? { url: s.url } : {})
					}))
				})
			: '';
</script>

<svelte:head>
	{#if title}<title>{title}</title>{/if}
	{#if description}<meta name="description" content={description} />{/if}
	{#if keywords}<meta name="keywords" content={keywords} />{/if}
	{#if canonical}<link rel="canonical" href={canonical} />{/if}

	{#if robots}<meta name="robots" content={robots} />{/if}

	{#if ogSiteName}<meta property="og:site_name" content={ogSiteName} />{/if}
	{#if ogTitle}<meta property="og:title" content={ogTitle} />{/if}
	{#if ogDescription}<meta property="og:description" content={ogDescription} />{/if}
	{#if canonical}<meta property="og:url" content={canonical} />{/if}
	<meta property="og:type" content="website" />
	{#if ogImage}<meta property="og:image" content={ogImage} />{/if}
	{#if ogImageWidth}<meta property="og:image:width" content={String(ogImageWidth)} />{/if}
	{#if ogImageHeight}<meta property="og:image:height" content={String(ogImageHeight)} />{/if}
	{#if ogImageAlt}<meta property="og:image:alt" content={ogImageAlt} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	{#if twitterSite}<meta name="twitter:site" content={twitterSite} />{/if}
	{#if twitterCreator}<meta name="twitter:creator" content={twitterCreator} />{/if}
	{#if twitterTitle}<meta name="twitter:title" content={twitterTitle} />{/if}
	{#if twitterDescription}<meta name="twitter:description" content={twitterDescription} />{/if}
	{#if twitterImage}<meta name="twitter:image" content={twitterImage} />{/if}
	{#if twitterImageAlt}<meta name="twitter:image:alt" content={twitterImageAlt} />{/if}

	{#if _webAppJson}
		{@html `<script type="application/ld+json">${_webAppJson}</script>`}
	{/if}
	{#if _faqJson}
		{@html `<script type="application/ld+json">${_faqJson}</script>`}
	{/if}
	{#if _breadcrumbJson}
		{@html `<script type="application/ld+json">${_breadcrumbJson}</script>`}
	{/if}
	{#if _howToJson}
		{@html `<script type="application/ld+json">${_howToJson}</script>`}
	{/if}
</svelte:head>
