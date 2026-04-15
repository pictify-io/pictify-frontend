<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Automate Social Media Images at Scale | Pictify';
	const description =
		'Personalized social cards at scale — one template, thousands of variants, zero manual design work. Generate LinkedIn, X, Instagram, and Facebook images via API.';
	const canonical = 'https://pictify.io/solutions/automate-social-media-images';
	const ogImage = 'https://media.pictify.io/6ese3-1776199824315.png';
	const related = getRelatedSolutions('automate-social-media-images', 6);

	const faqs = [
		{
			q: 'How do I automate social media image generation?',
			a: 'Design one template per social platform (or one multi-size template), declare the variables that change per post (headline, subtitle, author, image, stats), and POST data to the render API. The same template can render at Instagram square (1080×1080), Instagram story (1080×1920), LinkedIn (1200×627), and Twitter (1200×675) dimensions — just pass different `width`/`height` per request.'
		},
		{
			q: 'Can I generate personalized social images per user or customer?',
			a: "Yes. Bind the template to each user's data (name, avatar, stat, achievement), POST per user. Typical use: Year-in-Review cards, referral graphics, user-of-the-week spotlights, personalized testimonial cards. All generated from one template design."
		},
		{
			q: "What's the difference between this and Canva's bulk feature?",
			a: "Canva's bulk feature reads a CSV; Pictify reads live data from your application. With Pictify, a social card updates automatically when the underlying data changes — no re-uploading a CSV. Plus Pictify templates support conditional blocks, expressions, and logic Canva can't express."
		},
		{
			q: 'How do I handle multiple platforms with different dimensions?',
			a: 'Two patterns: (1) separate templates per platform, same variables — pick the template at render time; (2) one master template, different `width`/`height` per request — Pictify auto-scales the layout. Pattern 2 is cheaper to maintain for brand consistency; pattern 1 gives per-platform design control.'
		},
		{
			q: 'Can I A/B test social image variants?',
			a: 'Yes. Pictify ships native experiment support — define variants of a template, traffic-split across them, track which converts. Integrated into the render API, so there\'s no separate experiment platform to wire up.'
		},
		{
			q: 'How does this scale to thousands of daily social posts?',
			a: 'Batch endpoint for scheduled campaigns: POST an array of variable sets, get a webhook when all images render. Individual on-demand renders complete in under 1s cold, ~100ms warm (CDN-cached). A daily 1,000-image campaign finishes in minutes.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Automate Social Media Images',
		url: canonical,
		description:
			'Automate personalized social media image generation across LinkedIn, X, Instagram, Facebook via template API.',
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
	breadcrumbLabel="Automate Social Media Images"
	{ogImage}
	ogImageAlt="Automate social media images — one template, every platform"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#ffc480]/20 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">For Marketing</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Automate social media images<br /><span class="text-[#ff6b6b]">at any scale.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			One template. Thousands of personalized variants. One API call per post. No more design-queue bottlenecks.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Social teams live and die by image throughput. Every post needs a graphic. Every campaign has
				ten variations. Every platform has different dimensions. Design requests stack up and the
				social calendar slips — not because the copy isn't ready, but because the image isn't.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Automated social media image generation breaks the dependency. Design one template per
				campaign; bind it to the content source your team already uses (blog posts, CRM, user data,
				event feed); render on demand or in batch. The image queue becomes an API call.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">
			What automated social images unlock
		</h2>
		<div class="grid md:grid-cols-2 gap-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Blog-post-to-social automation</h3>
				<p class="text-gray-700">
					New blog post lands? Webhook renders LinkedIn, X, and Instagram cards with the headline,
					author, and hero image. Push to Buffer/Hootsuite automatically. Writer publishes, social
					ships — no human in between.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Customer testimonial cards</h3>
				<p class="text-gray-700">
					Every 5-star review in your CRM becomes a social-ready testimonial graphic. Avatar, quote,
					name, role — bound to the record. Content calendar fills itself from customer data you
					already have.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Event and webinar promos</h3>
				<p class="text-gray-700">
					Speaker confirmed? Render their cover card. Session time updated? Re-render. Panel of five
					speakers? Batch renders five cards in parallel, all using the same brand template.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Year-in-review and milestone cards</h3>
				<p class="text-gray-700">
					One template × N customers = N shareable Year-in-Review graphics. Each user's data (hours
					saved, words written, projects shipped) flows into the same design. Users share them;
					you get viral distribution for free.
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			One template, every platform
		</h2>
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Social platforms each have their own canonical dimensions:
			</p>
			<ul class="text-lg text-gray-700 leading-relaxed space-y-2 mb-5 list-disc pl-6 marker:text-[#ff6b6b]">
				<li><strong>LinkedIn post:</strong> 1200 × 627</li>
				<li><strong>X (Twitter):</strong> 1200 × 675</li>
				<li><strong>Instagram feed:</strong> 1080 × 1080 (square) or 1080 × 1350 (portrait)</li>
				<li><strong>Instagram story / Reel cover:</strong> 1080 × 1920</li>
				<li><strong>Facebook post:</strong> 1200 × 630</li>
				<li><strong>OG image (universal):</strong> 1200 × 630</li>
			</ul>
			<p class="text-lg text-gray-700 leading-relaxed">
				Design one master template, then vary the <code class="bg-gray-100 px-1 rounded">width</code>
				and <code class="bg-gray-100 px-1 rounded">height</code> per render. Pictify's layout engine
				handles the aspect-ratio scaling. For brand-critical platforms where you want per-platform
				control, clone the template and adjust — the variable schema stays consistent, so your
				integration code doesn't change.
			</p>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Example: render LinkedIn + X cards for every new blog post
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>blog-publish-webhook.js</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`async function renderSocialCards(post) {
  const variables = {
    title: post.title,
    author: post.author.name,
    avatar: post.author.avatar_url,
    hero: post.hero_image,
    category: post.category
  };

  const platforms = [
    { id: 'linkedin', width: 1200, height: 627 },
    { id: 'x',        width: 1200, height: 675 },
    { id: 'ig',       width: 1080, height: 1080 }
  ];

  const cards = await Promise.all(platforms.map(p =>
    fetch('https://api.pictify.io/template/tpl_social_card/render', {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${process.env.PICTIFY_API_KEY}\` },
      body: JSON.stringify({ variables, width: p.width, height: p.height })
    }).then(r => r.json()).then(j => ({ platform: p.id, url: j.image.url }))
  ));

  return cards; // [{platform: 'linkedin', url: '...'}, ...]
}`}</code
				></pre>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="automate_social_media_images"
			headline="One template. Every platform. Every post."
			kicker="Automate Social Media Images"
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
