<script>
	/**
	 * Post-generation success banner — the green #4ade80 block that appears when
	 * a tool produces an image. Contains a rotated image preview in a bordered
	 * card + a Download button + an optional named slot for extra CTAs (e.g.,
	 * cert-gen's "Edit in Full Editor").
	 *
	 * Markup mirrors what certificate-generator and tweet-screenshot emit today.
	 *
	 * Consumer renders this conditionally (i.e. wraps it in `{#if generatedImageUrl}`).
	 * Nothing here is conditional on its own — just pass a non-empty imageUrl.
	 *
	 * See plan: docs/plans/2026-04-15-002-refactor-tool-scaffold-plan.md
	 */
	export let imageUrl = '';
	export let imageAlt = 'Generated result';
	export let heading = 'Success! Here is your image';
	export let downloadFileName = 'pictify-result.png';
</script>

<div class="max-w-4xl mx-auto px-4 mb-20 animate-fade-in-up">
	<div
		class="bg-[#4ade80]/10 border-[3px] border-[#4ade80] rounded-3xl p-8 text-center relative overflow-hidden"
	>
		<div class="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/20 rounded-full blur-2xl" />

		<h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">
			{heading}
		</h3>

		<div
			class="inline-block bg-white border-[3px] border-gray-900 p-2 shadow-[8px_8px_0_0_#1f2937] rotate-1 mb-8"
		>
			<img src={imageUrl} alt={imageAlt} class="max-w-full h-auto max-h-[400px]" />
		</div>

		<div class="flex flex-wrap justify-center gap-4">
			<a
				href={imageUrl}
				download={downloadFileName}
				class="px-6 py-3 bg-white text-gray-900 border-[3px] border-gray-900 font-bold uppercase tracking-wide shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl flex items-center gap-2"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/></svg
				>
				Download PNG
			</a>
			<slot name="extra-actions" />
		</div>
	</div>
</div>
