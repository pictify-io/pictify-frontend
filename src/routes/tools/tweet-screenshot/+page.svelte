<script>
	/**
	 * /tools/tweet-screenshot — the v2 tool page, column mode.
	 *
	 * The head, the FAQ and the prose keep their live wording; only the frame,
	 * the toolbar and the result surface are new. ToolSeoHead and ToolFaq stay:
	 * they own the frozen schema and heading.
	 */
	import ToolSeoHead from '$lib/components/tools/scaffold/ToolSeoHead.svelte';
	import ToolFaq from '$lib/components/tools/scaffold/ToolFaq.svelte';
	import ToolPageShell from '$lib/components/tools/v2/ToolPageShell.svelte';
	import ToolCard from '$lib/components/tools/v2/ToolCard.svelte';
	import QuotaMeter from '$lib/components/tools/v2/QuotaMeter.svelte';
	import GenerateButton from '$lib/components/tools/v2/GenerateButton.svelte';
	import ResultCard from '$lib/components/tools/v2/ResultCard.svelte';
	import AutomateSection from '$lib/components/tools/v2/AutomateSection.svelte';
	import LongformSection from '$lib/components/tools/v2/LongformSection.svelte';
	import RelatedTools from '$lib/components/tools/RelatedTools.svelte';
	import { onMount } from 'svelte';
	import { user } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { generationLimits, GUEST_DAILY_LIMIT } from '../../../store/generationLimits.store';
	import backend from '../../../service/backend';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import { analytics } from '$lib/telemetry.js';
	import { buildTweetHtml, DEFAULT_TWEET } from '$lib/components/tools/TweetScreenshot.js';

	$: isUserLoggedIn = !!$user?.email;

	const CARD_WIDTH = 600;

	// Reactive tool state — single source of truth for both preview and API snippet
	let urlInput = '';
	let status = 'idle'; // 'idle' | 'fetching' | 'prefilled' | 'confirm-overwrite'
	let fetchError = '';
	let fetchNotice = '';
	let tweet = { ...DEFAULT_TWEET };
	let editedFields = new Set(); // fields the user has touched since last fetch
	let isGenerating = false;
	let generatedImageUrl = '';
	let generationError = '';
	let fetchController = null;

	$: previewHtml = buildTweetHtml(tweet, { width: CARD_WIDTH });

	// Auto-size the preview iframe to its content height so there's no inner scrollbar.
	let previewIframe;
	let previewHeight = 320;
	function resizePreview() {
		try {
			const doc = previewIframe?.contentDocument;
			if (!doc) return;
			const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
			if (h && h !== previewHeight) previewHeight = h;
		} catch {
			// cross-origin — shouldn't happen for srcdoc, but be defensive
		}
	}
	// Re-measure whenever the HTML changes (next tick so the iframe has re-rendered)
	$: if (previewHtml && previewIframe) {
		setTimeout(resizePreview, 0);
	}

	// API snippet derives from the SAME `tweet` state that drives the preview — guards the
	// certificate-generator 0fe1c32 regression class (snippet reflecting stale props).
	$: snippetPayload = JSON.stringify(
		{
			html: buildTweetHtml(tweet, { width: CARD_WIDTH }),
			width: CARD_WIDTH,
			height: null,
			fileExtension: 'png'
		},
		null,
		2
	);
	$: apiSnippetCurl = `curl -X POST https://api.pictify.io/image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${snippetPayload.replace(/'/g, "'\\''")}'`;

	// Node.js and Python snippets for the Automate with the API section.
	$: apiSnippetNode = `import fetch from 'node-fetch';

const res = await fetch('https://api.pictify.io/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.PICTIFY_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${snippetPayload})
});

const { image } = await res.json();
console.log(image.url);`;

	$: apiSnippetPython = `import os
import requests

res = requests.post(
    'https://api.pictify.io/image',
    headers={
        'Authorization': f"Bearer {os.environ['PICTIFY_API_KEY']}",
        'Content-Type': 'application/json'
    },
    json=${snippetPayload.split('\n').join('\n           ')}
)

print(res.json()['image']['url'])`;

	function escapeHtml(s) {
		return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	/**
	 * Single-pass tokenizer: iterate through the source once, try each rule in priority
	 * order at the current cursor, emit a wrapped span, and advance. This prevents the
	 * "regex replace already-replaced HTML" bug that breaks naive chained highlighting.
	 */
	function highlight(source, rules) {
		let out = '';
		let i = 0;
		while (i < source.length) {
			let matched = false;
			for (const { re, cls } of rules) {
				re.lastIndex = i;
				const m = re.exec(source);
				if (m && m.index === i) {
					out += `<span class="tok-${cls}">${escapeHtml(m[0])}</span>`;
					i += m[0].length;
					matched = true;
					break;
				}
			}
			if (!matched) {
				out += escapeHtml(source[i]);
				i += 1;
			}
		}
		return out;
	}

	// cURL: flags, URLs, HTTP verbs, quoted strings (incl. multi-line)
	const curlRules = [
		{ re: /\\\n/gs, cls: 'punct' }, // line continuation
		{ re: /\bcurl\b/g, cls: 'cmd' },
		{ re: /-[A-Za-z]\b/g, cls: 'flag' },
		{ re: /\b(POST|GET|PUT|DELETE|PATCH)\b/g, cls: 'keyword' },
		{ re: /https?:\/\/[^\s'"\\]+/g, cls: 'url' },
		{ re: /"(?:[^"\\]|\\.)*"/gs, cls: 'string' },
		{ re: /'(?:[^'\\]|\\.)*'/gs, cls: 'string' },
		{ re: /\bBearer\b/g, cls: 'keyword' },
		{ re: /\$[A-Z_]+\b/g, cls: 'variable' }
	];

	// JavaScript / Node
	const jsRules = [
		{ re: /\/\/[^\n]*/g, cls: 'comment' },
		{ re: /"(?:[^"\\]|\\.)*"/gs, cls: 'string' },
		{ re: /'(?:[^'\\]|\\.)*'/gs, cls: 'string' },
		{ re: /`(?:[^`\\]|\\.)*`/gs, cls: 'string' },
		{
			re: /\b(?:import|from|const|let|var|await|async|return|if|else|function|new|true|false|null|undefined)\b/g,
			cls: 'keyword'
		},
		{ re: /\b(?:fetch|JSON|console|stringify|parse)\b/g, cls: 'function' },
		{ re: /\b[A-Za-z_$][\w$]*(?=\s*\()/g, cls: 'function' },
		{ re: /\b\d+(?:\.\d+)?\b/g, cls: 'number' },
		{ re: /[{}[\]()]/g, cls: 'punct' }
	];

	// Python
	const pyRules = [
		{ re: /#[^\n]*/g, cls: 'comment' },
		{ re: /f?"(?:[^"\\]|\\.)*"/gs, cls: 'string' },
		{ re: /f?'(?:[^'\\]|\\.)*'/gs, cls: 'string' },
		{
			re: /\b(?:import|from|as|def|return|if|else|elif|for|while|in|is|not|and|or|True|False|None|print)\b/g,
			cls: 'keyword'
		},
		{ re: /\b(?:requests|os|json)\b/g, cls: 'function' },
		{ re: /\.[a-zA-Z_][\w]*(?=\s*\()/g, cls: 'function' },
		{ re: /\b\d+(?:\.\d+)?\b/g, cls: 'number' },
		{ re: /[{}[\]()]/g, cls: 'punct' }
	];

	$: codeExamples = [
		{ id: 'curl', label: 'cURL', fileName: 'terminal', code: highlight(apiSnippetCurl, curlRules) },
		{
			id: 'node',
			label: 'Node.js',
			fileName: 'tweet-screenshot.js',
			code: highlight(apiSnippetNode, jsRules)
		},
		{
			id: 'python',
			label: 'Python',
			fileName: 'tweet_screenshot.py',
			code: highlight(apiSnippetPython, pyRules)
		}
	];
	let selectedSnippet = 'curl';
	$: activeSnippet = codeExamples.find((c) => c.id === selectedSnippet) || codeExamples[0];

	function markEdited(field) {
		editedFields.add(field);
		editedFields = editedFields; // trigger reactivity
	}

	function updateAuthor(field, value) {
		tweet = { ...tweet, author: { ...tweet.author, [field]: value } };
		markEdited(`author.${field}`);
	}
	function updateTweetField(field, value) {
		tweet = { ...tweet, [field]: value };
		markEdited(field);
	}
	function updateMetric(field, value) {
		const num = value === '' ? null : Number(value);
		tweet = { ...tweet, metrics: { ...tweet.metrics, [field]: Number.isNaN(num) ? null : num } };
		markEdited(`metrics.${field}`);
	}

	function messageForReason(reason, fallback) {
		if (reason === 'not_found')
			return 'Tweet not found or private. Fill the fields below manually.';
		if (reason === 'rate_limited') return 'Twitter is rate-limiting us. Fill the fields manually.';
		if (reason === 'upstream' || reason === 'shape_error')
			return "Couldn't reach Twitter. Fill the fields manually.";
		if (reason === 'disabled_kill_switch')
			return 'Auto-fetch is temporarily disabled. Fill the fields manually.';
		return fallback || 'Something went wrong.';
	}

	async function doFetch() {
		if (!urlInput.trim()) {
			fetchError = 'Paste a tweet URL first.';
			return;
		}
		fetchError = '';
		fetchNotice = '';
		status = 'fetching';
		if (fetchController) fetchController.abort();
		fetchController = new AbortController();

		// Raw fetch so non-2xx responses with structured body don't throw — our endpoint
		// uses HTTP status to signal *kind* of failure but always returns JSON we want to read.
		const qs = new URLSearchParams({ url: urlInput.trim() });
		const endpoint = `${PUBLIC_BACKEND_URL}/api/tools/tweet-screenshot/fetch?${qs}`;

		try {
			const response = await fetch(endpoint, {
				credentials: 'include',
				signal: fetchController.signal
			});
			let body = null;
			try {
				body = await response.json();
			} catch {
				body = null;
			}

			if (response.ok && body?.tweet) {
				tweet = body.tweet;
				editedFields = new Set();
				status = 'prefilled';
				generatedImageUrl = '';
				generationError = '';
				fetchNotice = body.tweet.is_long_form_truncated
					? 'This is a long-form tweet. X only returns the 277-character preview to embeds. Paste the full text into the body field below if you want the whole thing.'
					: '';
				analytics.trackToolOpened?.({ tool_name: 'tweet_screenshot', action: 'fetch_success' });
			} else {
				fetchError = messageForReason(body?.reason, body?.message);
				fetchNotice = '';
				status = 'idle';
			}
		} catch (e) {
			if (e?.name === 'AbortError') return;
			fetchError = 'Network error. Fill the fields manually.';
			status = 'idle';
		}
	}

	function handleFetchClick() {
		if (status === 'fetching') return;
		if (editedFields.size > 0 && status !== 'idle') {
			status = 'confirm-overwrite';
			return;
		}
		doFetch();
	}

	function confirmOverwrite() {
		doFetch();
	}
	function cancelOverwrite() {
		status = 'prefilled';
	}

	// Inline an external image as a base64 data URL. Our HTML-to-image renderer
	// waits for DOMContentLoaded only (not networkidle), so external <img> tags
	// race the screenshot. Inlining them as data URLs guarantees they're painted
	// before capture.
	async function inlineImage(url) {
		if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
		try {
			const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
			if (!resp.ok) return null;
			const blob = await resp.blob();
			return await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		} catch {
			return null; // avatar/media will fall back to initials / skip
		}
	}

	async function inlineTweetImages(t) {
		const [avatar, ...media] = await Promise.all([
			inlineImage(t?.author?.avatar_url),
			...(t?.media || []).map((m) => inlineImage(m.url))
		]);
		return {
			...t,
			author: { ...t.author, avatar_url: avatar },
			media: (t?.media || [])
				.map((m, i) => (media[i] ? { ...m, url: media[i] } : null))
				.filter(Boolean)
		};
	}

	async function handleGenerate() {
		isGenerating = true;
		generationError = '';
		generatedImageUrl = '';
		generationLimits.increment();

		try {
			const inlined = await inlineTweetImages(tweet);
			const response = await backend.post('/image/public', {
				html: buildTweetHtml(inlined, { width: CARD_WIDTH }),
				width: CARD_WIDTH,
				selector: '.card',
				fileExtension: 'png'
			});

			const imageUrl = response?.image?.url || response?.url;
			if (imageUrl) {
				generatedImageUrl = imageUrl;
				toast.set({ message: 'Tweet screenshot generated!', type: 'success', duration: 2000 });
				analytics.trackImageGenerated?.({
					tool_name: 'tweet_screenshot',
					format: 'png',
					with_watermark: !isUserLoggedIn
				});
			} else {
				throw new Error('No image URL in response');
			}
		} catch (e) {
			if (e?.message?.includes('rate') || e?.status === 429) {
				generationError = 'Too many requests. Please wait a moment and try again.';
			} else {
				generationError = e?.message || 'Failed to generate screenshot';
			}
			toast.set({ message: generationError, type: 'error', duration: 3000 });
		} finally {
			isGenerating = false;
		}
	}

	const faqs = [
		{
			q: 'How do I generate a tweet screenshot?',
			a: 'Paste any public tweet URL (from twitter.com or x.com), let us auto-fill the fields, tweak anything you like, and click Generate to download a PNG. You can also fill all fields manually if a tweet is deleted or private.'
		},
		{
			q: 'Can I generate tweet screenshots programmatically?',
			a: 'Yes. The same HTML that produces the preview is rendered to PNG by the Pictify API. Copy the curl snippet shown on this page, replace YOUR_API_KEY with your Pictify key, and POST it from any backend. Perfect for newsletters, CMS integrations, content pipelines, and bulk content generation.'
		},
		{
			q: 'Where does the tweet data come from?',
			a: "We fetch public tweet metadata via Twitter's public syndication endpoint, the same one Twitter itself uses to power embeds. No Twitter API key needed on your end. If the data is unavailable (deleted, private, or rate-limited), the tool falls back to manual entry so you can still produce the screenshot."
		},
		{
			q: 'Is there a watermark on downloads?',
			a: 'Guest downloads include a small Pictify watermark. Sign up for a free account to remove it.'
		},
		{
			q: 'What tweet features are supported?',
			a: 'Avatar, display name, handle, verified badge (blue or legacy gold), body text with clickable URLs/mentions/hashtags, media (up to 4 images), and engagement metrics (likes and replies). Quote tweets and polls are not yet supported.'
		},
		{
			q: 'Can I edit the tweet before downloading?',
			a: 'Absolutely. Every field is editable: great for making "what-if" screenshots, typo corrections, or creating mockups from scratch without a real tweet URL.'
		}
	];

	// SEO schema data — consumed by <ToolSeoHead>. Keeping the shape identical to
	// what the page emitted inline before the scaffold refactor so JSON-LD output
	// stays byte-identical (apart from optional whitespace).
	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify.io Tweet Screenshot Generator',
		url: 'https://pictify.io/tools/tweet-screenshot',
		description:
			'Generate tweet screenshots from any public tweet URL. Auto-fill via Twitter syndication, customize every field, download as PNG, or automate the whole thing with one API call.',
		applicationCategory: ['DesignApplication', 'ImageGenerator'],
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		featureList: [
			'Auto-fill from tweet URL',
			'Editable author, body, metrics, and media',
			'Verified badge (blue + legacy)',
			'High-resolution PNG download',
			'API for bulk generation',
			'No Twitter API key required'
		],
		creator: { '@type': 'Organization', name: 'Pictify.io', url: 'https://pictify.io' }
	};
	const howToMeta = {
		name: 'How to screenshot a tweet',
		description:
			'Generate a clean PNG screenshot of any public tweet in three steps. No screen capture, no Twitter API key.',
		totalTime: 'PT30S',
		supply: [{ '@type': 'HowToSupply', name: 'A public tweet URL from twitter.com or x.com' }],
		tool: [{ '@type': 'HowToTool', name: 'Pictify Tweet Screenshot Generator' }]
	};
	const howToSteps = [
		{
			name: 'Paste the tweet URL',
			text: 'Copy a tweet link from twitter.com or x.com and paste it into the input field.',
			url: 'https://pictify.io/tools/tweet-screenshot#paste-url'
		},
		{
			name: 'Customize the fields',
			text: 'Edit any field: display name, handle, verified badge, body text, media, or engagement metrics. The live preview updates instantly.',
			url: 'https://pictify.io/tools/tweet-screenshot#customize'
		},
		{
			name: 'Download the PNG',
			text: 'Click Download to get a high-resolution PNG, or copy the API call to automate it from your backend.',
			url: 'https://pictify.io/tools/tweet-screenshot#download'
		}
	];

	onMount(() => {
		analytics.trackToolOpened?.({ tool_name: 'tweet_screenshot' });
	});

	const TOOL_NAME = 'tweet_screenshot';
	const TOOL_PATH = '/tools/tweet-screenshot';

	$: guestRemaining = Math.max(0, GUEST_DAILY_LIMIT - ($generationLimits?.count || 0));

	const RELATED = [
		{
			title: 'Social proof card',
			meta: 'REVIEW → PNG',
			href: '/tools/social-proof-card',
			art: '/landing/tools/social-proof-card.svg'
		},
		{
			title: 'Code to image',
			meta: 'SNIPPET → PNG',
			href: '/tools/code-to-image',
			art: '/landing/tools/code-to-image.svg'
		},
		{
			title: 'OG image generator',
			meta: 'TITLE · LOGO → 1200×630',
			href: '/tools/og-image-generator',
			art: '/landing/tools/og-image-generator.svg'
		}
	];
</script>

<ToolSeoHead
	title="Tweet Screenshot Generator: Free Twitter Screenshot Maker | Pictify"
	description="Free tweet screenshot generator. Paste any Twitter or X URL, customize the tweet, download a PNG, or automate it with one API call. No Twitter API key needed."
	canonical="https://pictify.io/tools/tweet-screenshot"
	robots="index,follow,max-image-preview:large,max-snippet:-1"
	ogSiteName="Pictify"
	ogTitle="Tweet Screenshot Generator: Free Twitter Screenshot Maker"
	ogDescription="Paste a tweet URL, customize every field, download a PNG. Automate the whole thing with one API call. No Twitter API key required."
	ogImage="https://pictify.io/og/tools/tweet-screenshot.png"
	ogImageWidth={1200}
	ogImageHeight={630}
	ogImageAlt="Pictify tweet screenshot generator: paste a URL, download a PNG"
	twitterSite="@pictify_io"
	twitterCreator="@pictify_io"
	twitterTitle="Tweet Screenshot Generator: Free Twitter Screenshot Maker"
	twitterDescription="Paste a tweet URL, customize every field, download a PNG. Automate with one API call."
	twitterImage="https://pictify.io/og/tools/tweet-screenshot.png"
	twitterImageAlt="Pictify tweet screenshot generator"
	{webApplicationSchema}
	{faqs}
	breadcrumbLabel="Tweet Screenshot Generator"
	{howToSteps}
	{howToMeta}
/>

<ToolPageShell
	toolName={TOOL_NAME}
	toolPath={TOOL_PATH}
	breadcrumb="TWEET SCREENSHOT"
	facts="FREE · 5 RENDERS A DAY · NO SIGNUP · NO TWITTER API KEY"
	related={RELATED}
	loggedIn={isUserLoggedIn}
	hasResult={!!generatedImageUrl}
	longform="column"
>
	<h1
		slot="h1"
		class="font-display text-[38px] font-extrabold leading-[1.04] tracking-[-0.02em] text-brand-ink lg:text-[52px] lg:leading-[56px]"
	>
		Tweet Screenshot Generator
	</h1>

	<p
		slot="hero-sub"
		class="max-w-[640px] font-sans text-base leading-[25px] text-[#2A2C1E] lg:text-lg lg:leading-[27px]"
	>
		Paste any tweet URL. Auto-fills in a click. Tweak anything. Download as PNG, or automate with
		one API call.
	</p>

	<div slot="tool">
		<ToolCard>
			<div class="flex flex-col gap-6 p-5 lg:p-7">
				<div id="paste-url" class="scroll-mt-20" />
				<div class="max-w-3xl mx-auto mb-6">
					<div class="flex gap-2">
						<input
							type="url"
							placeholder="https://twitter.com/jack/status/20"
							bind:value={urlInput}
							on:keydown={(e) => e.key === 'Enter' && handleFetchClick()}
							class="flex-1 px-4 py-3 text-base bg-brand-paper border border-brand-ink rounded-lg focus:outline-none transition-all"
						/>
						<button
							on:click={handleFetchClick}
							disabled={status === 'fetching'}
							class="px-6 py-3 bg-brand-field text-brand-ink font-semibold border border-brand-ink rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
						>
							{status === 'fetching' ? 'Fetching…' : 'Fetch'}
						</button>
					</div>
					{#if fetchError}
						<p class="mt-2 text-sm font-bold text-brand-alarm">{fetchError}</p>
					{/if}
					{#if fetchNotice}
						<div
							class="mt-3 p-3 bg-brand-powder border border-brand-blue rounded-lg text-sm font-semibold text-brand-slate flex items-start gap-2"
						>
							<span class="text-brand-blue font-semibold">ℹ</span>
							<span>{fetchNotice}</span>
						</div>
					{/if}
					{#if status === 'confirm-overwrite'}
						<div
							class="mt-3 p-3 bg-brand-field/30 border border-brand-field rounded-lg flex items-center gap-3"
						>
							<span class="text-sm font-bold text-brand-ink"
								>Refetching will replace your edits.</span
							>
							<button
								on:click={confirmOverwrite}
								class="px-3 py-1.5 bg-brand-ink text-white text-sm font-bold rounded border border-brand-ink"
								>Refetch</button
							>
							<button
								on:click={cancelOverwrite}
								class="px-3 py-1.5 bg-brand-paper text-brand-ink text-sm font-bold rounded border border-brand-ink"
								>Cancel</button
							>
						</div>
					{/if}
				</div>
				<!-- Preview on top, fields below (stacked vertically; preview is full-width so tall cards don't clip) -->
				<div class="flex flex-col-reverse gap-6 mb-10 max-w-3xl mx-auto">
					<!-- Fields -->
					<div class="bg-brand-paper border border-brand-ink rounded-tile p-6">
						<h2 class="text-xl font-semibold mb-4 text-brand-ink">Tweet fields</h2>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-bold text-brand-slate mb-1">Display name</label>
								<input
									type="text"
									value={tweet.author.name}
									on:input={(e) => updateAuthor('name', e.target.value)}
									class="w-full px-3 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
								/>
							</div>
							<div>
								<label class="block text-sm font-bold text-brand-slate mb-1"
									>Handle (without @)</label
								>
								<input
									type="text"
									value={tweet.author.handle}
									on:input={(e) => updateAuthor('handle', e.target.value.replace(/^@/, ''))}
									class="w-full px-3 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
								/>
							</div>
							<div>
								<label class="block text-sm font-bold text-brand-slate mb-1">Avatar URL</label>
								<input
									type="url"
									value={tweet.author.avatar_url || ''}
									on:input={(e) => updateAuthor('avatar_url', e.target.value || null)}
									placeholder="https://pbs.twimg.com/..."
									class="w-full px-3 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
								/>
							</div>
							<div class="flex gap-4">
								<label class="flex items-center gap-2 font-bold text-sm text-brand-slate">
									<input
										type="checkbox"
										checked={tweet.author.is_verified_blue}
										on:change={(e) => updateAuthor('is_verified_blue', e.target.checked)}
										class="w-5 h-5"
									/>
									Verified (blue)
								</label>
								<label class="flex items-center gap-2 font-bold text-sm text-brand-slate">
									<input
										type="checkbox"
										checked={tweet.author.is_verified}
										on:change={(e) => updateAuthor('is_verified', e.target.checked)}
										class="w-5 h-5"
									/>
									Verified (legacy)
								</label>
							</div>
							<div>
								<label class="block text-sm font-bold text-brand-slate mb-1">Tweet body</label>
								<textarea
									value={tweet.body}
									on:input={(e) => updateTweetField('body', e.target.value)}
									rows="4"
									class="w-full px-3 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold resize-none"
								/>
							</div>
							<div>
								<label class="block text-sm font-bold text-brand-slate mb-1"
									>Date (ISO 8601 or blank)</label
								>
								<input
									type="text"
									value={tweet.created_at || ''}
									on:input={(e) => updateTweetField('created_at', e.target.value || null)}
									placeholder="2026-04-14T10:00:00.000Z"
									class="w-full px-3 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
								/>
							</div>
							<div class="grid grid-cols-3 gap-3">
								<div>
									<label class="block text-xs font-bold text-brand-slate mb-1">Replies</label>
									<input
										type="number"
										min="0"
										value={tweet.metrics.replies ?? ''}
										on:input={(e) => updateMetric('replies', e.target.value)}
										class="w-full px-2 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
									/>
								</div>
								<div>
									<label class="block text-xs font-bold text-brand-slate mb-1">Retweets</label>
									<input
										type="number"
										min="0"
										value={tweet.metrics.retweets ?? ''}
										on:input={(e) => updateMetric('retweets', e.target.value)}
										class="w-full px-2 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
									/>
								</div>
								<div>
									<label class="block text-xs font-bold text-brand-slate mb-1">Likes</label>
									<input
										type="number"
										min="0"
										value={tweet.metrics.likes ?? ''}
										on:input={(e) => updateMetric('likes', e.target.value)}
										class="w-full px-2 py-2 bg-brand-paper border border-brand-ink rounded-md font-semibold"
									/>
								</div>
							</div>
						</div>
						{#if generationError}
							<p class="mt-2 text-sm font-bold text-brand-alarm">{generationError}</p>
						{/if}
					</div>

					<!-- Live preview -->
					<div class="bg-brand-subtle border border-brand-ink rounded-tile p-6">
						<h2 class="text-xl font-semibold mb-4 text-brand-ink">Live preview</h2>
						<div class="flex items-start justify-center">
							<div
								class="rounded-xl overflow-hidden border border-brand-rule shadow-md bg-brand-paper max-w-full"
							>
								<!-- Rendered tweet card; same HTML that will be POSTed to /image/public on Download -->
								<iframe
									bind:this={previewIframe}
									on:load={resizePreview}
									title="Tweet preview"
									srcdoc={previewHtml}
									scrolling="no"
									style="width:{CARD_WIDTH}px;max-width:100%;height:{previewHeight}px;border:0;display:block;overflow:hidden"
									sandbox="allow-same-origin"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<svelte:fragment slot="toolbar-left">
				<span class="font-mono text-xs tracking-[0.06em] text-brand-mute">TWEET URL → PNG</span>
			</svelte:fragment>

			<svelte:fragment slot="toolbar-right">
				<QuotaMeter
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
				/>
				<GenerateButton
					label="Download PNG"
					loading={isGenerating}
					remaining={guestRemaining}
					loggedIn={isUserLoggedIn}
					toolName={TOOL_NAME}
					toolPath={TOOL_PATH}
					on:generate={handleGenerate}
				/>
			</svelte:fragment>
		</ToolCard>
	</div>

	<div slot="result">
		{#if generatedImageUrl}
			<ResultCard
				imageUrl={generatedImageUrl}
				formatLabel="PNG"
				fileExtension="png"
				loggedIn={isUserLoggedIn}
				toolName={TOOL_NAME}
				toolPath={TOOL_PATH}
				html={previewHtml}
			/>
		{/if}
	</div>

	<AutomateSection
		slot="automate"
		title="Automate with the"
		titleHighlight="API"
		toolName={TOOL_NAME}
		description="Generate tweet screenshots programmatically. Same HTML as the live preview, rendered at any scale via a single POST."
		{codeExamples}
	/>

	<svelte:fragment slot="longform">
		<LongformSection index="01" id="about" first>
			<h2
				slot="heading"
				class="font-display text-[28px] font-bold leading-9 tracking-[-0.02em] text-brand-ink"
			>
				The fastest way to <span class="text-brand-pink">screenshot a tweet</span>
			</h2>
			<p class="text-lg text-brand-slate leading-relaxed mb-5">
				A clean tweet screenshot does a lot of work in content. Newsletters quote tweets. LinkedIn
				posts lead with them. Podcast thumbnails reference them. Decks drop them onto slides. The
				problem: the built-in phone or browser screenshot always looks wrong: wrong crop, wrong
				dark/light mode, UI chrome bleeding in, verified badge missing, weird resolution. This tool
				fixes that in one paste.
			</p>
			<p class="text-lg text-brand-slate leading-relaxed mb-8">
				Paste any public tweet URL from twitter.com or x.com. We fetch the tweet body, author,
				avatar, verified badge, media, and engagement metrics through Twitter's own public
				syndication endpoint; no Twitter API key required on your side. Every field is editable, so
				you can tweak the name, rewrite the body for a mockup, adjust metric counts, or swap the
				avatar. Click download and you get a crisp PNG at 600&nbsp;×&nbsp;auto, perfect for any
				social graphic, blog embed, or presentation slide.
			</p>

			<h3 class="text-2xl font-semibold text-brand-ink mt-10 mb-4">
				Who uses a tweet screenshot generator?
			</h3>
			<ul
				class="text-lg text-brand-slate leading-relaxed space-y-3 mb-8 list-disc pl-6 marker:text-brand-pink"
			>
				<li>
					<strong>Newsletter writers and creators</strong> who quote tweets in Substack, Beehiiv, or
					ConvertKit and want a consistent look instead of iOS screenshots of different phone sizes.
				</li>
				<li>
					<strong>Marketing teams</strong> turning customer praise into social proof (testimonial tweets,
					product launch reactions, founder announcements) formatted for LinkedIn, Instagram, and ads.
				</li>
				<li>
					<strong>Podcast and YouTube creators</strong> who reference a tweet on screen or in a thumbnail
					and need a clean, non-branded capture that doesn't scream "phone photo."
				</li>
				<li>
					<strong>Writers and journalists</strong> embedding tweets in articles where the official Twitter
					embed is blocked, rate-limited, or too heavy for AMP.
				</li>
				<li>
					<strong>Developers and product teams</strong> generating tweet images programmatically for
					content pipelines, CMS integrations, or automated lifecycle emails. See the
					<a href="#api" class="text-brand-pink underline">API section</a> above.
				</li>
			</ul>

			<h3 class="text-2xl font-semibold text-brand-ink mt-10 mb-4">
				How to screenshot a tweet in three steps
			</h3>
			<ol
				class="text-lg text-brand-slate leading-relaxed space-y-3 mb-8 list-decimal pl-6 marker:text-brand-pink marker:font-semibold"
			>
				<li>
					<strong>Paste the tweet URL.</strong> Copy the link from any tweet on
					<code class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">twitter.com</code>
					or
					<code class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">x.com</code>
					and paste it above. We accept links from mobile, desktop, and shared X
					<code class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">?s=20</code>
					variants.
				</li>
				<li>
					<strong>Edit any field.</strong> Display name, handle, verified badge (blue or legacy), body
					text, media, date, replies, retweets, likes. Every surface is editable. Great for typo fixes,
					hypothetical tweets, or stress-testing a draft before posting.
				</li>
				<li>
					<strong>Download the PNG</strong> or copy the API call and automate it from your backend. Both
					paths produce the exact same image: what you preview is what you ship.
				</li>
			</ol>

			<h3 class="text-2xl font-semibold text-brand-ink mt-10 mb-4">
				Why this beats screenshots of your screen
			</h3>
			<div class="grid md:grid-cols-2 gap-5 mb-8">
				<div class="bg-brand-paper border border-brand-ink rounded-xl p-5">
					<h4 class="font-semibold text-brand-ink mb-2">Pixel-perfect, every time</h4>
					<p class="text-brand-slate">
						Rendered server-side with consistent typography and spacing. No viewport differences, no
						device pixel ratio weirdness, no status-bar notch cropping.
					</p>
				</div>
				<div class="bg-brand-paper border border-brand-ink rounded-xl p-5">
					<h4 class="font-semibold text-brand-ink mb-2">Works when the embed doesn't</h4>
					<p class="text-brand-slate">
						Tweet got deleted or the account went private? Paste what you remember, fill the fields
						manually, and produce a usable screenshot without relying on the live tweet.
					</p>
				</div>
				<div class="bg-brand-paper border border-brand-ink rounded-xl p-5">
					<h4 class="font-semibold text-brand-ink mb-2">No Twitter API key</h4>
					<p class="text-brand-slate">
						Other tools require you to spin up a Twitter developer account and manage tokens. We use
						the public syndication endpoint: zero setup, zero monthly cost.
					</p>
				</div>
				<div class="bg-brand-paper border border-brand-ink rounded-xl p-5">
					<h4 class="font-semibold text-brand-ink mb-2">Scales to a million</h4>
					<p class="text-brand-slate">
						Need tweet images for every author, every post, every campaign? The same tool ships a
						REST API: POST a payload, get a CDN-backed PNG.
					</p>
				</div>
			</div>

			<h3 class="text-2xl font-semibold text-brand-ink mt-10 mb-4">
				What's captured in the tweet image
			</h3>
			<p class="text-lg text-brand-slate leading-relaxed mb-4">
				The rendered image matches Twitter's native tweet card layout:
			</p>
			<ul
				class="text-lg text-brand-slate leading-relaxed space-y-2 mb-8 list-disc pl-6 marker:text-brand-pink"
			>
				<li>
					Profile picture (auto-fetched from <code
						class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">pbs.twimg.com</code
					>)
				</li>
				<li>Display name + @handle with verified badge (blue checkmark or legacy gold)</li>
				<li>Tweet body with clickable URLs, mentions, and hashtags styled in Twitter blue</li>
				<li>Attached photos: up to four, in the same grid layout Twitter uses</li>
				<li>Post timestamp in the Twitter time format</li>
				<li>Engagement metrics: replies, retweets, and likes (formatted with K/M suffixes)</li>
				<li>The X logo in the top-right corner, so the screenshot reads as a tweet at a glance</li>
			</ul>

			<h3 class="text-2xl font-semibold text-brand-ink mt-10 mb-4">
				Tweet to image, programmatically
			</h3>
			<p class="text-lg text-brand-slate leading-relaxed mb-4">
				Everything this tool does, the <a
					href="https://docs.pictify.io"
					target="_blank"
					rel="noopener"
					class="text-brand-pink underline">Pictify API</a
				>
				does via a single HTTP call. Generate tweet screenshots as part of a daily newsletter build,
				a CMS publish hook, or a scheduled social campaign. The API snippet
				<a href="#api" class="text-brand-pink underline">above</a> is the exact call we'd make ourselves.
				Copy it, swap in your key, and you're shipping.
			</p>
			<p class="text-lg text-brand-slate leading-relaxed">
				Common automated workflows: <em
					>"every new reply to our product account becomes a social post"</em
				>, <em>"founder tweets auto-generate LinkedIn graphics"</em>,
				<em
					>"newsletter archive page renders every quoted tweet as a PNG for faster load and better
					SEO"</em
				>.
			</p>
		</LongformSection>

		<ToolFaq {faqs} />
	</svelte:fragment>

	<svelte:fragment slot="footer-links">
		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<RelatedTools tools={['certificate', 'markdown', 'code']} />
		</div>
	</svelte:fragment>
</ToolPageShell>
