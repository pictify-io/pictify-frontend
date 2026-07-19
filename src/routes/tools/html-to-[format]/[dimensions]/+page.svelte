<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import BasePage from '../+page.svelte';

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

	// All head tags (title, meta, canonical, JSON-LD) come from BasePage, which is
	// dimension-aware via $page.params.dimensions. A second <svelte:head> here
	// produced duplicate conflicting titles/canonicals/schema on variant pages.
</script>

<section>
	<BasePage />
</section>
