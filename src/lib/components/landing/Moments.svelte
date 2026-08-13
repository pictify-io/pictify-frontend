<script>
	import CtaStrip from './CtaStrip.svelte';
	import PixelCluster from './PixelCluster.svelte';
	import Capsule from './Capsule.svelte';
	import { reveal } from '$lib/actions/reveal.js';

	// Four moments, four demand shapes. No containers — the rows are separated
	// by hairlines and the scenes bleed past the page edge, alternating sides.
	// Each scene was generated with a deliberately blank surface — a held card,
	// empty shelf panels, a sheet in an envelope, a page leaving a machine. The
	// real render is composited on top in actual tokens and type. Overlay
	// positions are percentages so they hold at both breakpoints.
	const moments = [
		{
			n: '01', kicker: 'One per user', numColor: 'text-brand-powder', img: 'moment-user.jpg',
			title: 'When a user does something worth showing them',
			body: 'Wrapped-style recaps, milestone cards, streaks, certificates. Every product with users gets asked for this, usually by a founder in December.',
			icp: 'consumer apps · fitness · learning · fintech · communities · games',
			overlay: {
				pos: 'left-[34.3%] top-[21.5%] w-[32%] h-[35.5%]', bg: 'bg-brand-blue', rot: '-rotate-2',
				align: 'items-center justify-center text-center',
				label: '2026 in review', labelClass: 'text-white/65',
				value: '1,284', valueClass: 'text-white', valueSize: 'text-[22px] lg:text-[40px]',
				sub: 'Priya · top 4%', subClass: 'text-white/80'
			}
		},
		{
			n: '02', kicker: 'One per item', numColor: 'text-brand-sky', img: 'moment-item.jpg',
			title: 'When a catalogue needs a picture',
			body: 'An OG image for every listing, product, property and profile — regenerated when the data changes, not when someone remembers.',
			icp: 'marketplaces · e-commerce · real estate · job boards · travel · publishers',
			overlay: {
				pos: 'left-[66%] top-[35%] w-[15%] h-[18%]', bg: 'bg-brand-field', rot: '-rotate-[9deg]',
				align: 'justify-end',
				value: '£1,190', valueClass: 'text-brand-ink', valueSize: 'text-[11px] lg:text-[15px]'
			}
		},
		{
			n: '03', kicker: 'One per period', numColor: 'text-brand-rose', img: 'moment-period.jpg',
			title: 'When numbers need to become a document',
			body: "Statements, invoices, weekly digests, board reports. The output isn't a dashboard — it's a thing someone forwards, files or prints.",
			icp: 'fintech · analytics · billing · agencies · ops teams',
			overlay: {
				pos: 'left-[41.7%] top-[28.5%] w-[25%] h-[40.5%]', bg: 'bg-white ring-2 ring-brand-ink ring-inset',
				align: 'justify-start gap-1',
				label: 'October statement', labelClass: 'text-brand-mute',
				value: '£4,182', valueClass: 'text-brand-ink', valueSize: 'text-[15px] lg:text-[26px]',
				rule: 'bg-brand-blue'
			}
		},
		{
			n: '04', kicker: 'One per event', numColor: 'text-brand-field', img: 'moment-event.jpg',
			title: 'When a machine has to hand a human a file',
			body: 'Agents and pipelines that have to emit something real — a PDF, an image, a deck — not another block of text.',
			icp: 'AI products · automation builders · internal tooling',
			overlay: {
				pos: 'left-[42.5%] top-[57%] w-[16%] h-[23%]', bg: 'bg-white', rot: '-rotate-2',
				align: 'justify-between',
				label: 'Q3 summary', labelClass: 'text-brand-mute',
				value: '+18.4%', valueClass: 'text-brand-ink', valueSize: 'text-[11px] lg:text-[16px]',
				bars: true
			}
		}
	];

	const bleed = [
		[2, 0, 'powder'], [1, 1, 'blue'], [2, 1, 'ink'],
		[0, 2, 'sky'], [1, 2, 'blue'], [3, 2, 'pink'],
		[0, 3, 'blue'], [2, 3, 'field'], [1, 4, 'blue'], [0, 5, 'pink']
	];

	// Five-step run straddling the seam into Integrations.
	const zigzag = [
		[0, 1, 'blue'], [1.5, 0, 'powder'], [3, 1, 'ink'],
		[4.5, 0, 'blue'], [6, 1, 'pink']
	];

	$: isEven = (i) => i % 2 === 1;
</script>

<section class="relative w-full overflow-hidden bg-brand-paper py-14 lg:py-28">
	<PixelCluster cells={bleed} cell={35} origin="w" cycle={4} class="-left-5 top-24 hidden lg:block" />
	<PixelCluster cells={zigzag} cell={34} origin="w" class="-bottom-[24px] left-[410px] hidden lg:block" />
	<Capsule from="r" drift={12} class="-right-[78px] top-28 hidden h-12 w-[214px] rotate-[36deg] bg-brand-powder lg:block" />

	<div class="relative flex flex-col gap-10 lg:gap-[72px]">
		<div class="mx-auto flex w-full max-w-page flex-col gap-3 px-5 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:px-10" use:reveal>
			<h2 class="max-w-[700px] font-display text-heading-sm font-extrabold text-brand-ink lg:text-heading">
				Every product eventually has to hand someone a file.
			</h2>
			<p class="font-sans text-base leading-6 text-brand-slate lg:w-[400px] lg:pb-2 lg:text-[17px] lg:leading-[26px]">
				The file arrives as four different problems, depending on what triggers it. All four are the
				same render.
			</p>
		</div>

		{#each moments as m, i (m.n)}
			<article
				class="flex flex-col gap-4 border-b border-brand-rule pb-10 last:border-0 last:pb-0 lg:gap-14 lg:pb-[72px] {isEven(i)
					? 'items-end lg:flex-row-reverse'
					: 'lg:flex-row'} lg:items-center"
				use:reveal
			>
				<!-- Scales at 2xl only: 1440 sits inside xl, and the design is drawn at 1440. -->
				<div class="relative h-[200px] w-[300px] flex-shrink-0 lg:h-[400px] lg:w-[600px] 2xl:h-[480px] 2xl:w-[720px]">
					<img
						src="/landing/{m.img}"
						alt=""
						width="600"
						height="400"
						loading="lazy"
						class="h-full w-full object-cover"
					/>
					<!--
						The scene arrives first, then the render lands on the blank surface it
						was drawn to hold. Same beat as the product: surface, then fill.
					-->
					<div
						class="absolute flex flex-col p-1.5 lg:p-3 {m.overlay.pos} {m.overlay.bg} {m.overlay.rot ??
							''} {m.overlay.align}"
						aria-hidden="true"
						data-drop
					>
						{#if m.overlay.label}
							<p class="font-mono text-[6px] uppercase tracking-[0.08em] lg:text-[9px] {m.overlay.labelClass}">
								{m.overlay.label}
							</p>
						{/if}
						{#if m.overlay.rule}
							<span class="h-[2px] w-6 lg:w-10 {m.overlay.rule}"></span>
						{/if}
						<p
							class="font-display font-extrabold leading-[0.9] tracking-[-0.03em] {m.overlay.valueSize} {m.overlay.valueClass}"
						>
							{m.overlay.value}
						</p>
						{#if m.overlay.sub}
							<p class="font-sans text-[6px] lg:text-[10px] {m.overlay.subClass}">{m.overlay.sub}</p>
						{/if}
						{#if m.overlay.bars}
							<span class="flex h-2 items-end gap-[2px] lg:h-4 lg:gap-1">
								{#each [40, 68, 52, 100] as h}
									<span class="w-1 bg-brand-blue lg:w-1.5" style="height:{h}%"></span>
								{/each}
							</span>
						{/if}
					</div>
				</div>
				<!--
					The art bleeds off the outer edge, but the text must stay on the page
					grid: its outer margin is the gutter outside the 1200px column, so the
					copy lines up with the section heading at any width instead of drifting
					to the viewport edge on large screens.
				-->
				<div
					class="flex w-full flex-col gap-2.5 px-5 lg:min-w-0 lg:flex-1 lg:gap-3.5 lg:px-0 {isEven(i)
						? 'lg:ml-[max(40px,calc((100%-1200px)/2))]'
						: 'lg:mr-[max(40px,calc((100%-1200px)/2))]'}"
				>
					<p class="flex items-baseline gap-3 lg:gap-4">
						<span class="font-display text-heading-sm font-extrabold leading-[0.8] tracking-[-0.04em] lg:text-heading {m.numColor}">
							{m.n}
						</span>
						<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6B6B68] lg:text-xs">
							{m.kicker}
						</span>
					</p>
					<h3 class="font-display text-card font-bold text-brand-ink lg:text-title">{m.title}</h3>
					<p class="font-sans text-[15px] leading-[22px] text-brand-slate lg:max-w-[420px] lg:text-[17px] lg:leading-[26px]">
						{m.body}
					</p>
					<p class="font-mono text-[11px] leading-[17px] text-brand-mute lg:max-w-[400px] lg:text-xs lg:leading-[19px]">
						{m.icp}
					</p>
				</div>
			</article>
		{/each}

		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<CtaStrip
				variant="blue"
				text="Four problems. One integration."
				action="Start rendering"
				link="See the templates"
				linkHref="/templates"
			/>
		</div>
	</div>
</section>
