<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import BasePage from '../+page.svelte';

	$: format = $page.params.format;
	$: dimensions = $page.params.dimensions || '';

	function parseDimensions(dim) {
		const match = (dim || '').toLowerCase().match(/^(\d+)x(\d+)$/);
		if (!match) return { width: null, height: null };
		const width = parseInt(match[1], 10);
		const height = parseInt(match[2], 10);
		if (Number.isNaN(width) || Number.isNaN(height) || width <= 0 || height <= 0) {
			return { width: null, height: null };
		}
		return { width, height };
	}

	$: ({ width, height } = parseDimensions(dimensions));

	// Pre-seed the converter with desired dimensions without changing URL
	if (browser && width && height) {
		try {
			localStorage.setItem('pictify_html_to_image_width', String(width));
			localStorage.setItem('pictify_html_to_image_height', String(height));
		} catch (e) {}
	}
</script>

<svelte:head>
	<title>HTML to {format?.toUpperCase?.() || format} {width && height ? `${width}x${height} ` : ''}Converter | Pictify.io</title>
  <meta name="description" content={width && height
    ? `Convert HTML to ${(format?.toUpperCase?.() || format || 'image')} at ${width}x${height}. Fast, free HTML to image generator by Pictify.io.`
    : `Convert HTML to ${(format?.toUpperCase?.() || format || 'image')} in any size. Fast, free HTML to image generator by Pictify.io.`} />
  <link rel="canonical" href={width && height
    ? `https://pictify.io/tools/html-to-${format}/${width}x${height}`
    : `https://pictify.io/tools/html-to-${format}` } />
	{#if width && height}
	{@html `<script type="application/ld+json">
${JSON.stringify({
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: `HTML to ${String(format).toUpperCase()} ${width}x${height} Converter`,
	url: `https://pictify.io/tools/html-to-${format}/${width}x${height}`,
	description: `Convert HTML to ${String(format).toUpperCase()} at ${width}x${height}.`,
	applicationCategory: "DesignApplication",
	operatingSystem: "Web",
	mainEntity: [
		{
			"@type": "HowTo",
			name: `How to convert HTML to ${String(format).toUpperCase()} (${width}x${height})`,
			step: [
				{ "@type": "HowToStep", text: "Open the HTML to Image converter" },
				{ "@type": "HowToStep", text: "Paste your HTML and set dimensions" },
				{ "@type": "HowToStep", text: "Generate and download the image" }
			]
		}
	]
})}
</script>`}
	{/if}
</svelte:head>

<section>
	<BasePage />
</section>


