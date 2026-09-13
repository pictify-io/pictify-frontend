<script>
	/**
	 * Start state for a NEW template. PS-6 (board PS-04 `K7R-0`).
	 *
	 * Three ways in, and the board puts them in this order because that is the
	 * order of commitment: describe it (cheapest, an AI call), start from one of
	 * three shapes the product is actually asked for, or paste HTML you already
	 * have.
	 *
	 * NOTHING IS DRAWN UNTIL THE BUYER PRESSES CREATE — the same rule as the
	 * campaign start. Picking a starter fills the description; it does not
	 * generate. A picker that quietly produced a draft would spend an AI call and
	 * put something on the canvas they then have to undo rather than begin from.
	 *
	 * PASTE IS DIFFERENT, and deliberately so: pasted HTML is already a design,
	 * so it goes straight to Code — but only after the compatibility report,
	 * because the things that will not survive the trip (a logo on someone
	 * else's CDN, a script, a remote stylesheet) are invisible in the browser it
	 * was copied from. Told before, not discovered after.
	 */
	import { createEventDispatcher } from 'svelte';
	import { TEMPLATE_STARTERS } from '$lib/campaigns/starters/templates.js';
	import { inspectPastedHtml, reportLines } from './paste-report.js';

	export let busy = false;

	const dispatch = createEventDispatcher();

	const FORMATS = [
		{
			key: 'png',
			title: 'Image · PNG or JPG',
			detail: 'Any size · OG images, cards, banners, certificates'
		},
		{ key: 'pdf', title: 'PDF', detail: 'A4, Letter or custom · invoices, reports, one-pagers' }
	];

	/** Sizes worth one click. "Custom" is the escape hatch, not the default. */
	const SIZES = {
		png: [
			{ label: 'OG · 1200 × 630', width: 1200, height: 630 },
			{ label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
			{ label: 'Wide · 1600 × 900', width: 1600, height: 900 }
		],
		pdf: [
			{ label: 'A4 portrait', width: 794, height: 1123 },
			{ label: 'A4 landscape', width: 1123, height: 794 },
			{ label: 'Letter', width: 816, height: 1056 }
		]
	};

	let format = 'png';
	let width = 1200;
	let height = 630;
	let description = '';
	let pasting = false;
	let pasted = '';

	/*
	 * Switching format moves the size to that format's first preset — an A4
	 * page at 1200 × 630 is neither, and silently keeping the old number is how
	 * someone ends up rendering a PDF the shape of an OG image.
	 */
	function pickFormat(next) {
		if (format === next) return;
		format = next;
		({ width, height } = SIZES[next][0]);
	}

	$: sizeMatches = (s) => s.width === width && s.height === height;

	function useStarter(starter) {
		description = starter.prompt;
		format = starter.format;
		width = starter.width;
		height = starter.height;
	}

	$: report = pasted.trim() ? inspectPastedHtml(pasted) : null;
	$: lines = report ? reportLines(report) : [];

	const create = () => {
		if (!description.trim() || busy) return;
		dispatch('create', { description: description.trim(), format, width, height });
	};

	const usePaste = () => {
		if (!pasted.trim() || busy) return;
		dispatch('paste', { html: pasted, format, width, height });
	};

	const onKey = (event) => {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') create();
	};
</script>

<div class="flex flex-col gap-4 p-4">
	{#if pasting}
		<div class="flex flex-col gap-2">
			<h2 class="font-display text-[19px] font-medium leading-[24px] tracking-[-0.015em] text-brand-ink">
				Paste your HTML
			</h2>
			<p class="font-sans text-[13px] leading-[17px] text-brand-slate">
				It opens in Code, exactly as pasted. Nothing is drawn until you continue.
			</p>
		</div>

		<textarea
			bind:value={pasted}
			rows="10"
			placeholder="&lt;html&gt;…"
			class="w-full rounded-[6px] border-[1.5px] border-brand-ink px-3 py-2.5 font-mono text-[12px] leading-[17px] text-brand-ink placeholder:text-brand-mute"
		/>

		{#if report}
			<!--
				The report, before the paste is accepted. `ok` means nothing will
				change on the way in — not that the design is good.
			-->
			<div class="flex flex-col gap-2 border border-brand-rule p-3">
				<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">
					Compatibility
				</p>
				{#if report.ok}
					<p class="flex items-start gap-2">
						<span class="mt-1 block h-2 w-2 flex-shrink-0 bg-brand-proof" aria-hidden="true" />
						<span class="font-sans text-[12.5px] leading-[17px] text-brand-slate">
							Nothing here needs changing. It will render as pasted.
						</span>
					</p>
				{:else}
					{#each lines as line (line.label)}
						<p class="flex items-start gap-2">
							<span
								class="mt-1 block h-2 w-2 flex-shrink-0 {line.tone === 'alarm'
									? 'bg-brand-alarm'
									: 'bg-brand-field'}"
								aria-hidden="true"
							/>
							<span class="min-w-0">
								<span class="block font-sans text-[12.5px] font-medium leading-[17px] text-brand-ink"
									>{line.label}</span
								>
								<span class="block font-sans text-[12px] leading-[16px] text-brand-slate"
									>{line.detail}</span
								>
							</span>
						</p>
					{/each}
				{/if}
			</div>
		{/if}

		<div class="flex items-center gap-2">
			<button
				type="button"
				on:click={usePaste}
				disabled={!pasted.trim() || busy}
				class="flex h-[38px] flex-1 items-center justify-center rounded-[4px] font-sans text-[13.5px] font-medium {pasted.trim() &&
				!busy
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}">Continue to Code</button
			>
			<button
				type="button"
				on:click={() => {
					pasting = false;
					pasted = '';
				}}
				class="h-[38px] rounded-[4px] border border-brand-rule px-3 font-sans text-[13px] text-brand-ink"
				>Back</button
			>
		</div>
	{:else}
		<div class="flex flex-col gap-1">
			<h2 class="font-display text-[21px] font-medium leading-[26px] tracking-[-0.015em] text-brand-ink">
				Describe the template. AI drafts it. You make it yours.
			</h2>
			<p class="font-sans text-[13px] leading-[17px] text-brand-slate">
				Visually, by instruction, or in the HTML. Variables become the API contract.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Format</p>
			<div class="flex flex-col gap-1.5">
				{#each FORMATS as option (option.key)}
					<button
						type="button"
						on:click={() => pickFormat(option.key)}
						aria-pressed={format === option.key}
						class="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-left {format ===
						option.key
							? 'border-[1.5px] border-brand-ink'
							: 'border border-brand-rule'}"
					>
						<!-- The shape of the thing, not a radio: a wide box for an image,
						     a tall one for a page. -->
						<span
							class="block flex-shrink-0 rounded-[2px] border {option.key === 'png'
								? 'h-5 w-[30px]'
								: 'ml-[7px] h-[22px] w-4'} {format === option.key
								? 'border-brand-ink'
								: 'border-brand-mute'}"
							aria-hidden="true"
						/>
						<span class="min-w-0">
							<span
								class="block font-sans text-[13px] leading-4 text-brand-ink {format === option.key
									? 'font-medium'
									: ''}">{option.title}</span
							>
							<span class="block font-sans text-[12px] leading-[14px] text-brand-slate"
								>{option.detail}</span
							>
						</span>
					</button>
				{/each}
			</div>
			<div class="flex flex-wrap gap-1.5">
				{#each SIZES[format] as size (size.label)}
					<button
						type="button"
						on:click={() => ({ width, height } = size)}
						aria-pressed={sizeMatches(size)}
						class="rounded-[4px] px-2 py-1 font-mono text-[10.5px] {sizeMatches(size)
							? 'bg-brand-ink text-white'
							: 'border border-brand-rule text-brand-slate'}">{size.label}</button
					>
				{/each}
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Describe it</p>
			<div
				class="flex h-[132px] flex-col justify-between rounded-[6px] border-[1.5px] border-brand-ink p-3"
			>
				<textarea
					bind:value={description}
					on:keydown={onKey}
					placeholder="An OG image for blog posts. Site name and category up top, the post title big, author, date and read time below."
					class="min-h-0 flex-1 resize-none border-0 p-0 font-sans text-[13.5px] leading-[19px] text-brand-ink outline-none placeholder:text-brand-mute"
				/>
				<div class="flex items-center justify-between">
					<span class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute"
						>Variables: AI proposes, you confirm</span
					>
					<span class="font-mono text-[10px] tracking-[0.06em] text-brand-mute">⌘↵</span>
				</div>
			</div>
			<button
				type="button"
				on:click={create}
				disabled={!description.trim() || busy}
				class="flex h-[38px] items-center justify-center rounded-[4px] font-sans text-[13.5px] font-medium {description.trim() &&
				!busy
					? 'bg-brand-plum text-white'
					: 'cursor-not-allowed bg-brand-subtle text-brand-mute'}"
			>
				{busy ? 'Drafting…' : 'Create first draft · about 20 s'}
			</button>
		</div>

		<div class="flex flex-col gap-1.5">
			<p class="font-mono text-[11px] uppercase tracking-[0.06em] text-brand-mute">Or start from</p>
			<div class="flex flex-col gap-1">
				{#each TEMPLATE_STARTERS as starter (starter.key)}
					<button
						type="button"
						on:click={() => useStarter(starter)}
						class="flex items-center gap-2 rounded-[4px] bg-brand-subtle px-2.5 py-2 text-left"
					>
						<span class="block h-2 w-2 flex-shrink-0 bg-brand-blue" aria-hidden="true" />
						<span class="font-sans text-[13px] leading-4 text-brand-ink">{starter.label}</span>
					</button>
				{/each}
			</div>
			<p class="font-sans text-[12px] leading-4 text-brand-mute">
				Starters fill the description; nothing is drawn until you press Create.
			</p>
		</div>

		<div class="flex items-center justify-between border-t border-brand-rule pt-3">
			<button
				type="button"
				on:click={() => (pasting = true)}
				class="font-sans text-[13px] leading-4 text-brand-ink hover:underline">Paste HTML</button
			>
			<a
				href="/dashboard/template"
				class="font-sans text-[13px] leading-4 text-brand-ink hover:underline"
				>Choose an existing template</a
			>
		</div>
	{/if}
</div>
