<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { toast } from '../../../store/toast.store';
	import { user } from '../../../store/user.store';
	import { generationLimits } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { analytics } from '$lib/analytics.js';
	import ApiCodeSection from './ApiCodeSection.svelte';

	let isUserLoggedIn = false;
	user.subscribe((u) => { isUserLoggedIn = !!u?.email; });

	// ── Barcode state ──────────────────────────────────────
	let barcodeValue = '1234567890128';
	let barcodeFormat = 'CODE128';
	let showText = true;
	let barWidth = 2;
	let barHeight = 100;
	let barColor = '#000000';
	let bgColor = '#ffffff';
	let transparentBg = false;
	let fontSize = 16;

	// ── Generation state ───────────────────────────────────
	let imageUrl = '';
	let isGenerating = false;
	let barcodeError = '';
	let fileFormat = 'png';
	let svgContainer;
	let JsBarcode = null;

	const formats = [
		{ id: 'CODE128', label: 'Code 128', desc: 'Alphanumeric, any length', placeholder: 'ABC-12345' },
		{ id: 'EAN13', label: 'EAN-13', desc: '13 digits, retail', placeholder: '5901234123457' },
		{ id: 'UPC', label: 'UPC-A', desc: '12 digits, US retail', placeholder: '012345678905' },
		{ id: 'CODE39', label: 'Code 39', desc: 'Alphanumeric + symbols', placeholder: 'HELLO-123' },
		{ id: 'ITF14', label: 'ITF-14', desc: '14 digits, shipping', placeholder: '01234567890128' },
		{ id: 'CODE93', label: 'Code 93', desc: 'Compact alphanumeric', placeholder: 'TEST-93' },
		{ id: 'codabar', label: 'Codabar', desc: 'Numeric, libraries/blood banks', placeholder: 'A12345B' },
		{ id: 'MSI', label: 'MSI', desc: 'Numeric, inventory', placeholder: '1234567' },
		{ id: 'pharmacode', label: 'Pharmacode', desc: 'Pharma packaging (3-131070)', placeholder: '1234' }
	];

	$: activeFormat = formats.find((f) => f.id === barcodeFormat) || formats[0];

	// ── Validation ─────────────────────────────────────────
	function validate(value, format) {
		if (!value) return 'Enter barcode data';
		switch (format) {
			case 'EAN13':
				if (!/^\d{13}$/.test(value)) return 'EAN-13 requires exactly 13 digits';
				break;
			case 'UPC':
				if (!/^\d{12}$/.test(value)) return 'UPC-A requires exactly 12 digits';
				break;
			case 'ITF14':
				if (!/^\d{14}$/.test(value)) return 'ITF-14 requires exactly 14 digits';
				{ // check digit validation
					let s = 0;
					for (let i = 0; i < 13; i++) s += parseInt(value[i]) * (i % 2 === 0 ? 3 : 1);
					if (parseInt(value[13]) !== (10 - (s % 10)) % 10) return 'Invalid check digit. Last digit should be ' + ((10 - (s % 10)) % 10);
				}
				break;
			case 'CODE39':
				if (!/^[A-Z0-9\-\.\ \$\/\+\%]+$/i.test(value)) return 'Code 39 supports A-Z, 0-9, - . $ / + % and space';
				break;
			case 'codabar':
				if (!/^[A-Da-d][0-9\-\$\:\/\.\+]+[A-Da-d]$/.test(value)) return 'Codabar must start and end with A-D, digits and - $ : / . + in between';
				break;
			case 'MSI':
				if (!/^\d+$/.test(value)) return 'MSI requires numeric digits only';
				break;
			case 'pharmacode':
				{ const n = parseInt(value); if (isNaN(n) || n < 3 || n > 131070) return 'Pharmacode requires a number between 3 and 131070'; }
				break;
		}
		return '';
	}

	$: barcodeError = validate(barcodeValue, barcodeFormat);

	// ── Render barcode SVG (reactive) ──────────────────────
	function renderBarcode() {
		if (!browser || !JsBarcode || !svgContainer || barcodeError) return;
		try {
			// Clear previous
			svgContainer.innerHTML = '';
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svgContainer.appendChild(svg);
			JsBarcode(svg, barcodeValue, {
				format: barcodeFormat,
				displayValue: showText,
				width: barWidth,
				height: barHeight,
				lineColor: barColor,
				background: transparentBg ? 'transparent' : bgColor,
				fontSize: fontSize,
				font: 'Inter',
				textMargin: 8,
				margin: 20
			});
		} catch (e) {
			barcodeError = e.message || 'Invalid barcode data for this format';
		}
	}

	// Trigger re-render on any setting change
	$: if (browser && JsBarcode) {
		// Reactive dependencies
		barcodeValue, barcodeFormat, showText, barWidth, barHeight, barColor, bgColor, transparentBg, fontSize;
		renderBarcode();
	}

	onMount(async () => {
		const mod = await import('jsbarcode');
		JsBarcode = mod.default || mod;
		renderBarcode();
	});

	// ── Generate image via Pictify API ─────────────────────
	async function generateImage() {
		if (barcodeError) {
			toast.set({ message: barcodeError, type: 'error', duration: 3000 });
			return;
		}

		if (!isUserLoggedIn && !generationLimits.isWithinLimit()) {
			toast.set({ message: 'Daily limit reached. Sign up for unlimited access.', type: 'warning', duration: 5000 });
			return;
		}

		generationLimits.increment();
		isGenerating = true;
		imageUrl = '';

		try {
			// Build HTML that renders the barcode server-side
			const effectiveBg = transparentBg ? 'transparent' : bgColor;
			const cssBlock = `body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: ${effectiveBg}; min-height: 100%; } svg { max-width: 100%; }`;
			const jsBlock = `JsBarcode("#barcode", "${barcodeValue.replace(/"/g, '\\"')}", { format: "${barcodeFormat}", displayValue: ${showText}, width: ${barWidth}, height: ${barHeight}, lineColor: "${barColor}", background: "${effectiveBg}", fontSize: ${fontSize}, font: "Inter", textMargin: 8, margin: 20 });`;
			// Force PNG for transparent backgrounds (JPG doesn't support alpha)
			const outputFormat = transparentBg && fileFormat === 'jpg' ? 'png' : fileFormat;
			const html = '<html><head>'
				+ '<scr' + 'ipt src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></scr' + 'ipt>'
				+ '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">'
				+ '<sty' + 'le>' + cssBlock + '</sty' + 'le>'
				+ '</head><body>'
				+ '<svg id="barcode"></svg>'
				+ '<scr' + 'ipt>' + jsBlock + '</scr' + 'ipt>'
				+ '</body></html>';

			const { image } = await createImagePublic({
				html,
				width: Math.max(400, barcodeValue.length * barWidth * 11 + 80),
				height: barHeight + (showText ? fontSize + 30 : 0) + 60,
				fileExtension: outputFormat,
				watermark: !isUserLoggedIn
			});

			imageUrl = image.url;

			analytics.trackImageGenerated({
				tool_name: 'barcode_generator',
				format: fileFormat,
				with_watermark: !isUserLoggedIn
			});
		} catch (error) {
			const status = error?.status || error?.response?.status;
			if (status === 429) {
				toast.set({ message: 'Rate limit reached. Wait a moment and try again.', type: 'warning', duration: 5000 });
			} else {
				toast.set({ message: 'Generation failed. Please try again.', type: 'error', duration: 4000 });
			}
		}
		isGenerating = false;
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard!', type: 'success', duration: 1500 });
		});
	}

	function downloadSvg() {
		if (!svgContainer) return;
		const svg = svgContainer.querySelector('svg');
		if (!svg) return;
		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svg);
		const blob = new Blob([svgString], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'barcode.svg';
		a.click();
		URL.revokeObjectURL(url);
		toast.set({ message: 'SVG downloaded!', type: 'success', duration: 1500 });
	}

	// ── API code examples ──────────────────────────────────
	const barcodeCodeExamples = [
		{
			id: 'javascript',
			label: 'JavaScript',
			fileName: 'barcode.js',
			code: `<span class="text-[#6a9955]">// Generate a barcode image via Pictify API</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">'&lt;script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"&gt;&lt;/script&gt;&lt;svg id="bc"&gt;&lt;/svg&gt;&lt;script&gt;JsBarcode("#bc","1234567890128",{format:"EAN13"})&lt;/script&gt;'</span>;

<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">res</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: { <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">'Bearer YOUR_API_KEY'</span> },
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({ <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">600</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">200</span> })
});

<span class="text-[#c586c0]">const</span> { <span class="text-[#9cdcfe]">image</span> } = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">res</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// CDN-hosted barcode image</span>`
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'barcode.py',
			code: `<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>

<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">'&lt;script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"&gt;&lt;/script&gt;&lt;svg id="bc"&gt;&lt;/svg&gt;&lt;script&gt;JsBarcode("#bc","1234567890128",{format:"EAN13"})&lt;/script&gt;'</span>

<span class="text-[#9cdcfe]">resp</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={<span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>},
    <span class="text-[#9cdcfe]">json</span>={<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">600</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">200</span>})

<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">resp</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"url"</span>])`
		},
		{
			id: 'go',
			label: 'Go',
			fileName: 'barcode.go',
			code: `<span class="text-[#c586c0]">package</span> <span class="text-[#9cdcfe]">main</span>

<span class="text-[#c586c0]">import</span> (<span class="text-[#ce9178]">"bytes"</span>; <span class="text-[#ce9178]">"encoding/json"</span>; <span class="text-[#ce9178]">"net/http"</span>)

<span class="text-[#c586c0]">func</span> <span class="text-[#dcdcaa]">main</span>() {
    <span class="text-[#9cdcfe]">body</span>, _ := <span class="text-[#9cdcfe]">json</span>.<span class="text-[#dcdcaa]">Marshal</span>(<span class="text-[#c586c0]">map</span>[<span class="text-[#c586c0]">string</span>]<span class="text-[#c586c0]">any</span>{
        <span class="text-[#ce9178]">"html"</span>: <span class="text-[#ce9178]">"&lt;script src='https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js'&gt;&lt;/script&gt;&lt;svg id='bc'&gt;&lt;/svg&gt;&lt;script&gt;JsBarcode('#bc','1234567890128',{format:'EAN13'})&lt;/script&gt;"</span>,
        <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">600</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">200</span>,
    })
    <span class="text-[#9cdcfe]">req</span>, _ := <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">NewRequest</span>(<span class="text-[#ce9178]">"POST"</span>, <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>, <span class="text-[#9cdcfe]">bytes</span>.<span class="text-[#dcdcaa]">NewBuffer</span>(<span class="text-[#9cdcfe]">body</span>))
    <span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">Header</span>.<span class="text-[#dcdcaa]">Set</span>(<span class="text-[#ce9178]">"Authorization"</span>, <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>)
    <span class="text-[#9cdcfe]">http</span>.<span class="text-[#9cdcfe]">DefaultClient</span>.<span class="text-[#dcdcaa]">Do</span>(<span class="text-[#9cdcfe]">req</span>)
}`
		}
	];
</script>

<!-- Barcode Generator Tool -->
<div class="w-full max-w-6xl mx-auto">
	<!-- Editor Window -->
	<div class="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000]">
		<!-- Window Header -->
		<div class="bg-black text-white px-4 py-2.5 flex justify-between items-center border-b-[3px] border-black">
			<div class="flex gap-2">
				<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-white" />
				<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-white" />
				<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-white" />
			</div>
			<div class="font-mono font-bold tracking-widest text-xs uppercase">BARCODE_GENERATOR</div>
			<div class="w-16" />
		</div>

		<!-- Editor Body -->
		<div class="grid grid-cols-1 lg:grid-cols-[340px,1fr]">
			<!-- Left: Controls -->
			<div class="p-5 border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-black space-y-5 bg-[#fafafa]">
				<!-- Data Input -->
				<div>
					<label class="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600">Barcode Data</label>
					<input
						bind:value={barcodeValue}
						type="text"
						placeholder={activeFormat.placeholder}
						class="w-full border-[3px] border-black px-3 py-2.5 font-mono font-bold text-sm focus:outline-none focus:border-[#ff6b6b] focus:shadow-[3px_3px_0_0_#ff6b6b] transition-all"
					/>
					{#if barcodeError}
						<p class="text-xs font-bold text-[#ff6b6b] mt-1">{barcodeError}</p>
					{/if}
				</div>

				<!-- Format Picker -->
				<div>
					<label class="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600">Format</label>
					<div class="space-y-1.5">
						{#each formats as fmt}
							<button
								on:click={() => { barcodeFormat = fmt.id; barcodeValue = fmt.placeholder; }}
								class="w-full text-left px-3 py-2 border-[2px] border-black text-sm font-bold transition-all
									{barcodeFormat === fmt.id
										? 'bg-black text-white'
										: 'bg-white text-black hover:bg-gray-50'}"
							>
								<span class="block">{fmt.label}</span>
								<span class="block text-[10px] font-medium {barcodeFormat === fmt.id ? 'text-gray-400' : 'text-gray-500'}">{fmt.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Display Options -->
				<div class="space-y-3">
					<label class="block text-xs font-black uppercase tracking-wider text-gray-600">Display</label>

					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={showText} class="w-4 h-4 border-2 border-black accent-black" />
						<span class="text-sm font-bold">Show text below bars</span>
					</label>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<span class="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Bar Width (1-5)</span>
							<input type="number" bind:value={barWidth} min="1" max="5" on:change={() => { barWidth = Math.min(5, Math.max(1, barWidth || 1)); }} class="w-full border-[2px] border-black px-2 py-1.5 font-mono text-sm text-center focus:outline-none" />
						</div>
						<div>
							<span class="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Height (30-300)</span>
							<input type="number" bind:value={barHeight} min="30" max="300" on:change={() => { barHeight = Math.min(300, Math.max(30, barHeight || 30)); }} class="w-full border-[2px] border-black px-2 py-1.5 font-mono text-sm text-center focus:outline-none" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<span class="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Bar Color</span>
							<div class="flex items-center gap-2 border-[2px] border-black px-2 py-1">
								<input type="color" bind:value={barColor} class="w-6 h-6 border-none cursor-pointer" />
								<span class="font-mono text-xs font-bold">{barColor}</span>
							</div>
						</div>
						<div>
							<span class="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Background</span>
							{#if transparentBg}
								<button
									on:click={() => (transparentBg = false)}
									class="w-full border-[2px] border-black px-2 py-1 text-xs font-bold bg-gray-100 text-gray-500 flex items-center gap-2"
								>
									<span class="w-6 h-6 rounded" style="background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 12px 12px"></span>
									Transparent
								</button>
							{:else}
								<div class="flex items-center gap-2 border-[2px] border-black px-2 py-1">
									<input type="color" bind:value={bgColor} class="w-6 h-6 border-none cursor-pointer" />
									<span class="font-mono text-xs font-bold">{bgColor}</span>
								</div>
							{/if}
							<label class="flex items-center gap-2 cursor-pointer mt-1.5">
								<input type="checkbox" bind:checked={transparentBg} class="w-3.5 h-3.5 border-2 border-black accent-black" />
								<span class="text-[10px] font-bold text-gray-500">Transparent</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Output Format -->
				<div>
					<label class="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600">Output</label>
					<div class="flex gap-0">
						{#each ['png', 'jpg', 'webp'] as fmt}
							<button
								on:click={() => (fileFormat = fmt)}
								class="flex-1 px-3 py-2 border-[2px] border-black font-black text-xs uppercase transition-all -ml-[2px] first:ml-0
									{fileFormat === fmt ? 'bg-black text-white z-10' : 'bg-white text-black hover:bg-gray-50'}"
							>
								{fmt}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Right: Preview -->
			<div
				class="p-6 flex flex-col items-center justify-center min-h-[300px]"
				style:background={transparentBg ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 20px 20px' : bgColor}
			>
				{#if barcodeError}
					<div class="text-center">
						<div class="w-12 h-12 rounded-full bg-red-100 border-[3px] border-red-500 flex items-center justify-center mx-auto mb-3">
							<span class="text-red-500 font-black text-lg">!</span>
						</div>
						<p class="font-bold text-gray-600 text-sm">{barcodeError}</p>
					</div>
				{:else}
					<div bind:this={svgContainer} class="flex items-center justify-center w-full"></div>
				{/if}
			</div>
		</div>

		<!-- Generate Bar -->
		<div class="border-t-[3px] border-black p-4 flex flex-wrap items-center justify-center gap-3 bg-[#fafafa]">
			<button
				on:click={generateImage}
				disabled={!!barcodeError || isGenerating || !barcodeValue}
				class="px-8 py-3 bg-[#4ade80] text-black border-[3px] border-black font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center gap-2"
			>
				{#if isGenerating}
					<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
					Generating...
				{:else}
					Generate {fileFormat.toUpperCase()}
				{/if}
			</button>
			<button
				on:click={downloadSvg}
				disabled={!!barcodeError || !barcodeValue}
				class="px-6 py-3 bg-white text-black border-[3px] border-black font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
				Download SVG
			</button>
		</div>
	</div>

	<!-- Result -->
	{#if imageUrl}
		<div class="mt-12">
			<div class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-3xl p-8 text-center relative overflow-hidden">
				<div class="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/20 rounded-full blur-2xl" />
				<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Barcode Generated!</h3>

				<div class="inline-block bg-white border-[3px] border-gray-900 p-4 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-8">
					<img src={imageUrl} alt="Generated barcode" class="max-w-full h-auto max-h-[200px]" />
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<a
						href={imageUrl}
						download="barcode.{fileFormat}"
						class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
						Download {fileFormat.toUpperCase()}
					</a>
					<button
						on:click={() => copyToClipboard(imageUrl)}
						class="px-6 py-3 bg-gray-900 text-white border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
						Copy URL
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Barcode Types Explained -->
	<section class="mt-20 mb-12">
		<div class="text-center mb-10">
			<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter">
				Barcode Types <span class="text-[#ff6b6b]">Explained</span>
			</h2>
			<p class="text-lg font-bold text-gray-600 mt-3 max-w-2xl mx-auto">
				Choose the right barcode format for your use case. Each type has different data capacity, character support, and industry applications.
			</p>
		</div>

		<div class="overflow-x-auto border-[3px] border-black shadow-[8px_8px_0_0_#1f2937]">
			<table class="w-full text-left border-collapse bg-white">
				<thead>
					<tr class="bg-black text-white">
						<th class="p-3 font-black uppercase text-xs tracking-wider">Format</th>
						<th class="p-3 font-black uppercase text-xs tracking-wider">Data Type</th>
						<th class="p-3 font-black uppercase text-xs tracking-wider">Length</th>
						<th class="p-3 font-black uppercase text-xs tracking-wider">Common Use</th>
					</tr>
				</thead>
				<tbody class="text-sm font-medium text-gray-700">
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">Code 128</td>
						<td class="p-3">Alphanumeric + symbols</td>
						<td class="p-3">Variable</td>
						<td class="p-3">Shipping labels, logistics, general purpose</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">EAN-13</td>
						<td class="p-3">Numeric only</td>
						<td class="p-3">13 digits</td>
						<td class="p-3">Retail products worldwide (international standard)</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">UPC-A</td>
						<td class="p-3">Numeric only</td>
						<td class="p-3">12 digits</td>
						<td class="p-3">Retail products in North America</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">Code 39</td>
						<td class="p-3">Alphanumeric</td>
						<td class="p-3">Variable</td>
						<td class="p-3">Manufacturing, military, healthcare IDs</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">ITF-14</td>
						<td class="p-3">Numeric only</td>
						<td class="p-3">14 digits</td>
						<td class="p-3">Shipping containers, carton-level tracking</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">Code 93</td>
						<td class="p-3">Alphanumeric</td>
						<td class="p-3">Variable</td>
						<td class="p-3">Postal services, electronic components</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">Codabar</td>
						<td class="p-3">Numeric + A-D delimiters</td>
						<td class="p-3">Variable</td>
						<td class="p-3">Blood banks, libraries, FedEx airbills</td>
					</tr>
					<tr class="border-b border-gray-200 hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">MSI</td>
						<td class="p-3">Numeric only</td>
						<td class="p-3">Variable</td>
						<td class="p-3">Warehouse shelves, inventory management</td>
					</tr>
					<tr class="hover:bg-[#ffc480]/10">
						<td class="p-3 font-black">Pharmacode</td>
						<td class="p-3">Numeric (3-131070)</td>
						<td class="p-3">1-6 digits</td>
						<td class="p-3">Pharmaceutical packaging and quality control</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- How to Create a Barcode -->
	<section class="mb-12">
		<div class="border-[3px] border-black bg-white shadow-[8px_8px_0_0_#1f2937] p-6 md:p-10">
			<h2 class="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter mb-6">
				How to Create a <span class="text-[#ff6b6b]">Barcode</span>
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="border-[3px] border-black p-5 bg-[#ffc480]/10">
					<div class="w-10 h-10 bg-black text-white font-black text-lg flex items-center justify-center mb-3">1</div>
					<h3 class="font-black text-lg mb-2">Enter Your Data</h3>
					<p class="text-sm font-medium text-gray-600">Type the text or numbers you want to encode. Choose a barcode format that matches your use case — Code 128 for general purpose, EAN-13 for retail products, UPC-A for US retail.</p>
				</div>
				<div class="border-[3px] border-black p-5 bg-[#4ade80]/10">
					<div class="w-10 h-10 bg-black text-white font-black text-lg flex items-center justify-center mb-3">2</div>
					<h3 class="font-black text-lg mb-2">Customize Appearance</h3>
					<p class="text-sm font-medium text-gray-600">Adjust bar width, height, colors, and choose whether to display the encoded text below the bars. Enable transparent background for overlay use.</p>
				</div>
				<div class="border-[3px] border-black p-5 bg-[#ff6b6b]/10">
					<div class="w-10 h-10 bg-black text-white font-black text-lg flex items-center justify-center mb-3">3</div>
					<h3 class="font-black text-lg mb-2">Download or Automate</h3>
					<p class="text-sm font-medium text-gray-600">Download as PNG, JPG, WebP, or SVG. For bulk generation, use the Pictify API to create thousands of unique barcodes programmatically from your inventory or product data.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Bulk Barcode Generation -->
	<section class="mb-12">
		<div class="border-[3px] border-black bg-[#0b0b1f] text-white shadow-[8px_8px_0_0_#1f2937] p-6 md:p-10">
			<div class="flex items-start gap-4 mb-4">
				<span class="px-3 py-1 bg-[#4ade80] text-black text-xs font-black uppercase tracking-wider border-[2px] border-[#4ade80] rounded">API</span>
			</div>
			<h2 class="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-3">
				Bulk Barcode Generation
			</h2>
			<p class="text-gray-300 font-medium mb-6 max-w-2xl">
				Need thousands of barcodes? Use the Pictify batch API to generate unique barcode images for every product, bin, or shipment in your system. Feed a CSV of SKUs and get back CDN-hosted barcode images in seconds.
			</p>
			<div class="flex flex-wrap gap-4">
				<a href="/signup" class="px-6 py-3 bg-[#4ade80] text-black font-black border-[3px] border-[#4ade80] rounded-xl uppercase tracking-wide hover:bg-[#22c55e] transition-colors">
					Get API Key
				</a>
				<a href="https://docs.pictify.io" target="_blank" rel="noopener noreferrer" class="px-6 py-3 bg-transparent text-white font-black border-[3px] border-white rounded-xl uppercase tracking-wide hover:bg-white/10 transition-colors">
					Batch API Docs
				</a>
			</div>
		</div>
	</section>

	<!-- Automate with API -->
	<ApiCodeSection
		title="Automate with the"
		titleHighlight="API"
		description="Generate barcodes programmatically. Render barcode labels, shipping tags, and inventory stickers via API in your warehouse, e-commerce, or logistics pipeline."
		codeExamples={barcodeCodeExamples}
	/>
</div>
