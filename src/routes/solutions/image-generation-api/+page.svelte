<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { solutions, getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Image Generation API — Render Templates via HTTP | Pictify';
	const description =
		'The image generation API for developers. POST a template + variables, get a CDN-cached PNG/JPEG/WebP/PDF/GIF. Expression engine, live bindings, and batch rendering built in.';
	const canonical = 'https://pictify.io/solutions/image-generation-api';
	const ogImage = 'https://pictify.io/og/solutions/image-generation-api.png';

	const related = getRelatedSolutions('image-generation-api', 6);

	const faqs = [
		{
			q: 'What is an image generation API?',
			a: 'An image generation API is an HTTP endpoint that produces images programmatically. You POST a template ID and a JSON payload of variables; the service renders a customized image server-side and returns a hosted URL. It replaces manual design work for anything that needs to produce images at scale — OG images, product cards, certificates, personalized social posts, email headers.'
		},
		{
			q: 'Which image generation API is best for developers?',
			a: "Depends on what your templates need to do. If your data is already formatted and you only need string replacement, Bannerbear and Placid work fine. If you need conditional logic, price formatting, live data bindings, or A/B testing inside the template itself, Pictify is the only option that ships those as first-class features. Pictify's free tier lets you validate the integration before committing."
		},
		{
			q: "What's the cheapest image generation API?",
			a: 'Per-render pricing, Pictify and Bannerbear are roughly comparable; both are cheaper than Placid at volume. All three are dramatically cheaper than running your own Puppeteer fleet once you account for compute, cold-starts, and ops time. Pictify has the most generous free tier (no credit card required).'
		},
		{
			q: 'Is there a free image generation API?',
			a: "Yes — Pictify's free tier covers a few hundred renders per month with no credit card. Sufficient for prototyping, side projects, and validating the integration in staging. When you need more, paid plans start low and scale per render."
		},
		{
			q: 'Can I use an image generation API for dynamic OG images?',
			a: 'Yes, this is one of the most popular use cases. Render OG images on request (per blog post, per user profile, per product) or pre-render them at publish time. Pictify returns a CDN-cached URL in ~800ms cold, sub-100ms warm.'
		},
		{
			q: 'How does the image generation API handle bulk workloads?',
			a: 'Pictify exposes a batch endpoint that accepts an array of variables sets and returns a job ID. Images render asynchronously; a webhook fires when the batch completes. For workloads over ~100 images per request, always use the batch endpoint — it parallelizes better than N individual calls.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify Image Generation API',
		url: canonical,
		description:
			'HTTP image generation API with template variables, expression engine, live data bindings, and batch rendering.',
		applicationCategory: 'DeveloperApplication',
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		featureList: [
			'Template-based rendering via POST',
			'Expression engine and conditionals',
			'Live data bindings',
			'Batch endpoint with webhooks',
			'PNG, JPEG, WebP, PDF, GIF output',
			'Free tier, no credit card'
		],
		creator: { '@type': 'Organization', name: 'Pictify', url: 'https://pictify.io' }
	};
</script>

<SolutionPageShell
	{title}
	{description}
	{canonical}
	breadcrumbLabel="Image Generation API"
	{ogImage}
	ogImageAlt="Pictify image generation API — POST. Render. Ship."
	{webApplicationSchema}
	{faqs}
>
	<!-- Hero -->
	<header class="text-center mb-12">
		<div
			class="inline-block bg-gray-900 text-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffc480] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">For Developers</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Image Generation <span class="text-[#ff6b6b]">API</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			POST a template + variables. Get a CDN-cached image URL. Logic in the template, not your backend.
		</p>
	</header>

	<!-- Opening framing -->
	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				An image generation API is an HTTP endpoint that produces images on demand. Template defines
				the layout; variables define the data; the API renders one and returns a URL. Replace "human
				opens Figma" with "backend calls an endpoint."
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Pictify's image generation API is built for developers who need more than string replacement.
				Templates carry an <strong>expression engine</strong>, <strong>conditional blocks</strong>, and
				<strong>live data bindings</strong> — features Bannerbear, Placid, and RenderForm simply don't
				ship. The result: your application code stays thin, and your templates do their own data
				formatting.
			</p>
		</div>
	</section>

	<!-- The 3-line example -->
	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			The three-line integration
		</h2>
		<p class="text-lg text-gray-700 leading-relaxed mb-6">
			Get your API key from the dashboard, and hit the render endpoint:
		</p>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>curl</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`curl -X POST https://api.pictify.io/template/tpl_abc/render \\
  -H "Authorization: Bearer $PICTIFY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "variables": {
      "title": "Shipping at scale",
      "price": 49,
      "featured": true,
      "avatar": "https://example.com/avatar.png"
    }
  }'`}</code
				></pre>
		</div>
		<p class="text-lg text-gray-700 leading-relaxed mt-6">
			The response contains a CDN-cached image URL. Render it anywhere — in an
			<code class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">&lt;img&gt;</code> tag, an
			<code class="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">og:image</code> meta tag,
			an email, a Slack post. Same URL works forever; subsequent calls with identical variables return
			a warm cache hit in under 100ms.
		</p>
	</section>

	<!-- What makes Pictify's API different -->
	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			What sets this apart
		</h2>
		<div class="space-y-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">Expression engine in the template</h3>
				<p class="text-gray-700 leading-relaxed">
					<code class="bg-gray-100 px-1.5 py-0.5 rounded">{`{{ price * 0.9 | currency }}`}</code>
					renders <code class="bg-gray-100 px-1.5 py-0.5 rounded">$44.10</code> without your backend
					pre-formatting. Filters for uppercase, lowercase, capitalize, currency, date, number — plus
					conditional blocks <code class="bg-gray-100 px-1.5 py-0.5 rounded">{`{{ if ... }}`}</code>
					and nested lookups.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">Live data bindings</h3>
				<p class="text-gray-700 leading-relaxed">
					Templates can fetch variables from an HTTP endpoint, a webhook, or a static JSON URL at
					render time. Bind the product price to your inventory API; when stock changes, every
					rendered image is current. No other template API ships this.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">Batch rendering with webhooks</h3>
				<p class="text-gray-700 leading-relaxed">
					For bulk workloads, POST an array of variable sets to the batch endpoint. A webhook fires
					when the job completes. We benchmark 100× faster than N individual calls.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">One API, six formats</h3>
				<p class="text-gray-700 leading-relaxed">
					Same template renders PNG, JPEG, WebP, single-page PDF, multi-page PDF, and GIF. Switching
					is a <code class="bg-gray-100 px-1.5 py-0.5 rounded">fileExtension</code> parameter — not a
					separate product.
				</p>
			</div>
		</div>
	</section>

	<!-- Compared to alternatives -->
	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Image generation API alternatives
		</h2>
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-4">
				The comparison table lives on the
				<a
					href="/solutions/automated-image-generation#comparison"
					class="text-[#ff6b6b] underline font-bold">pillar page</a
				>. One-line summary:
			</p>
			<ul class="text-lg text-gray-700 leading-relaxed space-y-2 mb-4 list-disc pl-6 marker:text-[#ff6b6b]">
				<li>
					<a href="/compare/pictify-vs-bannerbear" class="text-[#ff6b6b] underline">Bannerbear</a> —
					stable, great SDKs, no expression engine.
				</li>
				<li>
					<a href="/compare/pictify-vs-placid" class="text-[#ff6b6b] underline">Placid</a> — pretty
					editor, aggressive per-render pricing at volume.
				</li>
				<li>
					<a href="/compare/pictify-vs-renderform" class="text-[#ff6b6b] underline">RenderForm</a> —
					smaller ecosystem, competitive pricing.
				</li>
				<li>
					DynaPictures — Google Sheets bindings, thin elsewhere.
				</li>
				<li>
					<a href="/compare/pictify-vs-htmlcsstoimage" class="text-[#ff6b6b] underline"
						>Htmlcsstoimage</a
					> — no visual editor; you always POST raw HTML.
				</li>
			</ul>
			<p class="text-lg text-gray-700 leading-relaxed">
				For AI-generative APIs (OpenAI DALL-E, GPT-image-1, Gemini image, Stable Diffusion): different
				category. They create novel images from prompts. Pictify renders your existing design with
				your data. Use both; they don't compete.
			</p>
		</div>
	</section>

	<!-- SDKs -->
	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Language support
		</h2>
		<p class="text-lg text-gray-700 leading-relaxed mb-6">
			Pictify is an HTTP API; it works from any language. Direct HTTP calls are the fastest
			integration path — no SDK needed. For convenience, the docs show curl, Node, Python, Ruby,
			Go, and PHP examples.
		</p>
		<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
			<p class="text-gray-700 leading-relaxed">
				<strong>No SDK lock-in.</strong> If you prefer to keep your dependency tree clean, just use
				<code class="bg-gray-100 px-1.5 py-0.5 rounded">fetch</code>,
				<code class="bg-gray-100 px-1.5 py-0.5 rounded">requests</code>, or
				<code class="bg-gray-100 px-1.5 py-0.5 rounded">http.Client</code>. The request shape is four
				lines of JSON in every language.
			</p>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="image_generation_api"
			headline="One endpoint. Any language. Any scale."
			kicker="Image Generation API"
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
