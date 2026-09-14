<script>
	/**
	 * Shell for /solutions/* pages: identical SEO head, breadcrumb and page
	 * chrome for every guide, on the v2 tool frame.
	 *
	 * The consumer passes the hero through the `h1`, `hero-sub` and
	 * `hero-actions` slots, the guide's blocks through the default slot, and the
	 * closing block through `closing-block`. The FAQ is rendered here from the
	 * `faqs` prop so the visible answers and the FAQPage JSON-LD come from the
	 * same array.
	 *
	 * The tool furniture (signup card, related tool rows, the "this tool, on an
	 * account" band) is off: a guide sells a workflow, not a tool.
	 */
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';

	// SEO — passed through to ToolSeoHead
	export let title = '';
	export let description = '';
	export let canonical = '';
	export let ogImage = 'https://pictify.io/og/v2/solutions.png';
	export let ogImageAlt = '';
	export let ogImageWidth = 1200;
	export let ogImageHeight = 630;

	/** The label that appears last in the breadcrumb and in structured data. */
	export let breadcrumbLabel = '';
	/** Short mono line under the hero copy (the guide's eyebrow). */
	export let eyebrow = '';

	/** WebApplication JSON-LD payload. If omitted, no WebApplication schema is emitted. */
	export let webApplicationSchema = null;

	/** Optional HowTo JSON-LD. Array of { name, text, url? }. */
	export let howToSteps = null;
	export let howToMeta = null;

	/** Optional FAQs rendered as a FaqList and also emitted as FAQPage JSON-LD. */
	export let faqs = null;

	/** Whether to render the page-level FAQ block in the default place. */
	export let renderFaq = true;
	export let faqHeading = 'Frequently asked questions';
	/** Section number shown beside the FAQ heading. */
	export let faqIndex = '';

	$: crumbs = [
		{ label: 'SOLUTIONS', href: '/solutions' },
		{ label: String(breadcrumbLabel || '').toUpperCase() }
	];
</script>

<ToolSeoHead
	{title}
	{description}
	{canonical}
	robots="index,follow,max-image-preview:large,max-snippet:-1"
	ogSiteName="Pictify"
	ogTitle={title}
	ogDescription={description}
	{ogImage}
	{ogImageAlt}
	{ogImageWidth}
	{ogImageHeight}
	twitterTitle={title}
	twitterDescription={description}
	twitterImage={ogImage}
	twitterImageAlt={ogImageAlt}
	{webApplicationSchema}
	{faqs}
	{breadcrumbLabel}
	breadcrumbParentLabel="Solutions"
	breadcrumbParentPath="/solutions"
	{howToSteps}
	{howToMeta}
/>

<ToolPageShell
	{crumbs}
	facts={eyebrow ? String(eyebrow).toUpperCase() : ''}
	longform="column"
	showSignup={false}
	showRelated={false}
	showClosing={false}
>
	<svelte:fragment slot="h1"><slot name="h1" /></svelte:fragment>
	<svelte:fragment slot="hero-sub"><slot name="hero-sub" /></svelte:fragment>
	<svelte:fragment slot="hero-actions"><slot name="hero-actions" /></svelte:fragment>

	<svelte:fragment slot="longform">
		<slot />

		<slot name="closing-block" />

		{#if renderFaq && faqs && faqs.length > 0}
			<LongformSection index={faqIndex} id="faq" title={faqHeading}>
				<FaqList {faqs} />
			</LongformSection>
		{/if}

		<slot name="after-faq" />
	</svelte:fragment>
</ToolPageShell>
