<script>
	import PixelCluster from './PixelCluster.svelte';
	import Capsule from './Capsule.svelte';

	// Bookends the hero: the page opens and closes on the same field.
	const nw = [
		[0, 0, 'ink'], [1, 0, 'blue'], [3, 0, 'pink'],
		[0, 1, 'blue'], [2, 1, 'ink'], [3, 1, 'sky'],
		[1, 2, 'blue'],
		[0, 3, 'sky'], [2, 3, 'pink'],
		[1, 4, 'blue']
	];
	const se = [
		[1, 0, 'blue'], [3, 0, 'sky'],
		[0, 1, 'pink'], [2, 1, 'ink'], [3, 1, 'blue'],
		[1, 2, 'ink'], [2, 2, 'blue']
	];
</script>

<section class="relative w-full overflow-hidden bg-brand-field px-5 py-[72px] lg:px-10 lg:py-[132px]">
	<PixelCluster cells={nw} cell={26} origin="nw" cycle={4} class="-left-6 -top-4 lg:hidden" />
	<PixelCluster cells={nw} cell={45} origin="nw" cycle={4} class="-left-[30px] -top-[24px] hidden lg:block" />
	<PixelCluster cells={se} cell={50} origin="se" class="hidden lg:-bottom-[38px] lg:right-[60px] lg:block" />
	<Capsule from="r" drift={14} class="-right-[76px] top-[104px] hidden h-[52px] w-[230px] -rotate-[32deg] bg-brand-blue lg:block" />
	<Capsule from="r" drift={14} class="-right-14 bottom-6 h-[38px] w-[150px] -rotate-[30deg] bg-brand-blue lg:hidden" />

	<div class="relative mx-auto flex max-w-page flex-col items-center gap-5 lg:gap-[34px]">
		<h2
			class="max-w-[330px] text-balance text-center font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.04em] text-brand-ink lg:max-w-[900px] lg:text-display"
		>
			Your data already exists. The files don't.
		</h2>
		<p
			class="max-w-[300px] text-center font-sans text-base leading-6 text-black/70 lg:max-w-[520px] lg:text-lg lg:leading-[27px]"
		>
			Write one template, point something at it, and stop making files by hand.
		</p>
		<div class="flex w-[280px] flex-col gap-2.5 pt-1 lg:w-auto lg:flex-row lg:gap-3.5">
			<a
				href="/signup"
				class="flex items-center justify-center rounded-btn bg-brand-ink px-4 py-4 font-sans text-[17px] font-bold text-white transition-opacity hover:opacity-90 lg:px-[34px] lg:py-[18px] lg:text-lg"
			>
				Start rendering
			</a>
			<a
				href="/docs"
				class="flex items-center justify-center rounded-btn bg-white px-4 py-4 font-sans text-[17px] font-bold text-brand-ink transition-opacity hover:opacity-90 lg:px-[34px] lg:py-[18px] lg:text-lg"
			>
				Read the docs
			</a>
		</div>
		<ul class="flex items-center gap-2.5 font-mono text-xs text-black/60 lg:text-[13px]">
			<li>Free tier</li>
			<li aria-hidden="true" class="h-1 w-1 rounded-full bg-black/30"></li>
			<li>No credit card</li>
		</ul>
	</div>
</section>
