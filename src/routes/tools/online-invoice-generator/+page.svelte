<script>
	/**
	 * /tools/online-invoice-generator — the v2 tool page, column mode.
	 *
	 * Form and preview become the tool card's two columns; the quota ladder and
	 * Generate move into its toolbar. SEO copy is frozen.
	 */
	import InvoiceTemplate from '$lib/components/tools/InvoiceTemplate.svelte';
	import NextSteps from '$lib/components/tools/NextSteps.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import LongformSection from '$lib/components/tools/v2/LongformSection.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { getTemplates, getTemplate } from '../../../api/tools/invoice.js';
	import { onMount } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import { user } from '../../../store/user.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { page } from '$app/stores';
	import { analytics } from '$lib/telemetry.js';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';

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

	$: nextStepsCurlSnippet = buildCurlSnippetFromHtml(getCurrentInvoiceHtml(), 800, 1200);
	$: nextStepsTemplateDraft = imageUrl
		? {
				version: 1,
				name: 'Invoice template',
				type: 'invoice',
				width: 800,
				height: 1200,
				backgroundImageUrl: imageUrl,
				source: 'invoice-generator'
		  }
		: null;

	const structuredDataJson = JSON.stringify({
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
	});

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

	const faqSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: invoiceFaqs.map((faq) => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a }
		}))
	});

	const breadcrumbSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'Online Invoice Generator' }
		]
	});

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

		// Add watermark for ALL non-logged in users
		if (!isUserLoggedIn) {
			const watermarkDiv = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
                    padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
                    font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Created with <a href="https://pictify.io" style="color: #ff6b6b; text-decoration: none; font-weight: 600;">pictify.io</a>
        </div>
      `;
			html = html.replace('</body>', `${watermarkDiv}</body>`);
		}

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

	const RELATED = [
		{
			title: 'CSV to PDF',
			meta: 'CSV → PDF',
			href: '/tools/csv-to-pdf',
			art: '/landing/tools/csv-to-pdf.svg'
		},
		{
			title: 'Table to image',
			meta: 'CSV · HTML → PNG',
			href: '/tools/table',
			art: '/landing/tools/table-to-image.svg'
		},
		{
			title: 'Membership card',
			meta: 'MEMBER → PNG',
			href: '/tools/membership-card',
			art: '/landing/tools/membership-card.svg'
		}
	];
</script>

<svelte:head>
	<title>Free Online Invoice Generator | Pictify.io</title>
	<meta
		name="description"
		content="Create professional invoices for free with Pictify.io's Online Invoice Generator. Customize templates, add your branding, and generate invoices in seconds."
	/>
	<meta name="keywords" content="invoice generator, free invoice, online invoice, business tools" />
	<link rel="canonical" href="https://pictify.io/tools/online-invoice-generator" />
	<meta property="og:title" content="Online Invoice Generator | Pictify.io" />
	<meta
		property="og:description"
		content="Create custom invoices to streamline your billing process and maintain a professional image."
	/>
	<meta property="og:image" content="https://media.pictify.io/qyl7z-1775406830860.png" />
	<meta property="og:url" content="https://pictify.io/tools/online-invoice-generator" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@pictify_io" />
	<meta name="twitter:title" content="Online Invoice Generator | Pictify.io" />
	<meta
		name="twitter:description"
		content="Create custom invoices to streamline your billing process and maintain a professional image."
	/>
	<meta name="twitter:image" content="https://media.pictify.io/qyl7z-1775406830860.png" />
	{@html `<script type="application/ld+json">${structuredDataJson}</script>`}
	{@html `<script type="application/ld+json">${faqSchemaJson}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchemaJson}</script>`}
</svelte:head>

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
	<h1
		slot="h1"
		class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
	>
		<span>INVOICE</span>
		<span>GENERATOR</span>
	</h1>

	<p
		slot="hero-sub"
		class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
	>
		Create <span class="font-medium">professional invoices</span> for your business.
		<span class="text-brand-slate">Free, customizable templates with real-time preview</span>
	</p>

	<div slot="tool">
		<ToolCard>
			<div class="grid grid-cols-1 items-start gap-6 p-5 lg:grid-cols-2 lg:gap-8 lg:p-7">
				<div class="bg-brand-paper border border-brand-ink overflow-hidden">
					<!-- Panel header: keeps the frozen H2, drops the v1 window chrome. -->
					<div class="flex items-center gap-2 border-b border-brand-ink bg-brand-press px-4 py-2.5">
						<h2 class="font-mono text-xs tracking-[0.06em] text-white">
							<span class="animate-pulse">_</span> INVOICE DETAILS
						</h2>
					</div>

					<div class="p-4 sm:p-6 space-y-4">
						<!-- Company Section -->
						<div class="space-y-3">
							<h3
								class="text-xs font-semibold text-brand-ink tracking-wider flex items-center gap-2"
							>
								<span
									class="w-6 h-6 bg-brand-field border border-brand-ink flex items-center justify-center text-xs"
									>1</span
								>
								Your Company
							</h3>
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
							<h3
								class="text-xs font-semibold text-brand-ink tracking-wider flex items-center gap-2"
							>
								<span
									class="w-6 h-6 bg-data-sky border border-brand-ink flex items-center justify-center text-xs text-white"
									>2</span
								>
								Client Info
							</h3>
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
							<h3
								class="text-xs font-semibold text-brand-ink tracking-wider flex items-center gap-2"
							>
								<span
									class="w-6 h-6 bg-data-violet border border-brand-ink flex items-center justify-center text-xs text-white"
									>3</span
								>
								Invoice Details
							</h3>
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
							<h3
								class="text-xs font-semibold text-brand-ink tracking-wider flex items-center gap-2"
							>
								<span
									class="w-6 h-6 bg-brand-pink border border-brand-ink flex items-center justify-center text-xs text-white"
									>4</span
								>
								Line Items
							</h3>
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
			<div class="bg-brand-paper border border-brand-ink overflow-hidden">
				<div
					class="bg-brand-proof px-4 py-3 border-b border-brand-ink flex items-center justify-between"
				>
					<span class="font-semibold tracking-wider text-sm text-brand-ink"
						>✓ Invoice Generated</span
					>
					<div class="flex items-center gap-2">
						<button
							on:click={() => copyToClipboard(imageUrl)}
							class="px-3 py-1 bg-brand-ink text-white border border-brand-ink font-bold text-xs transition-all"
						>
							Copy URL
						</button>
						<a
							href={imageUrl}
							target="_blank"
							class="px-3 py-1 bg-brand-paper text-brand-ink border border-brand-ink font-bold text-xs transition-all"
						>
							Open in Tab
						</a>
					</div>
				</div>
				<div class="p-4">
					<img
						loading="lazy"
						src={imageUrl}
						alt="Invoice"
						class="w-full h-auto border border-brand-ink"
					/>
				</div>
			</div>

			<NextSteps
				heading="Next steps"
				description="Copy the API request, save this invoice as a template background, and batch render variants."
				curlSnippet={nextStepsCurlSnippet}
				templateDraft={nextStepsTemplateDraft}
				generatedUrl={imageUrl}
				toolName="Invoice Generator"
			/>
		{/if}
	</div>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="templates" first>
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink"
			>
				INVOICE TEMPLATES
			</h2>
			<div class="mt-12 sm:mt-16">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each templates as template}
						<button
							class="relative bg-brand-paper border-[3px] {selectedTemplate === template
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

		<div class="max-w-5xl mx-auto mt-16 sm:mt-20">
			<!-- Separator -->
			<div class="border-t-[3px] sm:border-t-[4px] border-black relative mb-8 sm:mb-12 lg:mb-16">
				<div
					class="absolute left-1/2 -top-4 sm:-top-5 -translate-x-1/2 bg-brand-subtle px-4 sm:px-6"
				>
					<div
						class="w-8 h-8 sm:w-10 sm:h-10 bg-brand-field border border-brand-ink flex items-center justify-center"
					>
						<span class="font-semibold text-sm sm:text-lg">?</span>
					</div>
				</div>
			</div>

			<h2
				class="text-2xl sm:text-3xl md:text-5xl font-semibold mb-8 sm:mb-12 text-center text-brand-ink tracking-[-0.02em] px-2"
			>
				LEARN MORE ABOUT <br class="md:hidden" />
				<span class="relative inline-block text-white mt-2">
					<span class="relative z-10 px-2 sm:px-4">INVOICING</span>
					<span
						class="absolute inset-0 bg-brand-pink transform -skew-x-2 border border-brand-ink -z-0"
					/>
				</span>
			</h2>

			<!-- What is Section -->
			<section
				class="mb-8 sm:mb-12 bg-brand-paper border border-brand-ink p-4 sm:p-6 md:p-10 sm:hover: transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-brand-field border border-brand-ink text-[10px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-6"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/></svg
					>
					Overview
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-brand-ink tracking-tight"
				>
					What is an Online Invoice Generator?
				</h3>
				<p class="text-sm sm:text-base text-brand-slate leading-relaxed font-medium">
					An online invoice generator is a powerful tool that allows businesses and freelancers to
					create professional invoices quickly and easily. It streamlines the billing process, helps
					maintain accurate financial records, and presents a polished image to clients.
				</p>
			</section>

			<!-- Benefits Section -->
			<section
				class="mb-8 sm:mb-12 bg-brand-paper border border-brand-ink p-4 sm:p-6 md:p-10 sm:hover: transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-brand-proof border border-brand-ink text-[10px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-6"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
						/></svg
					>
					Benefits
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-brand-ink tracking-tight"
				>
					Benefits of Using Our Invoice Generator
				</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each ['Create professional invoices in minutes', 'Customize templates to match your brand', 'Automate calculations for taxes and totals', 'Save time on billing and bookkeeping', 'Access your invoices from anywhere', 'Improve cash flow with accurate billing'] as benefit}
						<div
							class="bg-brand-subtle border border-brand-ink p-3 flex items-center gap-3 transition-all"
						>
							<span class="font-semibold text-brand-proof">✓</span>
							<span class="font-bold text-brand-ink text-sm">{benefit}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- How to Use Section -->
			<section
				class="mb-8 sm:mb-12 bg-brand-paper border border-brand-ink p-4 sm:p-6 md:p-10 sm:hover: transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-data-sky border border-brand-ink text-white text-[10px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-6"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					Guide
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-brand-ink tracking-tight"
				>
					How to Use Our Invoice Generator
				</h3>
				<div class="space-y-4">
					{#each [{ num: '1', text: 'Enter your company and client details' }, { num: '2', text: 'Choose from our professional invoice templates' }, { num: '3', text: 'Add line items for products or services' }, { num: '4', text: 'Set tax rates and discounts if applicable' }, { num: '5', text: 'Preview your invoice in real-time' }, { num: '6', text: 'Generate and download your custom invoice' }] as step}
						<div class="flex items-start gap-4">
							<span
								class="bg-data-sky text-white w-8 h-8 flex items-center justify-center font-semibold flex-shrink-0 border border-brand-ink"
								>{step.num}</span
							>
							<span class="font-bold text-brand-ink text-sm pt-1">{step.text}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- FAQ Section -->
			<section
				class="mb-8 sm:mb-12 bg-brand-paper border border-brand-ink p-4 sm:p-6 md:p-10 sm:hover: transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-brand-pink border border-brand-ink text-white text-[10px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-6"
				>
					<svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					FAQ
				</div>
				<h3
					class="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-brand-ink tracking-tight"
				>
					Frequently Asked Questions
				</h3>
				<div class="space-y-3">
					{#each invoiceFaqs as faq}
						<details
							class="group bg-brand-subtle border border-brand-ink overflow-hidden transition-all"
						>
							<summary
								class="flex items-center justify-between cursor-pointer p-4 font-bold text-brand-ink select-none text-sm"
							>
								<span>{faq.q}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-brand-ink group-open:rotate-180 transition-transform duration-300"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</summary>
							<div
								class="p-4 pt-0 text-brand-slate border-t border-brand-ink bg-brand-paper text-sm"
							>
								{faq.a}
							</div>
						</details>
					{/each}
				</div>
			</section>

			<!-- Share Buttons -->
			<div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12">
				<button
					class="px-6 py-3 bg-brand-ink text-white border border-brand-ink font-bold tracking-wide transition-all flex items-center justify-center gap-2"
					on:click={() => sharePage('twitter')}
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
						/>
					</svg>
					Share on X
				</button>
				<button
					class="px-6 py-3 bg-[#0A66C2] text-white border border-brand-ink font-bold tracking-wide transition-all flex items-center justify-center gap-2"
					on:click={() => sharePage('linkedin')}
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
						/>
					</svg>
					Share on LinkedIn
				</button>
			</div>
		</div>
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<RelatedTools tools={['receipt', 'certificate', 'membership-card', 'event-ticket']} />
		</div>
	</svelte:fragment>
</ToolPageShell>
