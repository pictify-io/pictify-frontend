<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import InvoiceTemplate from '$lib/components/tools/InvoiceTemplate.svelte';
	import NextSteps from '$lib/components/tools/NextSteps.svelte';
	import GenerationLimitBanner from '$lib/components/tools/GenerationLimitBanner.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { getTemplates, getTemplate } from '../../../api/tools/invoice.js';
	import { onMount } from 'svelte';
	import { toast } from '../../../store/toast.store';
	import { user } from '../../../store/user.store';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { page } from '$app/stores';
	import { analytics } from '$lib/analytics.js';
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

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
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

		const iframe = invoiceTemplateWrapper.querySelector('iframe');
		const doc = iframe.contentWindow.document;
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

		const document = iframe.contentWindow.document;
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
		companyName.innerHTML = invoiceData.companyName || '';
		companyAddress.innerHTML = invoiceData.companyAddress || '';
		clientName.innerHTML = invoiceData.clientName || '';
		clientAddress.innerHTML = invoiceData.clientAddress || '';
		invoiceNumber.innerHTML = invoiceData.invoiceNumber || '';
		invoiceDate.innerHTML = invoiceData.invoiceDate || '';
		dueDate.innerHTML = invoiceData.dueDate || '';
		items.innerHTML = `<tbody id="line-items">${itemsHTML}</tbody>`;
		notes.innerHTML = invoiceData.notes || '';

		const updatedLogo = document.createElement('img');
		updatedLogo.src = invoiceData.logo;
		updatedLogo.classList.add('logo');
		logo.parentNode.replaceChild(updatedLogo, logo);

		total = calculateTotal();
		const tax = (total * invoiceData.taxRate) / 100;
		const totalElement = document.querySelector('#total-amount');
		totalElement.innerHTML = `$${total.toFixed(2)}`;
		taxAmount.innerHTML = `$${tax.toFixed(2)}`;
		subtotal.innerHTML = `$${invoiceData.items
			.reduce((total, item) => total + item.quantity * item.price, 0)
			.toFixed(2)}`;
		html = document.documentElement.outerHTML;
	}
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
</svelte:head>

<svelte:window bind:innerWidth={windowWidth} />

<section class="w-full min-h-screen bg-[#FFFDF8] relative overflow-x-hidden font-['Manrope']">
	<Nav />

	<!-- Background Elements -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<main
		class="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 md:pt-24 md:pb-32 relative z-10"
	>
		<!-- Breadcrumb -->
		<nav class="mb-12 flex justify-center">
			<ol
				class="inline-flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 border-[3px] border-gray-900 rounded-full shadow-[4px_4px_0_0_#1f2937]"
			>
				<li><a href="/" class="text-gray-500 hover:text-gray-900 transition-colors">Home</a></li>
				<li class="text-gray-300">/</li>
				<li>
					<a href="/tools" class="text-gray-500 hover:text-gray-900 transition-colors">Tools</a>
				</li>
				<li class="text-gray-300">/</li>
				<li class="text-gray-900">Invoice Generator</li>
			</ol>
		</nav>

		<!-- Hero Section -->
		<div
			class="relative flex flex-col items-center justify-center text-center mb-8 sm:mb-12 lg:mb-16 pt-4 sm:pt-10"
		>
			<!-- Badge -->
			<div
				class="inline-flex transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default mb-4 sm:mb-8"
			>
				<div
					class="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#ffc480] border-[3px] sm:border-[4px] border-black text-black font-black text-xs sm:text-sm md:text-base uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					★ Free Tool
				</div>
			</div>

			<!-- Main Title -->
			<h1
				class="relative z-10 text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-tight mb-4 sm:mb-8"
			>
				<span class="block sm:inline">INVOICE</span>
				<span class="relative inline-block text-white mt-1 sm:mt-2 md:mt-0 md:ml-3">
					<span class="relative z-10 px-2 sm:px-3 md:px-4">GENERATOR</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-3 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h1>

			<!-- Description -->
			<div class="max-w-2xl mx-auto px-2">
				<p
					class="text-base sm:text-lg md:text-xl text-gray-800 font-bold leading-relaxed border-[3px] border-black bg-white p-4 sm:p-6 shadow-[4px_4px_0_0_#e5e7eb] sm:shadow-[8px_8px_0_0_#e5e7eb]"
				>
					Create <span class="bg-[#ffc480] px-1 border-b-[2px] sm:border-b-[3px] border-black"
						>professional invoices</span
					>
					for your business.
					<span class="text-gray-500 text-sm sm:text-base mt-2 sm:mt-3 block font-semibold"
						>Free, customizable templates with real-time preview</span
					>
				</p>
			</div>
		</div>

		<!-- Generation Limit Banner -->
		<GenerationLimitBanner toolName="online_invoice_generator" />

		<!-- Main Editor Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
			<!-- Left Column: Form -->
			<div
				class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] overflow-hidden"
			>
				<!-- Terminal Header -->
				<div
					class="bg-black text-white px-4 py-3 flex justify-between items-center border-b-[3px] border-black"
				>
					<h2 class="font-bold font-mono tracking-widest text-xs uppercase flex items-center gap-2">
						<span class="animate-pulse">_</span> INVOICE DETAILS
					</h2>
					<div class="flex gap-2">
						<div class="w-3 h-3 bg-[#ff6b6b] border border-black" />
						<div class="w-3 h-3 bg-[#ffc480] border border-black" />
						<div class="w-3 h-3 bg-[#4ade80] border border-black" />
					</div>
				</div>

				<div class="p-4 sm:p-6 space-y-4">
					<!-- Company Section -->
					<div class="space-y-3">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#ffc480] border-[2px] border-black flex items-center justify-center text-xs"
								>1</span
							>
							Your Company
						</h3>
						<input
							bind:value={invoiceData.companyName}
							type="text"
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
							placeholder="Company Name"
							on:input={updateHTML(selectedTemplate)}
						/>
						<div class="relative">
							<input
								type="file"
								class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] file:mr-4 file:py-1 file:px-3 file:border-[2px] file:border-black file:bg-[#ffc480] file:font-bold file:text-black file:text-xs file:uppercase cursor-pointer"
								accept="image/*"
								on:change={updateLogo}
							/>
						</div>
						<textarea
							bind:value={invoiceData.companyAddress}
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none resize-none"
							placeholder="Company Address"
							rows="2"
							on:input={updateHTML(selectedTemplate)}
						/>
					</div>

					<!-- Client Section -->
					<div class="space-y-3">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#60a5fa] border-[2px] border-black flex items-center justify-center text-xs text-white"
								>2</span
							>
							Client Info
						</h3>
						<input
							bind:value={invoiceData.clientName}
							type="text"
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
							placeholder="Client Name"
							on:input={updateHTML(selectedTemplate)}
						/>
						<textarea
							bind:value={invoiceData.clientAddress}
							class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none resize-none"
							placeholder="Client Address"
							rows="2"
							on:input={updateHTML(selectedTemplate)}
						/>
					</div>

					<!-- Invoice Details -->
					<div class="space-y-3">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#a78bfa] border-[2px] border-black flex items-center justify-center text-xs text-white"
								>3</span
							>
							Invoice Details
						</h3>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<input
								bind:value={invoiceData.invoiceNumber}
								type="text"
								class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
								placeholder="Invoice #"
								on:input={updateHTML(selectedTemplate)}
							/>
							<input
								bind:value={invoiceData.invoiceDate}
								type="date"
								class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
								on:input={updateHTML(selectedTemplate)}
							/>
							<input
								bind:value={invoiceData.dueDate}
								type="date"
								class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
								on:input={updateHTML(selectedTemplate)}
							/>
						</div>
					</div>

					<!-- Line Items -->
					<div class="space-y-3">
						<h3
							class="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2"
						>
							<span
								class="w-6 h-6 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center text-xs text-white"
								>4</span
							>
							Line Items
						</h3>
						{#each invoiceData.items as item, index}
							<div class="flex flex-wrap gap-2">
								<input
									bind:value={item.description}
									type="text"
									class="flex-grow min-w-[120px] border-[3px] border-black p-2 font-bold text-sm shadow-[2px_2px_0_0_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
									placeholder="Description"
									on:input={updateHTML(selectedTemplate)}
								/>
								<input
									bind:value={item.quantity}
									type="number"
									class="w-16 border-[3px] border-black p-2 font-bold text-sm text-center shadow-[2px_2px_0_0_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
									placeholder="Qty"
									on:input={updateHTML(selectedTemplate)}
								/>
								<input
									bind:value={item.price}
									type="number"
									class="w-20 border-[3px] border-black p-2 font-bold text-sm text-center shadow-[2px_2px_0_0_#000] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
									placeholder="Price"
									on:input={updateHTML(selectedTemplate)}
								/>
								<button
									on:click={() => removeItem(index)}
									class="w-10 h-10 bg-[#ff6b6b] border-[3px] border-black text-white font-black flex items-center justify-center shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
								>
									×
								</button>
							</div>
						{/each}
						<button
							on:click={addItem}
							class="px-4 py-2 bg-black text-white border-[3px] border-black font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0_0_#666] hover:shadow-[1px_1px_0_0_#666] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
						>
							<span>+</span> Add Item
						</button>
					</div>

					<!-- Tax & Notes -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-xs font-black text-black uppercase tracking-wider mb-2"
								>Tax Rate (%)</label
							>
							<input
								bind:value={invoiceData.taxRate}
								type="number"
								class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none"
								placeholder="0"
								on:input={updateHTML(selectedTemplate)}
							/>
						</div>
						<div class="flex items-end">
							<div class="w-full p-4 bg-[#ff6b6b] text-white border-[3px] border-black">
								<span class="text-xs font-black uppercase tracking-wider block">Total</span>
								<span class="text-2xl font-black">${total.toFixed(2)}</span>
							</div>
						</div>
					</div>

					<textarea
						bind:value={invoiceData.notes}
						class="w-full border-[3px] border-black p-3 font-bold text-sm shadow-[3px_3px_0_0_#000] focus:shadow-[1px_1px_0_0_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all outline-none resize-none"
						placeholder="Additional Notes..."
						rows="2"
						on:input={updateHTML(selectedTemplate)}
					/>
				</div>
			</div>

			<!-- Right Column: Preview -->
			<div class="space-y-4 sm:space-y-6">
				<div
					class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] overflow-hidden"
				>
					<!-- Preview Header -->
					<div
						class="bg-[#e5e7eb] px-4 py-2 border-b-[3px] border-black flex items-center justify-between"
					>
						<span class="font-mono text-xs font-bold uppercase tracking-wider">LIVE PREVIEW</span>
						<div class="flex gap-1">
							<div class="w-2 h-2 bg-black" />
							<div class="w-2 h-2 bg-black" />
							<div class="w-2 h-2 bg-black" />
						</div>
					</div>
					<div
						bind:this={invoiceTemplateWrapper}
						bind:clientWidth={previewContainerWidth}
						class="overflow-hidden bg-white flex justify-center"
					>
						<InvoiceTemplate
							html={selectedTemplate}
							width={800}
							height={1200}
							scale={iframeScale}
						/>
					</div>
				</div>

				<!-- Generate Button -->
				<button
					on:click={generateInvoice}
					disabled={isImageGenerating}
					class="w-full bg-[#ff6b6b] hover:bg-[#ff5252] text-white px-6 py-4 border-[3px] border-black shadow-[6px_6px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all font-black uppercase tracking-wide flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
				>
					{#if isImageGenerating}
						<svg
							class="animate-spin h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						GENERATING...
					{:else}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/></svg
						>
						GENERATE INVOICE
					{/if}
				</button>

				<!-- Generated Image Result -->
				{#if isImageGenerating}
					<div class="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000]">
						<p class="text-center font-bold mb-3">Generating Image...</p>
						<div class="w-full bg-gray-200 border-[2px] border-black h-4">
							<div class="bg-black h-full loading-bar" />
						</div>
					</div>
				{/if}

				{#if imageUrl}
					<div class="bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
						<div
							class="bg-[#4ade80] px-4 py-3 border-b-[3px] border-black flex items-center justify-between"
						>
							<span class="font-black uppercase tracking-wider text-sm text-black"
								>✓ Invoice Generated</span
							>
							<div class="flex items-center gap-2">
								<button
									on:click={() => copyToClipboard(imageUrl)}
									class="px-3 py-1 bg-black text-white border-[2px] border-black font-bold text-xs uppercase shadow-[2px_2px_0_0_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
								>
									Copy URL
								</button>
								<a
									href={imageUrl}
									target="_blank"
									class="px-3 py-1 bg-white text-black border-[2px] border-black font-bold text-xs uppercase shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
								>
									Open in Tab
								</a>
							</div>
						</div>
						<div class="p-4">
							<img
								src={imageUrl}
								alt="Invoice"
								class="w-full h-auto border-[3px] border-black shadow-[4px_4px_0_0_#000]"
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
		</div>

		<!-- Templates Section -->
		<div class="mt-12 sm:mt-16">
			<h2 class="text-xl sm:text-2xl font-black mb-6 flex items-center gap-3">
				<span
					class="w-8 h-8 bg-[#ffc480] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_0_#000]"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
						/></svg
					>
				</span>
				INVOICE TEMPLATES
			</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each templates as template}
					<button
						class="relative bg-white border-[3px] {selectedTemplate === template
							? 'border-[#ff6b6b] shadow-[6px_6px_0_0_#ff6b6b]'
							: 'border-black shadow-[4px_4px_0_0_#000]'} p-3 overflow-hidden hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
						on:click={() => updateTemplate(template)}
					>
						{#if selectedTemplate === template}
							<div
								class="absolute top-2 right-2 z-10 w-6 h-6 bg-[#ff6b6b] border-[2px] border-black flex items-center justify-center"
							>
								<span class="text-white font-black text-sm">✓</span>
							</div>
						{/if}
						<div class="pointer-events-none">
							<InvoiceTemplate html={template} width={800} height={800} scale={iframeScale * 0.5} />
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- SEO Content Sections -->
		<div class="max-w-5xl mx-auto mt-16 sm:mt-20">
			<!-- Separator -->
			<div class="border-t-[3px] sm:border-t-[4px] border-black relative mb-8 sm:mb-12 lg:mb-16">
				<div class="absolute left-1/2 -top-4 sm:-top-5 -translate-x-1/2 bg-[#FFFDF8] px-4 sm:px-6">
					<div
						class="w-8 h-8 sm:w-10 sm:h-10 bg-[#ffc480] border-[3px] border-black flex items-center justify-center shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
					>
						<span class="font-black text-sm sm:text-lg">?</span>
					</div>
				</div>
			</div>

			<h2
				class="text-2xl sm:text-3xl md:text-5xl font-black mb-8 sm:mb-12 text-center text-gray-900 tracking-tighter px-2"
			>
				LEARN MORE ABOUT <br class="md:hidden" />
				<span class="relative inline-block text-white mt-2">
					<span class="relative z-10 px-2 sm:px-4">INVOICING</span>
					<span
						class="absolute inset-0 bg-[#ff6b6b] transform -skew-x-2 border-[3px] sm:border-[4px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] -z-0"
					/>
				</span>
			</h2>

			<!-- What is Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ffc480] border-[3px] border-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
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
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					What is an Online Invoice Generator?
				</h3>
				<p class="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
					An online invoice generator is a powerful tool that allows businesses and freelancers to
					create professional invoices quickly and easily. It streamlines the billing process, helps
					maintain accurate financial records, and presents a polished image to clients.
				</p>
			</section>

			<!-- Benefits Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#4ade80] border-[3px] border-black text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
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
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					Benefits of Using Our Invoice Generator
				</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each ['Create professional invoices in minutes', 'Customize templates to match your brand', 'Automate calculations for taxes and totals', 'Save time on billing and bookkeeping', 'Access your invoices from anywhere', 'Improve cash flow with accurate billing'] as benefit}
						<div
							class="bg-[#f8f8f8] border-[3px] border-black p-3 shadow-[3px_3px_0_0_#000] flex items-center gap-3 hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							<span class="font-black text-[#4ade80]">✓</span>
							<span class="font-bold text-black text-sm">{benefit}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- How to Use Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#60a5fa] border-[3px] border-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
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
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					How to Use Our Invoice Generator
				</h3>
				<div class="space-y-4">
					{#each [{ num: '1', text: 'Enter your company and client details' }, { num: '2', text: 'Choose from our professional invoice templates' }, { num: '3', text: 'Add line items for products or services' }, { num: '4', text: 'Set tax rates and discounts if applicable' }, { num: '5', text: 'Preview your invoice in real-time' }, { num: '6', text: 'Generate and download your custom invoice' }] as step}
						<div class="flex items-start gap-4">
							<span
								class="bg-[#60a5fa] text-white w-8 h-8 flex items-center justify-center font-black flex-shrink-0 border-[3px] border-black shadow-[2px_2px_0_0_#000]"
								>{step.num}</span
							>
							<span class="font-bold text-black text-sm pt-1">{step.text}</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- FAQ Section -->
			<section
				class="mb-8 sm:mb-12 bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000] sm:shadow-[8px_8px_0_0_#000] p-4 sm:p-6 md:p-10 hover:shadow-[2px_2px_0_0_#000] sm:hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] sm:hover:translate-x-[4px] sm:hover:translate-y-[4px] transition-all duration-300"
			>
				<div
					class="inline-flex items-center gap-2 px-3 sm:px-4 py-1 bg-[#ff6b6b] border-[3px] border-black text-white text-[10px] sm:text-xs font-black uppercase tracking-wider mb-4 sm:mb-6 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
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
					class="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-black tracking-tight"
				>
					Frequently Asked Questions
				</h3>
				<div class="space-y-3">
					{#each [{ q: 'How do I use this invoice generator?', a: 'Simply fill in your company and client details, add invoice items, select a template, and click "Generate Invoice". You can then download your professional invoice.' }, { q: 'Is this invoice generator free to use?', a: 'Yes, our online invoice generator is completely free to use. Create and download as many invoices as you need without any cost.' }, { q: 'Can I customize the invoice template?', a: 'You can choose from a variety of professional designs. Each template can be populated with your specific invoice details.' }, { q: 'Are the generated invoices legally compliant?', a: 'Our templates include standard elements required for most invoices. Please check your local regulations for specific requirements.' }] as faq}
						<details
							class="group bg-[#f8f8f8] border-[3px] border-black overflow-hidden shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							<summary
								class="flex items-center justify-between cursor-pointer p-4 font-bold text-black select-none text-sm"
							>
								<span>{faq.q}</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-black group-open:rotate-180 transition-transform duration-300"
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
							<div class="p-4 pt-0 text-gray-600 border-t-[3px] border-black bg-white text-sm">
								{faq.a}
							</div>
						</details>
					{/each}
				</div>
			</section>

			<!-- Share Buttons -->
			<div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12">
				<button
					class="px-6 py-3 bg-black text-white border-[3px] border-black font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#444] hover:shadow-[2px_2px_0_0_#444] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
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
					class="px-6 py-3 bg-[#0A66C2] text-white border-[3px] border-black font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#084c94] hover:shadow-[2px_2px_0_0_#084c94] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
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
	</main>

	<RelatedTools tools={['receipt', 'certificate', 'membership-card', 'event-ticket']} />

	<Toast />
	<Footer />

</section>

<style>
	@keyframes loading {
		0% {
			width: 0%;
		}
		100% {
			width: 100%;
		}
	}

	.loading-bar {
		width: 0%;
		animation: loading 3s forwards;
	}
</style>
