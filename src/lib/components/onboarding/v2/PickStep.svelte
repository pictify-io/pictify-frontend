<script>
	/**
	 * Two co-equal ways in. Describing and picking sit at the same weight because
	 * they suit different people, not different skill levels.
	 *
	 * The seeded prompts matter more than they look: an empty prompt box is the
	 * blank-canvas problem relocated, not solved. One click has to be enough on
	 * both sides.
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** Preserved across a failed generation — never make someone retype. */
	export let prompt = '';
	export let errorMessage = '';

	const seeds = [
		'An OG image for every blog post',
		'A monthly statement PDF',
		'A ticket with a QR code',
		'A wrapped-style recap video'
	];

	const templates = [
		{
			id: 'certificate',
			name: 'Certificate',
			meta: 'PDF · per person',
			label: 'Certificate',
			title: 'Priya Raman',
			bg: 'bg-[#F4F6F4]',
			labelClass: 'text-brand-mute',
			titleClass: 'text-brand-ink',
			rule: 'bg-brand-blue'
		},
		{
			id: 'og-image',
			name: 'OG image',
			meta: 'PNG · per page',
			label: 'OG image',
			title: 'Six ways in',
			bg: 'bg-[#1B1F3B]',
			labelClass: 'text-brand-field',
			titleClass: 'text-white',
			rule: 'bg-brand-field'
		},
		{
			id: 'invoice',
			name: 'Invoice',
			meta: 'PDF · per charge',
			label: 'Invoice 0412',
			title: '£1,248',
			bg: 'bg-brand-plum',
			labelClass: 'text-brand-field',
			titleClass: 'text-white',
			rule: 'bg-brand-field'
		},
		{
			id: 'badge',
			name: 'Event badge',
			meta: 'PNG · per guest',
			label: 'Speaker badge',
			title: 'Rafael Nunes',
			bg: 'bg-brand-rose',
			labelClass: 'text-black/55',
			titleClass: 'text-brand-ink',
			rule: 'bg-brand-blue'
		}
	];
</script>

<div class="flex w-full flex-col items-center gap-10 px-5 pt-10 lg:px-10 lg:pt-12">
	<div class="flex w-[720px] max-w-full flex-col items-center gap-3">
		<h1 class="text-balance text-center font-display text-[52px] font-extrabold leading-[52px] tracking-[-0.04em] text-brand-ink">
			What do you need to make?
		</h1>
		<p class="max-w-[520px] text-center font-sans text-lg leading-[27px] text-brand-slate">
			Describe it and we'll write the template, or start from one that already exists. Either way
			there's a file at the end of it.
		</p>
	</div>

	<div class="flex w-full max-w-[1200px] flex-col items-stretch gap-9 lg:flex-row">
		<!-- Describe -->
		<div class="flex w-full flex-col gap-[18px] lg:w-[562px] lg:flex-shrink-0">
			<div class="flex flex-col gap-[5px]">
				<h2 class="font-display text-2xl font-bold tracking-[-0.03em] text-brand-ink">
					Describe what you need
				</h2>
				<p class="font-sans text-sm leading-[21px] text-brand-slate">
					We write the HTML and declare the variables for you.
				</p>
			</div>

			<div class="flex h-[186px] w-full flex-col justify-between rounded-card bg-brand-canvas p-[18px] focus-within:ring-2 focus-within:ring-brand-royal">
				<textarea
					bind:value={prompt}
					rows="3"
					placeholder="A certificate for people who finish our course — our logo, their name, the date and the course title."
					class="w-full flex-1 resize-none bg-transparent font-sans text-base leading-6 text-brand-ink outline-none placeholder:text-brand-mute"
				></textarea>
				<div class="flex items-center justify-between">
					<span class="font-mono text-[11px] text-brand-mute">Plain English is fine</span>
					<button
						type="button"
						disabled={!prompt.trim()}
						on:click={() => dispatch('generate', { prompt })}
						class="flex h-11 items-center rounded-btn bg-brand-ink px-[22px] font-sans text-[15px] font-bold text-brand-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
					>
						Generate template
					</button>
				</div>
			</div>

			{#if errorMessage}
				<p
					role="alert"
					class="flex items-start gap-2.5 rounded-btn bg-brand-rose px-4 py-3 font-sans text-[15px] leading-[21px] text-brand-ink"
				>
					<span class="mt-1.5 block h-2 w-2 flex-shrink-0 bg-brand-ink" aria-hidden="true"></span>
					{errorMessage} Your description is still here — adjust it and try again.
				</p>
			{/if}

			<div class="flex flex-col gap-[9px]">
				<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-mute">
					Or start from one of these
				</span>
				<div class="flex flex-wrap gap-2">
					{#each seeds as seed (seed)}
						<button
							type="button"
							on:click={() => (prompt = seed)}
							class="flex h-[34px] items-center rounded-full bg-brand-canvas px-3.5 font-sans text-[13px] text-brand-ink transition-colors hover:bg-brand-powder"
						>
							{seed}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- or -->
		<div class="hidden w-10 flex-shrink-0 flex-col items-center gap-3.5 pt-16 lg:flex">
			<span class="block h-24 w-px bg-brand-rule"></span>
			<span class="font-mono text-[11px] tracking-[0.1em] text-brand-mute">or</span>
			<span class="block h-24 w-px bg-brand-rule"></span>
		</div>

		<!-- Pick -->
		<div class="flex flex-1 flex-col gap-[18px]">
			<div class="flex flex-col gap-[5px]">
				<h2 class="font-display text-2xl font-bold tracking-[-0.03em] text-brand-ink">
					Start from a made one
				</h2>
				<p class="font-sans text-sm leading-[21px] text-brand-slate">
					Every one is plain HTML you can edit after.
				</p>
			</div>

			<div class="flex flex-wrap gap-3.5">
				{#each templates as t (t.id)}
					<button
						type="button"
						on:click={() => dispatch('pick', { template: t })}
						class="flex w-full flex-col gap-2.5 sm:w-[248px] rounded-card bg-brand-canvas p-3 pb-3.5 text-left transition-colors hover:bg-brand-powder"
					>
						<span class="flex h-[88px] w-full flex-col items-center justify-center gap-1 rounded-tile {t.bg}">
							<span class="font-mono text-[7px] uppercase tracking-[0.14em] {t.labelClass}">
								{t.label}
							</span>
							<span class="font-display text-[15px] font-bold tracking-[-0.02em] {t.titleClass}">
								{t.title}
							</span>
							<span class="block h-0.5 w-6 {t.rule}"></span>
						</span>
						<span class="flex items-baseline justify-between">
							<span class="font-display text-base font-bold tracking-[-0.02em] text-brand-ink">
								{t.name}
							</span>
							<span class="font-mono text-[10px] text-brand-mute">{t.meta}</span>
						</span>
					</button>
				{/each}
			</div>

			<a
				href="/templates"
				class="self-start font-sans text-sm font-semibold text-brand-ink underline underline-offset-[3px]"
			>
				See all 30 templates →
			</a>
		</div>
	</div>
</div>
