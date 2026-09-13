<script>
	/**
	 * /tools/online-invoice-generator — the v2 tool page, column mode.
	 *
	 * Form and preview become the tool card's two columns; the quota ladder and
	 * Generate move into its toolbar. SEO copy is frozen.
	 */
	import InvoiceTemplate from '$lib/components/tools/InvoiceTemplate.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { getTemplates, getTemplate } from '../../../api/tools/invoice.js';
	import { onMount } from 'svelte';
	import { user } from '../../../store/user.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import ToolEditor from '$lib/components/tools/ToolEditor.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { analytics } from '$lib/telemetry.js';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';

	// User login state
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData?.email;
	});

	/*
	 * An invoice is a document, so the canvas is portrait A4 at 96 dpi and PDF
	 * is the first format chip — the thing people actually send.
	 */
	const A4_PORTRAIT_WIDTH = 794;
	const A4_PORTRAIT_HEIGHT = 1123;

	/*
	 * The gallery. Names are derived from the filenames, as with the OG set —
	 * the templates endpoint returns names only and there is no metadata beside
	 * the files, so the panel says "Template 2" rather than inventing one.
	 */
	$: editorTemplates = templates
		.map((html, i) => ({
			key: templateNames[i] || `t${i}`,
			name: `Template ${String(templateNames[i] || '').replace(/[^0-9]/g, '') || i + 1}`,
			category: null,
			html
		}))
		.filter((t) => t.html);

	/** The longform gallery deep-links into the editor rather than a dead picker. */
	const openTemplateInEditor = (index) => {
		const key = templateNames[index];
		if (key) goto(`?template=${encodeURIComponent(key)}`, { noScroll: true, keepFocus: true });
		document.querySelector('[slot="tool"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	/** One release of escape hatch, the same lever the other tools use. */
	$: useLegacyTool = $page?.url?.searchParams?.get?.('studio') === 'v1';

	let templates = [];
	let templateNames = [];
	let selectedTemplate = '';
	let imageUrl = '';

	let previewContainerWidth = 500;



	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify.io Online Invoice Generator',
		url: 'https://pictify.io/tools/online-invoice-generator',
		description:
			'Create custom invoices to streamline your billing process and maintain a professional image.',
		applicationCategory: ['BusinessApplication', 'Utility'],
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		}
	};

	const invoiceFaqs = [
		{
			q: 'How do I use this invoice generator?',
			a: 'Simply fill in your company and client details, add invoice items, select a template, and click "Generate Invoice". You can then download your professional invoice.'
		},
		{
			q: 'Is this invoice generator free to use?',
			a: 'Yes, our online invoice generator is completely free to use. Create and download as many invoices as you need without any cost.'
		},
		{
			q: 'Can I customize the invoice template?',
			a: 'You can choose from a variety of professional designs. Each template can be populated with your specific invoice details.'
		},
		{
			q: 'Are the generated invoices legally compliant?',
			a: 'Our templates include standard elements required for most invoices. Please check your local regulations for specific requirements.'
		}
	];

	// Function to calculate iframe scale based on container width
	function calculateScale(containerWidth) {
		// Invoice is 800px wide, scale to fit container with some padding
		const padding = 0; // No padding needed
		const availableWidth = containerWidth - padding;
		const scale = Math.min(availableWidth / 800, 1); // Max scale of 1
		return Math.max(scale, 0.25); // Min scale of 0.25
	}



	$: iframeScale = calculateScale(previewContainerWidth);

	onMount(async () => {
		// Track tool opened
		analytics.trackToolOpened({ tool_name: 'online_invoice_generator' });

		templateNames = await getTemplates();
		/*
		 * Assigned, not pushed. `templates.push(...)` mutates the array without
		 * telling Svelte, so anything derived from `templates` — the editor's
		 * gallery — never recomputed and the canvas stayed empty. Fetched in
		 * parallel while we are here; four sequential round trips was four times
		 * the wait for no reason.
		 */
		templates = await Promise.all(templateNames.map((name) => getTemplate(name)));
		if (templates.length > 0) {
			const requestedTemplate = $page?.url?.searchParams?.get?.('template');
			if (requestedTemplate) {
				const idx = templateNames.indexOf(requestedTemplate);
				selectedTemplate = idx >= 0 ? templates[idx] : templates[0];
			} else {
				selectedTemplate = templates[0];
			}
		}
	});



	const TOOL_NAME = 'online_invoice_generator';
	const TOOL_PATH = '/tools/online-invoice-generator';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));
	$: lastFreeRender = !isUserLoggedIn && guestRemaining <= 1;

	const invoiceExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'invoice.js',
			code: `<span class="text-[#6a9955]">// Render an invoice image from your own HTML template</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>, <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>: <span class="text-[#9cdcfe]">invoiceHtml</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">800</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">'pdf'</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// email or store the invoice</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'invoice.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">invoice_html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">800</span>, <span class="text-[#ce9178]">"fileExtension"</span>: <span class="text-[#ce9178]">"pdf"</span>})

<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'curl',
			label: 'cURL',
			fileName: 'invoice.sh',
			code: `<span class="text-[#dcdcaa]">curl</span> -X POST <span class="text-[#ce9178]">https://api.pictify.io/image</span> \\
  -H <span class="text-[#ce9178]">"Content-Type: application/json"</span> \\
  -H <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span> \\
  -d <span class="text-[#ce9178]">'{"html":"&lt;div&gt;INVOICE ...&lt;/div&gt;","width":800,"fileExtension":"pdf"}'</span>`
		}
	];

</script>

<ToolSeoHead
	title="Free Online Invoice Generator | Pictify.io"
	description="Create professional invoices for free with Pictify.io's Online Invoice Generator. Customize templates, add your branding, and generate invoices in seconds."
	keywords="invoice generator, free invoice, online invoice, business tools"
	canonical="https://pictify.io/tools/online-invoice-generator"
	ogTitle="Online Invoice Generator | Pictify.io"
	ogDescription="Create custom invoices to streamline your billing process and maintain a professional image."
	ogImage="https://pictify.io/og/tools/online-invoice-generator.png"
	twitterSite="@pictify_io"
	twitterTitle="Online Invoice Generator | Pictify.io"
	twitterDescription="Create custom invoices to streamline your billing process and maintain a professional image."
	twitterImage="https://pictify.io/og/tools/online-invoice-generator.png"
	webApplicationSchema={structuredData}
	faqs={invoiceFaqs}
	breadcrumbLabel="Online Invoice Generator"
/>

<!-- The editor raises toasts for render and quota failures; without this
     they set the store and nothing appears. -->
<Toast />

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="INVOICE GENERATOR"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · PNG OR PDF"
	loggedIn={isUserLoggedIn}
	hasResult={!!imageUrl}
	longform="column"
>
	<HeroTitle slot="h1">
		<span>INVOICE</span>
		<span>GENERATOR</span>
	</HeroTitle>

	<HeroSub slot="hero-sub">
		Create <span class="font-medium">professional invoices</span> for your business.
		<span class="text-brand-slate">Free, customizable templates with real-time preview</span>
	</HeroSub>

	<div slot="tool">
		<!-- TS-8. Edited in place on the shared embed. `?studio=v1` for one release. -->
		{#if useLegacyTool}
			<ToolCard>
				<p class="p-6 font-sans text-[13.5px] leading-[19px] text-brand-slate">
					The classic generator has been replaced by the editor.
					<a href="?" class="text-brand-royal underline">Open it</a>.
				</p>
			</ToolCard>
		{:else if editorTemplates.length}
			<ToolEditor
				templates={editorTemplates}
				width={A4_PORTRAIT_WIDTH}
				height={A4_PORTRAIT_HEIGHT}
				sourceKind="invoice"
				toolName="online_invoice_generator"
				downloadName="invoice"
				defaultTab="inputs"
				formats={['pdf', 'png']}
			/>
		{:else}
			<div
				class="flex h-[560px] items-center justify-center rounded-[12px] border-[1.5px] border-brand-ink bg-brand-paper"
			>
				<p class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
					Loading the editor…
				</p>
			</div>
		{/if}
	</div>

	<div slot="result">
		{#if imageUrl}
			<ResultCard
				{imageUrl}
				formatLabel="PNG"
				fileExtension="png"
				width={800}
				height={null}
				loggedIn={isUserLoggedIn}
				lastFree={lastFreeRender}
				toolName={TOOL_NAME}
				toolPath={TOOL_PATH}
			/>
		{/if}
	</div>

	<AutomateSection
		slot="automate"
		title="Automate with the"
		titleHighlight="API"
		toolName={TOOL_NAME}
		description="Generate invoices programmatically. Render any invoice HTML to an image or PDF with one POST — wire it into billing, receipts, and order confirmations."
		codeExamples={invoiceExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="templates" first title="INVOICE TEMPLATES">
			<div class="mt-12 sm:mt-16">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each templates as template}
						<button
							class="relative bg-brand-paper border-[1.5px] {selectedTemplate === template
								? 'border-brand-danger'
								: 'border-black'} p-3 overflow-hidden transition-all cursor-pointer"
							on:click={() => openTemplateInEditor(templates.indexOf(template))}
						>
							{#if selectedTemplate === template}
								<div
									class="absolute top-2 right-2 z-10 w-6 h-6 bg-brand-pink border border-brand-ink flex items-center justify-center"
								>
									<span class="text-white font-semibold text-sm">✓</span>
								</div>
							{/if}
							<div class="pointer-events-none">
								<InvoiceTemplate
									html={template}
									width={800}
									height={800}
									scale={iframeScale * 0.5}
								/>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</LongformSection>

		<LongformSection index="02" id="what-is" title="What is an Online Invoice Generator?">
			<Prose>
				<p>
					An online invoice generator is a powerful tool that allows businesses and freelancers to
					create professional invoices quickly and easily. It streamlines the billing process, helps
					maintain accurate financial records, and presents a polished image to clients.
				</p>
			</Prose>
		</LongformSection>

		<LongformSection index="03" id="benefits" title="Benefits of Using Our Invoice Generator">
			<FeatureGrid
				columns={2}
				items={[
					{ title: 'Create professional invoices in minutes' },
					{ title: 'Customize templates to match your brand' },
					{ title: 'Automate calculations for taxes and totals' },
					{ title: 'Save time on billing and bookkeeping' },
					{ title: 'Access your invoices from anywhere' },
					{ title: 'Improve cash flow with accurate billing' }
				]}
			/>
		</LongformSection>

		<LongformSection index="04" id="how-to" title="How to Use Our Invoice Generator">
			<!-- These six were plain numbered lines, not headings. -->
			<StepCards
				titleTag="p"
				steps={[
					{ title: 'Enter your company and client details' },
					{ title: 'Choose from our professional invoice templates' },
					{ title: 'Add line items for products or services' },
					{ title: 'Set tax rates and discounts if applicable' },
					{ title: 'Preview your invoice in real-time' },
					{ title: 'Generate and download your custom invoice' }
				]}
			/>
		</LongformSection>

		<LongformSection index="05" id="faq" title="Frequently Asked Questions">
			<FaqList faqs={invoiceFaqs} />
		</LongformSection>
	</svelte:fragment>

</ToolPageShell>
