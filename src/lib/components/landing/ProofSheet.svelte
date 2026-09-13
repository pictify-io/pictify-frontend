<script>
	import RenderTile from './RenderTile.svelte';
	import { reveal } from '$lib/actions/reveal.js';
	import CtaStrip from './CtaStrip.svelte';
	import PixelCluster from './PixelCluster.svelte';
	import Capsule from './Capsule.svelte';

	// The proof wall. Two staggered rows running past both page edges — the
	// bleed is what says "this continues" without a number having to.
	const rowA = [
		{ label: 'OG image', title: 'How we cut render time 4×', row: 'row 001', format: 'PNG',
			bg: 'bg-[#1B1F3B]', labelClass: 'text-brand-field', titleClass: 'text-white' },
		{ label: 'Certificate', title: 'Tom Okafor', sub: 'Cloud Architecture', row: 'row 002', format: 'PDF',
			bg: 'bg-white ring-2 ring-brand-rule ring-inset', align: 'items-center justify-center text-center',
			labelClass: 'text-brand-mute', titleClass: 'text-brand-ink', subClass: 'text-brand-mute',
			rule: 'bg-brand-blue' },
		{ label: 'Price card', title: '£1,190', sub: 'Aeron Chair · in stock', row: 'row 003', format: 'JPG',
			bg: 'bg-[#F0EBDF]', labelClass: 'text-brand-mute', titleClass: 'text-brand-ink',
			titleSize: 'text-[22px] lg:text-[26px]', subClass: 'text-brand-mute' },
		{ label: 'Speaker badge', title: 'Rafael Nunes', sub: 'Hall B · 14:30', row: 'row 004', format: 'PNG',
			bg: 'bg-brand-proof', align: 'items-center justify-center text-center',
			labelClass: 'text-black/55', titleClass: 'text-brand-ink', subClass: 'text-black/65',
			rule: 'bg-brand-ink' },
		{ label: 'Recap film', title: 'Priya Raman', row: 'row 005', format: 'MP4',
			bg: 'bg-brand-field', align: 'items-center justify-center text-center',
			labelClass: 'text-black/55', titleClass: 'text-brand-ink' },
		{ label: 'Social card', title: 'Ship faster →', row: 'row 006', format: 'PNG',
			bg: 'bg-[#3B2FD9]', labelClass: 'text-white/65', titleClass: 'text-white',
			titleSize: 'text-[18px] lg:text-[21px]' },
		{ label: 'Invoice 0412', title: '£1,248', sub: 'Paid · 4 Aug', row: 'row 007', format: 'PDF',
			bg: 'bg-white ring-2 ring-brand-rule ring-inset', labelClass: 'text-brand-mute',
			titleClass: 'text-brand-ink', titleSize: 'text-[22px] lg:text-[26px]', subClass: 'text-brand-mute' }
	];

	const rowB = [
		{ label: 'Ticket', title: 'GA · 04B', row: 'row 008', format: 'PDF',
			bg: 'bg-[#FF4D6D]', labelClass: 'text-black/55', titleClass: 'text-brand-ink',
			titleSize: 'text-[20px] lg:text-[22px]' },
		{ label: 'Weekly report', title: '+18.4%', row: 'row 009', format: 'PDF',
			bg: 'bg-[#F4F6F4]', labelClass: 'text-brand-mute', titleClass: 'text-brand-ink',
			titleSize: 'text-[20px] lg:text-[22px]' },
		{ label: 'Milestone', title: '300 days', row: 'row 010', format: 'PNG',
			bg: 'bg-brand-powder', labelClass: 'text-black/55', titleClass: 'text-brand-ink',
			titleSize: 'text-[20px] lg:text-[22px]' },
		{ label: 'Listing', title: '2 bed · SE15', row: 'row 011', format: 'JPG',
			bg: 'bg-brand-sky', labelClass: 'text-black/55', titleClass: 'text-brand-ink',
			titleSize: 'text-[20px] lg:text-[22px]' },
		{ label: 'Receipt', title: '£29.00', row: 'row 012', format: 'PDF',
			bg: 'bg-black', labelClass: 'text-brand-field', titleClass: 'text-white',
			titleSize: 'text-[20px] lg:text-[22px]' },
		{ label: 'Profile card', title: 'Mei-Ling C.', row: 'row 013', format: 'PNG',
			bg: 'bg-brand-rose', labelClass: 'text-black/55', titleClass: 'text-brand-ink',
			titleSize: 'text-[20px] lg:text-[22px]' },
		// `done` draws its own animated dashed outline, so no static ring here.
		{ label: 'Still printing', title: '+4,987', row: 'rows 014–5000', format: '✓', done: true,
			bg: '', labelClass: 'text-brand-mute',
			titleClass: 'text-brand-mute', titleSize: 'text-[20px] lg:text-[22px]' }
	];

	const bleed = [
		[2, 0, 'blue'], [1, 1, 'field'], [2, 1, 'ink'],
		[0, 2, 'pink'], [1, 2, 'blue'], [3, 2, 'sky'],
		[0, 3, 'blue'], [2, 3, 'blue'], [1, 4, 'ink']
	];
</script>

<section class="relative w-full overflow-hidden bg-brand-paper py-14 lg:py-28">
	<PixelCluster cells={bleed} cell={20} origin="w" cycle={4} class="-left-5 top-16 lg:hidden" />
	<PixelCluster cells={bleed} cell={35} origin="w" cycle={4} class="-left-[22px] top-[104px] hidden lg:block" />
	<Capsule from="r" drift={12} class="-right-[70px] top-[52px] hidden h-11 w-[196px] rotate-[34deg] bg-brand-powder lg:block" />

	<div class="relative flex flex-col gap-7 lg:gap-12">
		<!-- Head -->
		<div class="mx-auto flex w-full max-w-page flex-col gap-3.5 px-5 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:px-10" use:reveal>
			<h2 class="max-w-[660px] font-display text-heading-sm font-extrabold text-brand-ink lg:text-heading">
				Five thousand rows went in on Tuesday.
			</h2>
			<div class="flex flex-col gap-3 lg:w-[380px] lg:pb-2">
				<p class="font-sans text-base leading-6 text-brand-slate lg:text-[17px] lg:leading-[26px]">
					Nobody opened a design tool. Here's a slice of what came out.
				</p>
				<p class="flex items-center gap-2.5 font-mono text-xs text-[#6B6B68] lg:text-[13px]">
					<span class="h-2 w-2 rounded-full bg-brand-proof" aria-hidden="true"></span>
					5,000 rendered · 4m 12s · 0 failed
				</p>
			</div>
		</div>

		<!-- Wall: rows bleed past both page edges. -->
		<div class="flex flex-col gap-5 lg:gap-6">
			<!--
				Rows are sized off the viewport, not a fixed 1600px — hard widths stopped
				bleeding past the right edge above ~1700 and left a dead white margin.
				max() keeps the drawn width on narrower screens; the two offsets are what
				stagger the rows against each other.
			-->
			<!-- Floor = the drawn width (7 tiles × 212 + 6 gaps), so ≤1440 is untouched. -->
			<ul class="relative left-5 flex w-[1500px] list-none items-start gap-3 lg:-left-16 lg:w-[max(1580px,calc(100%+140px))] lg:gap-4">
				{#each rowA as tile, i (tile.row)}
					<li
						class="w-[168px] min-w-0 flex-shrink-0 lg:w-auto lg:flex-1"
						use:reveal={{ delay: i * 55 }}
					>
						<RenderTile {tile} size="tall" />
					</li>
				{/each}
			</ul>
			<ul class="relative -left-10 flex w-[1500px] list-none items-start gap-3 lg:-left-10 lg:w-[max(1580px,calc(100%+140px))] lg:gap-4">
				{#each rowB as tile, i (tile.row)}
					<li
						class="w-[168px] min-w-0 flex-shrink-0 lg:w-auto lg:flex-1"
						use:reveal={{ delay: 180 + i * 55 }}
					>
						<RenderTile {tile} size="short" />
					</li>
				{/each}
			</ul>
		</div>

		<div class="mx-auto w-full max-w-page px-5 lg:px-10">
			<CtaStrip
				variant="dark"
				text="One template and a spreadsheet did all of that."
				action="Render your first file"
				link="Read the docs"
			/>
		</div>
	</div>
</section>
