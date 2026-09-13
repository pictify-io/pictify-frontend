<script>
	import CtaStrip from './CtaStrip.svelte';
	import PixelCluster from './PixelCluster.svelte';
	import { reveal } from '$lib/actions/reveal.js';
	import Capsule from './Capsule.svelte';

	const routes = [
		{ n: '01', title: 'A timeline editor', body: 'Drag scenes, bind any layer to a variable.', accent: 'text-brand-sky', ring: '' },
		{ n: '02', title: 'Code', body: 'Scenes as data, kept in version control.', accent: 'text-brand-rose', ring: '' },
		{ n: '03', title: 'An agent writes it', body: 'Describe the film. It writes the template and declares the variables.', accent: 'text-brand-field', ring: 'ring-2 ring-brand-field ring-inset' }
	];

	/*
	 * The recap film, cut into three. Composed strictly from the row shown beside
	 * the player — {{name}} Priya, {{ships}} 1284, {{percentile}} 96 — so nothing
	 * on screen could have come from data the template didn't declare.
	 */
	const scenes = [
		{
			bg: 'bg-brand-blue',
			kicker: 'Your year at Northwind',
			kickerClass: 'text-white/65',
			head: 'Priya shipped 1,284 times.',
			headSize: 'text-[30px] lg:text-[58px]',
			headClass: 'text-white',
			sub: 'More than 96% of the team. Nice one.',
			subClass: 'text-white/70'
		},
		{
			bg: 'bg-brand-ink',
			kicker: 'Total ships',
			kickerClass: 'text-brand-field',
			head: '1,284',
			headSize: 'text-[64px] lg:text-[132px]',
			headClass: 'text-white',
			sub: 'Every one of them, across the year.',
			subClass: 'text-white/55'
		},
		{
			bg: 'bg-brand-field',
			kicker: 'Percentile',
			kickerClass: 'text-black/55',
			head: 'Top 4%.',
			headSize: 'text-[46px] lg:text-[88px]',
			headClass: 'text-brand-ink',
			sub: 'Nice one, Priya.',
			subClass: 'text-black/65'
		}
	];

	const bleed = [
		[2, 0, 'blue'], [1, 1, 'field'], [2, 1, 'blue'],
		[0, 2, 'sky'], [1, 2, 'blue'], [3, 2, 'pink'],
		[0, 3, 'blue'], [2, 3, 'field'], [1, 4, 'blue']
	];

	// Five-step run straddling the seam into Moments.
	const zigzag = [
		[0, 1, 'blue'], [1.5, 0, 'field'], [3, 1, 'blue'],
		[4.5, 0, 'sky'], [6, 1, 'blue']
	];
</script>

<section class="relative w-full overflow-hidden bg-brand-press-deep py-14 lg:py-28">
	<PixelCluster cells={bleed} cell={42} origin="w" cycle={4} class="-left-[22px] top-[180px] hidden lg:block" />
	<PixelCluster cells={zigzag} cell={34} origin="e" class="-bottom-[18px] right-[196px] hidden lg:block" />
	<Capsule from="r" drift={9} class="-right-[70px] top-[78px] hidden h-[46px] w-[206px] rotate-[32deg] bg-brand-field lg:block" />

	<div class="relative mx-auto flex w-full max-w-page flex-col gap-6 px-5 lg:gap-11 lg:px-10">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16" use:reveal>
			<h2 class="max-w-[620px] font-display text-heading-sm font-extrabold text-white lg:text-heading">
				Same variables. Now it moves.
			</h2>
			<p class="font-sans text-base leading-6 text-brand-press-text lg:w-[420px] lg:pb-2 lg:text-[17px] lg:leading-[26px]">
				A video template declares variables exactly like an image one, and the same five callers fill
				them. An MP4 comes back instead of a PNG.
			</p>
		</div>

		<!-- Player + the row that filled it -->
		<div class="flex flex-col overflow-hidden rounded-card bg-brand-press lg:flex-row lg:rounded-pane">
			<div class="flex flex-col p-4 lg:flex-[2] lg:p-6">
				<!--
					Three scenes cutting on the same 15s clock as the playhead, each with
					its own ground so the change reads as an edit rather than a crossfade.
					Every value comes from the three variables declared in the panel beside
					it — a scene carrying data that row doesn't hold would contradict the
					section's own claim.
				-->
				<div class="relative h-[190px] overflow-hidden rounded-tile lg:h-[312px]">
					{#each scenes as sc, si (si)}
						<div
							class="scene absolute inset-0 flex flex-col justify-between p-[18px] lg:p-8 {sc.bg}"
							style="--sd:{si * 5}s"
						>
							<p class="font-mono text-[10px] uppercase tracking-[0.14em] lg:text-xs {sc.kickerClass}">
								{sc.kicker}
							</p>
							<div class="flex flex-col gap-1.5 lg:gap-2.5">
								<p
									class="font-display font-extrabold leading-[0.94] tracking-[-0.03em] lg:leading-[0.9] {sc.headClass} {sc.headSize}"
								>
									{sc.head}
								</p>
								<p class="font-sans text-[13px] lg:text-[17px] {sc.subClass}">{sc.sub}</p>
							</div>
						</div>
					{/each}
				</div>
				<div class="flex items-center gap-3 pt-3.5 lg:gap-3.5 lg:pt-[18px]">
					<span class="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-brand-field lg:h-[34px] lg:w-[34px]">
						<svg width="11" height="13" viewBox="0 0 12 14" fill="none" aria-hidden="true">
							<path d="M0 0 L12 7 L0 14 Z" fill="#000" />
						</svg>
					</span>
					<span class="flex h-1 flex-1 overflow-hidden rounded-full bg-white/15 lg:h-[5px]">
						<span class="playhead h-full w-full origin-left rounded-full bg-brand-field"></span>
					</span>
					<!--
						A section headed "Now it moves" cannot show a frozen player. The bar
						and the timecode run off the same 15s loop, both in CSS — the strip
						of seconds below steps up one line per second inside a clipped box.
					-->
					<span
						class="flex flex-shrink-0 items-center gap-1 font-mono text-[11px] text-brand-press-text lg:text-xs"
					>
						<span class="timecode inline-flex h-[1.35em] overflow-hidden" aria-hidden="true">
							<span class="ticker flex flex-col">
								{#each Array.from({ length: 16 }, (_, i) => i) as s (s)}
									<span class="h-[1.35em] leading-[1.35em]">0:{String(s).padStart(2, '0')}</span>
								{/each}
							</span>
						</span>
						<span>/ 0:15</span>
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-3 bg-[#1B1D20] p-4 lg:w-[380px] lg:flex-shrink-0 lg:gap-5 lg:p-6">
				<p class="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-brand-press-text lg:text-xs">
					<span class="h-2 w-2 bg-brand-sky" aria-hidden="true"></span>
					The row that filled it
				</p>
				<dl class="flex flex-col">
					{#each [['{{name}}', 'Priya'], ['{{ships}}', '1284'], ['{{percentile}}', '96']] as [k, v] (k)}
						<div class="flex items-center justify-between border-b border-white/10 py-2 lg:py-3">
							<dt class="font-mono text-xs text-brand-field lg:text-[13px]">{k}</dt>
							<dd class="font-mono text-xs text-white lg:text-[13px]">{v}</dd>
						</div>
					{/each}
				</dl>
				<p class="flex items-center gap-2 font-mono text-[11px] text-brand-proof lg:text-xs">
					<span class="h-2 w-2 rounded-full bg-brand-proof" aria-hidden="true"></span>
					rendered 11.4s · 1080p · 15s
				</p>
				<p class="font-sans text-[13px] leading-[19px] text-brand-press-text">
					No timeline was opened to make this one.
				</p>
			</div>
		</div>

		<!-- Authoring routes -->
		<div class="flex flex-col gap-3 lg:gap-4">
			<h3 class="max-w-[560px] font-display text-2xl font-bold leading-[1.08] tracking-[-0.03em] text-white lg:text-subtitle">
				Three ways to author it. One way to render it.
			</h3>
			<ul class="grid list-none grid-cols-1 gap-2.5 lg:grid-cols-3 lg:gap-4">
				{#each routes as r (r.n)}
					<li class="flex flex-col gap-1.5 rounded-card bg-brand-press p-4 lg:gap-2.5 lg:p-6 {r.ring}">
						<span class="font-mono text-[11px] uppercase tracking-[0.08em] lg:text-xs {r.accent}">
							Route {r.n}
						</span>
						<h4 class="font-display text-lg font-bold tracking-[-0.02em] text-white lg:text-2xl lg:tracking-[-0.03em]">
							{r.title}
						</h4>
						<p class="font-sans text-sm leading-5 text-brand-press-text lg:text-[15px] lg:leading-[22px]">
							{r.body}
						</p>
					</li>
				{/each}
			</ul>
		</div>

		<CtaStrip
			variant="field"
			text="If it can do the film, the PNG is not the hard part."
			action="Try a video render"
			link="Video docs"
			actionHref="/signup"
			linkHref="/docs/video"
		/>
	</div>
</section>

<style>
	/*
	 * `scale` on an origin-left bar rather than animating `width`: the same read,
	 * but it stays on the compositor instead of relaying out on every frame.
	 */
	.playhead {
		scale: 0 1;
		animation: playhead 15s linear infinite;
	}

	@keyframes playhead {
		from {
			scale: 0 1;
		}
		to {
			scale: 1 1;
		}
	}

	/*
	 * Each scene holds a third of the 15s loop. The staggered start is a positive
	 * delay smaller than the period, so after the first pass every scene's cycle
	 * stays locked to the playhead's rather than drifting against it. `backwards`
	 * keeps scenes 2 and 3 hidden before their first entrance.
	 */
	.scene {
		animation: scene 15s ease-out var(--sd) infinite backwards;
	}

	@keyframes scene {
		0% {
			opacity: 0;
			translate: 0 16px;
		}
		3% {
			opacity: 1;
			translate: 0 0;
		}
		30% {
			opacity: 1;
			translate: 0 0;
		}
		33.34%,
		100% {
			opacity: 0;
			translate: 0 -12px;
		}
	}

	/* One hard step per second, matching how a real timecode reads. */
	.ticker {
		animation: ticker 15s steps(15, end) infinite;
	}

	@keyframes ticker {
		from {
			translate: 0 0;
		}
		to {
			translate: 0 -20.25em;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.playhead {
			animation: none;
			scale: 0.38 1;
		}
		.ticker {
			animation: none;
			translate: 0 -8.1em;
		}
		/* Hold on the opening scene rather than cutting. */
		.scene {
			animation: none;
			opacity: 0;
			translate: none;
		}
		.scene:first-child {
			opacity: 1;
		}
	}
</style>
