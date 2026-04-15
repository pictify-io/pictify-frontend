<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Generate Images from Data — Live Bindings to HTTP, Sheets, Webhooks | Pictify';
	const description =
		'Bind image templates to Google Sheets, HTTP endpoints, or webhooks. When data changes, images reflect it — no manual re-render, no backend glue code.';
	const canonical = 'https://pictify.io/solutions/generate-images-from-data';
	const ogImage = 'https://media.pictify.io/sywyu-1776200332591.png';
	const related = getRelatedSolutions('generate-images-from-data', 6);

	const faqs = [
		{
			q: 'How do I generate images directly from a data source?',
			a: 'Pictify lets templates fetch variables themselves via bindings. Configure a binding with an HTTP endpoint, webhook URL, or static JSON source. When you call render, the template pulls current data from the binding and paints it. Your render request doesn\'t need to pass the variables — the template handles the fetch.'
		},
		{
			q: 'What data sources can I bind to?',
			a: 'HTTP endpoints (any REST or GraphQL API), webhook URLs, Google Sheets (via a connector), static JSON (posted once, cached), and your own webhook receivers. Multiple bindings per template are supported — one for user data, another for product data, a third for feature flags.'
		},
		{
			q: 'Does the binding fetch on every render?',
			a: 'By default yes — the template always pulls fresh data. You can configure a cache TTL per binding (e.g., 60 seconds) to batch-fetch when high-traffic renders would hammer the source. For data that changes every few minutes, a short TTL is the sensible default.'
		},
		{
			q: 'Can I bind to Google Sheets?',
			a: 'Yes. Connect your Sheet via the Pictify dashboard; pick the sheet and column mapping. Each render pulls the row identified by a key (e.g., product ID → row). When you edit the sheet, the next render reflects the change. Common pattern: non-technical teams maintain content in Sheets, designers build the template, engineers just call render.'
		},
		{
			q: 'How does this compare to passing variables on every render call?',
			a: "Two advantages. (1) Your backend doesn't need to know where the data lives — the template handles the fetch. (2) You decouple the data source from the rendering caller. A frontend JavaScript call can render an image without exposing the data source to the browser."
		},
		{
			q: 'What if the bound data source is slow or down?',
			a: 'Bindings have configurable timeouts (default 3s) and fallbacks (stale-while-revalidate cache, or default values). If the source is down beyond timeout, Pictify uses the last successful fetch or fails gracefully with a documented error code. Full control over the failure mode.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Generate Images from Data',
		url: canonical,
		description:
			'Image templates with live data bindings to HTTP, Google Sheets, and webhooks.',
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
	breadcrumbLabel="Generate Images from Data"
	{ogImage}
	ogImageAlt="Generate images from HTTP, Google Sheets, and webhooks with Pictify bindings"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#a7f3d0]/30 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">Data Bindings</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Generate images<br />
			<span class="text-[#10b981]">from any data source.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Bind templates to HTTP endpoints, Google Sheets, or webhooks. When data changes, images follow.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Most template APIs require you to pass every variable on every render call. Your backend
				fetches the data, builds the JSON payload, POSTs to the render endpoint. It works, but it
				ties the render caller to the data schema. A marketing team wants to update a field? They
				file a ticket with the engineering team to change the payload.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Pictify's <strong>live data bindings</strong> invert the pattern. The template knows where to
				fetch data; the render caller just identifies which row to render. Engineers ship the
				template once; non-technical teams manage the content in a Sheet or the app's CRM. The
				binding layer does the fetch at render time.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">
			Five binding patterns that work
		</h2>
		<div class="space-y-4">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-lg mb-2">Template ↔ Product API</h3>
				<p class="text-gray-700">
					Template binds to <code class="bg-gray-100 px-1 rounded">/api/products/:id</code>. Render URL identifies the product; template pulls current name/price/stock and paints.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-lg mb-2">Template ↔ Google Sheet</h3>
				<p class="text-gray-700">
					Non-technical content team maintains rows in a Sheet. Template renders each row as a graphic. Edit the cell, next render reflects it.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-lg mb-2">Template ↔ CRM</h3>
				<p class="text-gray-700">
					Template binds to your HubSpot / Salesforce / Stripe record. Personalized customer images (upgrade prompts, renewal nudges) pull from the single source of truth.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-lg mb-2">Template ↔ Analytics</h3>
				<p class="text-gray-700">
					Template binds to your PostHog / Mixpanel API. Renders a per-user or per-cohort stats card with live numbers — embed in dashboards, emails, Slack bots.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-lg mb-2">Template ↔ Webhook receiver</h3>
				<p class="text-gray-700">
					Your app POSTs data to a Pictify webhook endpoint; the template renders whatever the latest POST contained. Perfect for event-triggered images (deploy notifications, incident alerts, build status badges).
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Example: bind a template to your product API
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>binding-config.json</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`// Define the binding in the Pictify dashboard or via API:
{
  "type": "http",
  "url": "https://api.yourapp.com/products/\${product_id}",
  "headers": { "Authorization": "Bearer \${env.YOUR_API_KEY}" },
  "timeout_ms": 3000,
  "cache_ttl_seconds": 60,
  "mapping": {
    "name":  "$.title",
    "price": "$.variants[0].price",
    "stock": "$.variants[0].inventory"
  }
}

// Render call: no variables needed — the template fetches them.
// Only identify the row:
curl -X POST https://api.pictify.io/template/tpl_product/render \\
  -H "Authorization: Bearer $PICTIFY_API_KEY" \\
  -d '{"variables": {"product_id": "abc123"}}'

// Template pulls /products/abc123 and paints name/price/stock.`}</code
				></pre>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="generate_images_from_data"
			headline="Bind once. Render forever."
			kicker="Data Bindings"
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
