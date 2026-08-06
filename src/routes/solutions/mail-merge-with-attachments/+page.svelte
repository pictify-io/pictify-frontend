<script>
	import SolutionPageShell from '$lib/components/solutions/SolutionPageShell.svelte';
	import SolutionClosingCta from '$lib/components/solutions/SolutionClosingCta.svelte';

	const title = 'Mail Merge with Attachments — Every Row Gets Its Own File | Pictify';
	const description =
		'Word mail merge cannot attach the file. Pictify generates a personalized PDF per spreadsheet row and emails it to each recipient with per-person delivery status.';
	const canonical = 'https://pictify.io/solutions/mail-merge-with-attachments';
	const ogImage = 'https://media.pictify.io/v3g37-1775406808141.png';

	const faqs = [
		{
			q: 'Can Word mail merge send attachments?',
			a: 'No. Word\'s built-in mail merge sends the merged text as the email body — it has no option to attach a file, personalized or otherwise. When the deliverable IS a file (a certificate, an invoice, a report), the built-in merge cannot do the job. Pictify generates the personalized PDF per row and sends it as a real attachment-style delivery: each recipient gets a personal email carrying their own document.'
		},
		{
			q: 'What are the Gmail mail merge limits?',
			a: 'Gmail caps sending at 500 emails per day on free accounts and 1,500 per day via Google Workspace mail merge — and it can lock you out mid-batch when you hit the cap. Every merge add-on that sends "from your Gmail" inherits these limits. Pictify sends from its own isolated sending domain, so your batch size is your plan\'s email quota, not Gmail\'s daily cap, and your personal sender reputation is never at stake.'
		},
		{
			q: 'How do I mail merge a personalized PDF to each recipient?',
			a: 'Upload a CSV (one row per recipient, with an email column). Pick or generate a document template — the AI Template Maker builds one from a text description. Map columns to template variables, send a test to yourself, then run. Each row renders to its own PDF and emails to its recipient. The run screen shows sent, delivered, or bounced per person.'
		},
		{
			q: 'What happens when an address bounces?',
			a: 'The row shows bounced with the reason, the address is automatically suppressed so future runs never burn a send on it, and you can correct the address and re-send that single row — no re-running the whole batch, no bounce spreadsheet.'
		},
		{
			q: 'Do recipients see a generic bulk sender?',
			a: 'Sends go out from Pictify\'s dedicated sending infrastructure with your name on the message; paid workspaces get their own isolated sending subdomain. Every message carries a compliant one-click unsubscribe, which protects your deliverability instead of hurting it.'
		},
		{
			q: 'Can I trigger the merge automatically instead of uploading a CSV?',
			a: 'Yes. Every workflow exposes a signed webhook — point your form tool, LMS, CRM, or a Zapier/Make/n8n flow at it and each payload renders and delivers one document. The CSV wizard and the webhook feed the same template and the same run history.'
		}
	];

	const howToSteps = [
		{
			name: 'Upload your spreadsheet',
			text: 'Export your list as CSV — one row per recipient with an email column — and drop it into a Pictify workflow.'
		},
		{
			name: 'Pick or generate a template',
			text: 'Choose a document template or describe one to the AI Template Maker. Map CSV columns to the template variables.'
		},
		{
			name: 'Run and watch delivery',
			text: 'Every row renders to its own PDF and emails to its recipient. The run screen shows delivered, bounced, or suppressed per person, with one-click re-send.'
		}
	];
	const howToMeta = {
		name: 'How to mail merge with attachments',
		description:
			'Generate a personalized PDF per spreadsheet row and email it to each recipient with per-person delivery status.'
	};

	const webApplicationSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Pictify — Mail Merge with Attachments',
		url: canonical,
		description:
			'Generate a personalized document per spreadsheet row and email it to each recipient with per-person delivery status.',
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		creator: { '@type': 'Organization', name: 'Pictify', url: 'https://pictify.io' }
	};

	const receipts = [
		{
			tool: 'Word mail merge',
			wall: 'Cannot attach the file',
			detail:
				'The merged text becomes the email body. There is no attachment option — and the file is the whole point.'
		},
		{
			tool: 'Gmail / Workspace merge',
			wall: '500–1,500 emails per day',
			detail:
				'Free Gmail caps at 500/day, Workspace mail merge at 1,500/day — and locks you out mid-batch when you hit it.'
		},
		{
			tool: 'Sheets add-ons (Autocrat & co.)',
			wall: '6-minute timeouts, your Gmail quota',
			detail:
				'Apps Script executions cap at 6 minutes and sends ride your own Gmail. Google\'s June 2026 runtime migration broke add-on merges across an 81M-install base.'
		},
		{
			tool: 'Design tools (Canva)',
			wall: 'Stops at download',
			detail:
				'Bulk Create makes the variants, then hands you a zip. No email delivery of any kind — distribution is still your job.'
		}
	];
</script>

<SolutionPageShell
	{title}
	{description}
	{canonical}
	breadcrumbLabel="Mail Merge with Attachments"
	{ogImage}
	ogImageAlt="Mail merge with attachments — every row becomes a personalized PDF, delivered by email"
	{webApplicationSchema}
	{howToSteps}
	{howToMeta}
	{faqs}
>
	<header class="text-center mb-14">
		<div
			class="inline-block bg-gray-900 text-brand-accent border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ff6b6b] px-4 py-1 mb-6 transform -rotate-1 rounded-lg"
		>
			<span class="font-black uppercase tracking-widest text-sm">The Attachment Problem, Solved</span>
		</div>
		<h1
			class="text-4xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tighter max-w-4xl mx-auto"
		>
			Mail merge with attachments<br /><span class="text-brand-danger"
				>that actually attaches the file.</span
			>
		</h1>
		<p class="mt-5 text-lg md:text-xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
			Word can't attach it. Gmail caps you at 500 a day. Pictify generates a personalized PDF from
			every spreadsheet row and emails it to each recipient — with per-person delivery status.
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-4">
			<a
				href="/signup"
				class="px-8 py-4 bg-data-green text-gray-900 font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				Send Your First Batch Free
			</a>
			<a
				href="/tools/certificate-generator"
				class="px-8 py-4 bg-white text-gray-900 font-black border-[3px] border-gray-900 rounded-xl uppercase tracking-widest shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				Try It In Your Browser
			</a>
		</div>
	</header>

	<!-- The walls: why every mail-merge path breaks on attachments -->
	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-2 text-center">
			Why "mail merge with attachments" is a search with 480 results and no answer
		</h2>
		<p class="text-gray-600 font-medium text-center max-w-2xl mx-auto mb-8">
			Every tool in the usual toolkit stops one step short of the inbox.
		</p>
		<div class="grid md:grid-cols-2 gap-5">
			{#each receipts as r}
				<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-lg p-5">
					<div class="flex items-center justify-between gap-3 mb-2">
						<h3 class="font-black text-gray-900">{r.tool}</h3>
						<span
							class="shrink-0 bg-brand-danger text-white text-xs font-black uppercase tracking-wide px-2 py-1 rounded-md border-2 border-gray-900"
							>{r.wall}</span
						>
					</div>
					<p class="text-sm text-gray-700 leading-relaxed">{r.detail}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- The flip: don't attach, generate + deliver -->
	<section class="max-w-4xl mx-auto mb-16">
		<div class="bg-gray-900 text-white border-[3px] border-gray-900 rounded-2xl shadow-brutal-accent p-8 md:p-10">
			<h2 class="text-2xl md:text-3xl font-black mb-4">
				Stop attaching. Start <span class="text-data-green">delivering.</span>
			</h2>
			<p class="text-gray-300 font-medium leading-relaxed mb-6">
				The attachment hack exists because your document tool and your email tool are two different
				tools. Pictify is one run: each CSV row renders into its own personalized PDF, and each PDF
				goes to its recipient from an isolated sending domain — not your Gmail. What you get back
				isn't "sent". It's <strong class="text-white">delivered, per person</strong>, with bounces
				suppressed automatically and any row re-sendable in one click.
			</p>
			<ul class="grid sm:grid-cols-2 gap-3 text-sm font-bold">
				<li class="bg-white/10 rounded-lg px-4 py-3">✓ Personalized PDF per row — not one file for all</li>
				<li class="bg-white/10 rounded-lg px-4 py-3">✓ No Gmail daily caps, no mid-batch lockouts</li>
				<li class="bg-white/10 rounded-lg px-4 py-3">✓ Delivered / bounced / complained, per recipient</li>
				<li class="bg-white/10 rounded-lg px-4 py-3">✓ Fix a bad address, re-send that one row</li>
			</ul>
		</div>
	</section>

	<!-- How it works -->
	<section class="max-w-5xl mx-auto mb-16">
		<h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-8 text-center">
			CSV in. Inboxes reached. Three steps.
		</h2>
		<div class="grid md:grid-cols-3 gap-5">
			{#each howToSteps as step, i}
				<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-lg p-6">
					<div
						class="w-10 h-10 flex items-center justify-center bg-brand-accent border-[3px] border-gray-900 rounded-lg font-black text-lg mb-4"
					>
						{i + 1}
					</div>
					<h3 class="font-black text-gray-900 mb-2">{step.name}</h3>
					<p class="text-sm text-gray-700 leading-relaxed">{step.text}</p>
				</div>
			{/each}
		</div>
	</section>

	<SolutionClosingCta toolName="mail-merge-with-attachments" isPillar={true} />
</SolutionPageShell>
