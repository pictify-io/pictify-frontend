<script>
	/**
	 * Templates shown as what they print, not what they're called. Real
	 * templates use their rendered thumbnails; day 0 shows drawn starter
	 * previews with a "Use this" affordance that seeds the composer.
	 * The CMYK registration bar in the header is a real print-shop mark.
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** Template rows from the API: { uid, name, thumbnail, outputFormat, usageCount } */
	export let templates = [];
	/** When true, render the drawn starter set instead of `templates`. */
	export let starters = false;
	/** The host page provides its own section header (e.g. the empty state). */
	export let hideHeader = false;

	const STARTERS = [
		{
			id: 'certificate',
			name: 'Certificate',
			format: 'PNG',
			seed: 'A certificate for people who finish our course — our logo, their name, the date and the course title.'
		},
		{
			id: 'og-image',
			name: 'Social card',
			format: 'PNG',
			seed: 'An OG image for every blog post — post title, author name and our logo on our brand colors.'
		},
		{
			id: 'invoice',
			name: 'Invoice PDF',
			format: 'PDF',
			seed: 'An invoice PDF — our company details, line items with amounts, and a total, A4.'
		},
		{
			id: 'badge',
			name: 'Event badge',
			format: 'PNG',
			seed: 'An event badge — attendee name, their role and hall, our logo, portrait layout.'
		}
	];

	const formatChip = (f) => (f || 'PNG').toUpperCase();
</script>

<section class="flex flex-col gap-3.5">
	<div class="flex items-center justify-between" class:hidden={hideHeader}>
		<div class="flex items-center gap-3">
			<h2 class="font-mono text-[11px] uppercase tracking-[0.12em] text-brand-mute">
				{starters ? 'Starters' : 'Templates'}
			</h2>
			<span class="flex" aria-hidden="true">
				<span class="block h-2.5 w-2.5 bg-brand-blue"></span>
				<span class="block h-2.5 w-2.5 bg-brand-pink"></span>
				<span class="block h-2.5 w-2.5 bg-brand-field"></span>
				<span class="block h-2.5 w-2.5 bg-brand-ink"></span>
			</span>
		</div>
		<a
			href="/dashboard/template"
			class="font-sans text-[12.5px] font-semibold text-brand-slate underline underline-offset-[3px]"
		>
			{starters ? 'All starters' : 'All templates'}
		</a>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#if starters}
			{#each STARTERS as s, i (s.id)}
				<button
					type="button"
					on:click={() => dispatch('use', { seed: s.seed })}
					class="group flex flex-col overflow-hidden rounded-[10px] border-[1.5px] border-brand-rule text-left transition-colors hover:border-brand-ink"
				>
					<span class="relative flex h-40 flex-col items-center justify-center overflow-hidden
						{i === 0 ? 'bg-brand-powder' : i === 1 ? 'bg-brand-press' : i === 2 ? 'border-b border-brand-rule bg-white' : 'bg-brand-field'}"
					>
						<span class="absolute left-2.5 top-2 font-mono text-[7.5px] tracking-[0.14em] opacity-60
							{i === 1 ? 'text-brand-press-text' : i === 0 ? 'text-brand-royal' : 'text-brand-mute'}"
						>
							PLATE {String(i + 1).padStart(2, '0')}
						</span>
						{#if i === 0}
							<span class="font-mono text-[8px] tracking-[0.2em] text-brand-royal">CERTIFICATE OF COMPLETION</span>
							<span class="mt-1.5 font-display text-[21px] font-extrabold tracking-[-0.02em] text-brand-ink">Mika Patel</span>
							<span class="mt-1.5 block h-0.5 w-[54px] bg-brand-royal"></span>
							<span class="mt-1.5 font-mono text-[8px] text-brand-royal">ADVANCED TYPOGRAPHY — AUG 2026</span>
							<span class="absolute bottom-3 right-3 block h-[22px] w-[22px] bg-brand-field"></span>
						{:else if i === 1}
							<span class="w-full px-5 text-left">
								<span class="block font-mono text-[8px] tracking-[0.14em] text-[#7D8494]">YOURS.COM/BLOG</span>
								<span class="mt-1.5 block font-display text-[19px] font-extrabold leading-6 tracking-[-0.02em] text-white">
									Ship faster with templated media
								</span>
								<span class="mt-1.5 block font-mono text-[9px] text-[#7D8494]">BY ADA OSEI · 6 MIN READ</span>
							</span>
							<span class="absolute right-4 top-4 flex">
								<span class="block h-[9px] w-[9px] bg-brand-pink"></span>
								<span class="block h-[9px] w-[9px] bg-brand-field"></span>
							</span>
						{:else if i === 2}
							<span class="w-full px-5">
								<span class="flex items-center justify-between">
									<span class="font-display text-[15px] font-extrabold text-brand-ink">INVOICE</span>
									<span class="block h-3 w-[30px] bg-brand-rose"></span>
								</span>
								<span class="mt-1.5 block h-[1.5px] w-full bg-brand-ink"></span>
								<span class="mt-1.5 flex justify-between font-mono text-[8.5px] text-brand-slate">
									<span>Design retainer — July</span><span class="text-brand-ink">$2,400</span>
								</span>
								<span class="mt-1 flex justify-between font-mono text-[8.5px] text-brand-slate">
									<span>Print production</span><span class="text-brand-ink">$310</span>
								</span>
								<span class="mt-1.5 block h-px w-full bg-brand-rule"></span>
								<span class="mt-1 flex justify-between font-mono text-[8.5px] font-bold text-brand-ink">
									<span>TOTAL</span><span>$2,710</span>
								</span>
							</span>
						{:else}
							<span class="flex h-[38px] w-[38px] items-center justify-center bg-brand-ink">
								<span class="font-display text-[15px] font-extrabold text-brand-field">AO</span>
							</span>
							<span class="mt-1.5 font-display text-base font-extrabold text-brand-ink">Ada Osei</span>
							<span class="mt-1 font-mono text-[8px] tracking-[0.16em] text-brand-ink">SPEAKER — HALL B</span>
							<span class="absolute bottom-0 left-0 flex">
								<span class="block h-[11px] w-[11px] bg-brand-ink"></span>
								<span class="block h-[11px] w-[11px] bg-brand-pink"></span>
							</span>
						{/if}
					</span>
					<span class="flex items-center justify-between px-3.5 py-3">
						<span class="flex flex-col">
							<span class="font-sans text-[13.5px] font-bold text-brand-ink">{s.name}</span>
							<span class="font-mono text-[10.5px] text-brand-slate group-hover:text-brand-ink">Use this →</span>
						</span>
						<span class="rounded-[3px] bg-brand-powder px-[7px] py-0.5 font-mono text-[9px] tracking-[0.06em] text-brand-royal">
							{s.format}
						</span>
					</span>
				</button>
			{/each}
		{:else}
			{#each templates as t (t.uid)}
				<a
					href="/template-workspace/html/{t.uid}"
					class="group flex flex-col overflow-hidden rounded-[10px] border-[1.5px] border-brand-rule transition-colors hover:border-brand-ink"
				>
					<span class="relative block h-40 overflow-hidden bg-brand-canvas">
						{#if t.thumbnail}
							<img
								loading="lazy"
								src={t.thumbnail}
								alt="Last render of {t.name}"
								class="h-full w-full object-cover object-top"
							/>
						{:else}
							<span class="flex h-full items-center justify-center font-mono text-[10px] tracking-[0.12em] text-brand-mute">
								NO RENDERS YET
							</span>
						{/if}
					</span>
					<span class="flex items-center justify-between px-3.5 py-3">
						<span class="flex min-w-0 flex-col">
							<span class="truncate font-sans text-[13.5px] font-bold text-brand-ink">{t.name || 'Untitled'}</span>
							<span class="font-mono text-[10.5px] text-brand-mute">
								{t.usageCount ? `${t.usageCount.toLocaleString()} renders` : 'no renders yet'}
							</span>
						</span>
						<span class="ml-2 flex-shrink-0 rounded-[3px] bg-brand-powder px-[7px] py-0.5 font-mono text-[9px] tracking-[0.06em] text-brand-royal">
							{formatChip(t.outputFormat)}
						</span>
					</span>
				</a>
			{/each}
		{/if}
	</div>
</section>
