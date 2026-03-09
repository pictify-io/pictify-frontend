<script>
	import { activeSidebarTab, editor } from '../../../store/editor.store';
	import { IText, Textbox, Rect, Circle, FabricImage } from 'fabric';
	import ShapesIconsLibrary from './ShapesIconsLibrary.svelte';
	import TextPresetLibrary from './TextPresetLibrary.svelte';
	import ChartTableLibrary from './ChartTableLibrary.svelte';
	import QRCodeLibrary from './QRCodeLibrary.svelte';
	import BrandAssetsLibrary from './BrandAssetsLibrary.svelte';
	import CopilotPanel from './CopilotPanel.svelte';
	import PanelTabs from './ui/PanelTabs.svelte';

	let imageUrlInput = '';
	let textMode = 'presets'; // 'basic' or 'presets'

	function addComponent(type, content, style = {}) {
		if (!$editor) return;

		let object;
		const center = $editor.getCenter();
		const defaultOptions = {
			left: center.left,
			top: center.top,
			originX: 'center',
			originY: 'center',
			...style
		};

		if (type === 'text') {
			object = new IText(content, {
				...defaultOptions,
				fontSize: style['font-size'] ? parseInt(style['font-size']) : 20,
				fill: '#000000'
			});
		} else if (type === 'textbox') {
			object = new Textbox(content, {
				...defaultOptions,
				fontSize: style['font-size'] ? parseInt(style['font-size']) : 20,
				fill: '#000000',
				width: style.width ? parseInt(style.width) : 300,
				splitByGrapheme: false,
				textAlign: 'left',
				lockScalingY: true
			});
		} else if (type === 'rect') {
			object = new Rect({
				...defaultOptions,
				width: parseInt(style.width) || 100,
				height: parseInt(style.height) || 100,
				fill: style['background-color'] || '#cccccc'
			});
		} else if (type === 'circle') {
			object = new Circle({
				...defaultOptions,
				radius: (parseInt(style.width) || 100) / 2,
				fill: style['background-color'] || '#cccccc'
			});
		}

		if (object) {
			$editor.add(object);
			$editor.setActiveObject(object);
			$editor.renderAll();
		}
	}

	function handleFileUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (f) => {
			const data = f.target.result;
			FabricImage.fromURL(data).then((img) => {
				if (!$editor) return;

				const center = $editor.getCenter();
				img.set({
					left: center.left,
					top: center.top,
					originX: 'center',
					originY: 'center'
				});

				// Scale down if too big
				if (img.width > 500) {
					img.scaleToWidth(500);
				}

				$editor.add(img);
				$editor.setActiveObject(img);
				$editor.renderAll();
			});
		};
		reader.readAsDataURL(file);
		event.target.value = ''; // Reset input
	}

	function handleUrlImageImport() {
		if (!imageUrlInput.trim() || !$editor) return;

		FabricImage.fromURL(imageUrlInput, { crossOrigin: 'anonymous' })
			.then((img) => {
				const center = $editor.getCenter();
				img.set({
					left: center.left,
					top: center.top,
					originX: 'center',
					originY: 'center'
				});

				// Scale down if too big
				const maxSize = Math.min($editor.width, $editor.height) * 0.8;
				if (img.width > maxSize) {
					img.scaleToWidth(maxSize);
				}

				$editor.add(img);
				$editor.setActiveObject(img);
				$editor.renderAll();
				imageUrlInput = ''; // Reset input
			})
			.catch((error) => {
				console.error('Error loading image from URL:', error);
				alert('Failed to load image from URL. Please check the URL and try again.');
			});
	}

	function addText(tag, text, fontSize) {
		addComponent('text', text, { 'font-size': fontSize });
	}

	function addTextArea(text, fontSize, width = 250) {
		addComponent('textbox', text, { 'font-size': fontSize, width });
	}

	let displayTab = $activeSidebarTab;

	$: if ($activeSidebarTab) {
		displayTab = $activeSidebarTab;
	}
</script>

<div
	class="w-full bg-[#FFFDF8] h-full flex flex-col transition-all duration-300 z-0 overflow-hidden"
>
	{#if displayTab === 'copilot'}
		<CopilotPanel />
	{:else}
		<div class="px-5 py-4 border-b-[3px] border-gray-900 flex-shrink-0 bg-[#FFFDF8]">
			<h3 class="font-black text-sm text-gray-900 uppercase tracking-widest">{displayTab}</h3>
		</div>
		<div class="px-4 py-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-[#FFFDF8]">
			{#if displayTab === 'elements'}
				<ShapesIconsLibrary />
			{:else if displayTab === 'text'}
				<!-- Mode Tabs -->
				<div class="mb-4 -mx-4 -mt-4">
					<PanelTabs
						tabs={[
							{ id: 'basic', label: 'Basic' },
							{ id: 'presets', label: 'Presets' }
						]}
						activeTab={textMode}
						on:change={(e) => (textMode = e.detail)}
					/>
				</div>

				<!-- Content based on mode -->
				{#if textMode === 'basic'}
					<div class="space-y-3">
						<button
							class="w-full p-4 bg-white border-[2px] border-gray-900 rounded-xl text-left hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 transition-all group shadow-sm"
							on:click={() => addText('h1', 'Heading', '32px')}
						>
							<h1 class="text-2xl font-black text-gray-900 group-hover:text-black">
								Add a heading
							</h1>
						</button>
						<button
							class="w-full p-4 bg-white border-[2px] border-gray-900 rounded-xl text-left hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 transition-all group shadow-sm"
							on:click={() => addText('h2', 'Subheading', '24px')}
						>
							<h2 class="text-xl font-bold text-gray-800 group-hover:text-black">
								Add a subheading
							</h2>
						</button>
						<button
							class="w-full p-4 bg-white border-[2px] border-gray-900 rounded-xl text-left hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-1 transition-all group shadow-sm"
							on:click={() => addText('p', 'Body text', '16px')}
						>
							<p class="text-base font-medium text-gray-700 group-hover:text-black">
								Add a little bit of body text
							</p>
						</button>

						<!-- Text Area (auto-wrapping) -->
						<div class="pt-3 mt-3 border-t-[2px] border-gray-200">
							<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Text Area (auto-wrap)</p>
							<button
								class="w-full p-4 bg-white border-[2px] border-gray-900 rounded-xl text-left hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-1 transition-all group shadow-sm"
								on:click={() => addTextArea('Type your paragraph text here. This text area will automatically wrap within its bounds.', '16px', 300)}
							>
								<div class="flex items-start gap-3">
									<div class="w-8 h-8 rounded bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
										<i class="fa fa-align-left text-xs text-gray-900" />
									</div>
									<div>
										<p class="text-sm font-bold text-gray-900 group-hover:text-black">Add a text area</p>
										<p class="text-[10px] font-medium text-gray-500 mt-0.5">Auto-wraps text within a fixed width</p>
									</div>
								</div>
							</button>
						</div>
					</div>
				{:else}
					<TextPresetLibrary />
				{/if}
			{:else if displayTab === 'uploads'}
				<div class="space-y-4">
					<label class="block cursor-pointer">
						<input type="file" accept="image/*" class="hidden" on:change={handleFileUpload} />
						<div
							class="w-full py-10 border-[3px] border-dashed border-gray-900 rounded-xl hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-3 group bg-[#FFFDF8]"
						>
							<div
								class="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_#ffc480]"
							>
								<i class="fa fa-cloud-upload text-xl text-white" />
							</div>
							<div class="text-center">
								<span class="text-xs font-black text-gray-900 uppercase tracking-widest"
									>Upload Image</span
								>
								<p class="text-[10px] font-bold text-gray-500 mt-1 uppercase">
									PNG, JPG, SVG up to 10MB
								</p>
							</div>
						</div>
					</label>

					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={imageUrlInput}
							placeholder="PASTE IMAGE URL..."
							class="flex-1 px-3 py-2 bg-white border-[2px] border-gray-900 rounded-lg text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:shadow-[4px_4px_0_0_#ffc480] transition-all uppercase tracking-wide"
							on:keydown={(e) => e.key === 'Enter' && handleUrlImageImport()}
						/>
						<button
							class="px-4 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_0_#1f2937] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] border-[2px] border-gray-900"
							on:click={handleUrlImageImport}
							disabled={!imageUrlInput.trim()}
						>
							Add
						</button>
					</div>
				</div>
			{:else if displayTab === 'charts'}
				<ChartTableLibrary />
			{:else if displayTab === 'qrcodes'}
				<QRCodeLibrary />
			{:else if displayTab === 'brand'}
				<BrandAssetsLibrary />
			{:else if displayTab === 'layers'}
				<div class="text-center text-gray-400 mt-10">
					<div
						class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-[3px] border-gray-900"
					>
						<i class="fa fa-layer-group text-2xl text-gray-900" />
					</div>
					<p class="text-xs font-bold text-gray-900 uppercase tracking-widest">
						Layers coming soon
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
