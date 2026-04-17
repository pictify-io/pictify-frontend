<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Personalized Images at Scale — One Template, N Users | Pictify';
	const description =
		'Generate per-user personalized images at scale — for lifecycle emails, in-app onboarding, ads, and Year-in-Review graphics. One template, N users, N images.';
	const canonical = 'https://pictify.io/solutions/personalized-images-at-scale';
	const ogImage = 'https://pictify.io/og/solutions/personalized-images-at-scale.png';
	const related = getRelatedSolutions('personalized-images-at-scale', 6);

	const faqs = [
		{
			q: 'How do I generate personalized images for every user?',
			a: 'Design one template with variables for the fields that vary per user (name, avatar, stats, achievements). In batch, POST every user\'s data to the render API. Output: N CDN-cached image URLs, one per user. Deliver them via email, in-app, ads, or wherever the user sees them.'
		},
		{
			q: 'What kinds of personalized images make sense?',
			a: 'Lifecycle moments where the user seeing their own data drives engagement: onboarding milestones, monthly recap cards, Year-in-Review graphics, "your plan vs. theirs" upgrade prompts, referral-rewards posters, community-spotlight cards. Anything where the image IS the message.'
		},
		{
			q: 'How is this different from email personalization tokens?',
			a: 'Email tokens replace text in the email body. Personalized images embed per-user content in the visual — which is what recipients actually notice. A user\'s name in an image performs dramatically better than the same name in body copy, because the image is the first thing they see in the preview.'
		},
		{
			q: 'Can I A/B test personalized image variants?',
			a: 'Yes. Pictify ships native A/B experiments. Define two variants of the template; route users across variants by cohort. Track which variant drives more clicks / opens / signups. Results feed back into the template-picker for future campaigns.'
		},
		{
			q: 'How do I handle edge cases — missing data, long names, broken avatar URLs?',
			a: 'Three defenses. (1) Template default values for every variable. (2) Conditional blocks for presence checks: `{{ if avatar_url }}...{{ else }}initial-based fallback{{ endif }}`. (3) Pictify\'s image fetcher has timeouts and fallback behavior configurable per binding. Unlike rigid templates, Pictify handles degraded input gracefully.'
		},
		{
			q: 'How does this scale to 1M users?',
			a: 'Use the batch endpoint with webhooks. A 1M-user batch renders over a few hours; a webhook fires when complete. For real-time cases (user opens email → render personalized image on first fetch), Pictify\'s CDN cache makes the cost negligible beyond the first render.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Personalized Images at Scale',
		url: canonical,
		description:
			'Generate per-user personalized images for lifecycle emails, onboarding, and ads via API.',
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
	breadcrumbLabel="Personalized Images at Scale"
	{ogImage}
	ogImageAlt="Personalized images at scale — one template, every user"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#c084fc]/20 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">Lifecycle Marketing</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Personalized images<br /><span class="text-[#9333ea]">at scale.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			One template × N users = N personalized images. Rendered on demand or in batch, delivered through email, in-app, ads — anywhere the user sees the message.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				Personalization works because users pay more attention to things that are obviously about
				them. A generic "Welcome!" graphic gets glanced past. A graphic with the user's name, avatar,
				and current progress gets shared. Spotify Wrapped is the canonical proof: hundreds of
				millions of personalized cards per year, most shared voluntarily, all from one template.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Until recently, building a personalized-image pipeline meant committing engineering-quarters
				of work. With template APIs, it's one template design + one batch render call. The
				asymmetry between effort and results is the main reason every lifecycle marketing team
				should have this capability.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8">
			Seven high-ROI personalization patterns
		</h2>
		<div class="grid md:grid-cols-2 gap-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Year-in-Review cards</h3>
				<p class="text-gray-700">
					Once-a-year viral distribution. Every user's card shows their stats; they share voluntarily because it's about them.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Onboarding milestones</h3>
				<p class="text-gray-700">
					"You've completed your first 10 tasks" with the user's name and actual task count. Celebratory graphics that embed the user's progress.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Monthly recap emails</h3>
				<p class="text-gray-700">
					Per-user stats card in every monthly email — hours saved, tasks done, team activity. Higher open rates from the preview alone.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Upgrade prompts</h3>
				<p class="text-gray-700">
					"You've hit the limit on your current plan" with the user's actual usage. Far more persuasive than generic upgrade CTAs.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Referral reward posters</h3>
				<p class="text-gray-700">
					"Ada invited you — here's $20 off" with Ada's actual name and the actual reward. Shares better than text-only referrals.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Community spotlight cards</h3>
				<p class="text-gray-700">
					Customer of the week / top contributor of the month. Rendered from CRM data, delivered as social assets the customer shares.
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			The canonical example: Year-in-Review at scale
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>year-in-review.ts</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`// Year-end cron: render a personalized card for every active user
const users = await db.users.whereActiveIn(2026);

const batch = await fetch('https://api.pictify.io/template/tpl_wrapped/batch', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.PICTIFY_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    variables: users.map(u => ({
      name: u.first_name,
      avatar: u.avatar_url,
      projects_count: u.stats_2026.projects,
      hours_saved: u.stats_2026.hours_saved,
      top_feature: u.stats_2026.top_feature_used,
      plan: u.plan
    })),
    webhookUrl: 'https://yourapp.com/hooks/wrapped-batch-complete'
  })
});

// Webhook fires when all N cards render.
// Payload includes per-user image URLs → email delivery pipeline.`}</code
				></pre>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="personalized_images_at_scale"
			headline="Every user. Their own image. Automatically."
			kicker="Personalized at Scale"
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
