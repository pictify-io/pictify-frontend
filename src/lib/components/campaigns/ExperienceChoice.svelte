<script>
	/**
	 * FE-4 — the one-time experience question (board `DQG-0`, left card).
	 *
	 * Shown ONLY to a new signup with no intent and no stored preference. It
	 * decides where someone starts, and the card says so in as many words —
	 * because a question that looks like it is provisioning an account gets
	 * agonised over, while one that is plainly a starting point does not.
	 *
	 * It never changes what the team can access. Entitlement is a separate
	 * server-side grant, and this preference is deliberately not consulted for
	 * it (see src/store/experience.store.js).
	 */
	import { setExperienceAction } from '../../../store/experience.store';
	import { campaignsHome } from '$lib/campaigns/nav';
	import { goto } from '$app/navigation';

	export let onDismiss = null;

	let choice = 'campaigns';
	let busy = false;
	let error = null;

	const OPTIONS = [
		{
			key: 'campaigns',
			title: 'Customer value updates',
			body: 'Branded PNG cards or PDF summaries from a CSV of account metrics. Your tool sends them.',
			badge: 'Pilot'
		},
		{
			key: 'platform',
			title: 'Images, GIFs or PDFs with templates and the API',
			body: 'The Pictify platform: HTML templates, renders, callers, playground.',
			badge: null
		}
	];

	async function submit() {
		busy = true;
		error = null;
		try {
			await setExperienceAction(choice);
			await goto(choice === 'campaigns' ? campaignsHome() : '/dashboard');
		} catch (err) {
			error = 'Couldn’t save that. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<div class="max-w-[560px] rounded-lg border-2 border-brand-ink bg-white p-6">
	<p class="font-mono text-[10.5px] uppercase tracking-[0.08em] text-brand-mute">
		One-time · new signup with no intent
	</p>
	<h2 class="mt-2.5 font-display text-[24px] font-extrabold tracking-[-0.02em] text-brand-ink">
		What do you want to create?
	</h2>
	<p class="mt-2 font-sans text-[14px] text-brand-slate">
		This only sets where you start. You can switch any time from the account menu; it never changes
		what your team can access.
	</p>

	<div class="mt-4 flex flex-col gap-3">
		{#each OPTIONS as option (option.key)}
			<button
				type="button"
				on:click={() => (choice = option.key)}
				class="flex items-start gap-3.5 rounded-md border-2 p-4 text-left {choice === option.key
					? 'border-brand-ink'
					: 'border-brand-rule'}"
				aria-pressed={choice === option.key}
			>
				<!-- A filled square rather than a radio dot: it matches the status
				     vocabulary used everywhere else in campaigns. -->
				<span
					class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center border-2 {choice ===
					option.key
						? 'border-brand-ink bg-brand-ink'
						: 'border-brand-slate'}"
				>
					{#if choice === option.key}
						<span class="font-sans text-[13px] font-bold leading-none text-white">✓</span>
					{/if}
				</span>
				<span class="min-w-0 flex-1">
					<span class="flex flex-wrap items-center gap-2">
						<span class="font-sans text-[15px] font-bold text-brand-ink">{option.title}</span>
						{#if option.badge}
							<span
								class="bg-brand-field px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-brand-ink"
								>{option.badge}</span
							>
						{/if}
					</span>
					<span class="mt-1 block font-sans text-[13.5px] text-brand-slate">{option.body}</span>
				</span>
			</button>
		{/each}
	</div>

	{#if error}
		<p class="mt-3 font-sans text-[13.5px] text-brand-alarm">{error}</p>
	{/if}

	<div class="mt-5 flex flex-wrap items-center justify-between gap-3">
		<button
			type="button"
			on:click={onDismiss}
			class="font-sans text-[13.5px] text-brand-royal hover:underline"
			>Explore first (platform default)</button
		>
		<button
			type="button"
			on:click={submit}
			disabled={busy}
			class="flex h-11 items-center gap-2.5 rounded-btn bg-brand-plum px-4 font-sans text-[13.5px] text-white"
		>
			{busy ? 'Saving…' : 'Continue'}
			<span class="block h-2 w-2 bg-brand-field" aria-hidden="true" />
		</button>
	</div>
</div>
