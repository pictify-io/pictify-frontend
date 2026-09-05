<script>
	/**
	 * /campaigns/customer-value-updates — the campaigns landing page. FE-17.
	 *
	 * Built from board `F31-0` after the non-technical pass (handoff §7.1), so
	 * the register is a customer success lead's, not an engineer's:
	 * "spreadsheet" rather than CSV, "folder of cards and a match-list" rather
	 * than ZIP and manifest, "line" rather than row. There is no code on the
	 * page and no API surface, deliberately — the buyer this is written for
	 * never touches either.
	 *
	 * Every specimen is HTML built from ONE fixture
	 * (`$lib/campaigns/marketing-fixture.js`), not a screenshot. The page's
	 * central claim is that each card comes from one line of one spreadsheet;
	 * if the sheet and the card were separate assets they would eventually
	 * disagree, and the page would be demonstrating the opposite of its claim.
	 *
	 * COPY RULES THAT ARE NOT NEGOTIABLE (spec, and repeated in the handoff):
	 * no "native integration", no delivery or "sent" claims — Pictify renders
	 * and the buyer's own tool sends — "whichever comes first" on retention, no
	 * reply-time promise, and a "Prototype" label on anything showing product
	 * UI while the pilot is private.
	 */
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import PixelCluster from '$lib/components/landing/PixelCluster.svelte';
	import CtaStrip from '$lib/components/landing/CtaStrip.svelte';
	import { HERO_CLUSTER } from '$lib/components/landing/hero-clusters.js';
	import ValueCard from '$lib/components/campaigns/marketing/ValueCard.svelte';
	import EmailSpecimen from '$lib/components/campaigns/marketing/EmailSpecimen.svelte';
	import PhoneFrame from '$lib/components/campaigns/marketing/PhoneFrame.svelte';
	import InboxList from '$lib/components/campaigns/marketing/InboxList.svelte';
	import SheetTable from '$lib/components/campaigns/marketing/SheetTable.svelte';
	import {
		ROWS,
		TOTAL_CUSTOMERS,
		byLine,
		num,
		comparison
	} from '$lib/campaigns/marketing-fixture.js';
	import { authUrl } from '$lib/campaigns/nav.js';

	/**
	 * Both CTAs go through signup carrying the intent.
	 *
	 * There is no anonymous access-request form: the request is recorded against
	 * an account, and a form that collected a work email and then asked for one
	 * again after signup would be asking twice for the same thing. `authUrl`
	 * validates the intent against its allowlist, so this cannot become a way to
	 * push arbitrary values through the auth flow.
	 */
	const REQUEST = authUrl('/signup', { intent: 'customer-value-update' });
	const SAMPLE = authUrl('/signup', { intent: 'customer-value-update' });

	const hero = byLine(42);
	const wall = ROWS.slice(0, 5);

	/** 01 / 02 / 03 — what it needs, what it will not do, what it hands off. */
	const FIT = [
		{
			n: '01',
			kicker: 'It needs',
			numColor: 'text-brand-powder',
			title: 'A spreadsheet your team already signs off on',
			body: 'One line per customer: an account id, the company name, one to three numbers you already report, and last month’s numbers if you have them. Estimates carry a one-line note on how you got them. Up to 250 customers per send in the pilot.',
			factsLabel: 'Formats',
			facts: ['Email card (image)', 'One-page PDF'],
			factsNote: 'Pick one per send'
		},
		{
			n: '02',
			kicker: 'It will not',
			numColor: 'text-brand-rose',
			title: 'Send, guess, or invent anything',
			body: 'No sending, no contact lists, no made-up numbers, no health scores. Pictify puts what your spreadsheet says on a card and stops. If last month’s number is missing, the card leaves the comparison out rather than inventing one.',
			factsLabel: 'Stays in your email tool',
			facts: ['Who receives it', 'When it goes out', 'Opt-outs and eligibility'],
			factsNote: null
		},
		{
			n: '03',
			kicker: 'It hands off',
			numColor: 'text-brand-field',
			title: 'A folder of cards, matched to each customer',
			body: 'You download the cards and a match-list from your Pictify account and place them in your own email tool. We never ask for your customers’ email addresses. Card images are hosted like your other Pictify images, at addresses nobody can guess; the download itself needs your login. Deletion dates are shown before you upload.',
			factsLabel: 'Send from',
			facts: ['Customer.io', 'Braze', 'HubSpot', 'Iterable', 'Any email tool'],
			factsNote: 'You place the cards yourself; there is no automatic connection yet.'
		}
	];

	const STEPS = [
		{
			step: 'Step 01 · Upload',
			title: 'Upload your spreadsheet',
			body: 'Account, company, one to three numbers. We point out duplicates, odd values and anything that would look wrong on a card before a single one is made.'
		},
		{
			step: 'Step 02 · Review and approve',
			title: 'Check ten before you approve',
			body: 'We pick the ten trickiest cards: longest names, biggest and smallest numbers, first-month customers. You approve exactly what will go out.'
		},
		{
			step: 'Step 03 · Generate',
			title: 'Every card gets made, or none go out',
			body: 'Close the tab; it keeps going. If a card fails, it is named and retried on its own. You never get a half-finished batch presented as done.'
		},
		{
			step: 'Step 04 · Export · the handoff',
			title: 'Download and send from your email tool',
			body: 'You get a folder of cards plus a simple spreadsheet that matches each card to its customer. Drop them into Customer.io, Braze, HubSpot or whatever you already send from.'
		}
	];

	const OFFER = [
		['Scope', '1 campaign · 1 month · card or PDF'],
		['Allowance', '250 customers · 10 preview cards · retries included within reason'],
		['Approval', 'You approve every send in the app'],
		['Delivered', 'A folder of cards + match-list + text versions'],
		['Deletion', 'On request, confirmed before we say “deleted”'],
		['Price', 'Quoted per pilot · no card on file needed']
	];

	const FAQ = [
		{
			q: 'Does Pictify send the emails?',
			a: 'No. You get the cards and a match-list, and you send from the tool you already use. Who gets what, and when, stays with you.'
		},
		{
			q: 'Where do the numbers come from?',
			a: 'From you. Whatever your team already reports per customer. Pictify does not pull data from your product or calculate ROI. If a number is an estimate, the card says so and carries your note on how it was worked out.'
		},
		{
			q: 'What if one card comes out wrong?',
			a: 'You will usually catch it in the ten preview cards. If one fails while the batch is being made, it is named and retried on its own, and the download waits until every card is right.'
		},
		{
			q: 'How long do you keep our data?',
			a: 'Your spreadsheet: 30 days after upload, or 7 days after you confirm you have collected the cards, whichever comes first. The cards: 30 days after they are made. The dates are shown in the app before you confirm anything.'
		},
		{
			q: 'Can we do this every month?',
			a: 'Yes. “New period” keeps your setup and asks for a fresh spreadsheet and a fresh approval. Automatic monthly runs come later.'
		}
	];
</script>

<svelte:head>
	<title>Customer value updates · Pictify Campaigns</title>
	<meta
		name="description"
		content="Turn the numbers your team already tracks per account into a branded card for every customer, ready to drop into the emails you already send. Private pilot for customer success and lifecycle teams."
	/>
	<link rel="canonical" href="https://pictify.io/campaigns/customer-value-updates" />
</svelte:head>

<div data-v2>
	<Nav />

	<!-- 1 · Hero -->
	<section
		class="relative w-full overflow-hidden bg-brand-field px-5 pb-[86px] pt-12 lg:px-10 lg:pb-[120px] lg:pt-16"
	>
		<PixelCluster
			cells={HERO_CLUSTER}
			cell={38}
			origin="sw"
			cycle={5}
			class="-bottom-[26px] left-[36%] hidden lg:block"
		/>

		<div
			class="relative mx-auto grid max-w-page gap-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16"
		>
			<div class="min-w-0">
				<p class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-slate">
					Pictify Campaigns · Customer value updates
				</p>
				<h1
					class="mt-5 max-w-[640px] text-balance font-display text-[42px] font-extrabold leading-[0.92] tracking-[-0.04em] text-brand-ink lg:text-[62px]"
				>
					Show every customer what they got from you this month.
				</h1>
				<p
					class="mt-6 max-w-[560px] font-sans text-[17px] leading-[27px] text-brand-slate lg:text-body"
				>
					Take the numbers your team already tracks per account and turn them into a branded card
					for each customer, ready to drop into the emails you already send. No designer, no
					developer, no new tool for sending.
				</p>

				<div class="mt-8 flex flex-wrap items-center gap-3">
					<a
						href={REQUEST}
						class="flex h-12 items-center gap-2.5 bg-brand-ink px-5 font-sans text-[15px] font-semibold text-white"
					>
						Request pilot access
						<span class="block h-2.5 w-2.5 bg-brand-field" aria-hidden="true" />
					</a>
					<a
						href={SAMPLE}
						class="flex h-12 items-center border border-brand-ink bg-white px-5 font-sans text-[15px] font-semibold text-brand-ink"
						>See a sample</a
					>
				</div>

				<p class="mt-6 font-mono text-[11px] leading-[18px] text-brand-slate">
					For customer success and lifecycle marketing teams · private pilot · up to 250 accounts
				</p>
			</div>

			<!--
				What the CUSTOMER sees, not what the buyer uploads. The inbox row and
				the phone are the two places a CS lead already recognises this
				artefact; a raw PNG on a field would be a file, and a file is the
				thing this audience was told they would have to make.
			-->
			<div class="relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:gap-4">
				<div class="w-full lg:mt-8 lg:w-[248px] lg:flex-shrink-0">
					<InboxList row={hero} />
				</div>
				<PhoneFrame class="w-full max-w-[280px] lg:w-[240px] lg:flex-shrink-0">
					<EmailSpecimen row={hero} size="sm" />
					<p class="px-3 pb-2 pt-2.5 font-sans text-[10px] leading-[14px] text-brand-mute">
						Hours saved is an estimate: workflows × the handling time you told us at onboarding.
					</p>
				</PhoneFrame>
			</div>
		</div>
	</section>

	<!-- 2 · Before / after -->
	<section class="w-full bg-brand-paper px-5 py-[72px] lg:px-10 lg:py-[112px]">
		<div class="mx-auto max-w-page">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
				<h2
					class="max-w-[620px] text-balance font-display text-[36px] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink lg:text-h1"
				>
					The same monthly email. Now it’s about them.
				</h2>
				<p class="font-sans text-[15.5px] leading-[25px] text-brand-slate lg:pt-2">
					Most product updates say what you shipped. A value update says what the customer got. Same
					send, same tool, one card added.
				</p>
			</div>

			<div class="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10">
				<div>
					<p class="flex items-baseline gap-3">
						<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
							>Before</span
						>
						<span class="font-sans text-[14px] text-brand-ink">One newsletter for everyone</span>
					</p>
					<div class="mt-3 bg-brand-subtle p-5">
						<p class="font-sans text-[15px] font-semibold text-brand-ink">
							What’s new at Northwind · September
						</p>
						<p class="mt-0.5 font-sans text-[12.5px] text-brand-mute">
							Northwind · to {TOTAL_CUSTOMERS} customers
						</p>
						<p class="mt-3 font-sans text-[13.5px] leading-[21px] text-brand-slate">
							This month we shipped bulk exports, a faster approvals queue and three integrations.
							Read on for what’s coming next quarter…
						</p>
						<div
							class="mt-4 flex h-[110px] items-center justify-center bg-brand-rule/40 font-sans text-[12.5px] text-brand-mute"
							aria-hidden="true"
						>
							generic product banner
						</div>
						<p class="mt-4 font-sans text-[13.5px] text-brand-slate">Log in to see your usage…</p>
					</div>
					<p class="mt-3 font-sans text-[13.5px] leading-[20px] text-brand-slate">
						Nothing in it belongs to {hero.company}. It reads like marketing, because it is.
					</p>
				</div>

				<div>
					<p class="flex items-baseline gap-3">
						<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-royal"
							>After</span
						>
						<span class="font-sans text-[14px] text-brand-ink"
							>One email per customer, with their card</span
						>
					</p>
					<div class="mt-3 border-2 border-brand-ink">
						<EmailSpecimen row={hero} />
					</div>
					<p class="mt-3 font-sans text-[13.5px] leading-[20px] text-brand-slate">
						Their numbers, your brand, a real button. The kind of email a renewal conversation can
						start from.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 3 · Proof wall -->
	<section class="w-full bg-brand-canvas px-5 py-[72px] lg:px-10 lg:py-[112px]">
		<div class="mx-auto max-w-page">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
				<h2
					class="max-w-[640px] text-balance font-display text-[38px] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink lg:text-h1"
				>
					{TOTAL_CUSTOMERS} customers each got their own card on Tuesday.
				</h2>
				<div class="lg:pt-2">
					<p class="font-sans text-[15.5px] leading-[25px] text-brand-slate">
						One spreadsheet from the customer success team. Ten cards checked and approved. Every
						customer got theirs from the same template, none of them made by hand.
					</p>
					<p class="mt-4 flex items-start gap-2.5">
						<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
						<span class="font-mono text-[11px] leading-[18px] text-brand-slate">
							{TOTAL_CUSTOMERS} of {TOTAL_CUSTOMERS} made · 2 left out on purpose · sample data
						</span>
					</p>
				</div>
			</div>

			<!--
				Scrolls sideways inside itself. The wall's argument is the VARIETY —
				a seven-digit figure, a fall, a first month, a non-Latin name — so
				wrapping it into a tidy grid would remove the thing it is proving.
			-->
			<div class="mt-10 -mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
				<ul class="flex min-w-min gap-4">
					{#each wall as row (row.line)}
						{@const delta = comparison(row)}
						<li class="w-[240px] flex-shrink-0">
							<div class="border border-brand-rule bg-white">
								<ValueCard {row} size="sm" showComparison={false} />
							</div>
							<p class="mt-2 flex items-baseline justify-between gap-2">
								<span class="font-mono text-[10.5px] text-brand-mute">
									line {row.line}{row.note ? ` · ${row.note}` : ''}
								</span>
								<span class="font-mono text-[10.5px] text-brand-mute">
									{delta
										? (delta.direction === 'down' ? '▼' : '▲') + ' ' + delta.label
										: 'no prior'}
								</span>
							</p>
						</li>
					{/each}
					<li class="w-[190px] flex-shrink-0">
						<div
							class="flex h-full min-h-[132px] flex-col justify-center border border-dashed border-brand-mute bg-brand-subtle p-4"
						>
							<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
								And the rest
							</p>
							<p class="mt-1 font-display text-[34px] font-extrabold leading-none text-brand-ink">
								+{TOTAL_CUSTOMERS - wall.length}
							</p>
							<p class="mt-2 font-sans text-[12.5px] leading-[18px] text-brand-slate">
								Same template, each made from its own line.
							</p>
						</div>
					</li>
				</ul>
			</div>

			<div class="mt-10">
				<CtaStrip
					text="One spreadsheet and one approval did all of that."
					action="Request pilot access"
					actionHref={REQUEST}
					link="See a sample set"
					linkHref={SAMPLE}
				/>
			</div>
		</div>
	</section>

	<!-- 4 · Spreadsheet → card -->
	<section class="w-full bg-brand-paper px-5 py-[72px] lg:px-10 lg:py-[112px]">
		<div class="mx-auto max-w-page">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
				<h2
					class="max-w-[620px] text-balance font-display text-[38px] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink lg:text-h1"
				>
					It starts with a spreadsheet you already have.
				</h2>
				<p class="font-sans text-[15.5px] leading-[25px] text-brand-slate lg:pt-2">
					One line per customer: who they are and one to three numbers you already report on. Every
					card is filled from its own line and nothing else.
				</p>
			</div>

			<div class="mt-10 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_320px] lg:gap-8">
				<SheetTable highlight={42} limit={4} />
				<p class="flex items-center gap-3 lg:flex-col lg:gap-1.5">
					<span class="font-display text-[26px] leading-none text-brand-ink" aria-hidden="true"
						>→</span
					>
					<span class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute"
						>Line 42</span
					>
				</p>
				<div class="border border-brand-rule bg-white">
					<ValueCard row={hero} />
				</div>
			</div>

			<div class="mt-10 grid gap-4 lg:grid-cols-3 lg:gap-6">
				{#each [['Blank means blank', 'No last-month number for Tailspin Toys? Their card simply skips the comparison. We never turn a gap into a zero or a percentage.'], ['A dip is shown as a dip', 'Wide World Importers did fewer workflows than last month. The card says so, plainly, in the same neutral colour. Your reviewer decides whether to exclude that account.'], ['Estimates say so on the card', '“Hours saved” is marked as an estimate and the method you approved travels with it. Nothing is calculated for you behind the scenes.']] as [title, body] (title)}
					<div class="bg-brand-subtle p-5">
						<p class="font-sans text-[15px] font-semibold text-brand-ink">{title}</p>
						<p class="mt-2 font-sans text-[13.5px] leading-[21px] text-brand-slate">{body}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 5 · Four steps -->
	<section class="w-full bg-brand-canvas px-5 py-[72px] lg:px-10 lg:py-[112px]">
		<div class="mx-auto max-w-page">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
				<h2
					class="max-w-[560px] text-balance font-display text-[38px] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink lg:text-h1"
				>
					Four steps. One approval. You stay in charge.
				</h2>
				<p class="font-sans text-[15.5px] leading-[25px] text-brand-slate lg:pt-2">
					No design tool to learn, no developer to wait for, nothing to install.
				</p>
			</div>

			<ol class="mt-10 grid gap-4 lg:grid-cols-2 lg:gap-6">
				{#each STEPS as step, i (step.step)}
					<li
						class="p-6 lg:p-8 {i === 0
							? 'bg-brand-blue text-white'
							: i === 3
							? 'border-2 border-brand-ink bg-brand-field'
							: 'bg-brand-powder'}"
					>
						<p
							class="font-mono text-[10.5px] uppercase tracking-[0.06em] {i === 0
								? 'text-white/70'
								: 'text-brand-royal'}"
						>
							{step.step}
						</p>
						<p
							class="mt-3 font-display text-[24px] font-bold leading-[1.05] tracking-[-0.02em] {i ===
							0
								? 'text-white'
								: 'text-brand-ink'}"
						>
							{step.title}
						</p>
						<p
							class="mt-3 max-w-[440px] font-sans text-[14px] leading-[22px] {i === 0
								? 'text-white/85'
								: 'text-brand-slate'}"
						>
							{step.body}
						</p>
						{#if i === 3}
							<a
								href={REQUEST}
								class="mt-6 inline-flex h-11 items-center bg-brand-ink px-4 font-sans text-[14px] font-semibold text-white"
								>See the sending guide</a
							>
						{/if}
					</li>
				{/each}
			</ol>

			<p class="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2">
				{#each ['No design skills. No code.', 'The AI sees your layout, never your customers’ numbers.', 'Have HTML already? Import it and edit it the same way.'] as fact (fact)}
					<!--
						Top-aligned, not centred: these wrap to two lines at 390 and a
						centred square then floats beside the gap between them rather
						than marking where the sentence starts.
					-->
					<span class="flex items-start gap-2.5">
						<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
						<span class="font-sans text-[13.5px] leading-[20px] text-brand-slate">{fact}</span>
					</span>
				{/each}
			</p>
		</div>
	</section>

	<!-- 6 · What it needs / will not do -->
	<section class="w-full bg-brand-paper px-5 py-[72px] lg:px-10 lg:py-[112px]">
		<div class="mx-auto max-w-page">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
				<h2
					class="max-w-[560px] text-balance font-display text-[38px] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink lg:text-h1"
				>
					What it needs. What it will not do.
				</h2>
				<p class="font-sans text-[15.5px] leading-[25px] text-brand-slate lg:pt-2">
					Three things worth knowing before you ask for access, said the way we would say them on a
					call.
				</p>
			</div>

			<dl class="mt-10 border-t border-brand-rule">
				{#each FIT as item (item.n)}
					<div
						class="grid gap-5 border-b border-brand-rule py-8 lg:grid-cols-[120px_minmax(0,1fr)_240px] lg:gap-10 lg:py-10"
					>
						<p class="flex items-baseline gap-3 lg:block">
							<span
								class="font-display text-[44px] font-extrabold leading-none tracking-[-0.03em] {item.numColor}"
								>{item.n}</span
							>
							<span
								class="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute lg:mt-1"
								>{item.kicker}</span
							>
						</p>
						<div class="min-w-0">
							<dt
								class="font-display text-[22px] font-bold leading-[1.1] tracking-[-0.02em] text-brand-ink"
							>
								{item.title}
							</dt>
							<dd
								class="mt-3 max-w-[620px] font-sans text-[14.5px] leading-[23px] text-brand-slate"
							>
								{item.body}
							</dd>
						</div>
						<div>
							<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
								{item.factsLabel}
							</p>
							<ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 lg:flex-col lg:gap-y-1">
								{#each item.facts as fact (fact)}
									<li class="font-sans text-[13.5px] text-brand-ink">{fact}</li>
								{/each}
							</ul>
							{#if item.factsNote}
								<p class="mt-2 font-sans text-[12.5px] leading-[18px] text-brand-mute">
									{item.factsNote}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<!-- 7 · Offer + FAQ -->
	<section class="w-full bg-brand-subtle px-5 py-[72px] lg:px-10 lg:py-[112px]">
		<div class="mx-auto grid max-w-page gap-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16">
			<div class="border border-brand-rule bg-white p-6 lg:p-7">
				<p class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-mute">
					Private pilot · how it works
				</p>
				<!--
					A real heading, not a styled paragraph. The offer and the FAQ are the
					two sections a buyer comes here to read, and with no heading in
					either, someone navigating by heading skipped straight from "what it
					will not do" to the closing band.
				-->
				<h2
					class="mt-3 font-display text-[27px] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-ink"
				>
					One send, up to 250 customers, one format.
				</h2>

				<dl class="mt-5 border-t border-brand-ink">
					{#each OFFER as [label, value] (label)}
						<div
							class="flex items-baseline justify-between gap-5 border-b border-brand-rule py-2.5"
						>
							<dt class="flex-shrink-0 font-sans text-[13.5px] text-brand-slate">{label}</dt>
							<dd class="text-right font-sans text-[13.5px] font-semibold text-brand-ink">
								{value}
							</dd>
						</div>
					{/each}
				</dl>

				<a
					href={REQUEST}
					class="mt-6 flex h-12 w-full items-center justify-center gap-2.5 bg-brand-ink font-sans text-[15px] font-semibold text-white"
				>
					Request pilot access
					<span class="block h-2.5 w-2.5 bg-brand-field" aria-hidden="true" />
				</a>
				<p class="mt-3 text-center font-sans text-[12.5px] leading-[18px] text-brand-slate">
					We ask for your work email, what you want to send, roughly how many customers, and which
					email tool you use. No customer data.
				</p>
			</div>

			<div>
				<h2 class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-royal">
					Questions we get
				</h2>
				<dl class="mt-4 border-t border-brand-ink">
					{#each FAQ as item (item.q)}
						<div class="border-b border-brand-rule py-5">
							<dt class="font-sans text-[15.5px] font-semibold text-brand-ink">{item.q}</dt>
							<dd class="mt-2 max-w-[720px] font-sans text-[14px] leading-[22px] text-brand-slate">
								{item.a}
							</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	</section>

	<!-- 8 · Closing -->
	<section
		class="relative w-full overflow-hidden bg-brand-field px-5 py-[80px] lg:px-10 lg:py-[132px]"
	>
		<!--
			Low enough to clear the caption. At -24px the cluster ran straight
			through the mono line, which turned a decorative bleed into an
			unreadable sentence — the one line on the section that says the data is
			a sample.
		-->
		<PixelCluster
			cells={HERO_CLUSTER}
			cell={40}
			origin="sw"
			cycle={4}
			class="-bottom-[92px] left-[38%] hidden lg:block"
		/>
		<div class="relative mx-auto flex max-w-page flex-col items-center gap-6 text-center">
			<h2
				class="max-w-[880px] text-balance font-display text-[40px] font-extrabold leading-[0.92] tracking-[-0.04em] text-brand-ink lg:text-display"
			>
				Your numbers already exist. The cards don’t.
			</h2>
			<p class="max-w-[520px] font-sans text-[16px] leading-[26px] text-brand-slate">
				Upload the spreadsheet you already trust, check ten cards, download the set. Send it from
				your own email tool.
			</p>
			<div class="flex flex-wrap items-center justify-center gap-3">
				<a
					href={REQUEST}
					class="flex h-12 items-center gap-2.5 bg-brand-ink px-5 font-sans text-[15px] font-semibold text-white"
				>
					Request pilot access
					<span class="block h-2.5 w-2.5 bg-brand-field" aria-hidden="true" />
				</a>
				<a
					href={SAMPLE}
					class="flex h-12 items-center border border-brand-ink bg-white px-5 font-sans text-[15px] font-semibold text-brand-ink"
					>See a sample</a
				>
			</div>
			<p class="font-mono text-[11px] text-brand-slate">
				Private pilot for CS and Lifecycle teams · sample data on this page
			</p>
		</div>
	</section>

	<Footer />
</div>
