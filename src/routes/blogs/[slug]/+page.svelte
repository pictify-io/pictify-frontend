<script>
	/**
	 * /blogs/[slug] — the proof read.
	 *
	 * Marketing surface, so it wears the landing language. The signature
	 * element is the UPDATED strip: these guides describe an API that moves,
	 * and the single most useful thing the page can tell a reader is when it
	 * was last checked and what changed. It renders only when the CMS carries
	 * an `updatedNote` — an update note is never invented.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import Capsule from '$lib/components/landing/Capsule.svelte';
	import SvelteMarkdown from 'svelte-markdown';
	import { page } from '$app/stores';
	import { setContext, onMount, onDestroy } from 'svelte';
	import { BLOG_HEADINGS } from '$lib/blog/context.js';
	import {
		headingSlugger,
		tableOfContents,
		extractTldr,
		stripLeadingH1,
		formatDate,
		formatUpdated,
		readingMinutes
	} from '$lib/blog/markdown.js';

	import Heading from '$lib/components/blog/v2/Heading.svelte';
	import CodeBlock from '$lib/components/blog/v2/CodeBlock.svelte';
	import BlogLink from '$lib/components/blog/v2/BlogLink.svelte';
	import Blockquote from '$lib/components/blog/v2/Blockquote.svelte';
	import Table from '$lib/components/blog/v2/Table.svelte';
	import Codespan from '$lib/components/blog/v2/Codespan.svelte';
	import Text from '$lib/components/blog/v2/Text.svelte';

	export let data;

	$: blog = data.props.blog;
	$: related = data.props.recommendedBlogs || [];

	$: bodyRaw = stripLeadingH1(blog.content);

	/*
	 * The TL;DR card. A CMS field wins; otherwise a leading "> **TL;DR**"
	 * blockquote is lifted out of the body so it renders as the card instead of
	 * as an ordinary quote, and is removed from the source so it is not shown
	 * twice.
	 */
	$: harvested = blog.tldr ? null : extractTldr(bodyRaw);
	$: source = harvested ? harvested.rest : bodyRaw;
	$: tldr = blog.tldr
		? { claim: blog.tldr.split('\n')[0].trim(), points: tldrPoints(blog.tldr) }
		: harvested
			? { claim: harvested.claim, points: harvested.points }
			: null;

	function tldrPoints(value) {
		return String(value)
			.split('\n')
			.slice(1)
			.map((l) => l.trim())
			.filter((l) => /^[-*+]\s+/.test(l))
			.map((l) => l.replace(/^[-*+]\s+/, ''));
	}

	$: toc = tableOfContents(source);
	$: minutes = readingMinutes(blog);
	$: publishedLabel = formatDate(blog.createdAt);
	$: updatedLabel = formatDate(blog.updatedAt);
	$: canonicalUrl = `https://pictify.io/blogs/${blog.slug || $page.params.slug}`;
	$: blogImage = blog.heroImage || blog.image;
	/*
	 * The share card falls back to the branded one; the hero plate above does
	 * not fall back at all. A post without an image should still arrive in a
	 * feed as Pictify rather than as a bare link, but inventing a hero for it
	 * would put the same picture on top of every unillustrated post.
	 */
	$: shareImage = blogImage || 'https://pictify.io/og/v2/blog.png';

	/*
	 * One slugger per article, shared with every Heading the renderer mounts.
	 * Rebuilt whenever the source changes (client-side navigation between two
	 * posts reuses this component), or the second post's ids would continue the
	 * first post's dedupe counter.
	 */
	let headings = { nextId: () => undefined, nextIndex: () => 0 };
	setContext(BLOG_HEADINGS, {
		nextId: (text) => headings.nextId(text),
		nextIndex: () => headings.nextIndex()
	});
	$: if (source) {
		const slug = headingSlugger();
		let n = 0;
		headings = { nextId: (t) => slug(t), nextIndex: () => ++n };
	}

	function contentExcerpt(markdown, max = 155) {
		if (!markdown) return '';
		const text = markdown
			.replace(/```[\s\S]*?```/g, ' ')
			.replace(/^#+\s.*$/gm, ' ')
			.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/[*_`>#|-]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		if (text.length <= max) return text;
		return text.slice(0, max).replace(/\s\S*$/, '') + '…';
	}
	$: metaDescription = blog.description || contentExcerpt(blog.content);

	const renderers = {
		heading: Heading,
		code: CodeBlock,
		codespan: Codespan,
		text: Text,
		link: BlogLink,
		blockquote: Blockquote,
		table: Table
	};

	// ── Reading position ──────────────────────────────────────────────
	let activeId = '';
	let observer;
	onMount(() => {
		if (!toc.length || typeof IntersectionObserver === 'undefined') return;
		// A tall band across the upper third: the heading nearest the top of the
		// reader's view is the one they are in, which a plain "is visible" test
		// gets wrong on a 25k-character page where four headings are on screen.
		observer = new IntersectionObserver(
			(entries) => {
				const hit = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
				if (hit) activeId = hit.target.id;
			},
			{ rootMargin: '-88px 0px -70% 0px', threshold: 0 }
		);
		// After the markdown has painted its headings.
		queueMicrotask(() => {
			for (const { id } of toc) {
				const el = document.getElementById(id);
				if (el) observer.observe(el);
			}
		});
	});
	onDestroy(() => observer?.disconnect());

	let copied = false;
	let copyFailed = false;
	async function copyLink() {
		copyFailed = false;
		try {
			await navigator.clipboard.writeText(canonicalUrl);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch (error) {
			// Was an alert() claiming success whether or not the write landed.
			copyFailed = true;
			setTimeout(() => (copyFailed = false), 2400);
		}
	}

	$: shareX = `https://x.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(blog.title)}`;
	$: shareIn = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(canonicalUrl)}`;
</script>

<svelte:head>
	<title>{blog.seoTitle || blog.title} | Pictify</title>
	{#if metaDescription}
		<meta name="description" content={metaDescription} />
	{/if}
	<link rel="canonical" href={canonicalUrl} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	{#if blog.tags?.length}
		<meta name="keywords" content={blog.tags.join(', ')} />
	{/if}
	<meta name="author" content={blog.author} />
	<meta property="og:title" content={blog.title} />
	{#if metaDescription}
		<meta property="og:description" content={metaDescription} />
	{/if}
	<meta property="og:image" content={shareImage} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="Pictify.io" />
	<meta property="og:locale" content="en_US" />
	<!-- Article OG: freshness is the signal this blog trades on, so the modified
	     time is published as machine-readable metadata and not only as a chip. -->
	{#if blog.createdAt}
		<meta property="article:published_time" content={new Date(blog.createdAt).toISOString()} />
	{/if}
	{#if blog.updatedAt}
		<meta property="article:modified_time" content={new Date(blog.updatedAt).toISOString()} />
	{/if}
	{#each blog.tags || [] as tag (tag)}
		<meta property="article:tag" content={tag} />
	{/each}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={blog.title} />
	{#if metaDescription}
		<meta name="twitter:description" content={metaDescription} />
	{/if}
	<meta name="twitter:image" content={shareImage} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org/',
		'@type': 'BlogPosting',
		headline: blog.title,
		image: shareImage,
		url: canonicalUrl,
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
		author: { '@type': 'Person', name: blog.author },
		publisher: {
			'@type': 'Organization',
			name: 'Pictify.io',
			logo: {
				'@type': 'ImageObject',
				url: 'https://res.cloudinary.com/diroilukd/image/upload/v1709358454/P_jeay4c.png'
			}
		},
		datePublished: blog.createdAt || blog.date,
		dateModified: blog.updatedAt || blog.createdAt || blog.date,
		description: metaDescription
	}).replace(/</g, '\\u003c')}</script>`}
</svelte:head>

<!-- .landing-v2 opts this page out of the app-wide root font-size down-scale (see app.css),
     so the rem-based rhythm lands on the 16px root the board was drawn against. -->
<div class="landing-v2 flex min-h-screen w-full flex-col bg-brand-paper">
	<Nav />

	<!-- ── Header band ───────────────────────────────────────────────── -->
	<!-- Capsules here, not pixels: the index hero used pixel clusters, and no
	     two surfaces in a row wear the same deco. -->
	<header class="relative w-full overflow-hidden bg-brand-field pb-[120px] pt-10 lg:pt-14">
		<Capsule from="r" class="right-[-40px] top-16 hidden h-[52px] w-[188px] rotate-[14deg] bg-brand-powder lg:block" drift={12} />
		<Capsule from="r" class="right-[70px] top-[128px] hidden h-[38px] w-[132px] -rotate-[7deg] bg-brand-blue/70 lg:block" drift={9} />

		<div class="relative z-10 mx-auto w-full max-w-[1120px] px-5 lg:px-10">
			<nav class="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-ink/60" aria-label="Breadcrumb">
				<a href="/blogs" class="hover:underline">Blog</a>
				<span aria-hidden="true"> / </span>
				<span>{blog.type === 'guide' ? 'Guides' : 'Articles'}</span>
			</nav>

			<div class="mt-5 flex flex-wrap items-center gap-2.5">
				<span class="rounded-btn bg-brand-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white">
					{blog.type === 'guide' ? 'Guide' : 'Article'}
				</span>
				{#each blog.tags || [] as tag (tag)}
					<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-ink/60">{tag}</span>
				{/each}
			</div>

			<h1
				class="mt-4 max-w-[20ch] font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.035em] text-brand-ink lg:text-[56px]"
			>
				{blog.title}
			</h1>

			{#if blog.description}
				<p class="mt-4 max-w-[62ch] font-sans text-[16px] leading-[26px] text-brand-slate lg:text-[19px] lg:leading-[30px]">
					{blog.description}
				</p>
			{/if}

			<div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
				<span class="flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-royal font-mono text-[11px] font-medium text-white"
						aria-hidden="true"
					>
						{(blog.author || 'P').trim().charAt(0).toUpperCase()}
					</span>
					<span class="font-sans text-sm text-brand-ink">{blog.author}</span>
				</span>
				{#if publishedLabel}
					<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-ink/60">
						Published {publishedLabel}
					</span>
				{/if}
				{#if minutes}
					<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-ink/60">
						{minutes} min read
					</span>
				{/if}
			</div>

			<!-- The signature element. Hidden entirely when the CMS has no note:
			     "updated" with nothing to say is noise, and inventing the reason
			     would be a claim we cannot support. -->
			{#if blog.updatedNote && updatedLabel}
				<div
					class="mt-6 inline-flex items-center gap-2.5 rounded-btn border border-brand-ink bg-brand-paper px-3.5 py-2"
					style="box-shadow: 2px 2px 0 0 #000"
				>
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1.5" />
						<path d="M8 4.6V8l2.2 1.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
					<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-ink">
						Updated {updatedLabel} · {blog.updatedNote}
					</span>
				</div>
			{/if}
		</div>
	</header>

	<!--
		Hero plate, overlapping the band by 72px.

		`relative z-10` is load-bearing, not decoration. The header above is
		`relative` so it can hold the capsule deco, which puts it in the
		positioned-elements layer — and a positioned element paints above a
		static sibling regardless of DOM order. The plate was therefore sliding
		UNDER the lime band, which clipped its top edge and swallowed the ink
		border and offset shadow on that side. The overlap is the move; it only
		reads if the plate is the thing on top.
	-->
	{#if blogImage}
		<div class="relative z-10 mx-auto -mt-[72px] w-full max-w-[1120px] px-5 lg:px-10">
			<div
				class="overflow-hidden rounded-[14px] border-[1.5px] border-brand-ink bg-brand-canvas"
				style="box-shadow: 6px 6px 0 0 #000"
			>
				<img src={blogImage} alt="" class="h-[220px] w-full object-cover lg:h-[420px]" />
			</div>
		</div>
	{/if}

	<!-- ── Body ──────────────────────────────────────────────────────── -->
	<div class="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-10 px-5 py-12 lg:flex-row lg:gap-12 lg:px-10 lg:py-16">
		<!-- Rail. Above the content on small screens, with the TOC collapsed
		     into a <details> so it never pushes the article off the first
		     screen. -->
		<aside class="w-full flex-shrink-0 lg:sticky lg:top-6 lg:h-fit lg:w-[240px]">
			{#if toc.length}
				<nav class="hidden lg:block" aria-label="On this page">
					<h2 class="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
						On this page
					</h2>
					<ul class="flex flex-col gap-0.5">
						{#each toc as item (item.id)}
							<li>
								<a
									href="#{item.id}"
									aria-current={activeId === item.id ? 'location' : undefined}
									class="block border-l-2 py-1.5 pl-3 font-sans text-[13px] leading-[19px] transition-colors {activeId ===
									item.id
										? 'border-brand-pink font-medium text-brand-pink'
										: 'border-brand-rule text-brand-slate hover:border-brand-ink hover:text-brand-ink'}"
								>
									{item.text}
								</a>
							</li>
						{/each}
					</ul>
				</nav>

				<details class="rounded-tile border border-brand-rule px-4 py-3 lg:hidden">
					<summary class="cursor-pointer font-mono text-[11px] uppercase tracking-[0.1em] text-brand-ink">
						On this page · {toc.length}
					</summary>
					<ul class="mt-3 flex flex-col gap-1">
						{#each toc as item (item.id)}
							<li>
								<a href="#{item.id}" class="block py-1 font-sans text-[14px] text-brand-slate">
									{item.text}
								</a>
							</li>
						{/each}
					</ul>
				</details>
			{/if}

			<div class="mt-7 hidden lg:block">
				<h2 class="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Share</h2>
				<div class="flex items-center gap-2">
					<a
						href={shareX}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Share on X"
						class="flex h-8 w-8 items-center justify-center rounded-btn border border-brand-rule text-brand-slate hover:border-brand-ink hover:text-brand-ink"
					>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.8 22H2.5l7.7-8.8L1.9 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z" />
						</svg>
					</a>
					<a
						href={shareIn}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Share on LinkedIn"
						class="flex h-8 w-8 items-center justify-center rounded-btn border border-brand-rule text-brand-slate hover:border-brand-ink hover:text-brand-ink"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.75-1.95 4 0 4.4 2.5 4.4 5.9V21h-4v-5.4c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9V9Z" />
						</svg>
					</a>
					<button
						type="button"
						on:click={copyLink}
						aria-label="Copy link to this post"
						class="flex h-8 items-center justify-center gap-1.5 rounded-btn border border-brand-rule px-2.5 text-brand-slate hover:border-brand-ink hover:text-brand-ink"
					>
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M9.5 14.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							<path d="M14.5 9.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						{#if copied || copyFailed}
							<span class="font-mono text-[10px] uppercase tracking-[0.06em]">
								{copyFailed ? 'Failed' : 'Copied'}
							</span>
						{/if}
					</button>
				</div>
			</div>

			<div class="mt-7 hidden rounded-tile bg-brand-press-deep p-5 lg:block">
				<p class="font-display text-[17px] font-bold leading-[1.2] text-white">Try this guide live</p>
				<p class="mt-2 font-sans text-[13px] leading-[20px] text-brand-press-text">
					50 renders a month, free forever. No card.
				</p>
				<a
					href="/signup"
					class="mt-4 block rounded-btn bg-brand-field px-3 py-2 text-center font-sans text-[13px] font-semibold text-brand-ink transition-opacity hover:opacity-90"
				>
					Start rendering
				</a>
			</div>
		</aside>

		<!-- Content column -->
		<article class="min-w-0 flex-1 lg:max-w-[720px]">
			{#if tldr && (tldr.claim || tldr.points.length)}
				<div
					class="relative mb-10 rounded-tile border-[1.5px] border-brand-ink bg-brand-paper px-6 pb-6 pt-8"
					style="box-shadow: 6px 6px 0 0 #D3E7F6"
				>
					<span
						class="absolute -top-3 left-5 -rotate-2 rounded-btn border border-brand-ink bg-brand-field px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-ink"
					>
						TL;DR
					</span>
					{#if tldr.claim}
						<p class="font-sans text-[17px] font-semibold leading-[26px] text-brand-ink">
							{tldr.claim}
						</p>
					{/if}
					{#if tldr.points.length}
						<ol class="mt-4 flex flex-col gap-2">
							{#each tldr.points as point, i (i)}
								<li class="flex gap-3">
									<span class="mt-[3px] font-mono text-[11px] text-brand-royal">
										{String(i + 1).padStart(2, '0')}
									</span>
									<span class="font-sans text-[15px] leading-[24px] text-brand-slate">{point}</span>
								</li>
							{/each}
						</ol>
					{/if}
				</div>
			{/if}

			<div class="blog-body">
				<SvelteMarkdown {source} {renderers} />
			</div>

			<!-- End CTA -->
			<section
				class="mt-14 rounded-card bg-brand-press-deep p-7 lg:p-9"
				style="box-shadow: 8px 8px 0 0 #FF48B0"
			>
				<h2 class="max-w-[22ch] font-display text-[26px] font-extrabold leading-[1.08] tracking-[-0.025em] text-white lg:text-[30px]">
					Ship documents, images and video from one template.
				</h2>
				<p class="mt-3 max-w-[46ch] font-sans text-[15px] leading-[24px] text-brand-press-text">
					50 renders a month on the free tier. No card, no watermark.
				</p>
				<a
					href="/signup"
					class="mt-6 inline-block rounded-btn bg-brand-field px-5 py-2.5 font-sans text-[15px] font-semibold text-brand-ink transition-opacity hover:opacity-90"
				>
					Start free
				</a>
			</section>
		</article>
	</div>

	{#if related.length}
		<section class="mx-auto w-full max-w-[1120px] px-5 pb-16 lg:px-10 lg:pb-24">
			<div class="border-t border-brand-ink pt-8">
				<h2 class="mb-6 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-mute">
					Keep reading
				</h2>
				<ul class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{#each related as post (post.slug)}
						<li class="flex">
							<a
								href="/blogs/{post.slug}"
								class="group flex w-full flex-col gap-2 rounded-tile border border-brand-rule p-4 transition-colors hover:border-brand-ink"
							>
								<div class="flex items-center gap-2">
									<span class="rounded-btn border border-brand-ink px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-brand-ink">
										{post.type === 'guide' ? 'Guide' : 'Article'}
									</span>
									{#if post.tags?.length}
										<span class="truncate font-mono text-[9px] uppercase tracking-[0.08em] text-brand-mute">
											{post.tags[0]}
										</span>
									{/if}
								</div>
								<span class="font-display text-[16px] font-bold leading-[1.2] text-brand-ink group-hover:underline">
									{post.title}
								</span>
								{#if formatUpdated(post.updatedAt)}
									<span class="mt-auto w-fit rounded-full bg-brand-field px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-brand-ink">
										Upd {formatUpdated(post.updatedAt)}
									</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}

	<Footer />
</div>

<style>
	/*
	 * Body copy. Headings, code, tables, quotes and links all arrive as custom
	 * renderers with their own classes — what is left here is the prose itself
	 * and the elements svelte-markdown renders with no component of ours.
	 */
	.blog-body :global(p) {
		margin: 0 0 1.35rem;
		font-family: Inter, sans-serif;
		font-size: 17px;
		line-height: 27px;
		color: #383a42;
	}
	.blog-body :global(strong) {
		font-weight: 600;
		color: #000;
	}
	.blog-body :global(ul),
	.blog-body :global(ol) {
		margin: 0 0 1.35rem;
		padding-left: 1.35rem;
		font-family: Inter, sans-serif;
		font-size: 17px;
		line-height: 27px;
		color: #383a42;
	}
	.blog-body :global(ul li) {
		list-style-type: disc;
	}
	.blog-body :global(ol li) {
		list-style-type: decimal;
	}
	.blog-body :global(li) {
		margin-bottom: 0.5rem;
	}
	.blog-body :global(li::marker) {
		color: #8a8a85;
	}
	.blog-body :global(img) {
		display: block;
		margin: 2rem 0;
		max-width: 100%;
		height: auto;
		border: 1.5px solid #000;
		border-radius: 12px;
	}
	.blog-body :global(hr) {
		margin: 2.5rem 0;
		border: none;
		border-top: 1px solid #e5e7eb;
	}
	/*
	 * The FAQ block reads as a list of questions rather than as more H3s. Scoped
	 * by the sibling combinator off the FAQ heading so it cannot catch an H3
	 * anywhere else in the article.
	 */
	.blog-body :global(h2#faq ~ h3) {
		position: relative;
		margin-top: 1.5rem;
		padding: 0.85rem 2rem 0.85rem 0;
		border-top: 1px solid #e5e7eb;
		font-family: Inter, sans-serif;
		font-size: 16px;
		font-weight: 600;
		color: #000;
	}
	.blog-body :global(h2#faq ~ h3)::after {
		content: '+';
		position: absolute;
		top: 0.8rem;
		right: 0.25rem;
		font-family: 'JetBrains Mono', monospace;
		font-size: 15px;
		color: #8a8a85;
	}
</style>
