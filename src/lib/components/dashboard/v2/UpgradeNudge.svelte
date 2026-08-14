<script>
	/**
	 * The only banner steady-state users ever see, and only when it's true:
	 * quota pressure with days still left in the month.
	 */
	import { openUpgradeModal } from '../../../../store/upgrade-modal.store';
	import { analytics } from '$lib/telemetry.js';

	export let percentage = 0;
	export let resetDate = null;

	$: daysLeft = resetDate
		? Math.max(0, Math.ceil((new Date(resetDate).getTime() - Date.now()) / 86_400_000))
		: null;
	$: monthLabel = new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

	function upgrade() {
		analytics.track('home_quota_nudge_clicked', { percentage });
		openUpgradeModal('home_quota_nudge');
	}
</script>

<div class="relative flex flex-col justify-between gap-3 overflow-hidden rounded-[10px] bg-brand-field px-[22px] py-4 sm:flex-row sm:items-center">
	<div class="absolute right-0 top-0 flex" aria-hidden="true">
		<span class="block h-[11px] w-[11px] bg-brand-ink"></span>
		<span class="block h-[11px] w-[11px] bg-brand-pink"></span>
	</div>
	<div class="flex flex-col gap-0.5">
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-ink opacity-65">
			Render quota — {Math.round(percentage)}% used{daysLeft !== null ? `, ${daysLeft} days left in ${monthLabel}` : ''}
		</span>
		<span class="font-display text-[19px] font-extrabold leading-6 tracking-[-0.02em] text-brand-ink">
			The press won't stop mid-month — move up before it matters.
		</span>
	</div>
	<button
		type="button"
		on:click={upgrade}
		class="flex-shrink-0 self-start rounded-btn bg-brand-ink px-[18px] py-2.5 font-sans text-[13px] font-bold text-white transition-opacity hover:opacity-90 sm:self-auto"
	>
		See plans
	</button>
</div>
