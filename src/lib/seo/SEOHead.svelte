<script>
	/**
	 * SEOHead Component
	 * Universal SEO component for consistent meta tags across all pages
	 *
	 * @prop {string} title - Page title
	 * @prop {string} description - Meta description
	 * @prop {string} canonical - Canonical URL
	 * @prop {string[]} [keywords] - Keywords array
	 * @prop {Object} [openGraph] - Open Graph data
	 * @prop {Object} [twitter] - Twitter card data
	 * @prop {Object} [schema] - JSON-LD structured data
	 * @prop {string} [robots] - Robots meta directive
	 * @prop {string} [ogImage] - OG image URL (shorthand)
	 */

	export let title;
	export let description;
	export let canonical;
	export let keywords = [];
	export let openGraph = null;
	export let twitter = null;
	export let schema = null;
	export let robots = 'index, follow';
	export let ogImage = 'https://media.pictify.io/v3g37-1775406808141.png';

	// Defaults for Open Graph
	$: og = {
		title: title,
		description: description,
		url: canonical,
		type: 'website',
		image: ogImage,
		siteName: 'Pictify',
		...openGraph
	};

	// Defaults for Twitter Card
	$: tw = {
		card: 'summary_large_image',
		title: title,
		description: description,
		image: ogImage,
		...twitter
	};

	// Serialize schema for safe HTML embedding
	function serializeSchema(data) {
		if (!data) return '';
		return JSON.stringify(data, null, 0)
			.replace(/</g, '\\u003c')
			.replace(/>/g, '\\u003e')
			.replace(/&/g, '\\u0026');
	}
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content={robots} />

	{#if keywords.length > 0}
		<meta name="keywords" content={keywords.join(', ')} />
	{/if}

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={og.type} />
	<meta property="og:url" content={og.url} />
	<meta property="og:title" content={og.title} />
	<meta property="og:description" content={og.description} />
	<meta property="og:image" content={og.image} />
	<meta property="og:site_name" content={og.siteName} />

	<!-- Twitter -->
	<meta name="twitter:card" content={tw.card} />
	<meta name="twitter:url" content={canonical} />
	<meta name="twitter:title" content={tw.title} />
	<meta name="twitter:description" content={tw.description} />
	<meta name="twitter:image" content={tw.image} />

	<!-- JSON-LD Structured Data -->
	{#if schema}
		{@html `<script type="application/ld+json">${serializeSchema(schema)}</script>`}
	{/if}
</svelte:head>
