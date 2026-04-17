<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Dynamic Image Generation — Images That Change with Your Data | Pictify';
	const description =
		'Images that render based on request context — user, product, time, or data state. Live-bound templates so what you render is always current.';
	const canonical = 'https://pictify.io/solutions/dynamic-image-generation';
	const ogImage = 'https://pictify.io/og/solutions/dynamic-image-generation.png';
	const related = getRelatedSolutions('dynamic-image-generation', 6);

	const faqs = [
		{
			q: 'What is dynamic image generation?',
			a: 'Dynamic image generation is rendering an image based on request context — the current user, the current product, the current time, the current data state — rather than pre-rendering a static asset. Every fetch produces an image that reflects reality at that moment.'
		},
		{
			q: 'How is dynamic image generation different from static image rendering?',
			a: 'Static rendering happens at publish/build time: you bake an image once and serve it. Dynamic rendering happens at request time: the image is computed when someone fetches the URL. Dynamic is the right tool when the underlying data changes faster than you can re-publish (live prices, stock levels, personalized stats).'
		},
		{
			q: 'Is dynamic image generation expensive?',
			a: 'Not with CDN caching. Pictify caches every render URL; identical variable sets return a warm cache hit in under 100ms. If only 5% of your requests hit new variable combinations, 95% of your dynamic images cost the same as static. The cold-render cost is paid once per unique URL.'
		},
		{
			q: 'Can dynamic images update without re-fetching?',
			a: 'No — once an image is rendered, its bytes are fixed. But you can cache the URL for a short TTL (e.g., 5 minutes) so that a refreshing consumer (a dashboard, a live feed) gets a newly-rendered image at each poll interval. Pictify also supports smart links where the URL stays stable but the underlying render refreshes per TTL.'
		},
		{
			q: 'What data sources can drive dynamic images?',
			a: 'Any data your backend can read: user records, product inventory, CRM fields, feature flags, analytics events, experiment assignments, time of day, geography, A/B cohort. Pictify\'s live data bindings can pull directly from HTTP endpoints or webhooks — for other template APIs, your backend does the fetch and passes the values.'
		},
		{
			q: 'How does this compare to @vercel/og?',
			a: '@vercel/og renders dynamic OG images in a Next.js edge function — limited CSS, Vercel-only, and the template lives in your codebase. Pictify is an external API — full CSS, any host, templates live in a visual editor your designer can edit. For quick prototypes on Vercel, @vercel/og is fine. For production dynamic rendering with a design workflow, use Pictify.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Dynamic Image Generation',
		url: canonical,
		description:
			'Render images dynamically based on request context. Per-user, per-product, per-time dynamic rendering via API.',
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
	breadcrumbLabel="Dynamic Image Generation"
	{ogImage}
	ogImageAlt="Dynamic image generation — images that change with your data"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#67e8f9]/25 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">Dynamic Images</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Images that change<br /><span class="text-[#06b6d4]">with your data.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Live-bound templates render current reality — per user, per product, per request. Every fetch reflects now.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Dynamic image generation is what you need when the data behind an image changes faster than
				you can re-publish it. A pre-rendered product card with last week's price is a bug report
				waiting to happen. A static year-in-review card for every user means the loudest customer
				still sees their 2024 numbers in Q2 2025.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				With dynamic rendering, the image is computed when the URL is fetched. CDN caching keeps the
				cost of "changes per request" manageable: the first fetch for a unique variable set renders
				fresh; every subsequent fetch is a warm hit. You get current data with static-asset
				performance.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">
			Three dynamic-image shapes
		</h2>
		<div class="space-y-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">Per-user dynamic</h3>
				<p class="text-gray-700 leading-relaxed">
					The image reflects the current viewer. Example: a user's Year-in-Review card that includes
					their name, stats, and profile photo. URL encodes the user ID; Pictify renders with that
					user's data at request time. Stays current even if the user's stats change between shares.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">Per-request dynamic</h3>
				<p class="text-gray-700 leading-relaxed">
					The image reflects current state of something stateful — inventory, leaderboard standing,
					weather, stock price. URL stays the same; the rendered bytes update when the binding data
					changes. Great for live dashboards embedded in emails or status pages.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-6">
				<h3 class="font-black text-xl mb-2">Per-context dynamic</h3>
				<p class="text-gray-700 leading-relaxed">
					The image reflects contextual factors — campaign cohort, A/B experiment variant, device
					type, geography, time-of-day. URL encodes the context; Pictify renders the correct variant.
					Enables A/B testing on image copy directly.
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			The binding approach
		</h2>
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Pictify templates support live data bindings — configure the template to fetch variables from
				an HTTP endpoint (or webhook) at render time. The render call doesn't need to pass variables;
				the template pulls them itself.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Example: a leaderboard image for a gaming platform. The template has a binding to
				<code class="bg-gray-100 px-1 rounded">https://api.yourgame.com/leaderboard/top10</code>. Every
				render pulls current top-10 data and shows it. Your client just fetches a stable URL like
				<code class="bg-gray-100 px-1 rounded">api.pictify.io/template/leaderboard/render</code>; the
				image always shows now.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Live bindings are what separates Pictify from the rest of the template-API category.
				Bannerbear, Placid, and RenderForm all require your backend to fetch the data first. Pictify
				lets the template do it directly.
			</p>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Example: per-user dynamic OG image
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>profile-og.ts</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`// When a user shares their profile link, the OG image reflects their
// CURRENT stats — not a snapshot from signup day.

export function buildProfileOgUrl(userId: string) {
  const url = new URL('https://api.pictify.io/template/tpl_profile_og/render');
  url.searchParams.set('user_id', userId);
  return url.toString();
}

// In the profile page's <head>:
// <meta property="og:image" content={buildProfileOgUrl(user.id)} />

// Template has a binding to:
//   https://yourapp.com/api/profile/\${user_id}/stats
// On render, Pictify fetches current stats and paints them.
// User shares the link; Twitter caches the OG for ~24h.
// After TTL, next share re-fetches → new image with updated stats.`}</code
				></pre>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="dynamic_image_generation"
			headline="One URL. Always current data."
			kicker="Dynamic Image Generation"
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
