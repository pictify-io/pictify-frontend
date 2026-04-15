<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Automate Product Images at Catalog Scale | Pictify';
	const description =
		'Render catalog-scale product cards, seasonal variants, and stock-aware banners from one template — bound to your inventory data. One API, any scale.';
	const canonical = 'https://pictify.io/solutions/automate-product-images';
	const ogImage = 'https://media.pictify.io/ub2kk-1776199735728.png';
	const related = getRelatedSolutions('automate-product-images', 6);

	const faqs = [
		{
			q: 'How do I automate product images for an e-commerce catalog?',
			a: "Design one product-card template, declare variables for the fields that vary (product name, price, image URL, discount flag, stock count), then POST each product's data to the render API. For catalogs over 100 items, use the batch endpoint: send an array of variable sets, get a webhook when the batch finishes. No per-product design work."
		},
		{
			q: 'Can product images update automatically when inventory changes?',
			a: 'Yes. Pictify templates support live data bindings — the template fetches variables from an HTTP endpoint or webhook at render time. Bind the price and stock fields to your inventory API; every rendered image reflects current reality. When you drop a price, next request pulls the new price automatically.'
		},
		{
			q: 'What about seasonal or campaign-specific product variants?',
			a: "Use conditional blocks. `{{ if campaign == 'black-friday' }}` renders a different banner; `{{ if stock < 10 }}` adds a 'low stock' badge. Everything lives in the template — your backend just passes the flags."
		},
		{
			q: 'Does this work with Shopify or WooCommerce?',
			a: 'Yes. You call Pictify from your backend (or a serverless function triggered by your store webhooks). The typical pattern: product created/updated → webhook fires → render OG image and product card → store URLs on the product record.'
		},
		{
			q: "What's the render cost per product image?",
			a: 'Per-render pricing; cheaper than Bannerbear or Placid at equivalent volumes. For a 10K-product catalog refreshed monthly, Pictify renders all 10K for less than the cost of one designer-hour.'
		},
		{
			q: 'Can I generate product images for social media ads too?',
			a: 'Yes — same template rendered at different dimensions. Set `width` and `height` per request, or design multi-format variants. Common setup: one master template renders as OG, square Instagram, vertical story, and product grid.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Automate Product Images',
		url: canonical,
		description:
			'Automate product image generation for e-commerce catalogs, marketplaces, and storefronts via API.',
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify', url: 'https://pictify.io' }
	};
</script>

<SolutionPageShell
	{title}
	{description}
	{canonical}
	breadcrumbLabel="Automate Product Images"
	{ogImage}
	ogImageAlt="Automate product images for catalog-scale e-commerce"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#ff6b6b]/15 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">For E-commerce</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Automate product images<br /><span class="text-[#ff6b6b]">from your data.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Render catalog-scale cards, seasonal variants, and stock-aware banners from one template. One API, any catalog.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Every e-commerce team hits the same wall: the catalog grows faster than the design team. Ten
				new SKUs means ten new product cards. Ten product cards means ten OG images, ten social posts,
				ten email thumbnails. Multiply by seasonal variants (Black Friday! Holiday! Valentine's!) and
				the design queue eats the merchandising calendar.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Automated product image generation breaks the cycle. Design one template. Bind it to your
				inventory data. Every new SKU renders automatically — in every format, every channel, every
				variant — from the same source of truth your storefront already uses.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">
			What automated product images solve
		</h2>
		<div class="grid md:grid-cols-2 gap-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Catalog cards at scale</h3>
				<p class="text-gray-700">
					Every product needs a grid card, a detail hero, an OG image. That's 3× your catalog in
					image assets. Template + render API = all 3 assets per product, auto-generated on SKU
					creation.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Price-aware images</h3>
				<p class="text-gray-700">
					Drop the price? Every OG, every ad creative, every thumbnail needs to reflect the new
					number. With live data bindings, they do — automatically, on next request, no re-export.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Seasonal campaign variants</h3>
				<p class="text-gray-700">
					Black Friday, Cyber Monday, summer sale. Conditional blocks in the template flip the
					campaign banner per-request. One template, N campaigns.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Stock-aware badges</h3>
				<p class="text-gray-700">
					<code class="bg-gray-100 px-1 rounded">{`{{ if stock < 10 }}Only {{ stock }} left{{ endif }}`}</code> —
					scarcity in the image itself, not just the cart UI. Converts on channels where the cart
					UI never shows (email, social, ads).
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			The integration, end to end
		</h2>
		<ol class="space-y-5 list-decimal pl-6 marker:text-[#ff6b6b] marker:font-black">
			<li class="text-lg text-gray-700 leading-relaxed">
				<strong>Design the template.</strong> Drag-and-drop editor, or paste HTML/CSS. Declare
				variables for every field that changes per product: name, price, image URL, discount, stock.
			</li>
			<li class="text-lg text-gray-700 leading-relaxed">
				<strong>Wire up the webhook.</strong> Your store fires a webhook on product create/update.
				Your backend (or a serverless function) POSTs to the render API with the product data.
			</li>
			<li class="text-lg text-gray-700 leading-relaxed">
				<strong>Store the URLs.</strong> Pictify returns CDN-cached image URLs. Save them on the
				product record. Your storefront, emails, and ads all read from the same field.
			</li>
			<li class="text-lg text-gray-700 leading-relaxed">
				<strong>Backfill once.</strong> For existing catalogs, use the batch endpoint: POST an array
				of every product's data, get a webhook when all renders complete. A 50K-product catalog
				finishes in minutes.
			</li>
		</ol>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Example render call
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>shopify-webhook.js</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`// Shopify 'products/update' webhook handler
export async function handler(req) {
  const product = req.body;

  const res = await fetch('https://api.pictify.io/template/tpl_product_card/render', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.PICTIFY_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      variables: {
        name: product.title,
        price: product.variants[0].price,
        image_url: product.images[0].src,
        stock: product.variants[0].inventory_quantity,
        featured: product.tags.includes('featured')
      }
    })
  });

  const { image } = await res.json();
  await saveImageUrl(product.id, image.url); // update your record
}`}</code
				></pre>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="automate_product_images"
			headline="One template. Every product. Automatically."
			kicker="Automate Product Images"
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
