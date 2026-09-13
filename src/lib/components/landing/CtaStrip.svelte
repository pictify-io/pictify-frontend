<script>
	/**
	 * Mid-page CTA. Renders as a full-width strip inverted against the ground of
	 * whatever section it sits in — that inversion is what stops four of these
	 * reading as four identical cards.
	 */
	/** @type {'dark' | 'field' | 'blue'} */
	export let variant = 'dark';
	export let text;
	export let action;
	export let actionHref = '/signup';
	export let link;
	export let linkHref = '/docs';

	const skins = {
		dark: { bg: 'bg-brand-press-deep', text: 'text-white', btn: 'bg-brand-field text-brand-ink', link: 'text-white' },
		field: { bg: 'bg-brand-field', text: 'text-brand-ink', btn: 'bg-brand-ink text-white', link: 'text-brand-ink' },
		blue: { bg: 'bg-brand-blue', text: 'text-white', btn: 'bg-brand-field text-brand-ink', link: 'text-white' }
	};
	$: skin = skins[variant];
</script>

<div
	class="flex w-full flex-col items-start gap-5 rounded-card px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-11 lg:py-10 {skin.bg}"
>
	<p
		class="max-w-[560px] font-display text-card font-bold lg:text-[34px] lg:leading-[1.05] {skin.text}"
	>
		{text}
	</p>
	<!-- Stacked below sm: side by side, the pair overflows 390 and wraps the button label. -->
	<div
		class="flex w-full flex-shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-5 lg:gap-6"
	>
		<a
			href={actionHref}
			class="flex items-center justify-center whitespace-nowrap rounded-btn px-6 py-3.5 font-sans text-[15px] font-bold transition-opacity hover:opacity-90 sm:justify-start lg:px-7 lg:py-4 lg:text-[17px] {skin.btn}"
		>
			{action}
		</a>
		<a
			href={linkHref}
			class="whitespace-nowrap text-center font-sans text-[15px] font-semibold hover:underline sm:text-left lg:text-base {skin.link}"
		>
			{link} →
		</a>
	</div>
</div>
