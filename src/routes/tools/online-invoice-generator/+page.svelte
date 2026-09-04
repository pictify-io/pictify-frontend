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
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { getTemplates, getTemplate } from '../../../api/tools/invoice.js';
	import { onMount } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import { user } from '../../../store/user.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { page } from '$app/stores';
	import { analytics } from '$lib/telemetry.js';
	import ToolSeoHead from '$lib/components/tools/v2/ToolSeoHead.svelte';
	import HeroTitle from '$lib/components/tools/v2/longform/HeroTitle.svelte';
	import HeroSub from '$lib/components/tools/v2/longform/HeroSub.svelte';
	import Prose from '$lib/components/tools/v2/longform/Prose.svelte';
	import FeatureGrid from '$lib/components/tools/v2/longform/FeatureGrid.svelte';
	import StepCards from '$lib/components/tools/v2/longform/StepCards.svelte';
	import FaqList from '$lib/components/tools/v2/longform/FaqList.svelte';
	import RelatedLinks from '$lib/components/tools/v2/longform/RelatedLinks.svelte';

	// User login state
	let isUserLoggedIn = false;
	user.subscribe((userData) => {
		isUserLoggedIn = !!userData?.email;
	});

	let templates = [];
	let templateNames = [];
	let selectedTemplate = '';
	let total = 0;
	let imageUrl = '';
	let isImageGenerating = false;
	let logo;
	let invoiceData = {
		companyName: '',
		companyAddress: '',
		clientName: '',
		clientAddress: '',
		invoiceNumber: '',
		invoiceDate: '',
		dueDate: '',
		items: [{ description: '', quantity: 1, price: 0 }],
		notes: '',
		logo: '',
		taxRate: 0
	};

	let invoiceTemplateWrapper;
	let windowWidth;
	let previewContainerWidth = 500;

	function buildCurlSnippetFromHtml(html, width, height) {
		const payload = {
			html: String(html || ''),
			width: Number(width) || 800,
			height: Number(height) || 1200
		};
		return `curl -X POST https://api.pictify.io/image \\\\\n  -H "Content-Type: application/json" \\\\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\\\n  -d '${JSON.stringify(
			payload,
			null,
			2
		)}'`;
	}

	function getCurrentInvoiceHtml() {
		try {
			const iframe = invoiceTemplateWrapper?.querySelector?.('iframe');
			return iframe?.contentWindow?.document?.documentElement?.outerHTML || '';
		} catch (e) {
			return '';
		}
	}

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

	function sharePage(platform) {
		const url = encodeURIComponent(window.location.href);
		const text = encodeURIComponent('Check out this awesome Invoice Generator!');
		if (platform === 'twitter') {
			window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
		} else if (platform === 'linkedin') {
			window.open(
				`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent(
					'Invoice Generator'
				)}&summary=${text}`,
				'_blank'
			);
		}
	}

	function copyToClipboard(text, contentType = 'image_url') {
		navigator.clipboard.writeText(text).then(() => {
			analytics.trackCopy({
				content_type: contentType,
				context: 'tool_result',
				tool_name: 'online_invoice_generator'
			});
			toast.set({ message: 'Copied to clipboard !!', type: 'success', duration: 1500 });
		});
	}

	$: iframeScale = calculateScale(previewContainerWidth);

	onMount(async () => {
		// Track tool opened
		analytics.trackToolOpened({ tool_name: 'online_invoice_generator' });

		templateNames = await getTemplates();
		for (const template of templateNames) {
			const html = await getTemplate(template);
			templates.push(html);
		}
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

	function addItem() {
		invoiceData.items = [...invoiceData.items, { description: '', quantity: 1, price: 0 }];
	}

	function removeItem(index) {
		invoiceData.items = invoiceData.items.filter((_, i) => i !== index);
	}

	function calculateTotal() {
		return (
			invoiceData.items.reduce((total, item) => total + item.quantity * item.price, 0) +
			(invoiceData.taxRate > 0
				? (invoiceData.items.reduce((total, item) => total + item.quantity * item.price, 0) *
						invoiceData.taxRate) /
				  100
				: 0)
		);
	}

	function updateLogo(event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				invoiceData.logo = e.target.result;
				updateHTML(selectedTemplate);
			};
			reader.readAsDataURL(file);
		}
	}

	async function generateInvoice() {
		// Track generation in global limits store
		generationLimits.increment();
		isImageGenerating = true;

		const iframe = invoiceTemplateWrapper?.querySelector('iframe');
		const doc = iframe?.contentWindow?.document;
		if (!doc?.documentElement) {
			isImageGenerating = false;
			toast.set({
				message: 'Preview is still loading. Please try again.',
				type: 'error',
				duration: 3000
			});
			return;
		}
		let html = doc.documentElement.outerHTML;

		// No guest watermark: the toolbar promises NO WATERMARK.

		try {
			const { image } = await createImagePublic({
				html,
				width: 800
			});
			imageUrl = image.url;

			// Track successful invoice generation
			analytics.trackImageGenerated({
				tool_name: 'online_invoice_generator',
				format: 'png',
				with_watermark: !isUserLoggedIn
			});
		} catch (error) {
			toast.set({
				message: 'Failed to generate invoice. Please try again.',
				type: 'error',
				duration: 3000
			});
		}
		isImageGenerating = false;
	}

	function updateTemplate(template) {
		selectedTemplate = template;
		updateHTML(selectedTemplate);
		// Here you would update the invoice preview based on the selected template
	}

	function updateHTML(html) {
		if (!invoiceTemplateWrapper) {
			return;
		}
		const iframe = invoiceTemplateWrapper.querySelector('iframe');

		const document = iframe?.contentWindow?.document;
		// document.body is null until the srcdoc parses; a missing template node
		// should degrade to a skipped write, not a thrown TypeError.
		if (!document?.body) return;
		const companyName = document.querySelector('#company-name');
		const companyAddress = document.querySelector('#company-address');
		const clientName = document.querySelector('#client-name');
		const clientAddress = document.querySelector('#client-address');
		const invoiceNumber = document.querySelector('#invoice-number');
		const invoiceDate = document.querySelector('#invoice-date');
		const dueDate = document.querySelector('#due-date');
		const items = document.querySelector('#line-items');
		const notes = document.querySelector('#additional-notes');
		const taxAmount = document.querySelector('#tax-amount');
		const subtotal = document.querySelector('#subtotal');

		const logo = document.querySelector('.logo');
		const itemsHTML = invoiceData.items
			.map((item) => {
				return `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>$${item.price?.toFixed(2) || 0}</td>
          <td>$${(item.quantity * (item.price || 0)).toFixed(2)}</td>
        </tr>
      `;
			})
			.join('');
		if (companyName) companyName.innerHTML = invoiceData.companyName || '';
		if (companyAddress) companyAddress.innerHTML = invoiceData.companyAddress || '';
		if (clientName) clientName.innerHTML = invoiceData.clientName || '';
		if (clientAddress) clientAddress.innerHTML = invoiceData.clientAddress || '';
		if (invoiceNumber) invoiceNumber.innerHTML = invoiceData.invoiceNumber || '';
		if (invoiceDate) invoiceDate.innerHTML = invoiceData.invoiceDate || '';
		if (dueDate) dueDate.innerHTML = invoiceData.dueDate || '';
		if (items) items.innerHTML = `<tbody id="line-items">${itemsHTML}</tbody>`;
		if (notes) notes.innerHTML = invoiceData.notes || '';

		if (logo?.parentNode) {
			const updatedLogo = document.createElement('img');
			updatedLogo.src = invoiceData.logo;
			updatedLogo.classList.add('logo');
			logo.parentNode.replaceChild(updatedLogo, logo);
		}

		total = calculateTotal();
		const tax = (total * invoiceData.taxRate) / 100;
		const totalElement = document.querySelector('#total-amount');
		if (totalElement) totalElement.innerHTML = `$${total.toFixed(2)}`;
		if (taxAmount) taxAmount.innerHTML = `$${tax.toFixed(2)}`;
		if (subtotal)
			subtotal.innerHTML = `$${invoiceData.items
				.reduce((total, item) => total + item.quantity * item.price, 0)
				.toFixed(2)}`;
		html = document.documentElement.outerHTML;
	}

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

	const RELATED = ['csv-to-pdf', 'certificate-generator', 'table'];
</script>

<ToolSeoHead
	title="Free Online Invoice Generator | Pictify.io"
	description="Create professional invoices for free with Pictify.io's Online Invoice Generator. Customize templates, add your branding, and generate invoices in seconds."
	keywords="invoice generator, free invoice, online invoice, business tools"
	canonical="https://pictify.io/tools/online-invoice-generator"
	ogTitle="Online Invoice Generator | Pictify.io"
	ogDescription="Create custom invoices to streamline your billing process and maintain a professional image."
	ogImage="https://media.pictify.io/qyl7z-1775406830860.png"
	twitterSite="@pictify_io"
	twitterTitle="Online Invoice Generator | Pictify.io"
	twitterDescription="Create custom invoices to streamline your billing process and maintain a professional image."
	twitterImage="https://media.pictify.io/qyl7z-1775406830860.png"
	webApplicationSchema={structuredData}
	faqs={invoiceFaqs}
	breadcrumbLabel="Online Invoice Generator"
/>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="INVOICE GENERATOR"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · PNG OR PDF"
	related={RELATED}
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
		<ToolCard>
			<div class="grid grid-cols-1 items-start gap-6 p-5 lg:grid-cols-2 lg:gap-8 lg:p-7">
				<div class="bg-brand-paper border border-brand-ink overflow-hidden">
					<!-- Panel header. A chrome label, so it is a <p> (D2). -->
					<div class="flex items-center gap-2 border-b border-brand-ink bg-brand-press px-4 py-2.5">
						<p class="font-mono text-xs tracking-[0.06em] text-white">
							<span class="animate-pulse">_</span> INVOICE DETAILS
						</p>
					</div>

					<div class="p-4 sm:p-6 space-y-4">
						<!-- Company Section -->
						<div class="space-y-3">
							<p
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-ink"
							>
								<span
									class="w-6 h-6 bg-brand-field border border-brand-ink flex items-center justify-center text-xs"
									>1</span
								>
								Your Company
							</p>
							<input
								bind:value={invoiceData.companyName}
								type="text"
								class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none"
								placeholder="Company Name"
								on:input={updateHTML(selectedTemplate)}
							/>
							<div class="relative">
								<input
									type="file"
									class="w-full border border-brand-ink p-3 font-bold text-sm file:mr-4 file:py-1 file:px-3 file:border-[2px] file:border-black file:bg-brand-field file:font-bold file:text-brand-ink file:text-xs file: cursor-pointer"
									accept="image/*"
									on:change={updateLogo}
								/>
							</div>
							<textarea
								bind:value={invoiceData.companyAddress}
								class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none resize-none"
								placeholder="Company Address"
								rows="2"
								on:input={updateHTML(selectedTemplate)}
							/>
						</div>

						<!-- Client Section -->
						<div class="space-y-3">
							<p
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-ink"
							>
								<span
									class="w-6 h-6 bg-data-sky border border-brand-ink flex items-center justify-center text-xs text-white"
									>2</span
								>
								Client Info
							</p>
							<input
								bind:value={invoiceData.clientName}
								type="text"
								class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none"
								placeholder="Client Name"
								on:input={updateHTML(selectedTemplate)}
							/>
							<textarea
								bind:value={invoiceData.clientAddress}
								class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none resize-none"
								placeholder="Client Address"
								rows="2"
								on:input={updateHTML(selectedTemplate)}
							/>
						</div>

						<!-- Invoice Details -->
						<div class="space-y-3">
							<p
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-ink"
							>
								<span
									class="w-6 h-6 bg-data-violet border border-brand-ink flex items-center justify-center text-xs text-white"
									>3</span
								>
								Invoice Details
							</p>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<input
									bind:value={invoiceData.invoiceNumber}
									type="text"
									class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none"
									placeholder="Invoice #"
									on:input={updateHTML(selectedTemplate)}
								/>
								<input
									bind:value={invoiceData.invoiceDate}
									type="date"
									class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none"
									on:input={updateHTML(selectedTemplate)}
								/>
								<input
									bind:value={invoiceData.dueDate}
									type="date"
									class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none"
									on:input={updateHTML(selectedTemplate)}
								/>
							</div>
						</div>

						<!-- Line Items -->
						<div class="space-y-3">
							<p
								class="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-ink"
							>
								<span
									class="w-6 h-6 bg-brand-pink border border-brand-ink flex items-center justify-center text-xs text-white"
									>4</span
								>
								Line Items
							</p>
							{#each invoiceData.items as item, index}
								<div class="flex flex-wrap gap-2">
									<input
										bind:value={item.description}
										type="text"
										class="flex-grow min-w-[120px] border border-brand-ink p-2 font-bold text-sm transition-all outline-none"
										placeholder="Description"
										on:input={updateHTML(selectedTemplate)}
									/>
									<input
										bind:value={item.quantity}
										type="number"
										class="w-16 border border-brand-ink p-2 font-bold text-sm text-center transition-all outline-none"
										placeholder="Qty"
										on:input={updateHTML(selectedTemplate)}
									/>
									<input
										bind:value={item.price}
										type="number"
										class="w-20 border border-brand-ink p-2 font-bold text-sm text-center transition-all outline-none"
										placeholder="Price"
										on:input={updateHTML(selectedTemplate)}
									/>
									<button
										on:click={() => removeItem(index)}
										class="w-10 h-10 bg-brand-pink border border-brand-ink text-white font-semibold flex items-center justify-center transition-all"
									>
										×
									</button>
								</div>
							{/each}
							<button
								on:click={addItem}
								class="px-4 py-2 bg-brand-ink text-white border border-brand-ink font-bold text-xs tracking-wider transition-all flex items-center gap-2"
							>
								<span>+</span> Add Item
							</button>
						</div>

						<!-- Tax & Notes -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label class="block text-xs font-semibold text-brand-ink tracking-wider mb-2"
									>Tax Rate (%)</label
								>
								<input
									bind:value={invoiceData.taxRate}
									type="number"
									class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none"
									placeholder="0"
									on:input={updateHTML(selectedTemplate)}
								/>
							</div>
							<div class="flex items-end">
								<div class="w-full p-4 bg-brand-pink text-white border border-brand-ink">
									<span class="text-xs font-semibold tracking-wider block">Total</span>
									<span class="text-2xl font-semibold">${total.toFixed(2)}</span>
								</div>
							</div>
						</div>

						<textarea
							bind:value={invoiceData.notes}
							class="w-full border border-brand-ink p-3 font-bold text-sm transition-all outline-none resize-none"
							placeholder="Additional Notes..."
							rows="2"
							on:input={updateHTML(selectedTemplate)}
						/>
					</div>
				</div>
				<div class="flex flex-col gap-4">
					<div class="bg-brand-paper border border-brand-ink overflow-hidden">
						<!-- Preview Header -->
						<div
							class="bg-[#e5e7eb] px-4 py-2 border-b border-brand-ink flex items-center justify-between"
						>
							<span class="font-mono text-xs font-bold tracking-wider">LIVE PREVIEW</span>
							<div class="flex gap-1">
								<div class="w-2 h-2 bg-brand-ink" />
								<div class="w-2 h-2 bg-brand-ink" />
								<div class="w-2 h-2 bg-brand-ink" />
							</div>
						</div>
						<div
							bind:this={invoiceTemplateWrapper}
							bind:clientWidth={previewContainerWidth}
							class="overflow-hidden bg-brand-paper flex justify-center"
						>
							<InvoiceTemplate
								html={selectedTemplate}
								width={800}
								height={1200}
								scale={iframeScale}
							/>
						</div>
					</div>
					{#if isImageGenerating}
						<div class="bg-brand-paper border border-brand-ink p-4">
							<p class="text-center font-bold mb-3">Generating Image...</p>
							<div class="w-full bg-brand-rule border border-brand-ink h-4">
								<div class="bg-brand-ink h-full loading-bar" />
							</div>
						</div>
					{/if}
				</div>
			</div>

			<svelte:fragment slot="toolbar-left">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">LINE ITEMS → PNG</span>
			</svelte:fragment>

			<svelte:fragment slot="toolbar-right">
				<QuotaMeter
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
				/>
				<GenerateButton
					label="Generate Invoice"
					loading={isImageGenerating}
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
					on:generate={generateInvoice}
				/>
			</svelte:fragment>
		</ToolCard>
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
							on:click={() => updateTemplate(template)}
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

	<svelte:fragment slot="footer-links">
		<RelatedLinks
			toolName={TOOL_NAME}
			links={[
				{ href: '/tools/receipt', label: 'Receipt Generator' },
				{ href: '/tools/certificate', label: 'Certificate Generator' },
				{ href: '/tools/membership-card', label: 'Membership Card' },
				{ href: '/tools/event-ticket', label: 'Event Ticket' },
				{ href: '/tools', label: 'View all tools →' }
			]}
		/>
	</svelte:fragment>
</ToolPageShell>
