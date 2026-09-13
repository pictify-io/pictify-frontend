<script>
	import PixelCluster from './PixelCluster.svelte';
	import Capsule from './Capsule.svelte';
	import DitherField from '$lib/components/DitherField.svelte';

	// Pixels resolving left→right from scattered to solid: the page's signature
	// motif, and literally what the product does.
	const resolve = [
		[1, 3, 'blue'], [2, 1, 'blue'], [2, 5, 'pink'],
		[3, 0, 'blue'], [3, 3, 'blue'], [3, 6, 'sky'],
		[4, 1, 'blue'], [4, 2, 'pink'], [4, 4, 'blue'], [4, 7, 'blue'],
		[5, 0, 'blue'], [5, 2, 'sky'], [5, 3, 'blue'], [5, 5, 'blue'], [5, 6, 'pink'],
		[6, 1, 'blue'], [6, 2, 'blue'], [6, 3, 'blue'], [6, 4, 'sky'], [6, 6, 'blue'], [6, 7, 'blue'],
		[7, 0, 'blue'], [7, 1, 'ink'], [7, 2, 'blue'], [7, 3, 'pink'], [7, 4, 'blue'], [7, 5, 'ink'], [7, 7, 'blue'],
		[8, 0, 'ink'], [8, 1, 'blue'], [8, 2, 'ink'], [8, 3, 'ink'], [8, 4, 'sky'], [8, 5, 'ink'], [8, 6, 'blue'], [8, 7, 'ink'],
		[9, 0, 'ink'], [9, 1, 'ink'], [9, 2, 'ink'], [9, 3, 'blue'], [9, 4, 'ink'], [9, 5, 'ink'], [9, 6, 'ink'], [9, 7, 'ink']
	];

	const cornerBleed = [
		[0, 0, 'ink'], [1, 0, 'blue'], [3, 0, 'pink'],
		[0, 1, 'blue'], [2, 1, 'ink'], [4, 1, 'sky'],
		[0, 2, 'ink'], [2, 2, 'blue'],
		[1, 3, 'blue'], [3, 3, 'pink']
	];

	const bottomBleed = [
		[0, 1, 'blue'], [1, 0, 'pink'], [2, 1, 'blue'], [2, 2, 'ink'],
		[3, 0, 'blue'], [4, 1, 'sky'], [4, 2, 'blue'], [5, 0, 'blue'], [6, 1, 'ink']
	];

	// A dotted run trailing off the lower right — the last pixels still landing.
	const baselineRun = [
		[0, 0, 'blue'], [2, 0, 'ink'], [3, 1, 'blue'], [5, 0, 'blue'],
		[6, 1, 'sky'], [8, 0, 'blue'], [9, 1, 'pink'], [11, 0, 'blue']
	];

	// Large dithered blob, cut by the bottom-left corner.
	const blob = [
		[3, 0, 'blue'], [4, 0, 'blue'], [5, 0, 'pink'],
		[2, 1, 'blue'], [3, 1, 'ink'], [4, 1, 'blue'], [5, 1, 'blue'], [6, 1, 'sky'], [8, 1, 'blue'],
		[1, 2, 'blue'], [2, 2, 'blue'], [3, 2, 'blue'], [4, 2, 'ink'], [5, 2, 'blue'], [6, 2, 'pink'], [7, 2, 'blue'],
		[0, 3, 'blue'], [1, 3, 'blue'], [2, 3, 'ink'], [3, 3, 'blue'], [4, 3, 'sky'], [5, 3, 'ink'], [6, 3, 'blue'], [7, 3, 'blue'], [8, 3, 'blue'],
		[0, 4, 'blue'], [1, 4, 'ink'], [2, 4, 'blue'], [3, 4, 'pink'], [4, 4, 'blue'], [5, 4, 'blue'], [6, 4, 'ink'], [7, 4, 'blue'],
		[1, 5, 'blue'], [2, 5, 'blue'], [3, 5, 'ink'], [4, 5, 'blue'], [5, 5, 'sky'], [6, 5, 'blue'],
		[2, 6, 'blue'], [3, 6, 'blue'], [4, 6, 'blue'], [5, 6, 'pink']
	];
</script>

<section class="relative w-full overflow-hidden bg-brand-field">
	<!--
		A faint dither breathing across the whole field: the ground itself is
		freshly printed. Near-invisible by design — at 6% ink it has to be looked
		for, so it can sit under everything without competing with the clusters.
	-->
	<DitherField
		colorFront="rgba(0, 0, 0, 0.06)"
		shape="simplex"
		type="4x4"
		pxSize={6}
		speed={0.12}
		class="absolute inset-0"
	/>
	<!-- Decoration. Every shape is cut by a section edge, and resolves inward from it. -->
	<!--
		These fire on load rather than on scroll, so each carries a head start —
		the page paints first, then the decoration resolves into it. Staggered
		across the group so the hero assembles rather than arriving all at once.
	-->
	<PixelCluster cells={cornerBleed} cell={22} origin="nw" delay={260} class="-left-6 -top-4 lg:hidden" />
	<PixelCluster cells={cornerBleed} cell={30} origin="nw" delay={260} class="-left-[30px] -top-[26px] hidden lg:block" />
	<Capsule from="l" drift={12} class="-left-14 top-[104px] hidden h-[54px] w-[244px] rotate-[34deg] bg-brand-powder lg:block" />
	<Capsule from="l" drift={14} class="-left-[74px] top-[142px] hidden h-[50px] w-[232px] -rotate-[27deg] bg-brand-blue lg:block" />
	<!-- The signature cluster: scattered on the left, solid on the right, so it resolves with the read. -->
	<PixelCluster cells={resolve} cell={18} origin="w" delay={420} cycle={4} class="-right-20 top-12 lg:hidden" />
	<PixelCluster cells={resolve} cell={34} origin="w" delay={420} cycle={3} class="right-4 top-[58px] hidden lg:block" />
	<!-- Anchored to centre/right rather than a 1440-only left offset, so they hold position on wide screens. -->
	<PixelCluster cells={bottomBleed} cell={25} origin="sw" delay={620} class="-bottom-6 left-[calc(50%-160px)] hidden lg:block" />
	<PixelCluster cells={baselineRun} cell={25} origin="w" delay={700} class="bottom-[64px] right-[122px] hidden lg:block" />
	<PixelCluster cells={blob} cell={40} origin="sw" delay={520} class="-bottom-[132px] -left-[152px] hidden lg:block" />
	<Capsule from="r" drift={13} class="-right-[72px] top-[452px] hidden h-[52px] w-[240px] rotate-[28deg] bg-brand-sky lg:block" />
	<Capsule from="r" drift={10} class="-bottom-8 left-[220px] h-9 w-[150px] -rotate-[26deg] bg-brand-powder lg:hidden" />

	<div class="relative mx-auto w-full max-w-page px-5 pb-14 pt-11 lg:px-10 lg:pb-[196px] lg:pt-24">
		<div class="lg:mx-auto lg:w-[880px]">
			<h1
				class="max-w-[350px] text-balance font-display text-display-sm font-extrabold text-brand-ink lg:max-w-none lg:text-display-lg"
			>
				Templated media for developers.
			</h1>

			<p
				class="mt-5 max-w-[320px] font-sans text-base leading-6 text-brand-ink/80 lg:mt-6 lg:max-w-[430px]"
			>
				Write one HTML template and let anything fill it — your code, a spreadsheet, a webhook, an
				agent. Out comes PNG, JPG, PDF, GIF or MP4.
			</p>

			<div class="mt-5 flex items-center gap-2.5 lg:mt-6">
				<a
					href="/signup"
					class="flex items-center rounded-btn bg-brand-plum px-5 py-3.5 font-sans text-[15px] font-semibold text-white transition-opacity hover:opacity-90 lg:px-5 lg:py-3"
				>
					Start rendering
				</a>
				<a
					href="/docs"
					class="flex items-center rounded-btn bg-white px-5 py-3.5 font-sans text-[15px] font-semibold text-brand-ink transition-opacity hover:opacity-90 lg:px-5 lg:py-3"
				>
					Read the docs
				</a>
			</div>

			<ul class="mt-5 flex items-center gap-2.5 font-mono text-xs text-black/60 lg:mt-6 lg:text-[13px]">
				<li>Free tier</li>
				<li aria-hidden="true" class="h-1 w-1 rounded-full bg-black/30"></li>
				<li>No credit card</li>
				<li aria-hidden="true" class="hidden h-1 w-1 rounded-full bg-black/30 lg:block"></li>
				<li class="hidden lg:block">Cancel whenever</li>
			</ul>
		</div>
	</div>
</section>
