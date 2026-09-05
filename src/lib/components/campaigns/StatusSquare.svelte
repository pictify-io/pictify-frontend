<script>
	/**
	 * The campaigns status vocabulary (handoff §2 decision 3).
	 *
	 * Five tones, and the constraint that matters is the one this component
	 * cannot enforce alone: NEVER COLOUR-ONLY. Every square is followed by
	 * words, so the state survives a greyscale print, a colourblind reader and a
	 * screenshot pasted into a ticket. The `label` slot is required for that
	 * reason — a square on its own is not a status.
	 *
	 * Alarm is the only red in v2 and only ever appears with a sentence
	 * explaining what failed. A red square that says nothing tells a buyer
	 * something is wrong about their customers and not what.
	 */

	/**
	 * ready     — done, verified, confirmed.
	 * current   — needs a decision, or is the step you are on.
	 * blocked   — failed or blocking. Always paired with a sentence.
	 * excluded  — deliberately not in the run.
	 * expired   — superseded or past its retention.
	 */
	export let tone = 'ready';
	export let label = '';

	const TONES = {
		ready: 'bg-brand-proof',
		current: 'bg-brand-field border border-brand-ink',
		blocked: 'bg-brand-alarm',
		excluded: 'bg-brand-rule',
		expired: 'border border-brand-mute'
	};

	$: fill = TONES[tone] || TONES.ready;
</script>

<span class="inline-flex items-center gap-2">
	<span class="block h-2 w-2 flex-shrink-0 {fill}" aria-hidden="true" />
	<span
		class="font-sans text-[13.5px] {tone === 'expired' || tone === 'excluded'
			? 'text-brand-mute'
			: 'text-brand-slate'}"
	>
		{label}<slot />
	</span>
</span>
