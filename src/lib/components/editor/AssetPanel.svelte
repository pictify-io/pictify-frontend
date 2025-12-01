<script>
	import { activeSidebarTab, editor } from '../../../store/editor.store';
	import { IText, Rect, Circle, FabricImage } from 'fabric';
	import ShapesIconsLibrary from './ShapesIconsLibrary.svelte';
	import TextPresetLibrary from './TextPresetLibrary.svelte';
	import ChartTableLibrary from './ChartTableLibrary.svelte';

	let fileInput;
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

	function triggerUpload() {
		fileInput.click();
	}
	
	function handleUrlImageImport() {
		if (!imageUrlInput.trim() || !$editor) return;
		
		FabricImage.fromURL(imageUrlInput, { crossOrigin: 'anonymous' }).then((img) => {
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
		}).catch((error) => {
			console.error('Error loading image from URL:', error);
			alert('Failed to load image from URL. Please check the URL and try again.');
		});
	}

	function addText(tag, text, fontSize) {
		addComponent('text', text, { 'font-size': fontSize });
	}
	
	function addShape(shape) {
		if (shape === 'box') {
			addComponent('rect', '', { width: '100px', height: '100px', 'background-color': '#e2e8f0' });
		} else if (shape === 'circle') {
			addComponent('circle', '', { width: '100px', height: '100px', 'background-color': '#e2e8f0' });
		}
	}
	let displayTab = $activeSidebarTab;

	$: if ($activeSidebarTab) {
		displayTab = $activeSidebarTab;
	}
</script>

<div class="w-full bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 shadow-sm z-0 overflow-hidden">
	<div class="px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
		<h3 class="font-bold text-sm text-gray-900 uppercase tracking-wider">{displayTab}</h3>
		<p class="text-xs text-gray-500 mt-1">Drag and drop to add to canvas</p>
	</div>
	<div class="px-4 py-4 flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-gray-50/50">
		{#if displayTab === 'elements'}
			<ShapesIconsLibrary />
		{:else if displayTab === 'text'}
			<!-- Mode Tabs -->
			<div class="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
				<button
					class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all {textMode === 'basic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					on:click={() => textMode = 'basic'}
				>
					Basic
				</button>
				<button
					class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all {textMode === 'presets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
					on:click={() => textMode = 'presets'}
				>
					Presets
				</button>
			</div>

			<!-- Content based on mode -->
			{#if textMode === 'basic'}
				<div class="space-y-3">
					<button class="w-full p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-[#ff6b6b] hover:shadow-md transition-all group" on:click={() => addText('h1', 'Heading', '32px')}>
						<h1 class="text-2xl font-bold text-gray-800 group-hover:text-[#ff6b6b]">Add a heading</h1>
					</button>
					<button class="w-full p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-[#ff6b6b] hover:shadow-md transition-all group" on:click={() => addText('h2', 'Subheading', '24px')}>
						<h2 class="text-xl font-semibold text-gray-700 group-hover:text-[#ff6b6b]">Add a subheading</h2>
					</button>
					<button class="w-full p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-[#ff6b6b] hover:shadow-md transition-all group" on:click={() => addText('p', 'Body text', '16px')}>
						<p class="text-base text-gray-600 group-hover:text-[#ff6b6b]">Add a little bit of body text</p>
					</button>
				</div>
			{:else}
				<TextPresetLibrary />
			{/if}
		{:else if displayTab === 'uploads'}
			<div class="space-y-3">
				<label>
					<input
						type="file"
						accept="image/*"
						class="hidden"
						on:change={handleFileUpload}
					/>
					<div
						class="w-full py-10 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#ff6b6b] hover:bg-[#ff6b6b]/5 transition-all flex flex-col items-center justify-center gap-3 group bg-white"
					>
						<div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#ff6b6b]/10 transition-colors">
							<i class="fa fa-cloud-upload text-xl text-gray-500 group-hover:text-[#ff6b6b]"></i>
						</div>
						<div class="text-center">
							<span class="text-sm font-semibold text-gray-700 group-hover:text-[#ff6b6b]">Upload Image</span>
							<p class="text-xs text-gray-400 mt-1">PNG, JPG, SVG up to 10MB</p>
						</div>
					</div>
				</label>

				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={imageUrlInput}
						placeholder="Or paste image URL..."
						class="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b] transition-shadow"
						on:keydown={(e) => e.key === 'Enter' && handleUrlImageImport()}
					/>
					<button 
						class="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
						on:click={handleUrlImageImport}
						disabled={!imageUrlInput.trim()}
					>
						Add
					</button>
				</div>
			</div>
		{:else if displayTab === 'charts'}
			<ChartTableLibrary />
		{:else if displayTab === 'layers'}
			<div class="text-center text-gray-400 mt-10">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<i class="fa fa-layer-group text-2xl text-gray-300"></i>
				</div>
				<p class="text-sm font-medium text-gray-500">Layers coming soon</p>
			</div>
		{/if}
	</div>
</div>
