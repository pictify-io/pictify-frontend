<script>
	/**
	 * Shell for /solutions/* pages. Wraps the tool scaffold primitives so every
	 * solution page has identical SEO, breadcrumb, and page-chrome boilerplate —
	 * the consumer only provides content inside the default slot and an optional
	 * "faq" slot is replaced by a faqs prop.
	 *
	 * Keeps tool-scaffold components reusable without duplicating their behavior
	 * in /solutions/. Positioning, CTAs, and the "Related solutions" block are
	 * delivered via SolutionClosingCta and a consumer-rendered related list.
	 *
	 * See plan: docs/plans/2026-04-15-003-strategy-automated-images-cluster-plan.md
	 */
	import ToolPageShell from '$lib/components/tools/scaffold/ToolPageShell.svelte';
	import ToolBreadcrumb from '$lib/components/tools/scaffold/ToolBreadcrumb.svelte';
	import ToolSeoHead from '$lib/components/tools/scaffold/ToolSeoHead.svelte';
	import ToolFaq from '$lib/components/tools/scaffold/ToolFaq.svelte';

	// SEO — passed through to ToolSeoHead
	export let title = '';
	export let description = '';
	export let canonical = '';
	export let ogImage = 'https://media.pictify.io/k2oq1-1776144080510.png';
	export let ogImageAlt = '';
	export let ogImageWidth = 1200;
	export let ogImageHeight = 630;

	/** The label that appears third in the breadcrumb and in structured data. */
	export let breadcrumbLabel = '';

	/** WebApplication JSON-LD payload. If omitted, no WebApplication schema is emitted. */
	export let webApplicationSchema = null;

	/** Optional HowTo JSON-LD. Array of { name, text, url? }. */
	export let howToSteps = null;
	export let howToMeta = null;

	/** Optional FAQs rendered via ToolFaq and also emitted as FAQPage JSON-LD. */
	export let faqs = null;

	/** Whether to render the page-level FAQ block in the default place. Consumer can set to false and render their own. */
	export let renderFaq = true;
	export let faqHeading = 'Frequently asked questions';
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
	twitterSite="@pictify_io"
	twitterCreator="@pictify_io"
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

<ToolPageShell>
	<ToolBreadcrumb label={breadcrumbLabel} marginClass="mb-8" parent={{ href: '/solutions', label: 'Solutions' }} />
	<slot />
	{#if renderFaq && faqs && faqs.length > 0}
		<ToolFaq {faqs} heading={faqHeading} />
	{/if}
	<slot name="after-faq" />
</ToolPageShell>
