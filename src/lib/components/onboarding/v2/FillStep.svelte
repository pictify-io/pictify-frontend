<script>
	/**
	 * The one personalization question, asked at the only moment it's concrete:
	 * their first file just rendered. The answer sets the home's single
	 * next-step card and routes the integrate step — it is how the dashboard
	 * avoids asking four things at once.
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Leading with the agent path is deliberate: newest, most differentiated,
	// and every pick here is an MCP install nothing had to advertise.
	const OPTIONS = [
		{
			mode: 'mcp',
			name: 'An AI agent',
			detail: 'Claude, Cursor or ChatGPT fills it over MCP.',
			tag: 'MCP'
		},
		{
			mode: 'api',
			name: 'My code',
			detail: 'A POST from your backend, any language.',
			tag: 'REST API'
		},
		{
			mode: 'automation',
			name: 'An automation',
			detail: 'New signup, new order, new row — a file goes out.',
			tag: 'ZAPIER · MAKE'
		},
		{
			mode: 'csv',
			name: 'A spreadsheet',
			detail: 'One row per file — hundreds at a time.',
			tag: 'CSV BATCH'
		}
	];

	let selected = null;
</script>

<div class="flex w-full max-w-[720px] flex-col items-center gap-7 px-5 py-10">
	<div class="flex flex-col items-center gap-2.5">
		<span class="flex items-center gap-2">
			<span class="block h-2 w-2 bg-brand-proof" aria-hidden="true"></span>
			<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-proof">
				Your file is off the press — one last thing
			</span>
		</span>
		<h1 class="text-balance text-center font-display text-[34px] font-extrabold leading-10 tracking-[-0.03em] text-brand-ink">
			How will this template fill?
		</h1>
		<p class="max-w-[440px] text-center font-sans text-[15px] leading-[22px] text-brand-slate">
			Files print when something fills the variables. Pick what that'll be — it sets up your next
			step. You can change it anytime.
		</p>
	</div>

	<div class="mt-1 flex w-full flex-col gap-2.5" role="radiogroup" aria-label="How will this template fill?">
		{#each OPTIONS as option (option.mode)}
			{@const active = selected === option.mode}
			<button
				type="button"
				role="radio"
				aria-checked={active}
				on:click={() => (selected = option.mode)}
				class="flex items-center justify-between rounded-[10px] px-5 py-4 text-left transition-all {active
					? 'border-2 border-brand-ink bg-white shadow-[4px_4px_0_theme(colors.brand.field)]'
					: 'border-[1.5px] border-brand-rule hover:border-brand-ink'}"
			>
				<span class="flex flex-col gap-0.5">
					<span class="font-sans text-[15px] font-bold text-brand-ink">{option.name}</span>
					<span class="font-sans text-[12.5px] text-brand-slate">{option.detail}</span>
				</span>
				<span
					class="ml-4 flex-shrink-0 rounded-[3px] px-2.5 py-[3px] font-mono text-[10px] tracking-[0.06em] {active
						? 'bg-brand-field text-brand-ink'
						: 'border border-brand-rule text-brand-slate'}"
				>
					{option.tag}
				</span>
			</button>
		{/each}
		<button
			type="button"
			on:click={() => dispatch('answer', { mode: 'dashboard' })}
			class="self-center p-1.5 font-sans text-[13px] text-brand-slate underline underline-offset-[3px]"
		>
			Just me for now — I'll fill it in the dashboard
		</button>
	</div>

	<button
		type="button"
		disabled={!selected}
		on:click={() => dispatch('answer', { mode: selected })}
		class="flex items-center gap-2.5 rounded-btn bg-brand-ink px-6 py-3 font-sans text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
	>
		Set up my next step
		<span class="block h-2 w-2 bg-brand-field" aria-hidden="true"></span>
	</button>
</div>
