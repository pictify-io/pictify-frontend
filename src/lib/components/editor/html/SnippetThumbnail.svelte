<script>
	/**
	 * SnippetThumbnail — renders a snippet's body as a live miniature
	 * preview inside the snippet library card.
	 *
	 * Why shadow DOM: snippets ship inline styles that assume they're
	 * the only thing on the page (100% widths, margin: 0, huge font
	 * sizes). Rendering directly into the library DOM would leak those
	 * styles into the surrounding UI and fight for layout. A shadow
	 * root isolates them — styles scoped inside, styles scoped outside,
	 * body elements inherit only what we explicitly pass in.
	 *
	 * Why lazy mount: the library can have 60+ cards. Rendering every
	 * thumbnail up front + compiling handlebars ASTs for each is
	 * wasteful when most aren't scrolled into view. IntersectionObserver
	 * defers mount until the card approaches the viewport.
	 *
	 * Why transform-scale instead of width-set: snippets are authored at
	 * natural pixel sizes (1080×1080, 1920×1080, etc.). Resizing via
	 * width would reflow typography at the wrong cap size. Rendering at
	 * natural scale + CSS-scaling down preserves the typography
	 * relationships and is cheap (GPU-composited).
	 */
	import { onMount, onDestroy } from 'svelte';
	import Handlebars from 'handlebars';

	/** @type {string} the snippet body — a Handlebars template */
	export let body = '';
	/** @type {number} card width in px; the thumbnail fills this */
	export let cardWidth = 240;
	/** @type {number} card height in px */
	export let cardHeight = 150;
	/** Optional natural width the snippet was authored at (e.g. 1080
	 *  for square templates). If omitted, we infer from the first
	 *  `width:\s*<N>px` style found in the body. */
	export let naturalWidth = 0;
	export let naturalHeight = 0;
	/** Values to merge on top of SAMPLE_VARS. Used by callers like the
	 *  render page to show a LIVE preview that follows the user's
	 *  variable edits. Empty / undefined entries fall back to the
	 *  baked-in sample dictionary so the preview never has holes. */
	export let overrideVars = null;

	let hostEl; // the outer card div with the shadow root
	let io = null;
	let mounted = false;
	// Tracks the last rendered combination — used so the reactive
	// re-render below only fires when body / overrideVars actually
	// change, not on every parent update.
	let lastRenderKey = null;

	// Sample values used to stub {{variables}} before rendering. Covers
	// every variable name used across the current snippet library so
	// cells render populated content instead of literal `{{foo}}` strings
	// or empty #each loops. New snippet vars should get stubs here —
	// otherwise the template renders but the value is an empty string.
	const SAMPLE_VARS = {
		// Text / headline
		title: 'Hello, world',
		subtitle: 'Short subtitle',
		headline: 'Big headline',
		tagline: 'One-line tagline',
		body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		description: 'Short description',
		message: 'Sample message',
		summary: 'Post summary',
		hook: 'Hook text',
		recipient: 'Jane Doe',
		courseName: 'Advanced Topics',
		eventName: 'Launch Party',
		eventType: 'Live Event',
		productName: 'Pictify',
		newsletterName: 'The Weekly',
		episodeTitle: 'Rethinking design',
		postText: 'This is a demo post rendered in a thumbnail preview.',
		siteName: 'pictify.io',
		channelName: 'Pictify',
		viewCount: '12.4K',
		readTime: 4,
		host: 'Alex R.',
		guestName: 'Jordan L.',
		authorName: 'Jane Doe',
		authorTitle: 'Designer',
		authorHandle: 'jane_doe',
		authorRole: 'Lead Designer',
		name: 'Alex',
		metric: 'Retention',
		metricLabel: 'Retention',
		metricValue: '87%',
		filename: 'index.js',
		language: 'JavaScript',
		title_storm: 'ok',
		weekday: 'FRI',
		month: 'APR',
		day: 19,
		rowLabel: 'Last 7 days',
		chartTitle: 'Top sources',
		funnelTitle: 'Signup funnel',
		quote: 'Design is thinking made visual.',
		ctaLabel: 'Get started',
		ctaPrimary: 'Try free',
		ctaSecondary: 'Changelog',
		pinCategory: 'IDEAS',
		tag: 'NEW',
		hookLabel: 'INSIGHT',
		alertBg: '#ffe066',
		email: 'alex@example.com',
		website: 'example.com',
		role: 'Designer',
		planName: 'Pro',
		storeName: 'PICTIFY STORE',
		badge: 'WATCH NOW',
		// Numbers
		price: 29,
		total: 147,
		amount: 42,
		value: '1,248',
		count: 1248,
		percent: 72,
		ratio: 0.72,
		score: 4.8,
		reviewCount: '1,204',
		issueNumber: 42,
		episodeNumber: 17,
		duration: '38 min',
		trendValue: 12.4,
		trendDelta: 8.2,
		orderNumber: '1024',
		othersCount: 6,
		version: '2.0',
		beforeValue: '14%',
		afterValue: '38%',
		beforeLabel: 'Last quarter',
		afterLabel: 'This quarter',
		// Booleans / flags
		isCurrency: true,
		isPositive: true,
		isPremium: true,
		active: true,
		isAdmin: false,
		isMember: true,
		// Dates
		eventDate: '2026-05-20',
		eventTime: '18:00',
		completedOn: '2026-04-18',
		createdAt: '2026-04-18',
		orderDate: '2026-04-18',
		timestamp: '2026-04-18T14:30:00Z',
		publishedAt: '2026-04-18',
		postedAt: '2026-04-18T14:00:00Z',
		shipDate: 'Today',
		source: 'Web',
		// URLs / images
		url: 'https://example.com',
		avatarUrl:
			'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
		guestAvatar:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
		authorAvatar:
			'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
		creatorAvatar:
			'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop',
		backgroundImage:
			'https://images.unsplash.com/photo-1506765515384-028b60a970df?w=1200&h=700&fit=crop',
		// Arrays / objects
		tags: ['design', 'typography', 'color'],
		items: [
			{ name: 'T-shirt', qty: 2, price: 24, percent: 80 },
			{ name: 'Mug', qty: 1, price: 12, percent: 55 },
			{ name: 'Sticker pack', qty: 3, price: 6, percent: 30 }
		],
		features: [
			{ icon: '\u2713', title: 'Variables', body: 'Auto-declared as you type.' },
			{ icon: '\u2601', title: 'Cloud', body: 'Preview in real time.' },
			{ icon: '\u26A1', title: 'Fast', body: 'Millisecond renders.' }
		],
		entries: [
			{
				avatar:
					'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop',
				name: 'Ada L.',
				score: '9,214'
			},
			{
				avatar:
					'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop',
				name: 'Grace H.',
				score: '8,801'
			},
			{
				avatar:
					'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop',
				name: 'Alan T.',
				score: '8,522'
			}
		],
		stats: [
			{ value: '12K', label: 'Users' },
			{ value: '98%', label: 'Uptime' },
			{ value: '4.8', label: 'Rating' },
			{ value: '24/7', label: 'Support' }
		],
		rows: [
			{ label: 'Organic', value: '4,210', percent: 82 },
			{ label: 'Referral', value: '2,318', percent: 48 },
			{ label: 'Direct', value: '1,097', percent: 22 }
		],
		stages: [
			{ label: 'Visited', count: '10,000', dropoff: '100%', widthPercent: 100 },
			{ label: 'Signed up', count: '3,220', dropoff: '32%', widthPercent: 70 },
			{ label: 'Activated', count: '1,840', dropoff: '18%', widthPercent: 45 },
			{ label: 'Paying', count: '612', dropoff: '6%', widthPercent: 20 }
		],
		steps: [
			{ n: 1, label: 'Account', done: true },
			{ n: 2, label: 'Details', done: true },
			{ n: 3, label: 'Review', done: false },
			{ n: 4, label: 'Done', done: false }
		],
		events: [
			{ at: '2026-04-10', title: 'v2.0 shipped', body: 'Templates + variables + copilot.' },
			{ at: '2026-03-22', title: 'Private beta', body: 'First 200 users get access.' }
		],
		bars: [30, 52, 40, 68, 55, 82, 74],
		days: [
			{ label: 'Mon', count: 3 },
			{ label: 'Tue', count: 0 },
			{ label: 'Wed', count: 5 },
			{ label: 'Thu', count: 2 },
			{ label: 'Fri', count: 4 },
			{ label: 'Sat', count: 1 },
			{ label: 'Sun', count: 0 }
		],
		amounts: [12, 24, 8, 34, 16],
		scores: [82, 91, 88, 79, 93],
		members: [
			{
				name: 'Ada',
				avatar:
					'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop'
			},
			{
				name: 'Jordan',
				avatar:
					'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop'
			},
			{
				name: 'Kai',
				avatar:
					'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&h=60&fit=crop'
			}
		],
		leaderLine: 'Ada + Jordan',
		code: '<span style="color:#60a5fa;">function</span> hello() {\n  <span style="color:#34d399;">console</span>.log(&quot;hi&quot;);\n}',
		// Objects
		customer: {
			billing: { name: 'Acme Co.', email: 'billing@acme.com', balance: 1240 }
		},
		user: { name: 'Alex' },
		product: { name: 'Pictify', price: 29 },
		payload: { templateUid: 'abc123', width: 1080, height: 1080 },
		location: 'San Francisco',
		nickname: 'Ada',
		firstName: 'Alex',
		timeframe: '30 days'
	};

	// Handlebars safelisted helpers. Mirrors the backend's
	// service/template-helpers.js so thumbnails render the same way
	// production templates would. Definitions are intentionally tiny —
	// we only need enough fidelity for the miniature preview to read.
	function registerHelpers(hb) {
		const s = (v) => (v === null || v === undefined ? '' : String(v));
		const n = (v) => (typeof v === 'number' ? v : Number(v) || 0);
		hb.registerHelper('length', (v) => (v && v.length) || 0);
		hb.registerHelper('isEmpty', (v) => !v || (Array.isArray(v) && v.length === 0));
		hb.registerHelper('isNotEmpty', (v) => !!v && !(Array.isArray(v) && v.length === 0));
		hb.registerHelper('isDefined', (v) => v !== undefined && v !== null);
		hb.registerHelper('isUndefined', (v) => v === undefined || v === null);
		hb.registerHelper('isArray', (v) => Array.isArray(v));
		hb.registerHelper('isString', (v) => typeof v === 'string');
		hb.registerHelper('isNumber', (v) => typeof v === 'number');
		hb.registerHelper('isBoolean', (v) => typeof v === 'boolean');
		hb.registerHelper('isObject', (v) => typeof v === 'object' && v !== null && !Array.isArray(v));
		hb.registerHelper('contains', (arr, v) => Array.isArray(arr) && arr.includes(v));
		hb.registerHelper('first', (arr) => (Array.isArray(arr) ? arr[0] : ''));
		hb.registerHelper('last', (arr) => (Array.isArray(arr) ? arr[arr.length - 1] : ''));
		hb.registerHelper('indexOf', (arr, v) => (Array.isArray(arr) ? arr.indexOf(v) : -1));
		hb.registerHelper('join', (arr, sep = ', ') => (Array.isArray(arr) ? arr.join(sep) : ''));
		hb.registerHelper('slice', (arr, a, b) => (Array.isArray(arr) ? arr.slice(a, b) : []));
		hb.registerHelper('lowercase', (v) => s(v).toLowerCase());
		hb.registerHelper('uppercase', (v) => s(v).toUpperCase());
		hb.registerHelper('capitalize', (v) => s(v).charAt(0).toUpperCase() + s(v).slice(1));
		hb.registerHelper('titleCase', (v) =>
			s(v)
				.split(/\s+/)
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ')
		);
		hb.registerHelper('trim', (v) => s(v).trim());
		hb.registerHelper('truncate', (v, len = 40, suffix = '…') => {
			const str = s(v);
			return str.length > len ? str.slice(0, len) + suffix : str;
		});
		hb.registerHelper('padStart', (v, len = 0, ch = ' ') => s(v).padStart(len, ch));
		hb.registerHelper('padEnd', (v, len = 0, ch = ' ') => s(v).padEnd(len, ch));
		hb.registerHelper('replace', (v, find, rep) => s(v).split(find).join(rep));
		hb.registerHelper('split', (v, sep) => s(v).split(sep));
		hb.registerHelper('startsWith', (v, p) => s(v).startsWith(s(p)));
		hb.registerHelper('endsWith', (v, p) => s(v).endsWith(s(p)));
		hb.registerHelper('round', (v, d = 0) => {
			const f = Math.pow(10, d);
			return Math.round(n(v) * f) / f;
		});
		hb.registerHelper('floor', (v) => Math.floor(n(v)));
		hb.registerHelper('ceil', (v) => Math.ceil(n(v)));
		hb.registerHelper('abs', (v) => Math.abs(n(v)));
		hb.registerHelper('min', (...args) => Math.min(...args.slice(0, -1).map(n)));
		hb.registerHelper('max', (...args) => Math.max(...args.slice(0, -1).map(n)));
		hb.registerHelper('sum', (arr) => (Array.isArray(arr) ? arr.reduce((a, b) => a + n(b), 0) : 0));
		hb.registerHelper('average', (arr) =>
			Array.isArray(arr) && arr.length
				? arr.reduce((a, b) => a + n(b), 0) / arr.length
				: 0
		);
		hb.registerHelper('currency', (v, code = 'USD') => {
			try {
				return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(n(v));
			} catch {
				return s(v);
			}
		});
		hb.registerHelper('number', (v) => new Intl.NumberFormat('en-US').format(n(v)));
		hb.registerHelper('percent', (v) => `${Math.round(n(v) * (n(v) < 1 ? 100 : 1))}%`);
		hb.registerHelper('date', (v, fmt = 'short') => {
			try {
				const d = new Date(v);
				if (isNaN(d.getTime())) return s(v);
				if (fmt === 'long') return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
				return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
			} catch {
				return s(v);
			}
		});
		hb.registerHelper('time', (v) => {
			try {
				const d = new Date(v);
				if (isNaN(d.getTime())) return s(v);
				return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
			} catch {
				return s(v);
			}
		});
		hb.registerHelper('default', (v, fallback) => (v === undefined || v === null || v === '' ? fallback : v));
		hb.registerHelper('coalesce', (...args) => {
			for (const a of args.slice(0, -1)) {
				if (a !== undefined && a !== null && a !== '') return a;
			}
			return '';
		});
		hb.registerHelper('json', (v) => new Handlebars.SafeString(JSON.stringify(v, null, 2)));
		hb.registerHelper('parseJson', (v) => {
			try {
				return JSON.parse(s(v));
			} catch {
				return null;
			}
		});
	}

	// Cheap natural-size inference: scan for the first inline
	// `width:<N>px` / `height:<N>px` on what looks like the root
	// element. If the snippet is a sub-component (no explicit size),
	// default to the card size — the component renders at its own
	// natural layout, no scaling needed.
	function inferNaturalSize(src) {
		if (naturalWidth && naturalHeight) return { w: naturalWidth, h: naturalHeight };
		const wMatch = src.match(/width:\s*(\d+)px/);
		const hMatch = src.match(/height:\s*(\d+)px/);
		if (wMatch && hMatch) {
			return { w: parseInt(wMatch[1], 10), h: parseInt(hMatch[1], 10) };
		}
		return { w: cardWidth * 3, h: cardHeight * 3 };
	}

	// Merge overrideVars on top of SAMPLE_VARS, dropping empty strings
	// / null / undefined so the user's half-typed values don't render as
	// blanks — baked sample values hold the fort until the user finishes.
	function buildContext() {
		if (!overrideVars || typeof overrideVars !== 'object') return SAMPLE_VARS;
		const merged = { ...SAMPLE_VARS };
		for (const [k, v] of Object.entries(overrideVars)) {
			if (v === undefined || v === null || v === '') continue;
			merged[k] = v;
		}
		return merged;
	}

	function renderIntoShadow() {
		if (!hostEl) return;
		const shadow = hostEl.shadowRoot || hostEl.attachShadow({ mode: 'open' });
		mounted = true;

		let compiled;
		try {
			// Use a fresh Handlebars env so our helpers can't leak into
			// the app's runtime handlebars (the autocomplete AST parser
			// shares the same import).
			const hb = Handlebars.create();
			registerHelpers(hb);
			// Strip `$0` caret markers that the snippet library uses.
			const template = hb.compile(body.replace(/\$0/g, ''), { noEscape: false });
			compiled = template(buildContext());
		} catch (err) {
			// Broken template — render a placeholder instead of leaving
			// the shadow empty. Build the HTML via createElement/style
			// assignment rather than innerHTML with literal <style> tags
			// — Svelte's compiler walks JS template literals looking for
			// <style> and tries to preprocess them as component CSS,
			// which chokes because the body contains ${} interpolations
			// that don't mean anything to PostCSS.
			const styleEl = document.createElement('style');
			styleEl.textContent =
				':host { display:block; width:100%; height:100%; background:#f3f4f6; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-family:system-ui,sans-serif; font-size:11px; }';
			const msg = document.createElement('div');
			msg.textContent = 'preview unavailable';
			shadow.replaceChildren(styleEl, msg);
			return;
		}

		const { w: natW, h: natH } = inferNaturalSize(body);
		const scale = Math.min(cardWidth / natW, cardHeight / natH);

		// Ship CSS through a detached <style> element instead of a
		// template-literal string so the Svelte compiler doesn't try
		// to extract it as component CSS.
		const styleEl = document.createElement('style');
		styleEl.textContent = [
			':host { display: block;',
			'width: ' + cardWidth + 'px;',
			'height: ' + cardHeight + 'px;',
			'overflow: hidden;',
			'background: #FFFDF8;',
			'pointer-events: none;',
			'border-radius: 6px; }',
			'.stage {',
			'width: ' + natW + 'px;',
			'height: ' + natH + 'px;',
			'transform: scale(' + scale + ');',
			'transform-origin: top left;',
			'position: absolute;',
			'left: ' + Math.max(0, (cardWidth - natW * scale) / 2) + 'px;',
			'top: ' + Math.max(0, (cardHeight - natH * scale) / 2) + 'px; }'
		].join(' ');
		const stage = document.createElement('div');
		stage.className = 'stage';
		stage.innerHTML = compiled;
		shadow.replaceChildren(styleEl, stage);
	}

	onMount(() => {
		if (!hostEl) return;
		// Lazy mount — render on first intersection with viewport so
		// off-screen cards don't pay the compile+paint cost.
		if (typeof IntersectionObserver === 'undefined') {
			// Very old browser — just render immediately.
			renderIntoShadow();
			return;
		}
		io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						renderIntoShadow();
						io?.disconnect();
						io = null;
						break;
					}
				}
			},
			{ rootMargin: '100px' }
		);
		io.observe(hostEl);
	});

	// Live re-render when the body or overrideVars change AFTER the
	// initial mount. Used by the render page so the preview tracks
	// the user's variable edits in real time. Keyed by the JSON of
	// both inputs so identical-string re-renders short-circuit.
	$: {
		if (mounted && hostEl) {
			let key;
			try {
				key = body + '|' + JSON.stringify(overrideVars || null);
			} catch {
				key = body;
			}
			if (key !== lastRenderKey) {
				lastRenderKey = key;
				renderIntoShadow();
			}
		}
	}

	onDestroy(() => {
		if (io) io.disconnect();
	});
</script>

<div
	bind:this={hostEl}
	style:width="{cardWidth}px"
	style:height="{cardHeight}px"
	style:position="relative"
	style:overflow="hidden"
	style:border="2px solid #1f2937"
	style:border-radius="6px"
	style:background="#f5f0e6"
	style:flex-shrink="0"
	aria-hidden="true"
></div>
