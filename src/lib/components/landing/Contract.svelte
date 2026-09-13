<script>
	import PixelCluster from './PixelCluster.svelte';
	import { reveal } from '$lib/actions/reveal.js';
	import Capsule from './Capsule.svelte';

	// Five callers, one contract. Two uneven rows — a wide card leads each one,
	// so the set never reads as an even features grid. `wide` cards split
	// horizontally (copy left, art right); the rest stack art over copy.
	const rowA = [
		{ n: '01', title: 'Your code', body: 'POST a row of JSON and get a URL back. Most renders arrive this way.',
			bg: 'bg-brand-blue', label: 'text-white/60', head: 'text-white', text: 'text-white/80',
			img: 'filler-code.jpg', wide: true, code: 'POST /v1/render' },
		{ n: '02', title: 'A spreadsheet', body: 'Upload a CSV, map columns to variables. Every row renders.',
			bg: 'bg-brand-sky', label: 'text-black/50', head: 'text-brand-ink', text: 'text-black/70',
			img: 'filler-spreadsheet.jpg' },
		{ n: '03', title: 'A webhook', body: 'Point any service at a URL. Event in, file out, unattended.',
			bg: 'bg-brand-powder', label: 'text-black/50', head: 'text-brand-ink', text: 'text-black/70',
			img: 'filler-webhook.jpg' }
	];

	const rowB = [
		{ n: '04', title: 'A person', body: 'Three fields and a render button. No code anywhere.',
			bg: 'bg-brand-rose', label: 'text-black/50', head: 'text-brand-ink', text: 'text-black/70',
			img: 'filler-person.jpg' }
	];

	const bleed = [
		[1, 0, 'powder'], [0, 1, 'blue'], [1, 1, 'ink'],
		[0, 2, 'blue'], [1, 2, 'sky'], [2, 2, 'blue'],
		[0, 3, 'ink'], [1, 3, 'blue'], [0, 4, 'pink']
	];

	// Scatter straddling the seam into the next section.
	const bottomRun = [
		[0, 1, 'blue'], [2, 0, 'powder'], [2, 2, 'blue'],
		[4, 1, 'ink'], [5, 2, 'blue'], [7, 0, 'blue'], [8, 2, 'pink']
	];
</script>

<section class="relative w-full overflow-hidden bg-brand-canvas py-14 lg:py-28">
	<PixelCluster cells={bleed} cell={50} origin="w" cycle={4} class="-left-[18px] top-[300px] hidden lg:block" />
	<PixelCluster cells={bottomRun} cell={30} origin="w" class="-bottom-[34px] left-[290px] hidden lg:block" />
	<Capsule from="r" drift={9} class="-right-[84px] top-[206px] hidden h-[46px] w-[210px] -rotate-[38deg] bg-brand-rose lg:block" />

	<div class="relative mx-auto flex w-full max-w-page flex-col gap-6 px-5 lg:gap-11 lg:px-10">
		<!-- Head -->
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16" use:reveal>
			<h2 class="max-w-[620px] font-display text-heading-sm font-extrabold text-brand-ink lg:text-heading">
				A template declares what it needs.
			</h2>
			<p class="font-sans text-base leading-6 text-brand-slate lg:w-[420px] lg:pb-2 lg:text-[17px] lg:leading-[26px]">
				Then anything that can supply those values produces a file. Same template, same contract,
				whoever is calling.
			</p>
		</div>

		<!--
			The contract: what you write, and what it declares. On scroll-in each
			token lights, and the row it declares lights with it — the section's
			claim demonstrated rather than asserted. One pass, then it rests.
		-->
		<div
			class="contract flex flex-col overflow-hidden rounded-card bg-brand-press lg:flex-row lg:rounded-pane"
			use:reveal
		>
			<div class="flex flex-1 flex-col gap-4 p-5 lg:p-7">
				<p class="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-press-text lg:text-xs">
					<span class="h-2 w-2 bg-brand-field" aria-hidden="true"></span>
					The template you write
				</p>
				<pre class="overflow-x-auto font-mono text-xs leading-[1.9] text-[#7D8494] lg:text-sm"><code>&lt;div class=<span class="text-[#9BE3B8]">"badge"</span>&gt;
  &lt;img src=<span class="tok font-medium text-brand-field" style="--td:700ms">&#123;&#123;photo&#125;&#125;</span>&gt;
  &lt;h1&gt;<span class="tok font-medium text-brand-field" style="--td:1120ms">&#123;&#123;name&#125;&#125;</span>&lt;/h1&gt;
  &lt;p&gt;<span class="tok font-medium text-brand-field" style="--td:1540ms">&#123;&#123;role&#125;&#125;</span>&lt;/p&gt;
&lt;/div&gt;</code></pre>
				<p class="flex gap-3 border-l-[3px] border-brand-field pl-3 font-sans text-sm leading-[21px] text-brand-press-text lg:max-w-[380px]">
					Plain HTML and CSS — flexbox, Google Fonts, anything you already know. No proprietary
					editor, no design file to keep in sync.
				</p>
			</div>

			<div class="flex flex-col gap-4 bg-[#1B1D20] p-5 lg:w-[440px] lg:flex-shrink-0 lg:p-7">
				<p class="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-press-text lg:text-xs">
					<span class="h-2 w-2 bg-brand-sky" aria-hidden="true"></span>
					The contract it declares
				</p>
				<dl class="flex flex-col">
					{#each [['photo', 'image', 'required'], ['name', 'text', 'required'], ['role', 'text', 'optional']] as [name, type, req], vi (name)}
						<div
							class="var-row flex items-center justify-between border-b border-white/10 py-2.5 lg:py-3"
							style="--td:{700 + vi * 420}ms"
						>
							<dt class="font-mono text-[13px] text-white lg:text-sm">{name}</dt>
							<dd class="flex items-center gap-2.5">
								<span class="font-mono text-xs text-brand-press-text lg:text-[13px]">{type}</span>
								<span class="rounded-[3px] bg-white/10 px-2 py-0.5 font-mono text-[11px] text-brand-press-text">
									{req}
								</span>
							</dd>
						</div>
					{/each}
				</dl>
				<p class="font-sans text-[13px] leading-[19px] text-brand-press-text">
					Typed and validated, so a bad row fails before it renders.
				</p>
			</div>
		</div>

		<!--
			The callers, in two uneven rows. Column ratios are the drawn widths, so
			the fr units resolve to 558/305/305 and 319/866 inside the 1200 column.
			Cards share a fixed 324px height per row; the art sits on white and is
			contained, not cropped, matching the tiles in the design.
		-->
		<ul class="grid list-none grid-cols-1 gap-3 lg:h-[324px] lg:grid-cols-[558fr_305fr_305fr] lg:gap-4">
			{#each rowA as f (f.n)}
				<li class="flex items-center gap-4 rounded-card p-[18px] lg:gap-[26px] lg:p-[26px] {f.bg} {f.wide ? 'lg:flex-row lg:items-stretch' : 'lg:flex-col-reverse lg:items-stretch'}">
					<div class="order-2 flex flex-col gap-1.5 lg:order-none lg:flex-1">
						<span class="font-mono text-[11px] uppercase tracking-[0.08em] lg:text-xs {f.label}">
							Filler {f.n}
						</span>
						<h3 class="text-balance font-display text-2xl font-bold tracking-[-0.03em] lg:text-[30px] {f.head}">
							{f.title}
						</h3>
						<p class="font-sans text-sm leading-5 lg:text-[15px] lg:leading-[22px] {f.text}">{f.body}</p>
						{#if f.code}
							<code class="mt-3 inline-flex self-start rounded-btn bg-white/15 px-3.5 py-2 font-mono text-[13px] text-white lg:mt-auto">
								{f.code}
							</code>
						{/if}
					</div>
					<img
						src="/landing/{f.img}"
						alt=""
						width="196"
						height="272"
						loading="lazy"
						class="order-1 h-24 w-24 flex-shrink-0 rounded-tile bg-white object-contain lg:order-none {f.wide
							? 'lg:h-full lg:w-[196px]'
							: 'lg:h-[148px] lg:w-full'}"
					/>
				</li>
			{/each}
		</ul>

		<ul class="grid list-none grid-cols-1 gap-3 lg:h-[324px] lg:grid-cols-[319fr_866fr] lg:gap-4">
			{#each rowB as f (f.n)}
				<li class="flex items-center gap-4 rounded-card p-[18px] lg:flex-col-reverse lg:items-stretch lg:gap-[26px] lg:p-[26px] {f.bg}">
					<div class="order-2 flex flex-col gap-1.5 lg:order-none lg:flex-1">
						<span class="font-mono text-[11px] uppercase tracking-[0.08em] lg:text-xs {f.label}">
							Filler {f.n}
						</span>
						<h3 class="text-balance font-display text-2xl font-bold tracking-[-0.03em] lg:text-[30px] {f.head}">
							{f.title}
						</h3>
						<p class="font-sans text-sm leading-5 lg:text-[15px] lg:leading-[22px] {f.text}">{f.body}</p>
					</div>
					<img
						src="/landing/{f.img}"
						alt=""
						width="253"
						height="148"
						loading="lazy"
						class="order-1 h-24 w-24 flex-shrink-0 rounded-tile bg-white object-contain lg:order-none lg:h-[148px] lg:w-full"
					/>
				</li>
			{/each}

			<!-- The odd one out: shares row B with Filler 04 rather than running full width. -->
			<li class="flex flex-col gap-4 rounded-card border-[3px] border-brand-ink bg-brand-field p-5 lg:flex-row lg:items-center lg:gap-8 lg:p-[26px]">
				<div class="flex flex-1 flex-col gap-2.5">
					<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-black/55 lg:text-xs">
						Filler 05 — the odd one
					</span>
					<h3 class="font-display text-[26px] font-bold tracking-[-0.03em] text-brand-ink lg:text-[32px]">
						An agent
					</h3>
					<p class="font-sans text-sm leading-5 text-black/[0.78] lg:text-[15px] lg:leading-[22px]">
						Every other caller fills a contract someone already wrote. An agent can write the template
						first, read back the variables, then render it — start to finish, unattended.
					</p>
					<a
						href="#integrations"
						class="mt-1 inline-flex self-start rounded-btn bg-brand-ink px-4 py-2.5 font-sans text-sm font-semibold text-white lg:px-[18px] lg:py-2.5 lg:text-[15px]"
					>
						How that works ↓
					</a>
				</div>
				<img
					src="/landing/filler-agent.jpg"
					alt=""
					width="224"
					height="196"
					loading="lazy"
					class="h-24 w-24 flex-shrink-0 rounded-tile bg-white object-contain lg:h-[196px] lg:w-[224px]"
				/>
			</li>
		</ul>
	</div>
</section>
