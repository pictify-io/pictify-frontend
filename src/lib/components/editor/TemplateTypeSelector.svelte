<script>
	import { createEventDispatcher } from 'svelte';
	import {
		checkFeatureAccessSync,
		FEATURES,
		PLAN_DISPLAY_NAMES,
		getMinimumPlan
	} from '../../../store/plg.store';

	const dispatch = createEventDispatcher();

	let selectedFormat = 'image';
	let selectedPreset = 'CUSTOM';

	// Feature access check for PDF output
	$: pdfAccess = checkFeatureAccessSync(FEATURES.PDF_OUTPUT);
	$: hasPdfAccess = pdfAccess?.hasAccess ?? false;
	$: pdfMinPlan = getMinimumPlan(FEATURES.PDF_OUTPUT);
	$: pdfMinPlanName = PLAN_DISPLAY_NAMES[pdfMinPlan];

	const formats = [
		{
			value: 'image',
			label: 'Image Template',
			icon: 'fa-image',
			description: 'PNG/JPEG output for social media, OG images, banners',
			color: '#ffc480',
			bgColor: 'bg-[#ffc480]',
			borderColor: 'border-[#ffc480]',
			textOnBg: 'text-gray-900',
			shadowColor: 'shadow-[4px_4px_0_0_#ffc480]'
		},
		{
			value: 'pdf',
			label: 'PDF Document',
			icon: 'fa-file-pdf',
			description: 'Multi-page PDF with selectable text for invoices, reports',
			color: '#ff6b6b',
			bgColor: 'bg-[#ff6b6b]',
			borderColor: 'border-[#ff6b6b]',
			textOnBg: 'text-white',
			shadowColor: 'shadow-[4px_4px_0_0_#ff6b6b]'
		}
	];

	const pdfPresets = [
		{ value: 'A4', label: 'A4', width: 595, height: 842, description: 'Standard document' },
		{
			value: 'A4_LANDSCAPE',
			label: 'A4 Landscape',
			width: 842,
			height: 595,
			description: 'Wide format'
		},
		{ value: 'LETTER', label: 'Letter', width: 612, height: 792, description: 'US standard' },
		{
			value: 'LETTER_LANDSCAPE',
			label: 'Letter Landscape',
			width: 792,
			height: 612,
			description: 'US wide'
		},
		{ value: 'LEGAL', label: 'Legal', width: 612, height: 1008, description: 'Legal documents' },
		{ value: 'A3', label: 'A3', width: 842, height: 1191, description: 'Large format' },
		{
			value: 'CUSTOM',
			label: 'Custom Size',
			width: 1080,
			height: 1080,
			description: 'Define your own'
		}
	];

	let customWidth = 1080;
	let customHeight = 1080;

	$: currentPreset = pdfPresets.find((p) => p.value === selectedPreset);

	function handleClose() {
		dispatch('close');
	}

	function handleContinue() {
		const dimensions =
			selectedFormat === 'image'
				? { width: 1080, height: 1080 }
				: selectedPreset === 'CUSTOM'
				? { width: customWidth, height: customHeight }
				: { width: currentPreset.width, height: currentPreset.height };

		dispatch('select', {
			outputFormat: selectedFormat,
			pdfPreset: selectedFormat === 'pdf' ? selectedPreset : null,
			width: dimensions.width,
			height: dimensions.height
		});
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
	on:click|self={handleClose}
>
	<div
		class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
	>
		<!-- Header -->
		<div class="px-6 py-4 border-b-[3px] border-gray-900 bg-[#ffc480]">
			<h2 class="text-xl font-black uppercase tracking-wider text-gray-900">Create New Template</h2>
			<p class="text-sm text-gray-700 mt-1">Choose the output format for your template</p>
		</div>

		<!-- Content -->
		<div class="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
			<!-- Format Selection -->
			<div class="space-y-3">
				<label class="text-xs font-black uppercase tracking-widest text-gray-900"
					>Output Format</label
				>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each formats as format}
						{@const isLocked = format.value === 'pdf' && !hasPdfAccess}
						<button
							class="relative p-5 rounded-xl border-[3px] text-left transition-all
								{isLocked
								? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-75'
								: selectedFormat === format.value
								? `border-gray-900 ${format.bgColor}/10 shadow-[4px_4px_0_0_#1f2937] translate-x-[-2px] translate-y-[-2px]`
								: 'border-gray-900 bg-white hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px]'}"
							on:click={() => !isLocked && (selectedFormat = format.value)}
							disabled={isLocked}
						>
							{#if isLocked}
								<!-- Locked badge -->
								<div
									class="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-gray-200 rounded text-gray-500 border-2 border-gray-300"
								>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
										/>
									</svg>
									<span class="text-[10px] font-black uppercase">{pdfMinPlanName}+</span>
								</div>
							{:else if selectedFormat === format.value}
								<div
									class="absolute top-3 right-3 w-6 h-6 border-2 border-gray-900 shadow-[2px_2px_0_0_#1f2937] {format.bgColor} rounded-full flex items-center justify-center"
								>
									<i class="fa fa-check {format.textOnBg} text-xs font-bold" />
								</div>
							{/if}
							<div class="flex items-start gap-4">
								<div
									class="w-12 h-12 rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] flex items-center justify-center flex-shrink-0
									{isLocked
										? 'bg-gray-200 text-gray-400 border-gray-300 shadow-none'
										: selectedFormat === format.value
										? `${format.bgColor} ${format.textOnBg}`
										: 'bg-white text-gray-900'}"
								>
									<i class="fa {format.icon} text-xl" />
								</div>
								<div>
									<div class="font-black text-gray-900 text-base uppercase tracking-tight">
										{format.label}
									</div>
									<div class="text-xs font-bold text-gray-600 mt-1 leading-relaxed">
										{format.description}
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- PDF Preset Selection (only shown for PDF) -->
			{#if selectedFormat === 'pdf'}
				<div class="space-y-4 border-t-[3px] border-dashed border-gray-200 pt-6">
					<label class="text-xs font-black uppercase tracking-widest text-gray-900">Page Size</label
					>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{#each pdfPresets as preset}
							<button
								class="p-3 rounded-lg border-[3px] text-left transition-all
									{selectedPreset === preset.value
									? 'border-gray-900 bg-[#ff6b6b]/10 shadow-[4px_4px_0_0_#1f2937] translate-x-[-2px] translate-y-[-2px]'
									: 'border-gray-900 bg-white hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-[-2px] hover:translate-y-[-2px]'}"
								on:click={() => (selectedPreset = preset.value)}
							>
								<div class="font-black text-xs uppercase text-gray-900 tracking-tight">
									{preset.label}
								</div>
								<div class="text-[10px] font-bold text-gray-600 mt-1">
									{#if preset.value === 'CUSTOM'}
										{customWidth} × {customHeight} px
									{:else}
										{preset.width} × {preset.height} px
									{/if}
								</div>
							</button>
						{/each}
					</div>

					{#if selectedPreset === 'CUSTOM'}
						<div
							class="flex items-center gap-4 mt-4 p-5 bg-gray-50 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937]"
						>
							<div class="flex-1 space-y-1.5">
								<label class="text-[10px] font-black uppercase tracking-widest text-gray-900"
									>Width (px)</label
								>
								<input
									type="number"
									bind:value={customWidth}
									class="w-full px-4 py-2.5 border-[3px] border-gray-900 rounded-lg text-sm font-black focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:-translate-y-1 transition-all"
									min="100"
									max="5000"
								/>
							</div>
							<div class="text-gray-900 font-black text-xl pt-6">×</div>
							<div class="flex-1 space-y-1.5">
								<label class="text-[10px] font-black uppercase tracking-widest text-gray-900"
									>Height (px)</label
								>
								<input
									type="number"
									bind:value={customHeight}
									class="w-full px-4 py-2.5 border-[3px] border-gray-900 rounded-lg text-sm font-black focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] focus:-translate-y-1 transition-all"
									min="100"
									max="5000"
								/>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div
			class="px-6 py-4 border-t-[3px] border-gray-900 bg-gray-50 flex justify-end gap-4 overflow-visible shrink-0"
		>
			<button
				on:click={handleClose}
				class="px-6 py-3 rounded-xl border-[3px] border-gray-900 bg-white text-gray-900 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
			>
				Cancel
			</button>
			<button
				on:click={handleContinue}
				class="px-6 py-3 rounded-xl border-[3px] border-gray-900 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-[2px_2px_0_0_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2
					{selectedFormat === 'image'
					? 'bg-[#ffc480] text-gray-900 hover:bg-[#ffb360]'
					: 'bg-[#ff6b6b] text-white hover:bg-[#ff5252]'}"
			>
				Continue to Editor
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M14 5l7 7m0 0l-7 7m7-7H3"
					/></svg
				>
			</button>
		</div>
	</div>
</div>
