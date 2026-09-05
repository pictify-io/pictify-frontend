<script>
	/**
	 * The inbox the email lands in. FE-17.
	 *
	 * Two rows, not one: a single highlighted row could be any notification,
	 * while the same subject line repeating month on month is the thing being
	 * claimed — that this becomes a rhythm the customer starts to expect.
	 */
	import { SENDER } from '$lib/campaigns/marketing-fixture.js';

	export let row;

	$: firstName = String(row.contact || '').split(' ')[0];
</script>

<div class="w-full border border-brand-rule bg-white p-4">
	<p class="font-mono text-[10px] uppercase tracking-[0.06em] text-brand-mute">In their inbox</p>

	<div class="mt-3 bg-brand-subtle p-3">
		<div class="flex items-baseline justify-between gap-3">
			<span class="font-sans text-[12.5px] font-semibold text-brand-ink">{SENDER.name}</span>
			<span class="font-sans text-[11px] text-brand-mute">9:02</span>
		</div>
		<p class="mt-0.5 font-sans text-[13px] font-semibold text-brand-ink">
			Your September with {SENDER.name}
		</p>
		<p class="mt-0.5 font-sans text-[12px] leading-[17px] text-brand-slate">
			Hi {firstName}, here is what {row.company} did with us this month…
		</p>
	</div>

	<div class="mt-2.5 px-3 pb-1">
		<div class="flex items-baseline justify-between gap-3">
			<span class="font-sans text-[12.5px] text-brand-slate">{SENDER.name}</span>
			<span class="font-sans text-[11px] text-brand-mute">Aug</span>
		</div>
		<p class="mt-0.5 font-sans text-[12.5px] text-brand-slate">
			Your August with {SENDER.name}
		</p>
	</div>

	<p class="mt-3 border-t border-brand-rule pt-3 font-sans text-[12.5px] text-brand-slate">
		Sent from your own email tool, one per customer.
	</p>
</div>
