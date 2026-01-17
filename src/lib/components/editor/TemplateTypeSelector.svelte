<script>
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	let selectedFormat = 'image';
	let selectedPreset = 'CUSTOM';
	
	const formats = [
		{ 
			value: 'image', 
			label: 'Image Template', 
			icon: 'fa-image',
			description: 'PNG/JPEG output for social media, OG images, banners',
			color: 'blue'
		},
		{ 
			value: 'pdf', 
			label: 'PDF Document', 
			icon: 'fa-file-pdf',
			description: 'Multi-page PDF with selectable text for invoices, reports',
			color: 'red'
		}
	];
	
	const pdfPresets = [
		{ value: 'A4', label: 'A4', width: 595, height: 842, description: 'Standard document' },
		{ value: 'A4_LANDSCAPE', label: 'A4 Landscape', width: 842, height: 595, description: 'Wide format' },
		{ value: 'LETTER', label: 'Letter', width: 612, height: 792, description: 'US standard' },
		{ value: 'LETTER_LANDSCAPE', label: 'Letter Landscape', width: 792, height: 612, description: 'US wide' },
		{ value: 'LEGAL', label: 'Legal', width: 612, height: 1008, description: 'Legal documents' },
		{ value: 'A3', label: 'A3', width: 842, height: 1191, description: 'Large format' },
		{ value: 'CUSTOM', label: 'Custom Size', width: 1080, height: 1080, description: 'Define your own' },
	];
	
	let customWidth = 1080;
	let customHeight = 1080;
	
	$: currentPreset = pdfPresets.find(p => p.value === selectedPreset);
	
	function handleClose() {
		dispatch('close');
	}

	function handleContinue() {
		const dimensions = selectedFormat === 'image' 
			? { width: 1080, height: 1080 }
			: (selectedPreset === 'CUSTOM' 
				? { width: customWidth, height: customHeight }
				: { width: currentPreset.width, height: currentPreset.height });
		
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
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" on:click|self={handleClose}>
	<div class="bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
		<!-- Header -->
		<div class="px-6 py-4 border-b-[3px] border-gray-900 bg-[#ffc480]">
			<h2 class="text-xl font-black uppercase tracking-wider text-gray-900">
				Create New Template
			</h2>
			<p class="text-sm text-gray-700 mt-1">Choose the output format for your template</p>
		</div>
		
		<!-- Content -->
		<div class="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
			<!-- Format Selection -->
			<div class="space-y-3">
				<label class="text-sm font-bold uppercase tracking-wider text-gray-700">Output Format</label>
				<div class="grid grid-cols-2 gap-4">
					{#each formats as format}
						<button
							class="relative p-4 rounded-xl border-[3px] text-left transition-all
								{selectedFormat === format.value 
									? `border-${format.color}-500 bg-${format.color}-50 shadow-[4px_4px_0_0_#1f2937]`
									: 'border-gray-300 bg-white hover:border-gray-400'}"
							on:click={() => selectedFormat = format.value}
						>
							{#if selectedFormat === format.value}
								<div class="absolute top-2 right-2 w-5 h-5 bg-{format.color}-500 rounded-full flex items-center justify-center">
									<i class="fa fa-check text-white text-xs"></i>
								</div>
							{/if}
							<div class="flex items-start gap-3">
								<div class="w-12 h-12 rounded-lg flex items-center justify-center
									{selectedFormat === format.value 
										? (format.color === 'blue' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white')
										: 'bg-gray-100 text-gray-500'}">
									<i class="fa {format.icon} text-xl"></i>
								</div>
								<div>
									<div class="font-bold text-gray-900">{format.label}</div>
									<div class="text-xs text-gray-500 mt-0.5">{format.description}</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
			
			<!-- PDF Preset Selection (only shown for PDF) -->
			{#if selectedFormat === 'pdf'}
				<div class="space-y-3 border-t-2 border-gray-200 pt-5">
					<label class="text-sm font-bold uppercase tracking-wider text-gray-700">Page Size</label>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{#each pdfPresets as preset}
							<button
								class="p-3 rounded-lg border-2 text-left transition-all
									{selectedPreset === preset.value 
										? 'border-red-500 bg-red-50 shadow-[3px_3px_0_0_#1f2937]'
										: 'border-gray-200 bg-white hover:border-gray-300'}"
								on:click={() => selectedPreset = preset.value}
							>
								<div class="font-bold text-sm text-gray-900">{preset.label}</div>
								<div class="text-xs text-gray-500">
									{#if preset.value === 'CUSTOM'}
										{customWidth} × {customHeight}
									{:else}
										{preset.width} × {preset.height}
									{/if}
								</div>
							</button>
						{/each}
					</div>
					
					{#if selectedPreset === 'CUSTOM'}
						<div class="flex items-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
							<div class="flex-1">
								<label class="text-xs font-bold uppercase text-gray-600">Width</label>
								<input 
									type="number" 
									bind:value={customWidth}
									class="w-full mt-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-bold focus:border-gray-900 focus:outline-none"
									min="100"
									max="5000"
								/>
							</div>
							<div class="text-gray-400 font-bold pt-5">×</div>
							<div class="flex-1">
								<label class="text-xs font-bold uppercase text-gray-600">Height</label>
								<input 
									type="number" 
									bind:value={customHeight}
									class="w-full mt-1 px-3 py-2 border-2 border-gray-300 rounded-lg font-bold focus:border-gray-900 focus:outline-none"
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
		<div class="px-6 py-4 border-t-[3px] border-gray-900 bg-gray-50 flex justify-end gap-3">
			<button 
				on:click={handleClose}
				class="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-600 font-bold uppercase text-sm hover:border-gray-400 transition-colors"
			>
				Cancel
			</button>
			<button
				on:click={handleContinue}
				class="px-6 py-2.5 rounded-xl border-[3px] border-gray-900 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all
					{selectedFormat === 'image' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}"
			>
				<i class="fa fa-arrow-right mr-2"></i>
				Continue to Editor
			</button>
		</div>
	</div>
</div>
