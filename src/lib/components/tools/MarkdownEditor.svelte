<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import { refractor } from 'refractor';
	import { toHtml } from 'hast-util-to-html';
	import javascript from 'refractor/lang/javascript.js';
	import typescript from 'refractor/lang/typescript.js';
	import python from 'refractor/lang/python.js';
	import bash from 'refractor/lang/bash.js';
	import json from 'refractor/lang/json.js';
	import css from 'refractor/lang/css.js';
	import markup from 'refractor/lang/markup.js';
	import go from 'refractor/lang/go.js';
	import rust from 'refractor/lang/rust.js';
	import yaml from 'refractor/lang/yaml.js';
	import sql from 'refractor/lang/sql.js';
	import Toast from '$lib/components/Toast.svelte';
	import { createImagePublic } from '../../../api/image.js';
	import { toast } from '../../../store/toast.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import { analytics } from '$lib/analytics.js';

	export let isUserLoggedIn = false;

	// Register refractor languages
	refractor.register(javascript);
	refractor.register(typescript);
	refractor.register(python);
	refractor.register(bash);
	refractor.register(json);
	refractor.register(css);
	refractor.register(markup);
	refractor.register(go);
	refractor.register(rust);
	refractor.register(yaml);
	refractor.register(sql);

	// Configure marked with syntax highlighting via custom renderer (v5 API)
	const renderer = new marked.Renderer();
	renderer.code = (code, lang) => {
		if (!lang) return `<pre><code>${code}</code></pre>`;
		try {
			const prismLang = lang === 'html' ? 'markup' : lang;
			const hast = refractor.highlight(code, prismLang);
			return `<pre><code class="language-${lang}">${toHtml(hast)}</code></pre>`;
		} catch {
			return `<pre><code>${code}</code></pre>`;
		}
	};
	marked.setOptions({ gfm: true, breaks: true });
	marked.use({ renderer });

	// ── Theme definitions ──
	const themes = [
		// Light themes
		{
			id: 'github-light',
			name: 'GitHub Light',
			type: 'light',
			cssUrl: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.6.1/github-markdown-light.css',
			bodyBg: '#ffffff',
			cardBg: '#ffffff',
			textColor: '#1f2937',
			prismThemeUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css'
		},
		{
			id: 'minimal-light',
			name: 'Minimal Light',
			type: 'light',
			cssUrl: '',
			bodyBg: '#fafafa',
			cardBg: '#ffffff',
			textColor: '#374151',
			prismThemeUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css'
		},
		{
			id: 'academic',
			name: 'Academic',
			type: 'light',
			cssUrl: '',
			bodyBg: '#fffef5',
			cardBg: '#fffef5',
			textColor: '#1a1a1a',
			prismThemeUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css'
		},
		// Dark themes
		{
			id: 'github-dark',
			name: 'GitHub Dark',
			type: 'dark',
			cssUrl: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.6.1/github-markdown-dark.css',
			bodyBg: '#0d1117',
			cardBg: '#161b22',
			textColor: '#c9d1d9',
			prismThemeUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css'
		},
		{
			id: 'minimal-dark',
			name: 'Minimal Dark',
			type: 'dark',
			cssUrl: '',
			bodyBg: '#1a1a2e',
			cardBg: '#16213e',
			textColor: '#e2e8f0',
			prismThemeUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css'
		},
		{
			id: 'terminal',
			name: 'Terminal Green',
			type: 'dark',
			cssUrl: '',
			bodyBg: '#0a0a0a',
			cardBg: '#111111',
			textColor: '#00ff41',
			prismThemeUrl: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-dark.min.css'
		}
	];

	const fonts = [
		{
			id: 'inter',
			name: 'Inter',
			css: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
			family: "'Inter', system-ui, -apple-system, sans-serif"
		},
		{
			id: 'jetbrains',
			name: 'JetBrains Mono',
			css: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap',
			family: "'JetBrains Mono', ui-monospace, monospace"
		},
		{
			id: 'source-serif',
			name: 'Source Serif Pro',
			css: 'https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&display=swap',
			family: "'Source Serif Pro', Georgia, serif"
		},
		{
			id: 'merriweather',
			name: 'Merriweather',
			css: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
			family: "'Merriweather', Georgia, serif"
		},
		{
			id: 'system',
			name: 'System Default',
			css: '',
			family: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
		}
	];

	// ── State ──
	let markdown = `# Hello, Pictify! 👋

Welcome to the **Markdown to Image** tool. Edit this content and see the live preview.

## Features

- ✅ Live preview as you type
- ✅ Multiple themes (light & dark)
- ✅ Syntax highlighting for code blocks
- ✅ Custom fonts and dimensions

## Code Example

\`\`\`javascript
function generateImage(markdown) {
  const html = marked.parse(markdown);
  return renderToImage(html);
}
\`\`\`

## Table Support

| Feature | Status |
|---------|--------|
| Headings | ✅ |
| Lists | ✅ |
| Code blocks | ✅ |
| Tables | ✅ |
| Images | ✅ |

> **Pro tip:** Try different themes to find the perfect look for your content!
`;

	let themeId = 'github-light';
	let fontId = 'inter';
	let previewWidth = 1200;
	let previewHeight = 630;
	let srcdocKey = 0;

	// Generation state
	let isGenerating = false;
	let generatedImageUrl = '';
	let generationError = '';
	let measuredHeight = 0;

	// Growth loop state (driven by global store, not local counter)
	let showUpgradePrompt = false;
	let showFirstGenerationPrompt = false;
	let hasTrackedFirstInput = false;

	// GitHub import state
	let githubUrl = '';
	let isFetchingGithub = false;

	// API snippet language toggle
	let apiLang = 'javascript';

	// Debounce state
	let debounceTimer;

	// Reactive derivations
	$: theme = themes.find((t) => t.id === themeId) || themes[0];
	$: font = fonts.find((f) => f.id === fontId) || fonts[0];
	$: lightThemes = themes.filter((t) => t.type === 'light');
	$: darkThemes = themes.filter((t) => t.type === 'dark');
	$: generationsUsed = $generationLimits?.count || 0;
	$: remaining = GUEST_DAILY_LIMIT - generationsUsed;
	$: limitReached = !isUserLoggedIn && remaining <= 0;

	// Debounced srcdoc rebuild
	function handleInput() {
		if (!hasTrackedFirstInput) {
			hasTrackedFirstInput = true;
			analytics.track('tool_first_input', { tool_name: 'markdown_to_image' });
		}
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			srcdocKey++;
		}, 300);
	}

	// Force immediate rebuild on theme/font/dimension change
	$: if (themeId || fontId || previewWidth || previewHeight) {
		srcdocKey++;
	}

	$: srcdocContent = buildSrcDoc(markdown, theme, font, previewWidth);

	// Avoid literal style tags so Svelte's CSS preprocessor doesn't try to parse runtime content
	function returnStyleTag(css) {
		const openTag = String.fromCharCode(60, 115, 116, 121, 108, 101, 62);
		const closeTag = String.fromCharCode(60, 47, 115, 116, 121, 108, 101, 62);
		const tagRegex = new RegExp(openTag + '([\\s\\S]*?)' + closeTag);
		const match = tagRegex.exec(css);
		if (match) return css;
		return css.replace('[styleOpen]', openTag).replace('[styleClose]', closeTag);
	}

	function getCustomThemeCSS(t) {
		if (t.id === 'academic') {
			return `
				.markdown-body { font-family: 'Source Serif Pro', Georgia, serif; line-height: 1.8; color: ${t.textColor}; }
				.markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 700; border-bottom: 2px solid #333; padding-bottom: 0.3em; margin-top: 1.5em; }
				.markdown-body blockquote { border-left: 4px solid #8b7355; background: #f9f5eb; padding: 0.8em 1.2em; }
				.markdown-body code { background: #f0ece0; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
				.markdown-body pre { background: #f0ece0; padding: 1em; border-radius: 6px; overflow-x: auto; }
				.markdown-body pre code { background: transparent; padding: 0; }
				.markdown-body table { border-collapse: collapse; width: 100%; }
				.markdown-body th, .markdown-body td { border: 1px solid #ccc; padding: 0.5em 0.8em; text-align: left; }
				.markdown-body th { background: #f0ece0; font-weight: 700; }
				.markdown-body a { color: #5a3d2b; }
				.markdown-body img { max-width: 100%; }
			`;
		}
		if (t.id === 'terminal') {
			return `
				.markdown-body { font-family: 'JetBrains Mono', ui-monospace, monospace; line-height: 1.6; color: ${t.textColor}; }
				.markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #00ff41; text-transform: uppercase; letter-spacing: 0.05em; }
				.markdown-body h1::before { content: '# '; opacity: 0.5; }
				.markdown-body h2::before { content: '## '; opacity: 0.5; }
				.markdown-body blockquote { border-left: 3px solid #00ff41; background: rgba(0,255,65,0.05); padding: 0.5em 1em; }
				.markdown-body code { background: rgba(0,255,65,0.1); color: #00ff41; padding: 0.2em 0.4em; border-radius: 3px; }
				.markdown-body pre { background: #1a1a1a; border: 1px solid #333; padding: 1em; border-radius: 6px; overflow-x: auto; }
				.markdown-body pre code { background: transparent; }
				.markdown-body a { color: #00cc33; text-decoration: underline; }
				.markdown-body table { border-collapse: collapse; width: 100%; }
				.markdown-body th, .markdown-body td { border: 1px solid #333; padding: 0.4em 0.8em; }
				.markdown-body th { background: #1a1a1a; color: #00ff41; }
				.markdown-body strong { color: #66ff99; }
				.markdown-body img { max-width: 100%; }
			`;
		}
		// Minimal themes
		return `
			.markdown-body { font-family: ${font.family}; line-height: 1.7; color: ${t.textColor}; }
			.markdown-body h1, .markdown-body h2, .markdown-body h3 { font-weight: 700; margin-top: 1.4em; }
			.markdown-body h1 { font-size: 2em; }
			.markdown-body h2 { font-size: 1.5em; }
			.markdown-body blockquote { border-left: 4px solid ${t.type === 'dark' ? '#4a5568' : '#e2e8f0'}; padding: 0.5em 1em; margin: 1em 0; color: ${t.type === 'dark' ? '#a0aec0' : '#718096'}; }
			.markdown-body code { background: ${t.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
			.markdown-body pre { background: ${t.type === 'dark' ? '#1e293b' : '#f1f5f9'}; padding: 1em; border-radius: 8px; overflow-x: auto; }
			.markdown-body pre code { background: transparent; padding: 0; }
			.markdown-body table { border-collapse: collapse; width: 100%; }
			.markdown-body th, .markdown-body td { border: 1px solid ${t.type === 'dark' ? '#334155' : '#e2e8f0'}; padding: 0.5em 0.8em; text-align: left; }
			.markdown-body th { background: ${t.type === 'dark' ? '#1e293b' : '#f8fafc'}; font-weight: 600; }
			.markdown-body a { color: ${t.type === 'dark' ? '#60a5fa' : '#2563eb'}; }
			.markdown-body img { max-width: 100%; }
			.markdown-body ul, .markdown-body ol { padding-left: 1.5em; }
			.markdown-body li { margin: 0.25em 0; }
		`;
	}

	function buildSrcDoc(md, t, f, w) {
		const parsedHtml = marked.parse(md || '');
		const useGithubCSS = t.cssUrl ? `<link rel="stylesheet" href="${t.cssUrl}">` : '';
		const prismCSS = t.prismThemeUrl ? `<link rel="stylesheet" href="${t.prismThemeUrl}">` : '';
		const fontCSS = f.css ? `<link rel="stylesheet" href="${f.css}">` : '';
		const customCSS = !t.cssUrl ? getCustomThemeCSS(t) : '';

		const placeholderHtml = md?.trim()
			? parsedHtml
			: '<p style="opacity:0.4;font-style:italic;">Paste your markdown here...</p>';

		return `<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	${useGithubCSS}
	${prismCSS}
	${fontCSS}
	${returnStyleTag(`[styleOpen]
		* { margin: 0; padding: 0; box-sizing: border-box; }
		html, body { margin: 0; padding: 0; background: ${t.bodyBg}; }
		.wrapper {
			width: 100%;
			max-width: 100%;
			background: ${t.cardBg};
			padding: 48px 56px;
			min-height: 100%;
			box-sizing: border-box;
		}
		.markdown-body {
			font-family: ${f.family};
			color: ${t.textColor};
			line-height: 1.6;
		}
		${customCSS}
	[styleClose]`)}
</head>
<body>
	<div class="wrapper">
		<div class="markdown-body">
			${placeholderHtml}
		</div>
	</div>
	<script>
		// Report measured height to parent
		window.addEventListener('load', function() {
			var h = document.querySelector('.wrapper').scrollHeight;
			window.parent.postMessage({ type: 'measured-height', height: h }, '*');
		});
	<\/script>
</body>
</html>`;
	}

	// Listen for height measurements from iframe
	function handleMessage(e) {
		// Sandboxed iframes post with a null origin; reject anything else
		if (e.origin !== 'null' && e.origin !== null) return;
		if (e.data?.type === 'measured-height' && e.data.height > 0) {
			measuredHeight = Math.min(e.data.height, 5000);
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('message', handleMessage);
			analytics.trackToolOpened({ tool_name: 'markdown_to_image' });
			generationLimits.refresh();
		}

		return () => {
			if (browser) {
				window.removeEventListener('message', handleMessage);
				clearTimeout(debounceTimer);
			}
		};
	});

	// ── Generation ──
	async function handleGenerate() {
		if (isGenerating) return;
		if (!markdown?.trim()) {
			toast.set({ message: 'Please enter some markdown first', type: 'error', duration: 2000 });
			return;
		}

		// Check guest limits via global store
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
			let html = buildSrcDoc(markdown, theme, font, previewWidth);

			// Inject watermark for guests
			if (!isUserLoggedIn) {
				const watermarkDiv = `
					<div style="position: fixed; bottom: 10px; right: 10px; background: rgba(255,255,255,0.9);
						padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 9999;
						font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
						pictify.io
					</div>`;
				html = html.replace('</body>', `${watermarkDiv}</body>`);
			}

			// Use measured height if available and larger than default
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
				tool_name: 'markdown_to_image',
				format: 'png',
				with_watermark: !isUserLoggedIn
			});

			// Show contextual prompts for guests
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
		analytics.track('tool_download', { tool_name: 'markdown_to_image' });
	}

	// ── GitHub Import ──
	function convertGithubUrl(url) {
		try {
			const u = new URL(url.trim());
			if (u.hostname === 'raw.githubusercontent.com') return u.href;
			if (u.hostname === 'github.com') {
				// github.com/user/repo/blob/branch/path → raw.githubusercontent.com/user/repo/branch/path
				const parts = u.pathname.split('/').filter(Boolean);
				if (parts.length >= 5 && parts[2] === 'blob') {
					const [owner, repo, , branch, ...filePath] = parts;
					return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath.join('/')}`;
				}
			}
			return null;
		} catch {
			return null;
		}
	}

	async function fetchFromGithub() {
		if (!githubUrl.trim() || isFetchingGithub) return;

		const rawUrl = convertGithubUrl(githubUrl);
		if (!rawUrl) {
			toast.set({ message: 'Only GitHub URLs are supported (github.com or raw.githubusercontent.com)', type: 'error', duration: 3000 });
			return;
		}

		isFetchingGithub = true;
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);

		try {
			const res = await fetch(rawUrl, { signal: controller.signal });
			clearTimeout(timeout);

			if (!res.ok) {
				toast.set({ message: res.status === 404 ? 'File not found or private repository' : `GitHub returned ${res.status}`, type: 'error', duration: 3000 });
				return;
			}

			// Check content length
			const contentLength = res.headers.get('content-length');
			if (contentLength && parseInt(contentLength) > 100000) {
				toast.set({ message: 'File too large (max 100KB)', type: 'error', duration: 3000 });
				return;
			}

			const text = await res.text();
			if (text.length > 100000) {
				toast.set({ message: 'File too large (max 100KB)', type: 'error', duration: 3000 });
				return;
			}

			markdown = text;
			githubUrl = '';
			srcdocKey++;
			analytics.track('tool_github_import', { tool_name: 'markdown_to_image' });
			toast.set({ message: 'Markdown loaded from GitHub!', type: 'success', duration: 2000 });
		} catch (err) {
			clearTimeout(timeout);
			if (err.name === 'AbortError') {
				toast.set({ message: 'Request timed out', type: 'error', duration: 3000 });
			} else {
				toast.set({ message: 'Failed to fetch from GitHub', type: 'error', duration: 3000 });
			}
		} finally {
			isFetchingGithub = false;
		}
	}

	function handleSignupClick() {
		analytics.track('tool_signup_click', { tool_name: 'markdown_to_image' });
	}
</script>

<!-- ── Editor + Preview Layout ── -->
<div class="max-w-5xl mx-auto px-4 mb-20">
	<!-- GitHub Import -->
	<div class="mb-6">
		<div class="flex gap-2 items-center bg-white border-[3px] border-gray-900 rounded-xl p-3 shadow-[4px_4px_0_0_#1f2937]">
			<svg class="w-5 h-5 text-gray-500 ml-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
			<input
				type="text"
				bind:value={githubUrl}
				placeholder="Paste GitHub file URL (e.g. github.com/user/repo/blob/main/README.md)"
				class="flex-1 text-sm font-medium outline-none bg-transparent placeholder:text-gray-400"
				on:keydown={(e) => e.key === 'Enter' && fetchFromGithub()}
			/>
			<button
				on:click={fetchFromGithub}
				disabled={isFetchingGithub || !githubUrl.trim()}
				class="px-5 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-wider rounded-lg border-[3px] border-gray-900
					shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]
					disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
			>
				{isFetchingGithub ? 'Fetching...' : 'Fetch'}
			</button>
		</div>
	</div>

	<!-- Controls Bar -->
	<div class="flex flex-wrap gap-3 mb-6">
		<!-- Theme Selector -->
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

		<!-- Font Selector -->
		<div class="flex items-center gap-2 bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2.5 shadow-[4px_4px_0_0_#1f2937]">
			<span class="text-xs font-black uppercase tracking-widest text-gray-500">Font</span>
			<select bind:value={fontId} class="text-sm font-bold bg-transparent outline-none cursor-pointer">
				{#each fonts as f}
					<option value={f.id}>{f.name}</option>
				{/each}
			</select>
		</div>

		<!-- Dimensions -->
		<div class="flex items-center gap-2 bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2.5 shadow-[4px_4px_0_0_#1f2937]">
			<span class="text-xs font-black uppercase tracking-widest text-gray-500">Size</span>
			<input type="number" bind:value={previewWidth} min="200" max="2400" class="w-16 text-sm font-bold bg-transparent outline-none text-center" />
			<span class="text-gray-400 font-bold">x</span>
			<input type="number" bind:value={previewHeight} min="200" max="2400" class="w-16 text-sm font-bold bg-transparent outline-none text-center" />
		</div>
	</div>

	<!-- Editor + Preview Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
		<!-- Textarea Panel -->
		<div class="bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col max-h-[600px]">
			<div class="bg-gray-50 border-b-[3px] border-gray-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
				<div class="flex items-center gap-2">
					<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900" />
					<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-gray-900" />
					<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-gray-900" />
				</div>
				<span class="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">Markdown</span>
			</div>
			<textarea
				bind:value={markdown}
				on:input={handleInput}
				maxlength="50000"
				placeholder="Paste your markdown here..."
				class="flex-1 w-full p-6 font-mono text-sm leading-relaxed resize-none outline-none bg-white text-gray-800 overflow-y-auto"
				spellcheck="false"
			/>
		</div>

		<!-- Preview Panel -->
		<div class="bg-white border-[3px] border-gray-900 rounded-3xl shadow-[8px_8px_0_0_#1f2937] overflow-hidden flex flex-col max-h-[600px]">
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
						title="Markdown preview"
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
				href="/signup?redirect=/tools/markdown"
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

	<!-- Guest usage note -->
	{#if !isUserLoggedIn}
		<p class="text-center text-sm font-bold mt-4" class:text-gray-500={!limitReached} class:text-red-500={limitReached}>
			{#if limitReached}
				Daily limit reached. Sign up for unlimited access.
			{:else}
				{remaining} free generation{remaining !== 1 ? 's' : ''} remaining today
			{/if}
		</p>
	{/if}

	<!-- ── Generated Result ── -->
	{#if generatedImageUrl}
		<div class="mt-12">
			<div class="bg-white border-[3px] border-gray-900 rounded-3xl p-8 md:p-12 shadow-[8px_8px_0_0_#1f2937] text-center relative overflow-hidden">
				<div class="absolute top-0 right-0 w-40 h-40 bg-[#4ade80]/10 rounded-full -mr-10 -mt-10" />

				<span class="inline-block px-4 py-1.5 bg-[#4ade80] text-white border-[3px] border-gray-900 rounded-full text-xs font-black uppercase tracking-widest shadow-[2px_2px_0_0_#1f2937] mb-6">Success</span>

				<h3 class="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">
					Your image is ready
				</h3>

				<div class="inline-block bg-white border-[3px] border-gray-900 p-2 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-10">
					<img src={generatedImageUrl} alt="Generated markdown" class="max-w-full h-auto max-h-[400px]" />
				</div>

				<div class="flex flex-wrap justify-center gap-4">
					<a
						href={generatedImageUrl}
						download="pictify-markdown.png"
						on:click={handleDownload}
						class="px-6 py-3 bg-gray-900 text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
						Download PNG
					</a>
					<button
						on:click={() => copyToClipboard(generatedImageUrl, 'Link')}
						class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
						Copy Link
					</button>
					<button
						on:click={() => copyToClipboard(`<img src="${generatedImageUrl}" alt="Markdown image" />`, 'HTML')}
						class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
					>
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
				<button
					on:click={handleGenerate}
					class="px-5 py-2.5 bg-[#ff6b6b] text-white border-[3px] border-gray-900 font-black uppercase tracking-wide shadow-[3px_3px_0_0_#1f2937] hover:shadow-[1px_1px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-lg text-sm"
				>
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
				Generate markdown images programmatically. Render changelogs, README previews, and release notes as images in your CI/CD pipeline.
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
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">import</span> {'{'} <span class="text-[#9cdcfe]">marked</span> {'}'} <span class="text-[#c586c0]">from</span> <span class="text-[#ce9178]">'marked'</span>;
<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">fs</span> <span class="text-[#c586c0]">from</span> <span class="text-[#ce9178]">'fs'</span>;

<span class="text-[#6a9955]">// 1. Read markdown and convert to HTML</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">markdown</span> = <span class="text-[#9cdcfe]">fs</span>.<span class="text-[#dcdcaa]">readFileSync</span>(<span class="text-[#ce9178]">'README.md'</span>, <span class="text-[#ce9178]">'utf-8'</span>);
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">htmlContent</span> = <span class="text-[#9cdcfe]">marked</span>.<span class="text-[#dcdcaa]">parse</span>(<span class="text-[#9cdcfe]">markdown</span>);

<span class="text-[#6a9955]">// 2. Wrap in styled template</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">`&lt;html&gt;&lt;head&gt;
  &lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.css"&gt;
  &lt;style&gt;body{'{'} padding:48px; background:#fff {'}'} .markdown-body{'{'} max-width:800px; margin:auto {'}'}&lt;/style&gt;
&lt;/head&gt;&lt;body&gt;&lt;div class="markdown-body"&gt;${'$'}{'{'}htmlContent{'}'}&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;`</span>;

<span class="text-[#6a9955]">// 3. Call Pictify API</span>
<span class="text-[#c586c0]">const</span> <span class="text-[#9cdcfe]">response</span> = <span class="text-[#c586c0]">await</span> <span class="text-[#dcdcaa]">fetch</span>(<span class="text-[#ce9178]">'https://api.pictify.io/image'</span>, {'{'}
  <span class="text-[#9cdcfe]">method</span>: <span class="text-[#ce9178]">'POST'</span>,
  <span class="text-[#9cdcfe]">headers</span>: {'{'}
    <span class="text-[#ce9178]">'Content-Type'</span>: <span class="text-[#ce9178]">'application/json'</span>,
    <span class="text-[#ce9178]">'Authorization'</span>: <span class="text-[#ce9178]">`Bearer ${'$'}{'{'}YOUR_API_KEY{'}'}`</span>
  {'}'},
  <span class="text-[#9cdcfe]">body</span>: <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">stringify</span>({'{'}
    <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">'png'</span>
  {'}'})
{'}'});

<span class="text-[#c586c0]">const</span> {'{'} <span class="text-[#9cdcfe]">image</span> {'}'} = <span class="text-[#c586c0]">await</span> <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>();
<span class="text-[#9cdcfe]">console</span>.<span class="text-[#dcdcaa]">log</span>(<span class="text-[#9cdcfe]">image</span>.<span class="text-[#9cdcfe]">url</span>); <span class="text-[#6a9955]">// https://cdn.pictify.io/img/abc123.png</span></code></pre>

					{:else if apiLang === 'python'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">requests</span>
<span class="text-[#c586c0]">import</span> <span class="text-[#9cdcfe]">markdown</span>

<span class="text-[#6a9955]"># 1. Read markdown and convert to HTML</span>
<span class="text-[#c586c0]">with</span> <span class="text-[#dcdcaa]">open</span>(<span class="text-[#ce9178]">"README.md"</span>) <span class="text-[#c586c0]">as</span> <span class="text-[#9cdcfe]">f</span>:
    <span class="text-[#9cdcfe]">md_content</span> = <span class="text-[#9cdcfe]">f</span>.<span class="text-[#dcdcaa]">read</span>()

<span class="text-[#9cdcfe]">html_content</span> = <span class="text-[#9cdcfe]">markdown</span>.<span class="text-[#dcdcaa]">markdown</span>(<span class="text-[#9cdcfe]">md_content</span>, <span class="text-[#9cdcfe]">extensions</span>=[<span class="text-[#ce9178]">"fenced_code"</span>, <span class="text-[#ce9178]">"tables"</span>])

<span class="text-[#6a9955]"># 2. Wrap in styled template</span>
<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">f"""&lt;html&gt;&lt;head&gt;
  &lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.css"&gt;
  &lt;style&gt;body{'{'} padding:48px; background:#fff {'}'} .markdown-body{'{'} max-width:800px; margin:auto {'}'}&lt;/style&gt;
&lt;/head&gt;&lt;body&gt;&lt;div class="markdown-body"&gt;{'{'}html_content{'}'}&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;"""</span>

<span class="text-[#6a9955]"># 3. Call Pictify API</span>
<span class="text-[#9cdcfe]">response</span> = <span class="text-[#9cdcfe]">requests</span>.<span class="text-[#dcdcaa]">post</span>(
    <span class="text-[#ce9178]">"https://api.pictify.io/image"</span>,
    <span class="text-[#9cdcfe]">headers</span>={'{'}
        <span class="text-[#ce9178]">"Content-Type"</span>: <span class="text-[#ce9178]">"application/json"</span>,
        <span class="text-[#ce9178]">"Authorization"</span>: <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>
    {'}'},
    <span class="text-[#9cdcfe]">json</span>={'{'}
        <span class="text-[#ce9178]">"html"</span>: <span class="text-[#9cdcfe]">html</span>,
        <span class="text-[#ce9178]">"width"</span>: <span class="text-[#b5cea8]">1200</span>,
        <span class="text-[#ce9178]">"height"</span>: <span class="text-[#b5cea8]">630</span>,
        <span class="text-[#ce9178]">"fileExtension"</span>: <span class="text-[#ce9178]">"png"</span>
    {'}'}
)

<span class="text-[#9cdcfe]">image_url</span> = <span class="text-[#9cdcfe]">response</span>.<span class="text-[#dcdcaa]">json</span>()[<span class="text-[#ce9178]">"image"</span>][<span class="text-[#ce9178]">"url"</span>]
<span class="text-[#dcdcaa]">print</span>(<span class="text-[#9cdcfe]">image_url</span>)  <span class="text-[#6a9955]"># https://cdn.pictify.io/img/abc123.png</span></code></pre>

					{:else if apiLang === 'go'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">package</span> <span class="text-[#9cdcfe]">main</span>

<span class="text-[#c586c0]">import</span> (
    <span class="text-[#ce9178]">"bytes"</span>
    <span class="text-[#ce9178]">"encoding/json"</span>
    <span class="text-[#ce9178]">"fmt"</span>
    <span class="text-[#ce9178]">"net/http"</span>
    <span class="text-[#ce9178]">"os"</span>

    <span class="text-[#ce9178]">"github.com/gomarkdown/markdown"</span>
)

<span class="text-[#c586c0]">func</span> <span class="text-[#dcdcaa]">main</span>() {'{'}
    <span class="text-[#6a9955]">// 1. Read markdown and convert to HTML</span>
    <span class="text-[#9cdcfe]">md</span>, <span class="text-[#9cdcfe]">_</span> := <span class="text-[#9cdcfe]">os</span>.<span class="text-[#dcdcaa]">ReadFile</span>(<span class="text-[#ce9178]">"README.md"</span>)
    <span class="text-[#9cdcfe]">htmlContent</span> := <span class="text-[#dcdcaa]">string</span>(<span class="text-[#9cdcfe]">markdown</span>.<span class="text-[#dcdcaa]">ToHTML</span>(<span class="text-[#9cdcfe]">md</span>, <span class="text-[#569cd6]">nil</span>, <span class="text-[#569cd6]">nil</span>))

    <span class="text-[#6a9955]">// 2. Wrap in styled template</span>
    <span class="text-[#9cdcfe]">html</span> := <span class="text-[#9cdcfe]">fmt</span>.<span class="text-[#dcdcaa]">Sprintf</span>(<span class="text-[#ce9178]">`&lt;html&gt;&lt;head&gt;
  &lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.css"&gt;
&lt;/head&gt;&lt;body&gt;&lt;div class="markdown-body" style="padding:48px"&gt;%s&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;`</span>, <span class="text-[#9cdcfe]">htmlContent</span>)

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
    <span class="text-[#6a9955]">// Parse response for image.url</span>
{'}'}</code></pre>

					{:else if apiLang === 'ruby'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"net/http"</span>
<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"json"</span>
<span class="text-[#c586c0]">require</span> <span class="text-[#ce9178]">"redcarpet"</span>

<span class="text-[#6a9955]"># 1. Read markdown and convert to HTML</span>
<span class="text-[#9cdcfe]">md</span> = <span class="text-[#9cdcfe]">File</span>.<span class="text-[#dcdcaa]">read</span>(<span class="text-[#ce9178]">"README.md"</span>)
<span class="text-[#9cdcfe]">renderer</span> = <span class="text-[#9cdcfe]">Redcarpet</span>::<span class="text-[#9cdcfe]">Markdown</span>.<span class="text-[#dcdcaa]">new</span>(<span class="text-[#9cdcfe]">Redcarpet</span>::<span class="text-[#9cdcfe]">Render</span>::<span class="text-[#9cdcfe]">HTML</span>, <span class="text-[#9cdcfe]">fenced_code_blocks</span>: <span class="text-[#569cd6]">true</span>, <span class="text-[#9cdcfe]">tables</span>: <span class="text-[#569cd6]">true</span>)
<span class="text-[#9cdcfe]">html_content</span> = <span class="text-[#9cdcfe]">renderer</span>.<span class="text-[#dcdcaa]">render</span>(<span class="text-[#9cdcfe]">md</span>)

<span class="text-[#6a9955]"># 2. Wrap in styled template</span>
<span class="text-[#9cdcfe]">html</span> = <span class="text-[#ce9178]">%(&lt;html&gt;&lt;head&gt;
  &lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.css"&gt;
  &lt;style&gt;body{'{'} padding:48px; background:#fff {'}'}&lt;/style&gt;
&lt;/head&gt;&lt;body&gt;&lt;div class="markdown-body"&gt;#{'{'}<span class="text-[#9cdcfe]">html_content</span>{'}'}&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;)</span>

<span class="text-[#6a9955]"># 3. Call Pictify API</span>
<span class="text-[#9cdcfe]">uri</span> = <span class="text-[#9cdcfe]">URI</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>)
<span class="text-[#9cdcfe]">req</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>::<span class="text-[#9cdcfe]">Post</span>.<span class="text-[#dcdcaa]">new</span>(<span class="text-[#9cdcfe]">uri</span>, {'{'}
  <span class="text-[#ce9178]">"Content-Type"</span> => <span class="text-[#ce9178]">"application/json"</span>,
  <span class="text-[#ce9178]">"Authorization"</span> => <span class="text-[#ce9178]">"Bearer YOUR_API_KEY"</span>
{'}'})
<span class="text-[#9cdcfe]">req</span>.<span class="text-[#9cdcfe]">body</span> = {'{'} <span class="text-[#9cdcfe]">html</span>: <span class="text-[#9cdcfe]">html</span>, <span class="text-[#9cdcfe]">width</span>: <span class="text-[#b5cea8]">1200</span>, <span class="text-[#9cdcfe]">height</span>: <span class="text-[#b5cea8]">630</span>, <span class="text-[#9cdcfe]">fileExtension</span>: <span class="text-[#ce9178]">"png"</span> {'}'}.<span class="text-[#dcdcaa]">to_json</span>

<span class="text-[#9cdcfe]">res</span> = <span class="text-[#9cdcfe]">Net</span>::<span class="text-[#9cdcfe]">HTTP</span>.<span class="text-[#dcdcaa]">start</span>(<span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">hostname</span>, <span class="text-[#9cdcfe]">uri</span>.<span class="text-[#9cdcfe]">port</span>, <span class="text-[#9cdcfe]">use_ssl</span>: <span class="text-[#569cd6]">true</span>) {'{'} |<span class="text-[#9cdcfe]">http</span>| <span class="text-[#9cdcfe]">http</span>.<span class="text-[#dcdcaa]">request</span>(<span class="text-[#9cdcfe]">req</span>) {'}'}
<span class="text-[#9cdcfe]">image_url</span> = <span class="text-[#9cdcfe]">JSON</span>.<span class="text-[#dcdcaa]">parse</span>(<span class="text-[#9cdcfe]">res</span>.<span class="text-[#9cdcfe]">body</span>).<span class="text-[#dcdcaa]">dig</span>(<span class="text-[#ce9178]">"image"</span>, <span class="text-[#ce9178]">"url"</span>)
<span class="text-[#dcdcaa]">puts</span> <span class="text-[#9cdcfe]">image_url</span> <span class="text-[#6a9955]"># https://cdn.pictify.io/img/abc123.png</span></code></pre>

					{:else if apiLang === 'php'}
						<pre class="text-sm font-mono text-gray-300 leading-relaxed"><code><span class="text-[#569cd6]">&lt;?php</span>
<span class="text-[#c586c0]">use</span> <span class="text-[#9cdcfe]">League\CommonMark\CommonMarkConverter</span>;

<span class="text-[#6a9955]">// 1. Read markdown and convert to HTML</span>
<span class="text-[#9cdcfe]">$markdown</span> = <span class="text-[#dcdcaa]">file_get_contents</span>(<span class="text-[#ce9178]">"README.md"</span>);
<span class="text-[#9cdcfe]">$converter</span> = <span class="text-[#c586c0]">new</span> <span class="text-[#dcdcaa]">CommonMarkConverter</span>();
<span class="text-[#9cdcfe]">$htmlContent</span> = <span class="text-[#9cdcfe]">$converter</span>-><span class="text-[#dcdcaa]">convert</span>(<span class="text-[#9cdcfe]">$markdown</span>);

<span class="text-[#6a9955]">// 2. Wrap in styled template</span>
<span class="text-[#9cdcfe]">$html</span> = <span class="text-[#ce9178]">"&lt;html&gt;&lt;head&gt;
  &lt;link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown-light.css'&gt;
  &lt;style&gt;body{'{'} padding:48px; background:#fff {'}'}&lt;/style&gt;
&lt;/head&gt;&lt;body&gt;&lt;div class='markdown-body'&gt;{'{'}<span class="text-[#9cdcfe]">$htmlContent</span>{'}'}&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;"</span>;

<span class="text-[#6a9955]">// 3. Call Pictify API</span>
<span class="text-[#9cdcfe]">$ch</span> = <span class="text-[#dcdcaa]">curl_init</span>(<span class="text-[#ce9178]">"https://api.pictify.io/image"</span>);
<span class="text-[#dcdcaa]">curl_setopt_array</span>(<span class="text-[#9cdcfe]">$ch</span>, [
    <span class="text-[#9cdcfe]">CURLOPT_POST</span> => <span class="text-[#569cd6]">true</span>,
    <span class="text-[#9cdcfe]">CURLOPT_RETURNTRANSFER</span> => <span class="text-[#569cd6]">true</span>,
    <span class="text-[#9cdcfe]">CURLOPT_HTTPHEADER</span> => [
        <span class="text-[#ce9178]">"Content-Type: application/json"</span>,
        <span class="text-[#ce9178]">"Authorization: Bearer YOUR_API_KEY"</span>
    ],
    <span class="text-[#9cdcfe]">CURLOPT_POSTFIELDS</span> => <span class="text-[#dcdcaa]">json_encode</span>([
        <span class="text-[#ce9178]">"html"</span> => <span class="text-[#9cdcfe]">$html</span>,
        <span class="text-[#ce9178]">"width"</span> => <span class="text-[#b5cea8]">1200</span>,
        <span class="text-[#ce9178]">"height"</span> => <span class="text-[#b5cea8]">630</span>,
        <span class="text-[#ce9178]">"fileExtension"</span> => <span class="text-[#ce9178]">"png"</span>
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
					<h3 class="text-lg font-black text-black uppercase tracking-wider">
						Great First Image!
					</h3>
					<button
						class="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-[#ff6b6b] hover:text-white transition-colors"
						on:click={() => (showFirstGenerationPrompt = false)}
					>
						<span class="font-black">x</span>
					</button>
				</div>
				<div class="p-6">
					<p class="text-black font-bold mb-4">Create a free account to unlock:</p>
					<ul class="space-y-2 mb-6">
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#4ade80]">✓</span>
							<span class="font-bold text-black text-sm">Unlimited image generations</span>
						</li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#4ade80]">✓</span>
							<span class="font-bold text-black text-sm">No watermarks</span>
						</li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#4ade80]">✓</span>
							<span class="font-bold text-black text-sm">API Access</span>
						</li>
					</ul>
					<div class="space-y-3">
						<a
							href="/signup?redirect=/tools/markdown"
							on:click={handleSignupClick}
							class="block w-full py-3 px-6 border-[3px] border-black font-black bg-[#ff6b6b] uppercase tracking-wide text-center text-white shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							Create Free Account
						</a>
						<button
							class="w-full py-3 px-6 font-bold text-black hover:text-[#ff6b6b] transition-colors uppercase tracking-wide"
							on:click={() => (showFirstGenerationPrompt = false)}
						>
							Continue as Guest
						</button>
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
					<h3 class="text-lg font-black text-white uppercase tracking-wider">
						Ready to Create More?
					</h3>
					<button
						class="w-8 h-8 bg-white border-[3px] border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
						on:click={() => (showUpgradePrompt = false)}
					>
						<span class="font-black">x</span>
					</button>
				</div>
				<div class="p-6">
					<p class="text-black font-bold mb-4">
						You've reached the guest limit. Sign up to unlock:
					</p>
					<ul class="space-y-2 mb-6">
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#ff6b6b]">✓</span>
							<span class="font-bold text-black text-sm">Unlimited image generations</span>
						</li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#ff6b6b]">✓</span>
							<span class="font-bold text-black text-sm">No watermarks</span>
						</li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#ff6b6b]">✓</span>
							<span class="font-bold text-black text-sm">API Access</span>
						</li>
						<li class="flex items-center gap-2 p-2 bg-[#f8f8f8] border-[2px] border-black">
							<span class="font-black text-[#ff6b6b]">✓</span>
							<span class="font-bold text-black text-sm">Priority support</span>
						</li>
					</ul>
					<div class="space-y-3">
						<a
							href="/signup?redirect=/tools/markdown"
							on:click={handleSignupClick}
							class="block w-full py-3 px-6 border-[3px] border-black font-black bg-[#ff6b6b] uppercase tracking-wide text-center text-white shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
						>
							Sign Up Free
						</a>
						<button
							class="w-full py-3 px-6 font-bold text-black hover:text-[#ff6b6b] transition-colors uppercase tracking-wide"
							on:click={() => (showUpgradePrompt = false)}
						>
							Maybe Later
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<Toast />
</div>
