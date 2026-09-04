<script>
	/**
	 * /tools/csv-to-pdf — the v2 tool page, column mode.
	 *
	 * SEO copy is frozen: the two content sections, the FAQ and the three step
	 * headings are the wording that ranks, moved into the new layout unchanged.
	 * The quota ladder in the toolbar replaces GenerationLimitBanner.
	 */
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import LongformSection from '$lib/components/tools/v2/longform/LongformSection.svelte';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import Papa from 'papaparse';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { createImagePublic } from '../../../api/image.js';
	import { analytics } from '$lib/telemetry.js';

	$: isUserLoggedIn = !!$user?.email;

	const TOOL_NAME = 'csv_to_pdf';
	const TOOL_PATH = '/tools/csv-to-pdf';

	// Guests share the 5/day limit with every other free tool; the ladder in the
	// toolbar reads from the same store the render path increments.
	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));

	const RELATED = [
		{
			title: 'Table to image',
			meta: 'CSV · HTML → PNG',
			href: '/tools/table',
			art: '/landing/tools/table-to-image.svg'
		},
		{
			title: 'Invoice generator',
			meta: 'LINE ITEMS → PNG',
			href: '/tools/online-invoice-generator',
			art: '/landing/tools/invoice-generator.svg'
		},
		{
			title: 'Certificate generator',
			meta: 'NAMES → CERTIFICATES',
			href: '/tools/certificate-generator',
			art: '/landing/tools/certificate-generator.svg'
		}
	];

	// ── CSV state ────────────────────────────────────────────────────────────
	let rows = []; // array of objects keyed by header
	let headers = [];
	let fileName = '';
	let parseError = '';
	let csvText = '';

	// mode: 'per-row' (one PDF page per row) | 'table' (whole sheet as one page)
	let mode = 'per-row';

	let isGenerating = false;
	let progress = 0;
	let progressTotal = 0;
	let generatedImages = []; // [{ url, width, height }]
	let pdfBlobUrl = '';

	// Logged-in users get a generous client-side cap; guests are bound by the
	// shared 5/day guest limit like every other free tool.
	const MAX_ROWS_LOGGED_IN = 25;

	function handleFile(event) {
		const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
		if (!file) return;
		fileName = file.name;
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: onParsed,
			error: (err) => (parseError = err.message)
		});
	}

	function handlePaste() {
		if (!csvText.trim()) return;
		fileName = 'pasted data';
		Papa.parse(csvText.trim(), {
			header: true,
			skipEmptyLines: true,
			complete: onParsed,
			error: (err) => (parseError = err.message)
		});
	}

	function onParsed(result) {
		parseError = '';
		headers = (result.meta?.fields || []).filter(Boolean);
		rows = result.data || [];
		generatedImages = [];
		pdfBlobUrl = '';
		if (!headers.length || !rows.length) {
			parseError = 'Could not find a header row and data rows in that CSV.';
			return;
		}
		analytics.track?.('tool_csv_parsed', {
			tool_name: 'csv_to_pdf',
			rows: rows.length,
			columns: headers.length
		});
	}

	function loadSample() {
		csvText = `name,course,score,completed
Ada Lovelace,Advanced Analytics Bootcamp,94,2026-07-28
Tom Okafor,Advanced Analytics Bootcamp,88,2026-07-28
Mei-Ling Chen,Advanced Analytics Bootcamp,91,2026-07-29`;
		handlePaste();
	}

	// ── Templates ────────────────────────────────────────────────────────────
	const escapeHtml = (v) =>
		String(v ?? '')
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;');

	// A4 portrait at ~150dpi
	const PAGE_W = 1240;
	const PAGE_H = 1754;

	const baseCss = `
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { width: ${PAGE_W}px; min-height: ${PAGE_H}px; font-family: 'Inter', -apple-system, sans-serif; background: #ffffff; padding: 90px; }
		.rule { height: 4px; background: #1f2937; margin: 28px 0 40px; }
		.eyebrow { font-size: 16px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #6b7280; }
		.title { font-size: 52px; font-weight: 800; color: #111827; margin-top: 10px; line-height: 1.1; }
		.row { display: flex; border-bottom: 2px solid #e5e7eb; padding: 22px 4px; }
		.row .k { width: 34%; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
		.row .v { width: 66%; font-size: 24px; font-weight: 600; color: #111827; word-break: break-word; }
		.footer { margin-top: 60px; font-size: 16px; color: #9ca3af; font-weight: 600; }
		table { width: 100%; border-collapse: collapse; }
		th { text-align: left; font-size: 17px; text-transform: uppercase; letter-spacing: 0.05em; background: #1f2937; color: #fff; padding: 14px 12px; }
		td { font-size: 18px; color: #111827; padding: 13px 12px; border-bottom: 2px solid #e5e7eb; }
		tr:nth-child(even) td { background: #f9fafb; }
	`;

	// NOTE: the literal "<style>" tag is split so Svelte's preprocessor doesn't
	// mistake this template string for a component style block.
	const styleBlock = '<sty' + 'le>' + baseCss + '</sty' + 'le>';

	function rowDocumentHtml(row, index) {
		const titleValue = row[headers[0]] || `Record ${index + 1}`;
		const fields = headers
			.map(
				(h) =>
					`<div class="row"><div class="k">${escapeHtml(h)}</div><div class="v">${escapeHtml(
						row[h]
					)}</div></div>`
			)
			.join('');
		return `${styleBlock}<body>
			<div class="eyebrow">${escapeHtml(fileName || 'Document')} · ${index + 1} of ${rows.length}</div>
			<div class="title">${escapeHtml(titleValue)}</div>
			<div class="rule"></div>
			${fields}
			<div class="footer">Generated with Pictify: pictify.io/tools/csv-to-pdf</div>
		</body>`;
	}

	function tableDocumentHtml() {
		const displayRows = rows.slice(0, 40);
		const thead = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
		const tbody = displayRows
			.map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(r[h])}</td>`).join('')}</tr>`)
			.join('');
		const truncated =
			rows.length > 40
				? `<div class="footer">Showing first 40 of ${rows.length} rows. Sign up to render the full sheet.</div>`
				: `<div class="footer">Generated with Pictify: pictify.io/tools/csv-to-pdf</div>`;
		return `${styleBlock}<body>
			<div class="eyebrow">${escapeHtml(fileName || 'Spreadsheet')}</div>
			<div class="title">${rows.length} rows · ${headers.length} columns</div>
			<div class="rule"></div>
			<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
			${truncated}
		</body>`;
	}

	// ── Generation ───────────────────────────────────────────────────────────
	$: rowCap = isUserLoggedIn ? MAX_ROWS_LOGGED_IN : generationLimits.getRemaining();
	$: rowsToRender = mode === 'per-row' ? Math.min(rows.length, Math.max(rowCap, 0)) : 1;

	async function generate() {
		if (!rows.length) return;
		if (!isUserLoggedIn && !generationLimits.isWithinLimit()) {
			toast.set({
				message: 'Daily free limit reached. Sign up to keep generating.',
				type: 'error',
				duration: 3000
			});
			return;
		}

		isGenerating = true;
		generatedImages = [];
		pdfBlobUrl = '';
		progress = 0;
		progressTotal = rowsToRender;

		try {
			const jobs =
				mode === 'per-row'
					? rows.slice(0, rowsToRender).map((row, i) => rowDocumentHtml(row, i))
					: [tableDocumentHtml()];

			for (const html of jobs) {
				if (!isUserLoggedIn) {
					const ok = generationLimits.increment();
					if (!ok) break;
				}
				const { image } = await createImagePublic({
					html,
					width: PAGE_W,
					height: PAGE_H,
					fileExtension: 'png'
				});
				if (image?.url) {
					generatedImages = [...generatedImages, image];
					progress = generatedImages.length;
				}
			}

			if (generatedImages.length) {
				await buildPdf();
				analytics.trackImageGenerated?.({
					tool_name: 'csv_to_pdf',
					format: 'pdf',
					pages: generatedImages.length,
					mode
				});
			} else {
				throw new Error('No pages were generated');
			}
		} catch (e) {
			toast.set({
				message: e?.message?.includes('403')
					? 'Generation is only available from pictify.io'
					: e?.message || 'Failed to generate PDF',
				type: 'error',
				duration: 3000
			});
		} finally {
			isGenerating = false;
		}
	}

	async function buildPdf() {
		const { jsPDF } = await import('jspdf');
		const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
		const pageW = pdf.internal.pageSize.getWidth();
		const pageH = pdf.internal.pageSize.getHeight();

		for (let i = 0; i < generatedImages.length; i++) {
			if (i > 0) pdf.addPage();
			// Fetch through the same-origin asset proxy: media.pictify.io serves a
			// malformed duplicate CORS header, so a direct cross-origin fetch fails.
			const proxied = `/api/asset?url=${encodeURIComponent(generatedImages[i].url)}`;
			const blob = await fetch(proxied).then((r) => r.blob());
			const dataUrl = await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.readAsDataURL(blob);
			});
			pdf.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH);
		}
		pdfBlobUrl = pdf.output('bloburl');
	}

	// ── SEO data ─────────────────────────────────────────────────────────────
	const faqs = [
		{
			q: 'How do I convert a CSV file to PDF?',
			a: 'Upload or paste your CSV above. Choose "one document per row" to get a clean PDF page for every data row, or "whole sheet" to render the table as a single-page PDF. Click Generate and download the result: free, in your browser, no signup required.'
		},
		{
			q: 'Can each CSV row become its own PDF document?',
			a: "Yes, that is this tool's specialty. Every row renders as its own formatted document page: the first column becomes the document title and every column becomes a labeled field. With a free account you can go further and use branded templates (certificates, letters, reports) instead of the default layout."
		},
		{
			q: 'Can I render a whole sheet at once instead of row by row?',
			a: 'Yes, with a Pictify batch run. Point it at the same CSV and every row renders against your template in one job: a CDN link per document, a per-row status you can poll, and a webhook when the batch finishes. That is the part no converter or spreadsheet add-on does.'
		},
		{
			q: 'Is there a row limit?',
			a: 'The free browser tool renders up to 5 pages per day for guests and 25 rows per run for signed-in users. Workflows and the batch API handle hundreds of rows per run with per-row results.'
		},
		{
			q: 'Can I automate CSV to PDF conversion?',
			a: 'Yes. The REST API renders any HTML template to PDF (including multi-page): POST your data, get a document URL back. Workflows accept a CSV upload or a signed webhook, so your CRM, form tool, or n8n/Zapier/Make flow can trigger document generation automatically.'
		},
		{
			q: 'Does my data leave my browser?',
			a: 'Rows are sent to the Pictify rendering API over HTTPS to produce each page, and rendered files are stored on the CDN so you can download them. Your CSV itself is never stored; parsing happens in your browser.'
		}
	];

	const faqSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.q,
			acceptedAnswer: { '@type': 'Answer', text: faq.a }
		}))
	});

	const structuredDataJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify CSV to PDF Converter',
		url: 'https://pictify.io/tools/csv-to-pdf',
		description:
			'Convert CSV to PDF free in your browser: render the whole sheet as a table, or turn every row into its own formatted PDF document.',
		applicationCategory: ['BusinessApplication', 'Utility'],
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify.io', url: 'https://pictify.io' }
	});

	const breadcrumbSchemaJson = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pictify.io/' },
			{ '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://pictify.io/tools' },
			{ '@type': 'ListItem', position: 3, name: 'CSV to PDF' }
		]
	});
</script>

<svelte:head>
	<title>CSV to PDF Converter: Free, Every Row Becomes a Document | Pictify</title>
	<meta
		name="description"
		content="Convert CSV to PDF free in your browser. Render the sheet as a clean table PDF, or turn every row into its own document, then batch render the whole file through the Pictify API."
	/>
	<meta
		name="keywords"
		content="csv to pdf, csv to pdf converter, convert csv to pdf, spreadsheet to pdf, csv to documents, generate pdf from spreadsheet, csv to pdf free, Pictify"
	/>
	<link rel="canonical" href="https://pictify.io/tools/csv-to-pdf" />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta
		property="og:title"
		content="CSV to PDF Converter: Every Row Becomes a Document | Pictify"
	/>
	<meta
		property="og:description"
		content="Free CSV to PDF converter. Whole sheet as a table, or one formatted document per row. Then deliver each one by email."
	/>
	<meta property="og:url" content="https://pictify.io/tools/csv-to-pdf" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Pictify" />
	<meta property="og:image" content="https://media.pictify.io/v3g37-1775406808141.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="CSV to PDF Converter: Every Row Becomes a Document | Pictify"
	/>
	<meta
		name="twitter:description"
		content="Free CSV to PDF converter. Whole sheet as a table, or one formatted document per row."
	/>
	<meta name="twitter:image" content="https://media.pictify.io/v3g37-1775406808141.png" />
	{@html `<script type="application/ld+json">${structuredDataJson}</script>`}
	{@html `<script type="application/ld+json">${faqSchemaJson}</script>`}
	{@html `<script type="application/ld+json">${breadcrumbSchemaJson}</script>`}
</svelte:head>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="CSV TO PDF"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · TABLE OR ONE PAGE PER ROW"
	related={RELATED}
	loggedIn={isUserLoggedIn}
	hasResult={!!pdfBlobUrl}
	longform="column"
>
	<h1
		slot="h1"
		class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
	>
		<span>CSV</span>
		<span>TO PDF</span>
	</h1>

	<p
		slot="hero-sub"
		class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
	>
		Turn a spreadsheet into
		<span class="font-medium">real documents</span>: the whole sheet as a table, or one formatted
		PDF page per row.
		<span class="text-brand-slate">Free, in your browser. No signup required.</span>
	</p>

	<div slot="tool">
		<ToolCard>
			<div class="flex flex-col gap-6 p-5 lg:p-7">
				<div class="flex flex-col gap-4">
					<h2 class="font-semibold text-lg sm:text-xl mb-4 flex items-center gap-3">
						<span
							class="w-8 h-8 flex items-center justify-center bg-brand-field border border-brand-ink font-semibold"
							>1</span
						>
						Add your CSV
					</h2>
					<div class="grid md:grid-cols-2 gap-5">
						<label
							class="flex flex-col items-center justify-center border border-dashed border-brand-mute hover:border-black bg-brand-subtle p-8 cursor-pointer transition-colors text-center"
							on:drop|preventDefault={handleFile}
							on:dragover|preventDefault
						>
							<svg
								class="w-8 h-8 mb-2 text-brand-mute"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/></svg
							>
							<span class="font-semibold text-sm">Upload or drop a .csv file</span>
							<span class="text-xs text-brand-mute font-semibold mt-1"
								>{fileName || 'header row required'}</span
							>
							<input type="file" accept=".csv,text/csv" class="hidden" on:change={handleFile} />
						</label>
						<div class="flex flex-col">
							<textarea
								bind:value={csvText}
								rows="5"
								placeholder={'or paste CSV here…\nname,email,score\nAda,ada@example.com,94'}
								class="flex-1 border border-brand-ink p-3 font-mono text-xs resize-none focus:outline-none focus:ring-0"
							/>
							<div class="flex gap-3 mt-3">
								<button
									on:click={handlePaste}
									class="px-4 py-2 bg-brand-press text-white border border-brand-ink font-semibold text-xs tracking-wide transition-all"
									>Use pasted data</button
								>
								<button
									on:click={loadSample}
									class="px-4 py-2 bg-brand-paper text-brand-ink border border-brand-ink font-semibold text-xs tracking-wide transition-all"
									>Try sample data</button
								>
							</div>
						</div>
					</div>
					{#if parseError}
						<p class="mt-4 text-sm font-bold text-brand-alarm">{parseError}</p>
					{/if}
					{#if rows.length}
						<p class="mt-4 text-sm font-bold text-brand-slate">
							Parsed <span class="bg-brand-proof px-1 border-b-2 border-brand-ink"
								>{rows.length} rows</span
							>
							· {headers.length} columns:
							<span class="font-mono text-xs">{headers.join(', ')}</span>
						</p>
					{/if}
				</div>
				{#if rows.length}
					<div class="flex flex-col gap-4">
						<h2 class="font-semibold text-lg sm:text-xl mb-4 flex items-center gap-3">
							<span
								class="w-8 h-8 flex items-center justify-center bg-brand-field border border-brand-ink font-semibold"
								>2</span
							>
							Choose the output
						</h2>
						<div class="grid md:grid-cols-2 gap-4">
							<button
								class="text-left p-5 border border-brand-ink transition-all {mode === 'per-row'
									? 'bg-brand-press text-white'
									: 'bg-brand-paper hover:bg-brand-subtle'}"
								on:click={() => (mode = 'per-row')}
							>
								<div class="font-semibold mb-1">One document per row</div>
								<p
									class="text-xs font-semibold {mode === 'per-row'
										? 'text-brand-press-text'
										: 'text-brand-mute'}"
								>
									Every row becomes its own formatted PDF page: titles, labeled fields, ready to
									send. {rows.length} rows → {Math.min(rows.length, rowsToRender) || 0} pages now{rows.length >
									rowsToRender
										? ` (free cap)`
										: ''}.
								</p>
							</button>
							<button
								class="text-left p-5 border border-brand-ink transition-all {mode === 'table'
									? 'bg-brand-press text-white'
									: 'bg-brand-paper hover:bg-brand-subtle'}"
								on:click={() => (mode = 'table')}
							>
								<div class="font-semibold mb-1">Whole sheet as a table</div>
								<p
									class="text-xs font-semibold {mode === 'table'
										? 'text-brand-press-text'
										: 'text-brand-mute'}"
								>
									One clean, print-ready PDF of the table itself (first 40 rows).
								</p>
							</button>
						</div>
					</div>
				{/if}
			</div>

			<svelte:fragment slot="toolbar-left">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">
					{rows.length ? `${rows.length} ROWS · ${headers.length} COLUMNS` : 'CSV → PDF'}
				</span>
			</svelte:fragment>

			<svelte:fragment slot="toolbar-right">
				<QuotaMeter
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
				/>
				<GenerateButton
					label={isGenerating ? `Rendering ${progress}/${progressTotal}…` : 'Generate PDF'}
					loading={isGenerating}
					ready={rows.length > 0}
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
					on:generate={generate}
				/>
			</svelte:fragment>
		</ToolCard>
	</div>

	<div slot="result">
		{#if pdfBlobUrl}
			<div class="bg-brand-press border border-brand-ink p-5 sm:p-8 text-white">
				<h2 class="font-semibold text-lg sm:text-xl mb-4 flex items-center gap-3">
					<span
						class="w-8 h-8 flex items-center justify-center bg-brand-proof text-brand-ink border border-brand-ink font-semibold"
						>✓</span
					>
					Your PDF is ready
				</h2>
				<div class="flex flex-wrap gap-3 mb-6">
					<a
						href={pdfBlobUrl}
						download="{(fileName || 'documents').replace(/\.csv$/i, '')}.pdf"
						on:click={() =>
							analytics.trackDownload({
								content_type: 'document',
								format: 'pdf',
								tool_name: 'csv_to_pdf'
							})}
						class="px-6 py-3 bg-brand-proof text-brand-ink border border-white/30 font-semibold text-sm tracking-wide transition-all"
						>Download PDF ({generatedImages.length} page{generatedImages.length === 1
							? ''
							: 's'})</a
					>
				</div>
				{#if mode === 'per-row'}
					<div class="border-t border-white/20 pt-5">
						<p class="font-bold text-brand-press-text text-sm leading-relaxed">
							<span class="text-white font-semibold">Next step:</span> this run stopped at the free
							cap. A batch render takes the whole sheet
							{rows.length > rowsToRender ? `(all ${rows.length}, not just ${rowsToRender})` : ''}
							against a branded template and gives you
							<span class="text-brand-proof font-semibold">a result per row</span>: a CDN link for
							each document, and a webhook when the batch finishes.
						</p>
						<a
							href="/signup?redirect=%2Fdashboard%2Fworkflows%2Fnew"
							class="inline-block mt-4 px-6 py-3 bg-brand-paper text-brand-ink border border-white/30 font-semibold text-sm tracking-wide transition-all"
							>Render The Whole Sheet →</a
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="about" first>
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-brand-ink"
			>
				A CSV to PDF converter that understands rows are people
			</h2>
			<p class="text-sm sm:text-base text-brand-slate leading-relaxed font-medium mb-4">
				Most CSV to PDF converters print your spreadsheet as one long table, fine for archiving,
				useless when each row is a person who needs their own document. This tool does both jobs:
				render the whole sheet as a clean table PDF, or flip one switch and every row becomes its
				own formatted page, with the first column as the title and every column as a labeled field.
			</p>
			<p class="text-sm sm:text-base text-brand-slate leading-relaxed font-medium">
				And when the sheet is longer than the free cap, a
				<a href="/docs" class="underline font-semibold">Pictify batch run</a>
				takes the same CSV, renders each row against a branded template (certificate, letter, report,
				or one the
				<span class="font-semibold">AI Template Maker</span> writes from your description), and hands
				back a CDN link per document with a webhook when the run finishes.
			</p>
		</LongformSection>

		<LongformSection index="02" id="faq">
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-brand-ink"
			>
				Frequently Asked Questions
			</h2>
			<div class="space-y-3">
				{#each faqs as faq}
					<details
						class="group bg-brand-subtle border border-brand-ink overflow-hidden transition-all"
					>
						<summary
							class="flex items-center justify-between cursor-pointer p-4 font-bold text-brand-ink select-none text-sm"
						>
							<span>{faq.q}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-brand-ink group-open:rotate-180 transition-transform duration-300 flex-shrink-0"
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
							class="p-4 pt-0 text-brand-slate border-t-[3px] border-black bg-brand-paper text-sm"
						>
							{faq.a}
						</div>
					</details>
				{/each}
			</div>
		</LongformSection>
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<RelatedTools tools={['table', 'json-to-image', 'markdown', 'receipt']} />
		</div>
	</svelte:fragment>
</ToolPageShell>
