<script>
	/**
	 * Body copy. Everything below a heading that isn't a list, grid or table
	 * goes in here, so the reading column has exactly one body scale.
	 *
	 * Inline links and <strong> are styled from the wrapper (arbitrary variants
	 * rather than a <style> block) so the colours stay Tailwind tokens and no
	 * route restyles its own <a>.
	 */
</script>

<div
	class="flex flex-col gap-4 font-sans text-[15px] leading-[23px] text-brand-slate [&_a]:text-brand-ink [&_a]:underline [&_strong]:font-semibold [&_strong]:text-brand-ink"
>
	<slot />
</div>
