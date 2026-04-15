<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';
	import { getRelatedSolutions } from '$lib/solutions/related.js';

	const title = 'Bulk Image Generation — Batch Render from CSV or API | Pictify';
	const description =
		'Generate thousands of images from a spreadsheet, CSV, or JSON batch. Async jobs, webhooks on completion, parallelized renders — all from one template.';
	const canonical = 'https://pictify.io/solutions/bulk-image-generation';
	const ogImage = 'https://media.pictify.io/b4o9c-1776200153158.png';
	const related = getRelatedSolutions('bulk-image-generation', 6);

	const faqs = [
		{
			q: 'How do I generate images in bulk from a CSV?',
			a: 'Two paths. If you own the backend: parse the CSV, POST each row as a variables object to the render API (or batch them). If you want zero code: use Pictify\'s Google Sheets integration — connect the sheet, map columns to template variables, trigger a batch render. Either way produces CDN-cached URLs you can reference in your email, CMS, or storefront.'
		},
		{
			q: "What's the difference between sending 1,000 individual renders vs one batch request?",
			a: 'Performance and cost. The batch endpoint parallelizes internally — 1,000 images render in roughly the time of 100 individual calls. It also handles the webhook lifecycle so your code doesn\'t need to manage N in-flight requests. For workloads over ~100 images, always use batch.'
		},
		{
			q: 'How large a batch can I submit at once?',
			a: 'Tested up to 50,000 rows in a single request. Larger batches work but get queued; if your workload is over ~25K at once, split into chunks. The batch endpoint returns a job ID; poll for status or register a webhook.'
		},
		{
			q: 'Can I generate bulk images from a live data source instead of a static CSV?',
			a: 'Yes — use live data bindings. Define the template once with a binding to an HTTP endpoint or webhook; trigger a batch render whenever the source updates. Pictify fetches current data per render, so your images always reflect current state. Live bindings are unique to Pictify; other template APIs require you to pass static variables every call.'
		},
		{
			q: 'What happens if one image in the batch fails?',
			a: 'The batch continues; failures are reported in the webhook payload with per-row error details. You can retry just the failed rows with a second batch call. No "whole batch fails because one row has a bad URL" situations.'
		},
		{
			q: 'How do I handle image delivery at the end of a batch?',
			a: 'Webhook fires when the batch completes. Payload includes an array of render results (URL + metadata per row). Common patterns: email the URLs to users, update CRM records with image fields, upload to S3 / Cloudinary for your own delivery pipeline.'
		}
	];

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Bulk Image Generation',
		url: canonical,
		description:
			'Batch image generation API. Render thousands of images from CSV, spreadsheet, or JSON with async jobs and webhooks.',
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
	breadcrumbLabel="Bulk Image Generation"
	{ogImage}
	ogImageAlt="Bulk image generation from CSV or API — Pictify"
	{webApplicationSchema}
	{faqs}
>
	<header class="text-center mb-12">
		<div
			class="inline-block bg-[#4ade80]/20 border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">For Developers</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Bulk image generation,<br /><span class="text-[#4ade80] italic">done right.</span>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Render thousands of images from a CSV, spreadsheet, or JSON batch. Async jobs, webhooks on completion, parallelized renders — all from one template.
		</p>
	</header>

	<section class="max-w-4xl mx-auto mb-16">
		<div class="prose prose-lg prose-neutral max-w-none">
			<p class="text-lg text-gray-700 leading-relaxed mb-5">
				"We need 10,000 certificates by Friday." "Every user gets a personalized year-in-review card."
				"Re-render OG images for every archived blog post after the rebrand." All the same problem:
				one template × N rows of data = N images, and you'd like to finish before the weekend.
			</p>
			<p class="text-lg text-gray-700 leading-relaxed">
				Bulk image generation is the batch-rendering primitive for this class of workload. Submit a
				batch, get a webhook when it's done, deliver the URLs. No N individual API calls, no manual
				rate-limit management, no orchestrator to build.
			</p>
		</div>
	</section>

	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			When bulk rendering is the right tool
		</h2>
		<div class="grid md:grid-cols-2 gap-5">
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Campaign launches</h3>
				<p class="text-gray-700">
					New feature ships; every user gets a personalized announcement graphic. 40,000 users, 40,000 images. Render the batch, email the URLs.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Catalog backfills</h3>
				<p class="text-gray-700">
					Existing e-commerce catalog that never had OG images per product. One batch POST, every product has a rendered card. Store the URLs on the product records.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Certificate runs</h3>
				<p class="text-gray-700">
					Course cohort completes; every graduate gets a certificate. The batch lists all 500 graduates with their names and dates. Output is 500 PDF + 500 PNG ready to email.
				</p>
			</div>
			<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] p-5">
				<h3 class="font-black text-gray-900 mb-2">Monthly reports</h3>
				<p class="text-gray-700">
					End of month; render a dashboard summary image per customer from their usage data. Batch of N customers, one webhook, newsletter pipeline picks up the URLs.
				</p>
			</div>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Batch render example
		</h2>
		<div class="bg-[#282c34] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden mb-6">
			<div class="bg-[#21252b] px-4 py-3 border-b-[3px] border-gray-900 flex items-center gap-2">
				<div class="w-3.5 h-3.5 rounded-full bg-[#ff5f56]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]"></div>
				<div class="w-3.5 h-3.5 rounded-full bg-[#27c93f]"></div>
				<span class="ml-auto text-xs text-gray-500 font-mono font-bold uppercase tracking-wider"
					>batch-render.ts</span
				>
			</div>
			<pre class="p-6 overflow-x-auto text-sm text-gray-300 leading-relaxed"><code
					>{`// Render a certificate for every graduate in one request
const graduates = await db.graduates.listByCohort(cohortId);

const response = await fetch('https://api.pictify.io/template/tpl_certificate/batch', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.PICTIFY_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    variables: graduates.map(g => ({
      recipient_name: g.full_name,
      course_name: g.course,
      completion_date: g.completed_at,
      certificate_id: g.id
    })),
    webhookUrl: 'https://yourapp.com/hooks/batch-complete'
  })
});

const { jobId } = await response.json();
// Webhook fires when all N certificates render. Payload includes URLs.`}</code
				></pre>
		</div>
	</section>

	<section class="max-w-4xl mx-auto mb-16">
		<h2 class="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter mb-6">
			Performance expectations
		</h2>
		<div class="prose prose-lg prose-neutral max-w-none">
			<ul class="text-lg text-gray-700 leading-relaxed space-y-2 mb-5 list-disc pl-6 marker:text-[#4ade80]">
				<li><strong>100 images</strong> — typically under 30 seconds</li>
				<li><strong>1,000 images</strong> — typically 2–4 minutes</li>
				<li><strong>10,000 images</strong> — typically 15–25 minutes</li>
				<li><strong>50,000 images</strong> — typically 1.5–2 hours</li>
			</ul>
			<p class="text-lg text-gray-700 leading-relaxed">
				Actual time depends on template complexity and external asset load (external images in the
				template add latency). Webhooks let you kick off a batch, free the calling process, and pick
				up delivery when the job finishes — no need to hold connections or manage retries yourself.
			</p>
		</div>
	</section>

	<svelte:fragment slot="after-faq">
		<SolutionClosingCta
			toolName="bulk_image_generation"
			headline="One template. N rows. One webhook."
			kicker="Bulk Image Generation"
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
