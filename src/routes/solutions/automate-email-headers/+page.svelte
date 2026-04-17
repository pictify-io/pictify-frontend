<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Automate Email Header Images — Per-Recipient Personalization | Pictify';
	const description =
		'Automate personalized email header images per recipient. Open rates rise when the image says the reader\'s name. One template, every send.';
	const canonical = 'https://pictify.io/solutions/automate-email-headers';
	const ogImage = 'https://pictify.io/og/solutions/automate-email-headers.png';
	const related = getRelatedSolutions('automate-email-headers', 6);

	const faqs = [
		{
			q: 'How do I automate personalized email header images?',
			a: "Design one email-header template (typically 600×300 or 1200×400). Declare variables for the fields that personalize per recipient — name, plan, usage stat, recent achievement. In your ESP's email body, reference the Pictify image URL with the recipient's ID encoded as a query parameter. Pictify renders on first fetch; caches per-user."
		},
		{
			q: "Do email clients render dynamic image URLs correctly?",
			a: "Yes — as long as the URL returns a valid image. Gmail, Apple Mail, Outlook, Yahoo all fetch images when the recipient opens the email (or previews it). Pictify URLs are standard image URLs with query parameters; they render like any static image."
		},
		{
			q: "Does the image cache per recipient or per email?",
			a: "Per unique variable set, at the CDN edge. If 10,000 recipients each get a URL with their own user_id, each is cached separately; re-opens are instant. Gmail also caches images on Google's servers — after the first open, the same recipient's re-opens don't hit Pictify at all."
		},
		{
			q: "How much does automated email header generation cost at scale?",
			a: "For a million-send email blast where each recipient gets a unique image, you pay for ~1M cold renders (if every recipient opens). At typical open rates (20-30%), that's ~300K renders at Pictify's per-render cost — usually under $100. Cheaper than printing 1M postcards, often cheaper than running your own Puppeteer fleet."
		},
		{
			q: "Can I A/B test email header variants?",
			a: "Yes. Pictify ships experiments as a first-class feature. Bind the variant ID to the recipient's cohort; track open rate per variant via your ESP's analytics. The URL encodes the variant, so every open maps back to a variant ID cleanly."
		},
		{
			q: "What about email clients that block images?",
			a: "If a recipient blocks images, the email still renders — just without the header image. Ensure your email also has useful text content (accessibility best practice anyway). Gmail, Apple Mail, and Outlook 2024+ all auto-load images by default now; image blocking is a 10% problem, not a 50% problem."
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Automate Email Header Images',
		url: canonical,
		description:
			'Automate personalized email header image generation per recipient via API.',
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
	breadcrumbLabel="Automate Email Headers"
	{ogImage}
	ogImageAlt="Automate email headers — per-recipient personalization"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#67e8f9]/20 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">Email Personalization</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Automate email headers —<br />
			<span class="text-[#0ea5e9]">per recipient.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Personalized email header images generated per recipient. Open rates climb when the hero says the reader's name. One template, every send.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Email personalization tokens swap names into body copy. It helps. But the highest-leverage
				personalization is the one recipients see first — the header image. A visual that shows the
				recipient's name, avatar, or current stat drives measurably higher opens, click-throughs, and
				replies than any text-only personalization.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Our <a href="https://pictify.io/blogs/why-you-should-use-custom-and-personalized-email-banners" class="text-[#0ea5e9] underline font-bold">earlier post on custom email banners</a>
				made the case for why they matter. This page covers the technical automation: how to
				generate a personalized header per recipient at scale, without a design-team bottleneck.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">
			Email header patterns that convert
		</h2>
		<div class="grid md:grid-cols-2 gap-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Welcome series</h3>
				<p class="text-gray-700">
					"Welcome, Ada" with the user's avatar and plan. First impression; sets the tone for the entire relationship.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Monthly recaps</h3>
				<p class="text-gray-700">
					"This is what you did in April, Ada" with the month's stats visualized. Every user's card is unique to them.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Upgrade nudges</h3>
				<p class="text-gray-700">
					"You're using 92% of your plan, Ada" with the user's actual usage. More persuasive than a generic upgrade email.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Milestones + achievements</h3>
				<p class="text-gray-700">
					"You just hit 100 tasks — nice." Visual recognition of progress; recipients share these voluntarily.
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Example: Customer.io integration
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>email-template.liquid</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`<!-- Customer.io email body: the image URL uses liquid interpolation
     to pass current recipient attributes to Pictify. -->

<img src="https://api.pictify.io/template/tpl_welcome_header/render?
        name={{ customer.first_name | url_encode }}&
        plan={{ customer.plan }}&
        avatar={{ customer.avatar_url | url_encode }}"
     width="600" height="300"
     alt="Welcome, {{ customer.first_name }}" />

<h1>Hi {{ customer.first_name }}</h1>
<p>Your 2026 starts here...</p>`}</code
				></pre>
		</div>
		<p class="text-lg text-gray-700 leading-relaxed mt-6">
			Same pattern works in Klaviyo, Braze, Iterable, SendGrid, Mailchimp, Postmark, Resend — any ESP
			that supports variable interpolation in the email body. Pictify URL is a plain image URL; every
			client renders it.
		</p>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="automate_email_headers"
			headline="Every recipient. Their name. Their data."
			kicker="Email Personalization"
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
