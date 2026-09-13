<script>
	/**
	 * The tool surface: one bordered card holding the editor/preview body and a
	 * toolbar. Everything above it on the page is quiet by design — this is the
	 * thing the visitor came for.
	 *
	 * Slots: default (the body), `toolbar-left` (format/size controls),
	 * `toolbar-right` (quota meter + the generate button).
	 */
</script>

<div
	class="overflow-hidden rounded-card border-[1.5px] border-brand-ink bg-brand-paper shadow-[6px_6px_0_0_#000000]"
>
	<slot />

	<div
		class="flex flex-col gap-3 border-t border-brand-ink px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between lg:px-[30px]"
	>
		<div class="flex flex-wrap items-center gap-2">
			<slot name="toolbar-left" />
		</div>
		<div class="flex flex-wrap items-center gap-3.5">
			<slot name="toolbar-right" />
		</div>
	</div>
</div>
