<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Automate OG Images — Dynamic Open Graph Generation | Pictify';
	const description =
		'Dynamic Open Graph images for every blog post, product, or page. Render on-demand from your data via the Pictify API — no pre-rendering pipeline, no design bottleneck.';
	const canonical = 'https://pictify.io/solutions/automate-og-images';
	const ogImage = 'https://media.pictify.io/mskf0-1776199916311.png';
	const related = getRelatedSolutions('automate-og-images', 6);

	const faqs = [
		{
			q: 'How do I automate OG image generation for my site?',
			a: 'Design one OG template (1200×630). Declare variables for the fields that change per page (title, author, hero image, category). In your page\'s `<head>`, output `<meta property="og:image" content="https://api.pictify.io/template/tpl_og/render?title=...&author=...">`. Pictify returns the rendered image; social platforms cache it.'
		},
		{
			q: 'Should I render OG images on demand or pre-render at build time?',
			a: "Both patterns work. On-demand (what the snippet above does) keeps URLs stable and doesn't require a build step — Pictify CDN-caches each unique variable set. Pre-rendering at publish time (POST the template, save the URL on the record) is slightly faster for the first visitor but adds a write-path step. For most sites, on-demand is simpler."
		},
		{
			q: "What's the render latency for OG images?",
			a: 'Cold: ~800ms. Warm (CDN cache hit for identical variables): under 100ms. Twitter, Facebook, LinkedIn, and Slack all cache OG images after the first fetch, so the cold render only happens once per unique URL. Google\'s crawler and AI chat clients also benefit from the warm cache.'
		},
		{
			q: 'Can I test whether my OG image is working?',
			a: "Use Twitter's card validator, Facebook's sharing debugger, LinkedIn's post inspector — all three fetch your URL and show the rendered OG. Pictify also ships an OG generator tool at /tools/og-image-generator where you can prototype the template interactively."
		},
		{
			q: 'Does this work with Next.js, SvelteKit, Astro, Hugo, Ghost?',
			a: "Yes — any framework that renders the `<head>`. The OG image URL is plain HTML, no framework-specific integration. For Next.js, skip @vercel/og and use Pictify — better per-site caching, no 4MB bundle size limit, and templates live outside your codebase."
		},
		{
			q: 'Can I A/B test which OG image gets more clicks?',
			a: "Yes. Pictify's experiment support renders different variants based on a variant ID. Bind the variant to a user cookie or an A/B framework like PostHog; track the click-through on the shared URL. Rare feature — no other OG image service ships this."
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Automate OG Images',
		url: canonical,
		description:
			'Dynamic Open Graph image generation for blog posts, products, and pages via API.',
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify', url: 'https://pictify.io' }
	};
</script>

<SolutionPageShell
	{title}
	{description}
	{canonical}
	breadcrumbLabel="Automate OG Images"
	{ogImage}
	ogImageAlt="Automate OG images — dynamic open graph generation per page"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-gray-900 text-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">For Content Teams</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Automated OG images<br /><span class="text-[#ff6b6b]">for every page.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Dynamic Open Graph images rendered per blog post, product, or user. One template, one API, one line in your <code class="bg-gray-100 px-1 rounded">&lt;head&gt;</code>.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				OG images are the thumbnails that appear when a link is shared on Twitter, LinkedIn, Slack,
				Discord, or in an AI chat response. They're also the single highest-leverage SEO and CTR
				element you can ship: a good OG image doubles click-through on the same link.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				The problem: designing a unique OG image per blog post, product, or user is a full-time
				design job. Most teams default to a single static OG image site-wide, which is like greeting
				every visitor with "Welcome" printed on a door sign — fine, but not persuasive.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				<strong>Automated OG generation</strong> lets you render a unique, data-driven OG image per
				page — automatically, on demand, without adding a build step or a design queue.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			The pattern
		</h2>
		<ol class="space-y-4 list-decimal pl-6 marker:text-[#ff6b6b] marker:font-black text-lg text-gray-700">
			<li>Design one OG template (1200×630) with variable placeholders for title, author, hero image, category.</li>
			<li>In each page's <code class="bg-gray-100 px-1 rounded">&lt;head&gt;</code>, output an <code class="bg-gray-100 px-1 rounded">og:image</code> meta tag whose URL encodes the variables as query parameters.</li>
			<li>When a social platform fetches the URL, Pictify renders the image, CDN-caches it, and returns it in ~800ms. Every subsequent fetch hits the cache.</li>
		</ol>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Example: Next.js
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden mb-6">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>app/blog/[slug]/page.tsx</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  const ogUrl = new URL('https://api.pictify.io/template/tpl_og/render');
  ogUrl.searchParams.set('title', post.title);
  ogUrl.searchParams.set('author', post.author);
  ogUrl.searchParams.set('hero', post.hero_image);

  return {
    title: post.title,
    openGraph: {
      title: post.title,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }]
    }
  };
}`}</code
				></pre>
		</div>
		<p class="text-lg text-gray-700 leading-relaxed">
			Same pattern works in SvelteKit (via <code class="bg-gray-100 px-1 rounded">+page.server.ts</code>),
			Astro (in frontmatter), Hugo (Hugo template), Ghost (routes config), or any framework that
			renders the <code class="bg-gray-100 px-1 rounded">&lt;head&gt;</code>. The OG image URL is plain
			HTML — no framework lock-in.
		</p>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Why Pictify beats @vercel/og
		</h2>
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-4">
				<code class="bg-gray-100 px-1 rounded">@vercel/og</code> is the default in many Next.js apps
				— it renders OG images in your edge function. It works for simple designs, but hits limits
				quickly:
			</p>
			<ul class="text-lg text-gray-700 leading-relaxed space-y-2 mb-4 list-disc pl-6 marker:text-[#ff6b6b]">
				<li><strong>Bundle size:</strong> @vercel/og pushes your edge bundle past 1MB; Pictify is an external API with zero bundle impact.</li>
				<li><strong>CSS subset:</strong> @vercel/og uses satori, which supports a subset of CSS. Pictify renders real Chromium — full CSS grid, flexbox, web fonts, everything.</li>
				<li><strong>Design workflow:</strong> changing an @vercel/og template means redeploying. Pictify templates live in a visual editor; copy changes don't require a deploy.</li>
				<li><strong>Cross-platform:</strong> @vercel/og is Vercel-only. Pictify runs anywhere — self-hosted, Cloudflare, AWS Lambda, your Rails app.</li>
			</ul>
			<p class="text-lg text-gray-700 leading-relaxed">
				For quick prototypes and Vercel-deployed side projects, @vercel/og is fine. For anything with
				a designer in the loop or hosted outside Vercel, use Pictify. Try the
				<a href="/tools/og-image-generator" class="text-[#ff6b6b] underline font-bold">OG image generator tool</a>
				to prototype your template without writing code.
			</p>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="automate_og_images"
			headline="One template. Every page. Every share."
			kicker="Automate OG Images"
		/>
		<section class="max-w-5xl mx-auto mt-20">
			<h2
				class="text-2xl md:text-3xl font-black uppercase tracking-wider text-gray-400 mb-8 text-center"
			>
				Related solutions
			</h2>
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each related as r}
					<a
						href="/solutions/{r.slug}"
						class="block bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
					>
						<h3 class="font-black text-gray-900 mb-1">{r.label}</h3>
						<p class="text-xs text-gray-500 line-clamp-3">{r.summary}</p>
					</a>
				{/each}
			</div>
		</section>
	</svelte:fragment>
</SolutionPageShell>
