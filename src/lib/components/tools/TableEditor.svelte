<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Papa from 'papaparse';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { basicSetup } from 'codemirror';
	import { html as htmlLang } from '@codemirror/lang-html';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { indentWithTab } from '@codemirror/commands';
	import Toast from '$lib/components/Toast.svelte';
	import { createImagePublic } from '../../../api/image.js';
	import { toast } from '../../../store/toast.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/analytics.js';

	export let isUserLoggedIn = false;

	// ── Input mode ──
	let inputMode = 'csv'; // 'csv' | 'html'

	// ── Theme definitions ──
	const themes = [
		{
			id: 'corporate',
			name: 'Corporate Blue',
			type: 'light',
			bodyBg: '#f1f7ff',
			cardBg: '#ffffff',
			headerBg: '#0f3c6e',
			headerText: '#ffffff',
			textColor: '#1f2937',
			borderColor: '#e2e8f0',
			stripeBg: '#f5f9ff',
			accentColor: '#0f3c6e'
		},
		{
			id: 'minimal-light',
			name: 'Minimal Light',
			type: 'light',
			bodyBg: '#fafafa',
			cardBg: '#ffffff',
			headerBg: '#f8fafc',
			headerText: '#111827',
			textColor: '#374151',
			borderColor: '#e5e7eb',
			stripeBg: '#f9fafb',
			accentColor: '#6b7280'
		},
		{
			id: 'warm',
			name: 'Warm Sand',
			type: 'light',
			bodyBg: '#fef7ed',
			cardBg: '#ffffff',
			headerBg: '#92400e',
			headerText: '#ffffff',
			textColor: '#1c1917',
			borderColor: '#e7e5e4',
			stripeBg: '#fef3c7',
			accentColor: '#92400e'
		},
		{
			id: 'dark',
			name: 'Dark Mode',
			type: 'dark',
			bodyBg: '#0f172a',
			cardBg: '#1e293b',
			headerBg: '#334155',
			headerText: '#f1f5f9',
			textColor: '#cbd5e1',
			borderColor: '#334155',
			stripeBg: '#1e293b',
			accentColor: '#60a5fa'
		},
		{
			id: 'midnight',
			name: 'Midnight Green',
			type: 'dark',
			bodyBg: '#022c22',
			cardBg: '#064e3b',
			headerBg: '#065f46',
			headerText: '#ecfdf5',
			textColor: '#a7f3d0',
			borderColor: '#065f46',
			stripeBg: '#064e3b',
			accentColor: '#34d399'
		},
		{
			id: 'neon',
			name: 'Neon Dark',
			type: 'dark',
			bodyBg: '#0a0a0a',
			cardBg: '#141414',
			headerBg: '#1a1a1a',
			headerText: '#f0abfc',
			textColor: '#e2e8f0',
			borderColor: '#2d2d2d',
			stripeBg: '#111111',
			accentColor: '#f0abfc'
		}
	];

	const fonts = [
		{ id: 'inter', name: 'Inter', css: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap', family: "'Inter', system-ui, sans-serif" },
		{ id: 'jetbrains', name: 'JetBrains Mono', css: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap', family: "'JetBrains Mono', monospace" },
		{ id: 'source-serif', name: 'Source Serif Pro', css: 'https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&display=swap', family: "'Source Serif Pro', Georgia, serif" },
		{ id: 'roboto', name: 'Roboto', css: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap', family: "'Roboto', sans-serif" },
		{ id: 'system', name: 'System Default', css: '', family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }
	];

	// ── State ──
	let csvInput = `Name,Role,Department,Status
Alice Johnson,Engineering Manager,Engineering,Active
Bob Smith,Senior Developer,Engineering,Active
Carol Williams,Product Designer,Design,Active
David Brown,Marketing Lead,Marketing,On Leave
Eva Martinez,Data Analyst,Analytics,Active
Frank Lee,DevOps Engineer,Engineering,Active`;

	let htmlInput = `<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Department</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice Johnson</td>
      <td>Engineering Manager</td>
      <td>Engineering</td>
      <td>Active</td>
    </tr>
    <tr>
      <td>Bob Smith</td>
      <td>Senior Developer</td>
      <td>Engineering</td>
      <td>Active</td>
    </tr>
    <tr>
      <td>Carol Williams</td>
      <td>Product Designer</td>
      <td>Design</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>`;

	let themeId = 'corporate';
	let fontId = 'inter';
	let previewWidth = 1200;
	let previewHeight = 630;
	let srcdocKey = 0;
	let tableTitle = 'Team Directory';

	// Generation state
	let isGenerating = false;
	let generatedImageUrl = '';
	let generationError = '';
	let measuredHeight = 0;

	// Growth loop
	let showUpgradePrompt = false;
	let showFirstGenerationPrompt = false;
	let hasTrackedFirstInput = false;

	// API snippet language toggle
	let apiLang = 'javascript';

	// Debounce
	let debounceTimer;

	// CodeMirror refs
	let csvEditorEl;
	let htmlEditorEl;
	let csvEditorView;
	let htmlEditorView;

	// Reactive
	$: theme = themes.find((t) => t.id === themeId) || themes[0];
	$: font = fonts.find((f) => f.id === fontId) || fonts[0];
	$: lightThemes = themes.filter((t) => t.type === 'light');
	$: darkThemes = themes.filter((t) => t.type === 'dark');
	$: generationsUsed = $generationLimits?.count || 0;
	$: remaining = GUEST_DAILY_LIMIT - generationsUsed;
	$: limitReached = !isUserLoggedIn && remaining <= 0;

	function handleInput() {
		if (!hasTrackedFirstInput) {
			hasTrackedFirstInput = true;
			analytics.track('tool_first_input', { tool_name: 'table_to_image' });
		}
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => { srcdocKey++; }, 300);
	}

	$: if (themeId || fontId || previewWidth || previewHeight || tableTitle) {
		srcdocKey++;
	}

	// ── CSV to HTML ──
	function csvToHtmlTable(csv) {
		if (!csv?.trim()) return '';
		const result = Papa.parse(csv.trim(), { header: false, skipEmptyLines: true });
		if (!result.data || result.data.length === 0) return '';

		const rows = result.data;
		const headerRow = rows[0];
		const bodyRows = rows.slice(1);

		let html = '<table><thead><tr>';
		headerRow.forEach((cell) => { html += `<th>${escapeHtml(cell.trim())}</th>`; });
		html += '</tr></thead><tbody>';
		bodyRows.forEach((row) => {
			html += '<tr>';
			row.forEach((cell) => { html += `<td>${escapeHtml((cell || '').trim())}</td>`; });
			html += '</tr>';
		});
		html += '</tbody></table>';
		return html;
	}

	function escapeHtml(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	// Avoid literal style tags so Svelte's CSS preprocessor doesn't try to parse runtime content
	function returnStyleTag(css) {
		const openTag = String.fromCharCode(60, 115, 116, 121, 108, 101, 62);
		const closeTag = String.fromCharCode(60, 47, 115, 116, 121, 108, 101, 62);
		const tagRegex = new RegExp(openTag + '([\\s\\S]*?)' + closeTag);
		const match = tagRegex.exec(css);
		if (match) return css;
		return css.replace('[styleOpen]', openTag).replace('[styleClose]', closeTag);
	}

	$: tableHtml = inputMode === 'csv' ? csvToHtmlTable(csvInput) : htmlInput;
	$: srcdocContent = buildSrcDoc(tableHtml, theme, font, tableTitle);

	function buildSrcDoc(html, t, f, title) {
		const fontCSS = f.css ? `<link rel="stylesheet" href="${f.css}">` : '';
		const placeholderHtml = html?.trim()
			? html
			: '<p style="opacity:0.4;font-style:italic;text-align:center;padding:40px;">Paste your table data above...</p>';

		return `<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	${fontCSS}
	${returnStyleTag(`[styleOpen]
		* { margin: 0; padding: 0; box-sizing: border-box; }
		html, body { margin: 0; padding: 0; background: ${t.bodyBg}; }
		.wrapper {
			width: 100%;
			background: ${t.bodyBg};
			padding: 48px;
			min-height: 100%;
			box-sizing: border-box;
		}
		.card {
			max-width: 100%;
			margin: 0 auto;
			background: ${t.cardBg};
			border-radius: 16px;
			border: 1px solid ${t.borderColor};
			padding: 32px;
			box-shadow: 0 4px 24px rgba(0,0,0,0.08);
		}
		.title {
			font-family: ${f.family};
			font-size: 24px;
			font-weight: 700;
			color: ${t.type === 'dark' ? t.headerText : t.accentColor};
			margin-bottom: 20px;
		}
		table {
			width: 100%;
			border-collapse: collapse;
			font-family: ${f.family};
			font-size: 15px;
			color: ${t.textColor};
		}
		thead { background: ${t.headerBg}; }
		th {
			padding: 14px 18px;
			text-align: left;
			font-weight: 600;
			color: ${t.headerText};
			font-size: 13px;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		td {
			padding: 14px 18px;
			border-bottom: 1px solid ${t.borderColor};
		}
		tbody tr:nth-child(even) { background: ${t.stripeBg}; }
		tbody tr:hover { background: ${t.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}; }
		thead tr:first-child th:first-child { border-radius: 8px 0 0 0; }
		thead tr:first-child th:last-child { border-radius: 0 8px 0 0; }
	[styleClose]`)}
</head>
<body>
	<div class="wrapper">
		<div class="card">
			${title ? `<div class="title">${escapeHtml(title)}</div>` : ''}
			${placeholderHtml}
		</div>
	</div>
	<script>
		window.addEventListener('load', function() {
			var h = document.querySelector('.wrapper').scrollHeight;
			window.parent.postMessage({ type: 'measured-height', height: h }, '*');
		});
	<\/script>
</body>
</html>`;
	}

	// Listen for height measurements
	function handleMessage(e) {
		// Sandboxed iframes post with a null origin; reject anything else
		if (e.origin !== 'null' && e.origin !== null) return;
		if (e.data?.type === 'measured-height' && e.data.height > 0) {
			measuredHeight = Math.min(e.data.height, 5000);
		}
	}

	function initCsvEditor() {
		if (!csvEditorEl || csvEditorView) return;
		csvEditorView = new EditorView({
			state: EditorState.create({
				doc: csvInput,
				extensions: [
					basicSetup,
					oneDark,
					keymap.of([indentWithTab]),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							csvInput = update.state.doc.toString();
							handleInput();
						}
					}),
					EditorView.theme({
						'&': { fontSize: '13px' },
						'.cm-scroller': { minHeight: '300px', overflow: 'auto' },
						'.cm-content': { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }
					}),
					EditorView.lineWrapping
				]
			}),
			parent: csvEditorEl
		});
	}

	function initHtmlEditor() {
		if (!htmlEditorEl || htmlEditorView) return;
		htmlEditorView = new EditorView({
			state: EditorState.create({
				doc: htmlInput,
				extensions: [
					basicSetup,
					htmlLang({ selfClosingTags: true }),
					oneDark,
					keymap.of([indentWithTab]),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							htmlInput = update.state.doc.toString();
							handleInput();
						}
					}),
					EditorView.theme({
						'&': { fontSize: '13px' },
						'.cm-scroller': { minHeight: '300px', overflow: 'auto' },
						'.cm-content': { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }
					}),
					EditorView.lineWrapping
				]
			}),
			parent: htmlEditorEl
		});
	}

	// Re-initialize editor when input mode changes
	$: if (browser && inputMode === 'csv' && csvEditorEl) {
		// Destroy HTML editor if it exists
		if (htmlEditorView) { htmlEditorView.destroy(); htmlEditorView = null; }
		initCsvEditor();
	}
	$: if (browser && inputMode === 'html' && htmlEditorEl) {
		// Destroy CSV editor if it exists
		if (csvEditorView) { csvEditorView.destroy(); csvEditorView = null; }
		initHtmlEditor();
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('message', handleMessage);
			analytics.trackToolOpened({ tool_name: 'table_to_image' });
			generationLimits.refresh();
			// Init the default editor
			if (inputMode === 'csv') initCsvEditor();
			else initHtmlEditor();
		}
		return () => {
			if (browser) {
				window.removeEventListener('message', handleMessage);
				clearTimeout(debounceTimer);
				if (csvEditorView) csvEditorView.destroy();
				if (htmlEditorView) htmlEditorView.destroy();
			}
		};
	});

	// ── Generation ──
	async function handleGenerate() {
		if (isGenerating) return;
		const input = inputMode === 'csv' ? csvInput : htmlInput;
		if (!input?.trim()) {
			toast.set({ message: 'Please enter some table data first', type: 'error', duration: 2000 });
			return;
		}

		if (limitReached) {
			showUpgradePrompt = true;
			toast.set({ message: 'Daily limit reached. Create a free account for more.', type: 'error', duration: 3000 });
			return;
		}

		generationLimits.increment();
		isGenerating = true;
		generationError = '';
		generatedImageUrl = '';

		try {
			let html = buildSrcDoc(tableHtml, theme, font, tableTitle);

			if (!isUserLoggedIn) {
				const watermarkDiv = `
					<div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
						padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
						font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						pictify.io
					</div>`;
				html = html.replace('</body>', `${watermarkDiv}</body>`);
			}

			const renderHeight = measuredHeight > previewHeight ? measuredHeight + 40 : previewHeight;

			const { image } = await createImagePublic({
				html,
				width: previewWidth,
				height: renderHeight,
				fileExtension: 'png',
				selector: '.wrapper'
			});

			generatedImageUrl = image.url;
			analytics.trackImageGenerated({
				tool_name: 'table_to_image',
				format: 'png',
				with_watermark: !isUserLoggedIn
			});

			if (!isUserLoggedIn) {
				const currentCount = $generationLimits?.count || 0;
				if (currentCount === 1) {
					showFirstGenerationPrompt = true;
				} else if (currentCount >= GUEST_DAILY_LIMIT) {
					showUpgradePrompt = true;
				}
			}

			toast.set({ message: 'Image generated!', type: 'success', duration: 1500 });
		} catch (e) {
			if (e.message?.includes('rate') || e.status === 429) {
				generationError = 'Too many requests. Please wait a moment and try again.';
			} else {
				generationError = e.message || 'Failed to generate image';
			}
			toast.set({ message: generationError, type: 'error', duration: 3000 });
		} finally {
			isGenerating = false;
		}
	}

	function copyToClipboard(text, label) {
		if (!browser) return;
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: `${label} copied to clipboard!`, type: 'success', duration: 2000 });
		}).catch(() => {
			// Fallback for insecure contexts
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			toast.set({ message: `${label} copied to clipboard!`, type: 'success', duration: 2000 });
		});
	}

	function handleDownload() {
		analytics.track('tool_download', { tool_name: 'table_to_image' });
	}

	function handleSignupClick() {
		analytics.track('tool_signup_click', { tool_name: 'table_to_image' });
	}
</script>

<!-- ── Editor + Preview Layout ── -->
<div class="max-w-5xl mx-auto px-4 mb-20">
	<!-- Input Mode Toggle + Title -->
	<div class="flex flex-wrap items-center gap-4 mb-6">
		<div class="flex bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] overflow-hidden">
			<button
				on:click={() => { inputMode = 'csv'; srcdocKey++; }}
				class="px-5 py-2.5 text-sm font-black uppercase tracking-wider transition-colors
					{inputMode === 'csv' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}"
			>
				CSV
			</button>
			<button
				on:click={() => { inputMode = 'html'; srcdocKey++; }}
				class="px-5 py-2.5 text-sm font-black uppercase tracking-wider border-l-[3px] border-gray-900 transition-colors
					{inputMode === 'html' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}"
			>
				HTML
			</button>
		</div>

		<div class="flex items-center gap-2 bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2.5 shadow-[4px_4px_0_0_#1f2937] flex-1 min-w-[200px]">
			<span class="text-xs font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Title</span>
			<input
				type="text"
				bind:value={tableTitle}
				on:input={handleInput}
				placeholder="Optional table title..."
				class="flex-1 text-sm font-bold bg-transparent outline-none"
			/>
		</div>
	</div>

	<!-- Controls Bar -->
	<div class="flex flex-wrap gap-3 mb-6">
		<div class="flex items-center gap-2 bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2.5 shadow-[4px_4px_0_0_#1f2937]">
			<span class="text-xs font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">Theme</span>
			<select bind:value={themeId} class="text-sm font-bold bg-transparent outline-none cursor-pointer">
				<optgroup label="Light">
					{#each lightThemes as t}
						<option value={t.id}>{t.name}</option>
					{/each}
				</optgroup>
				<optgroup label="Dark">
					{#each darkThemes as t}
						<option value={t.id}>{t.name}</option>
					{/each}
				</optgroup>
			</select>
		</div>

		<div class="flex items-center gap-2 bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2.5 shadow-[4px_4px_0_0_#1f2937]">
			<span class="text-xs font-black uppercase tracking-widest text-gray-500">Font</span>
			<select bind:value={fontId} class="text-sm font-bold bg-transparent outline-none cursor-pointer">
				{#each fonts as f}
					<option value={f.id}>{f.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex items-center gap-2 bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2.5 shadow-[4px_4px_0_0_#1f2937]">
			<span class="text-xs font-black uppercase tracking-widest text-gray-500">Size</span>
			<input type="number" bind:value={previewWidth} min="200" max="2400" class="w-16 text-sm font-bold bg-transparent outline-none text-center" />
			<span class="text-gray-400 font-bold">x</span>
			<input type="number" bind:value={previewHeight} min="200" max="2400" class="w-16 text-sm font-bold bg-transparent outline-none text-center" />
		</div>
	</div>

	<!-- Editor + Preview Grid -->
	<div class="grid grid-cols-1 gap-6">
		<!-- Input Panel -->
		<div class="bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col min-h-[400px] max-h-[700px]">
			<div class="bg-gray-50 border-b-[3px] border-gray-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900" />
					<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-gray-900" />
					<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-gray-900" />
				</div>
				<span class="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
					{inputMode === 'csv' ? 'CSV Data' : 'HTML Table'}
				</span>
			</div>
			{#if inputMode === 'csv'}
				<div bind:this={csvEditorEl} class="flex-1 overflow-y-auto" />
			{:else}
				<div bind:this={htmlEditorEl} class="flex-1 overflow-y-auto" />
			{/if}
		</div>

		<!-- Preview Panel -->
		<div class="bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col min-h-[400px] max-h-[700px]">
			<div class="bg-gray-50 border-b-[3px] border-gray-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900" />
					<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-gray-900" />
					<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-gray-900" />
				</div>
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 bg-[#4ade80]/20 border border-[#4ade80] rounded text-[10px] font-bold text-gray-700 uppercase tracking-wider">Live Preview</span>
					<span class="font-mono text-xs font-bold text-gray-500">{previewWidth}x{previewHeight}</span>
				</div>
			</div>
			<div class="flex-1 overflow-y-auto bg-gray-100">
				{#key srcdocKey}
					<iframe
						srcdoc={srcdocContent}
						title="Table preview"
						class="w-full border-0 bg-white"
						style="height: {Math.max(600, measuredHeight || 600)}px;"
						sandbox="allow-scripts"
					/>
				{/key}
			</div>
		</div>
	</div>

	<!-- Generate Button -->
	<div class="flex items-center justify-center mt-10">
		{#if limitReached}
			<a
				href="/signup?redirect=/tools/table"
				on:click={handleSignupClick}
				class="px-10 py-5 bg-[#ff6b6b] text-white border-[3px] border-gray-900 font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all inline-flex items-center gap-3 rounded-2xl"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
				Sign Up to Continue
			</a>
		{:else}
			<button
				type="button"
				on:click={handleGenerate}
				disabled={isGenerating}
				class="px-10 py-5 bg-[#4ade80] text-gray-900 border-[3px] border-gray-900 font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#1f2937] hover:shadow-[3px_3px_0_0_#1f2937] hover:translate-x-[3px] hover:translate-y-[3px] transition-all inline-flex items-center gap-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if isGenerating}
					<svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
					Generating...
				{:else}
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
					Generate Image
				{/if}
			</button>
		{/if}
	</div>

	{#if !isUserLoggedIn}
		<p class="text-center text-sm font-bold mt-4" class:text-gray-500={!limitReached} class:text-red-500={limitReached}>
			{#if limitReached}
				Daily limit reached. Sign up for unlimited access.
			{:else}
				{remaining} free generation{remaining !== 1 ? 's' : ''} remaining today
			{/if}
		</p>
	{/if}

	<!-- Generated Result -->
	{#if generatedImageUrl}
		<div class="mt-12">
			<div class="bg-white border-[3px] border-gray-900 rounded-3xl p-8 md:p-12 shadow-[8px_8px_0_0_#1f2937] text-center relative overflow-hidden">
				<div class="absolute top-0 right-0 w-40 h-40 bg-[#4ade80]/10 rounded-full -mr-10 -mt-10" />
				<span class="inline-block px-4 py-1.5 bg-[#4ade80] text-white border-[3px] border-gray-900 rounded-full text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937] mb-6">Success</span>
				<h3 class="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">Your image is ready</h3>
				<div class="inline-block bg-white border-[3px] border-gray-900 p-2 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-10">
					<img src={generatedImageUrl} alt="Generated table" class="max-w-full h-auto max-h-[500px]" />
				</div>
				<div class="flex flex-wrap justify-center gap-4">
					<a href={generatedImageUrl} download="pictify-table.png" on:click={handleDownload}
						class="px-6 py-3 bg-gray-900 text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
						Download PNG
					</a>
					<button on:click={() => copyToClipboard(generatedImageUrl, 'Link')}
						class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
						Copy Link
					</button>
					<button on:click={() => copyToClipboard(`<img src="${generatedImageUrl}" alt="Table image" />`, 'HTML')}
						class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
						Copy HTML
					</button>
				</div>
			</div>
		</div>
	{:else if generationError}
		<div class="mt-8">
			<div class="bg-white border-[3px] border-gray-900 rounded-3xl p-6 shadow-[8px_8px_0_0_#1f2937] flex items-center gap-4">
				<div class="w-12 h-12 bg-[#ff6b6b] border-[3px] border-gray-900 rounded-xl flex items-center justify-center text-white font-black shadow-[3px_3px_0_0_#1f2937]">!</div>
				<div class="flex-1">
					<h4 class="font-black text-gray-900 uppercase tracking-wide">Generation Failed</h4>
					<p class="text-gray-600 font-medium">{generationError}</p>
				</div>
				<button on:click={handleGenerate}
					class="px-5 py-2.5 bg-[#ff6b6b] text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg text-sm">
					Retry
				</button>
			</div>
		</div>
	{/if}

	<!-- Programmatic Usage Section -->
	<section class="mt-20">
		<div class="text-center mb-12">
			<div class="inline-block bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform rotate-1 rounded-lg">
				<span class="font-black uppercase tracking-widest text-sm">For Developers</span>
			</div>
			<h2 class="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">
				Automate with the <span class="text-[#ff6b6b]">API</span>
			</h2>
			<p class="text-lg md:text-xl font-bold text-gray-700 mt-4 max-w-3xl mx-auto">
				Generate table images programmatically. Render KPI dashboards, reports, and data snapshots as images for Slack, email, and presentations.
			</p>
		</div>

		<!-- Language Tabs -->
		<div class="mb-6">
			<div class="flex flex-wrap gap-2">
				{#each [
					{ id: 'javascript', label: 'JavaScript' },
					{ id: 'python', label: 'Python' },
					{ id: 'go', label: 'Go' },
					{ id: 'ruby', label: 'Ruby' },
					{ id: 'php', label: 'PHP' }
				] as lang}
					<button
						on:click={() => (apiLang = lang.id)}
						class="px-4 py-2 text-sm font-black border-[3px] transition-all rounded-lg uppercase tracking-wider
							{apiLang === lang.id
								? 'border-gray-900 bg-gray-900 text-white shadow-[3px_3px_0_0_#ffc480]'
								: 'border-gray-900 bg-white text-gray-600 hover:bg-gray-50'}"
					>
						{lang.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Code Snippet -->
		<div class="bg-[#1e1e1e] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#2d2d2d] px-4 py-3 border-b-[3px] border-gray-900 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
					<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
					<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				</div>
				<span class="text-xs text-gray-500 font-mono font-bold uppercase tracking-wider">
					{apiLang === 'javascript' ? 'index.js' : apiLang === 'python' ? 'render.py' : apiLang === 'go' ? 'main.go' : apiLang === 'ruby' ? 'render.rb' : 'render.php'}
				</span>
			</div>
				<div class="p-6 overflow-x-auto">
					{#if apiLang === 'javascript'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#6a9955]">// 1. Build your HTML table from data</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">data</span> = [
  [<span class="text-[#ce9178]">"Name"</span>, <span class="text-[#ce9178]">"Role"</span>, <span class="text-[#ce9178]">"Status"</span>],
  [<span class="text-[#ce9178]">"Alice"</span>, <span class="text-[#ce9178]">"Engineer"</span>, <span class="text-[#ce9178]">"Active"</span>],
  [<span class="text-[#ce9178]">"Bob"</span>, <span class="text-[#ce9178]">"Designer"</span>, <span class="text-[#ce9178]">"Active"</span>],
];

<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">header</span> = <span class="text-[#9cdcfe]">data</span>[<span class="text-[#b5cea8]">0</span>].<span class="text-[#dcdcaa]">map</span>(<span class="text-[#9cdcfe]">h</span> => <span class="text-[#ce9178]">`&lt;th&gt;${'$'}{'{'}h{'}'}&lt;/th&gt;`</span>).<span class="text-[#dcdcaa]">join</span>(<span class="text-[#ce9178]">""</span>);
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">rows</span> = <span class="text-[#9cdcfe]">data</span>.<span class="text-[#dcdcaa]">slice</span>(<span class="text-[#b5cea8]">1</span>).<span class="text-[#dcdcaa]">map</span>(<span class="text-[#9cdcfe]">r</span> =>
  <span class="text-[#ce9178]">`&lt;tr&gt;${'$'}{'{'}r.<span class="text-[#dcdcaa]">map</span>(c => `&lt;td&gt;${'$'}{'{'}c{'}'}&lt;/td&gt;`).<span class="text-[#dcdcaa]">join</span>(""){'}'}&lt;/tr&gt;`</span>
).<span class="text-[#dcdcaa]">join</span>(<span class="text-[#ce9178]">""</span>);

<span class="text-[#6a9955]">// 2. Wrap in styled HTML template</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">`&lt;html&gt;&lt;head&gt;&lt;style&gt;
  body {'{'} padding:48px; background:#f1f7ff; font-family:Inter,sans-serif {'}'}
  table {'{'} width:100%; border-collapse:collapse {'}'}
  thead {'{'} background:#0f3c6e; color:#fff {'}'}
  th,td {'{'} padding:14px 18px; text-align:left {'}'}
  tbody tr:nth-child(even) {'{'} background:#f5f9ff {'}'}
&lt;/style&gt;&lt;/head&gt;&lt;body&gt;
  &lt;table&gt;&lt;thead&gt;&lt;tr&gt;${'$'}{'{'}header{'}'}&lt;/tr&gt;&lt;/thead&gt;
  &lt;tbody&gt;${'$'}{'{'}rows{'}'}&lt;/tbody&gt;&lt;/table&gt;
&lt;/body&gt;&lt;/html&gt;`</span>;

<span class="text-[#6a9955]">// 3. Call Pictify API</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>, {'{'}
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">"POST"</span>,
  <span class="text-[#9cdcfe]">headers</span>: {'{'}
    <span class="text-[#ce9178]">"Content-Type"</span>: <span class="text-[#ce9178]">"application/json"</span>,
    <span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">`Bearer ${'$'}{'{'}YOUR_API_KEY{'}'}`</span>
  {'}'},
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({'{'} <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">"png"</span> {'}'})
{'}'});

<span class="text-[#c586c0]">const</span> {'{'} <span class="text-[#9cdcfe]">image</span> {'}'} = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// https://cdn.pictify.io/img/abc123.png</span></code></pre>

					{:else if apiLang === 'python'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>, <span class="text-[#9cdcfe]">csv</span>, <span class="text-[#9cdcfe]">io</span>

<span class="text-[#6a9955]"># 1. Build HTML table from CSV data</span>
<span class="text-[#9cdcfe]">csv_data</span> = <span class="text-[#ce9178]">"""Name,Role,Status
Alice,Engineer,Active
Bob,Designer,Active"""</span>

<span class="text-[#9cdcfe]">reader</span> = <span class="text-[#9cdcfe]">csv</span>.<span class="text-[#dcdcaa]">reader</span>(<span class="text-[#9cdcfe]">io</span>.<span class="text-[#dcdcaa]">StringIO</span>(<span class="text-[#9cdcfe]">csv_data</span>))
<span class="text-[#9cdcfe]">rows</span> = <span class="text-[#dcdcaa]">list</span>(<span class="text-[#9cdcfe]">reader</span>)
<span class="text-[#9cdcfe]">header</span> = <span class="text-[#ce9178]">""</span>.<span class="text-[#dcdcaa]">join</span>(<span class="text-[#ce9178]">f"&lt;th&gt;{'{'}h{'}'}&lt;/th&gt;"</span> <span class="text-[#c586c0]">for</span> <span class="text-[#9cdcfe]">h</span> <span class="text-[#c586c0]">in</span> <span class="text-[#9cdcfe]">rows</span>[<span class="text-[#b5cea8]">0</span>])
<span class="text-[#9cdcfe]">body</span> = <span class="text-[#ce9178]">""</span>.<span class="text-[#dcdcaa]">join</span>(
    <span class="text-[#ce9178]">f"&lt;tr&gt;{'{'}''.<span class="text-[#dcdcaa]">join</span>(f'&lt;td&gt;{'{'}c{'}'}&lt;/td&gt;' for c in r){'}'}&lt;/tr&gt;"</span>
    <span class="text-[#c586c0]">for</span> <span class="text-[#9cdcfe]">r</span> <span class="text-[#c586c0]">in</span> <span class="text-[#9cdcfe]">rows</span>[<span class="text-[#b5cea8]">1</span>:]
)

<span class="text-[#6a9955]"># 2. Wrap in styled HTML</span>
<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">f"""&lt;html&gt;&lt;head&gt;&lt;style&gt;
  body {'{'} padding:48px; background:#f1f7ff; font-family:Inter,sans-serif {'}'}
  table {'{'} width:100%; border-collapse:collapse {'}'}
  thead {'{'} background:#0f3c6e; color:#fff {'}'}
  th,td {'{'} padding:14px 18px; text-align:left {'}'}
&lt;/style&gt;&lt;/head&gt;&lt;body&gt;
  &lt;table&gt;&lt;thead&gt;&lt;tr&gt;{'{'}header{'}'}&lt;/tr&gt;&lt;/thead&gt;
  &lt;tbody&gt;{'{'}body{'}'}&lt;/tbody&gt;&lt;/table&gt;
&lt;/body&gt;&lt;/html&gt;"""</span>

<span class="text-[#6a9955]"># 3. Call Pictify API</span>
<span class="text-[#9cdcfe]">response</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(
    <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={'{'}
        <span class="text-[#ce9178]">"Content-Type"</span>: <span class="text-[#ce9178]">"application/json"</span>,
        <span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>
    {'}'},
    <span class="text-[#9cdcfe]">json</span>={'{'}<span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#ce9178]">"fileExtension"</span>: <span class="text-[#ce9178]">"png"</span>{'}'}
)

<span class="text-[#9cdcfe]">image_url</span> = <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"image"</span>][<span class="text-[#ce9178]">"url"</span>]
<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">image_url</span>)  <span class="text-[#6a9955]"># https://cdn.pictify.io/img/abc123.png</span></code></pre>

					{:else if apiLang === 'go'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">package</span> <span class="text-[#9cdcfe]">main</span>

<span class="text-[#c586c0]">import</span> (
    <span class="text-[#ce9178]">"bytes"</span>
    <span class="text-[#ce9178]">"encoding/csv"</span>
    <span class="text-[#ce9178]">"encoding/json"</span>
    <span class="text-[#ce9178]">"fmt"</span>
    <span class="text-[#ce9178]">"net/http"</span>
    <span class="text-[#ce9178]">"strings"</span>
)

<span class="text-[#c586c0]">func</span> <span class="text-[#dcdcaa]">main</span>() {'{'}
    <span class="text-[#6a9955]">// 1. Parse CSV and build HTML table</span>
    <span class="text-[#9cdcfe]">csvData</span> := <span class="text-[#ce9178]">"Name,Role,Status\nAlice,Engineer,Active\nBob,Designer,Active"</span>
    <span class="text-[#9cdcfe]">reader</span> := <span class="text-[#9cdcfe]">csv</span>.<span class="text-[#dcdcaa]">NewReader</span>(<span class="text-[#9cdcfe]">strings</span>.<span class="text-[#dcdcaa]">NewReader</span>(<span class="text-[#9cdcfe]">csvData</span>))
    <span class="text-[#9cdcfe]">records</span>, <span class="text-[#9cdcfe]">_</span> := <span class="text-[#9cdcfe]">reader</span>.<span class="text-[#dcdcaa]">ReadAll</span>()

    <span class="text-[#6a9955]">// 2. Build styled HTML</span>
    <span class="text-[#9cdcfe]">html</span> := <span class="text-[#ce9178]">`&lt;html&gt;&lt;head&gt;&lt;style&gt;
  body {'{'} padding:48px; background:#f1f7ff; font-family:sans-serif {'}'}
  table {'{'} width:100%; border-collapse:collapse {'}'}
  thead {'{'} background:#0f3c6e; color:#fff {'}'}
  th,td {'{'} padding:14px 18px; text-align:left {'}'}
&lt;/style&gt;&lt;/head&gt;&lt;body&gt;&lt;table&gt;&lt;thead&gt;&lt;tr&gt;`</span>

    <span class="text-[#c586c0]">for</span> <span class="text-[#9cdcfe]">_</span>, <span class="text-[#9cdcfe]">h</span> := <span class="text-[#c586c0]">range</span> <span class="text-[#9cdcfe]">records</span>[<span class="text-[#b5cea8]">0</span>] {'{'}
        <span class="text-[#9cdcfe]">html</span> += <span class="text-[#9cdcfe]">fmt</span>.<span class="text-[#dcdcaa]">Sprintf</span>(<span class="text-[#ce9178]">"&lt;th&gt;%s&lt;/th&gt;"</span>, <span class="text-[#9cdcfe]">h</span>)
    {'}'}
    <span class="text-[#9cdcfe]">html</span> += <span class="text-[#ce9178]">"&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;"</span>
    <span class="text-[#c586c0]">for</span> <span class="text-[#9cdcfe]">_</span>, <span class="text-[#9cdcfe]">row</span> := <span class="text-[#c586c0]">range</span> <span class="text-[#9cdcfe]">records</span>[<span class="text-[#b5cea8]">1</span>:] {'{'}
        <span class="text-[#9cdcfe]">html</span> += <span class="text-[#ce9178]">"&lt;tr&gt;"</span>
        <span class="text-[#c586c0]">for</span> <span class="text-[#9cdcfe]">_</span>, <span class="text-[#9cdcfe]">c</span> := <span class="text-[#c586c0]">range</span> <span class="text-[#9cdcfe]">row</span> {'{'} <span class="text-[#9cdcfe]">html</span> += <span class="text-[#9cdcfe]">fmt</span>.<span class="text-[#dcdcaa]">Sprintf</span>(<span class="text-[#ce9178]">"&lt;td&gt;%s&lt;/td&gt;"</span>, <span class="text-[#9cdcfe]">c</span>) {'}'}
        <span class="text-[#9cdcfe]">html</span> += <span class="text-[#ce9178]">"&lt;/tr&gt;"</span>
    {'}'}
    <span class="text-[#9cdcfe]">html</span> += <span class="text-[#ce9178]">"&lt;/tbody&gt;&lt;/table&gt;&lt;/body&gt;&lt;/html&gt;"</span>

    <span class="text-[#6a9955]">// 3. Call Pictify API</span>
    <span class="text-[#9cdcfe]">body</span>, <span class="text-[#9cdcfe]">_</span> := <span class="text-[#9cdcfe]">json</span>.<span class="text-[#dcdcaa]">Marshal</span>(<span class="text-[#c586c0]">map</span>[<span class="text-[#c586c0]">string</span>]<span class="text-[#c586c0]">any</span>{'{'}
        <span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>,
        <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#ce9178]">"fileExtension"</span>: <span class="text-[#ce9178]">"png"</span>,
    {'}'})
    <span class="text-[#9cdcfe]">req</span>, <span class="text-[#9cdcfe]">_</span> := <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">NewRequest</span>(<span class="text-[#ce9178]">"POST"</span>, <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>, <span class="text-[#9cdcfe]">bytes</span>.<span class="text-[#dcdcaa]">NewBuffer</span>(<span class="text-[#9cdcfe]">body</span>))
    <span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">Header</span>.<span class="text-[#dcdcaa]">Set</span>(<span class="text-[#ce9178]">"Content-Type"</span>, <span class="text-[#ce9178]">"application/json"</span>)
    <span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">Header</span>.<span class="text-[#dcdcaa]">Set</span>(<span class="text-[#ce9178]">"Authorization"</span>, <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>)
    <span class="text-[#9cdcfe]">resp</span>, <span class="text-[#9cdcfe]">_</span> := <span class="text-[#9cdcfe]">http</span>.<span class="text-[#9cdcfe]">DefaultClient</span>.<span class="text-[#dcdcaa]">Do</span>(<span class="text-[#9cdcfe]">req</span>)
    <span class="text-[#c586c0]">defer</span> <span class="text-[#9cdcfe]">resp</span>.<span class="text-[#9cdcfe]">Body</span>.<span class="text-[#dcdcaa]">Close</span>()
{'}'}</code></pre>

					{:else if apiLang === 'ruby'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"net/http"</span>
<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"json"</span>
<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"csv"</span>

<span class="text-[#6a9955]"># 1. Parse CSV and build HTML table</span>
<span class="text-[#9cdcfe]">data</span> = <span class="text-[#9cdcfe]">CSV</span>.<span class="text-[#dcdcaa]">parse</span>(<span class="text-[#ce9178]">"Name,Role,Status\nAlice,Engineer,Active\nBob,Designer,Active"</span>)
<span class="text-[#9cdcfe]">header</span> = <span class="text-[#9cdcfe]">data</span>[<span class="text-[#b5cea8]">0</span>].<span class="text-[#dcdcaa]">map</span> {'{'} |<span class="text-[#9cdcfe]">h</span>| <span class="text-[#ce9178]">"&lt;th&gt;#{'{'}<span class="text-[#9cdcfe]">h</span>{'}'}&lt;/th&gt;"</span> {'}'}.<span class="text-[#dcdcaa]">join</span>
<span class="text-[#9cdcfe]">rows</span> = <span class="text-[#9cdcfe]">data</span>[<span class="text-[#b5cea8]">1</span>..].<span class="text-[#dcdcaa]">map</span> {'{'} |<span class="text-[#9cdcfe]">r</span>| <span class="text-[#ce9178]">"&lt;tr&gt;#{'{'}<span class="text-[#9cdcfe]">r</span>.map{'{'} |c| "&lt;td&gt;#{'{'}c{'}'}&lt;/td&gt;" {'}'}.join{'}'}&lt;/tr&gt;"</span> {'}'}.<span class="text-[#dcdcaa]">join</span>

<span class="text-[#6a9955]"># 2. Wrap in styled HTML</span>
<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">%(&lt;html&gt;&lt;head&gt;&lt;style&gt;
  body {'{'} padding:48px; background:#f1f7ff; font-family:sans-serif {'}'}
  table {'{'} width:100%; border-collapse:collapse {'}'}
  thead {'{'} background:#0f3c6e; color:#fff {'}'}
  th,td {'{'} padding:14px 18px; text-align:left {'}'}
&lt;/style&gt;&lt;/head&gt;&lt;body&gt;
  &lt;table&gt;&lt;thead&gt;&lt;tr&gt;#{'{'}<span class="text-[#9cdcfe]">header</span>{'}'}&lt;/tr&gt;&lt;/thead&gt;
  &lt;tbody&gt;#{'{'}<span class="text-[#9cdcfe]">rows</span>{'}'}&lt;/tbody&gt;&lt;/table&gt;
&lt;/body&gt;&lt;/html&gt;)</span>

<span class="text-[#6a9955]"># 3. Call Pictify API</span>
<span class="text-[#9cdcfe]">uri</span> = <span class="text-[#9cdcfe]">URI</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>)
<span class="text-[#9cdcfe]">req</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>::<span class="text-[#9cdcfe]">Post</span>.<span class="text-[#dcdcaa]">new</span>(<span class="text-[#9cdcfe]">uri</span>, {'{'}
  <span class="text-[#ce9178]">"Content-Type"</span> => <span class="text-[#ce9178]">"application/json"</span>,
  <span class="text-[#ce9178]">"Authorization"</span> => <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>
{'}'})
<span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">body</span> = {'{'} <span class="text-[#9cdcfe]">html</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">"png"</span> {'}'}.<span class="text-[#dcdcaa]">to_json</span>
<span class="text-[#9cdcfe]">res</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>.<span class="text-[#dcdcaa]">start</span>(<span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">hostname</span>, <span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">port</span>, <span class="text-[#9cdcfe]">use_ssl</span>: <span class="text-[#569cd6]">true</span>) {'{'} |<span class="text-[#9cdcfe]">http</span>| <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">request</span>(<span class="text-[#9cdcfe]">req</span>) {'}'}
<span class="text-[#dcdcaa]">puts</span> <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">parse</span>(<span class="text-[#9cdcfe]">res</span>.<span class="text-[#9cdcfe]">body</span>).<span class="text-[#dcdcaa]">dig</span>(<span class="text-[#ce9178]">"image"</span>, <span class="text-[#ce9178]">"url"</span>)</code></pre>

					{:else if apiLang === 'php'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#569cd6]">&lt;?php</span>
<span class="text-[#6a9955]">// 1. Parse CSV and build HTML table</span>
<span class="text-[#9cdcfe]">$csv</span> = <span class="text-[#ce9178]">"Name,Role,Status\nAlice,Engineer,Active\nBob,Designer,Active"</span>;
<span class="text-[#9cdcfe]">$rows</span> = <span class="text-[#dcdcaa]">array_map</span>(<span class="text-[#ce9178]">"str_getcsv"</span>, <span class="text-[#dcdcaa]">explode</span>(<span class="text-[#ce9178]">"\n"</span>, <span class="text-[#9cdcfe]">$csv</span>));
<span class="text-[#9cdcfe]">$header</span> = <span class="text-[#dcdcaa]">implode</span>(<span class="text-[#ce9178]">""</span>, <span class="text-[#dcdcaa]">array_map</span>(<span class="text-[#c586c0]">fn</span>(<span class="text-[#9cdcfe]">$h</span>) => <span class="text-[#ce9178]">"&lt;th&gt;{'{'}<span class="text-[#9cdcfe]">$h</span>{'}'}&lt;/th&gt;"</span>, <span class="text-[#9cdcfe]">$rows</span>[<span class="text-[#b5cea8]">0</span>]));
<span class="text-[#9cdcfe]">$body</span> = <span class="text-[#ce9178]">""</span>;
<span class="text-[#c586c0]">for</span> (<span class="text-[#9cdcfe]">$i</span> = <span class="text-[#b5cea8]">1</span>; <span class="text-[#9cdcfe]">$i</span> &lt; <span class="text-[#dcdcaa]">count</span>(<span class="text-[#9cdcfe]">$rows</span>); <span class="text-[#9cdcfe]">$i</span>++) {'{'}
    <span class="text-[#9cdcfe]">$body</span> .= <span class="text-[#ce9178]">"&lt;tr&gt;"</span> . <span class="text-[#dcdcaa]">implode</span>(<span class="text-[#ce9178]">""</span>, <span class="text-[#dcdcaa]">array_map</span>(<span class="text-[#c586c0]">fn</span>(<span class="text-[#9cdcfe]">$c</span>) => <span class="text-[#ce9178]">"&lt;td&gt;{'{'}<span class="text-[#9cdcfe]">$c</span>{'}'}&lt;/td&gt;"</span>, <span class="text-[#9cdcfe]">$rows</span>[<span class="text-[#9cdcfe]">$i</span>])) . <span class="text-[#ce9178]">"&lt;/tr&gt;"</span>;
{'}'}

<span class="text-[#6a9955]">// 2. Wrap in styled HTML</span>
<span class="text-[#9cdcfe]">$html</span> = <span class="text-[#ce9178]">"&lt;html&gt;&lt;head&gt;&lt;style&gt;
  body {'{'} padding:48px; background:#f1f7ff; font-family:sans-serif {'}'}
  table {'{'} width:100%; border-collapse:collapse {'}'}
  thead {'{'} background:#0f3c6e; color:#fff {'}'}
  th,td {'{'} padding:14px 18px; text-align:left {'}'}
&lt;/style&gt;&lt;/head&gt;&lt;body&gt;
  &lt;table&gt;&lt;thead&gt;&lt;tr&gt;{'{'}<span class="text-[#9cdcfe]">$header</span>{'}'}&lt;/tr&gt;&lt;/thead&gt;
  &lt;tbody&gt;{'{'}<span class="text-[#9cdcfe]">$body</span>{'}'}&lt;/tbody&gt;&lt;/table&gt;
&lt;/body&gt;&lt;/html&gt;"</span>;

<span class="text-[#6a9955]">// 3. Call Pictify API</span>
<span class="text-[#9cdcfe]">$ch</span> = <span class="text-[#dcdcaa]">curl_init</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>);
<span class="text-[#dcdcaa]">curl_setopt_array</span>(<span class="text-[#9cdcfe]">$ch</span>, [
    <span class="text-[#9cdcfe]">CURLOPT_POST</span> => <span class="text-[#569cd6]">true</span>,
    <span class="text-[#9cdcfe]">CURLOPT_RETURNTRANSFER</span> => <span class="text-[#569cd6]">true</span>,
    <span class="text-[#9cdcfe]">CURLOPT_HTTPHEADER</span> => [<span class="text-[#ce9178]">"Content-Type: application/json"</span>, <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span>],
    <span class="text-[#9cdcfe]">CURLOPT_POSTFIELDS</span> => <span class="text-[#dcdcaa]">json_encode</span>([
        <span class="text-[#ce9178]">"html"</span> => <span class="text-[#9cdcfe]">$html</span>, <span class="text-[#ce9178]">"width"</span> => <span class="text-[#b5cea8]">1200</span>, <span class="text-[#ce9178]">"height"</span> => <span class="text-[#b5cea8]">630</span>, <span class="text-[#ce9178]">"fileExtension"</span> => <span class="text-[#ce9178]">"png"</span>
    ])
]);
<span class="text-[#9cdcfe]">$response</span> = <span class="text-[#dcdcaa]">json_decode</span>(<span class="text-[#dcdcaa]">curl_exec</span>(<span class="text-[#9cdcfe]">$ch</span>), <span class="text-[#569cd6]">true</span>);
<span class="text-[#dcdcaa]">echo</span> <span class="text-[#9cdcfe]">$response</span>[<span class="text-[#ce9178]">"image"</span>][<span class="text-[#ce9178]">"url"</span>]; <span class="text-[#6a9955]">// https://cdn.pictify.io/img/abc123.png</span></code></pre>
					{/if}
				</div>
			</div>

		<!-- CTA -->
		<div class="text-center mt-12">
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="/signup"
					on:click={handleSignupClick}
					class="px-8 py-4 bg-gray-900 text-white font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Get API Key
				</a>
				<a
					href="https://docs.pictify.io"
					target="_blank"
					rel="noopener noreferrer"
					class="px-8 py-4 bg-white text-gray-900 font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>
					Read API Docs
				</a>
			</div>
		</div>
	</section>

	<!-- First Generation Prompt (Modal) -->
	{#if showFirstGenerationPrompt && !isUserLoggedIn}
		<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div class="bg-white border-[4px] border-black max-w-md w-full mx-auto shadow-[12px_12px_0_0_#000]">
				<div class="bg-[#4ade80] px-6 py-3 border-b-[4px] border-black flex justify-between items-center">
					<h3 class="text-lg font-black text-black uppercase tracking-wider">Great First Image!</h3>
					<button class="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#ff6b6b] hover:text-white transition-colors" on:click={() => (showFirstGenerationPrompt = false)}>
						<span class="font-black">x</span>
					</button>
				</div>
				<div class="p-6">
					<p class="text-black font-bold mb-4">Create a free account to unlock:</p>
					<ul class="space-y-2 mb-6">
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#4ade80]">✓</span><span class="font-bold text-black text-sm">Unlimited image generations</span></li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#4ade80]">✓</span><span class="font-bold text-black text-sm">No watermarks</span></li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#4ade80]">✓</span><span class="font-bold text-black text-sm">API Access</span></li>
					</ul>
					<div class="space-y-3">
						<a href="/signup?redirect=/tools/table" on:click={handleSignupClick} class="block w-full py-3 px-6 border-[3px] border-black font-black bg-[#ff6b6b] uppercase tracking-wide text-center text-white shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">Create Free Account</a>
						<button class="w-full py-3 px-6 font-bold text-black hover:text-[#ff6b6b] transition-colors uppercase tracking-wide" on:click={() => (showFirstGenerationPrompt = false)}>Continue as Guest</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Upgrade Prompt (Modal) -->
	{#if showUpgradePrompt && !isUserLoggedIn}
		<div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" style="margin-top: 0px;">
			<div class="bg-white border-[4px] border-black max-w-md w-full mx-auto shadow-[12px_12px_0_0_#000]">
				<div class="bg-[#ff6b6b] px-6 py-3 border-b-[4px] border-black flex justify-between items-center">
					<h3 class="text-lg font-black text-white uppercase tracking-wider">Ready to Create More?</h3>
					<button class="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors" on:click={() => (showUpgradePrompt = false)}>
						<span class="font-black">x</span>
					</button>
				</div>
				<div class="p-6">
					<p class="text-black font-bold mb-4">You've reached the guest limit. Sign up to unlock:</p>
					<ul class="space-y-2 mb-6">
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#ff6b6b]">✓</span><span class="font-bold text-black text-sm">Unlimited image generations</span></li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#ff6b6b]">✓</span><span class="font-bold text-black text-sm">No watermarks</span></li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#ff6b6b]">✓</span><span class="font-bold text-black text-sm">API Access</span></li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black"><span class="font-black text-[#ff6b6b]">✓</span><span class="font-bold text-black text-sm">Priority support</span></li>
					</ul>
					<div class="space-y-3">
						<a href="/signup?redirect=/tools/table" on:click={handleSignupClick} class="block w-full py-3 px-6 border-[3px] border-black font-black bg-[#ff6b6b] uppercase tracking-wide text-center text-white shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">Sign Up Free</a>
						<button class="w-full py-3 px-6 font-bold text-black hover:text-[#ff6b6b] transition-colors uppercase tracking-wide" on:click={() => (showUpgradePrompt = false)}>Maybe Later</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<Toast />
</div>
