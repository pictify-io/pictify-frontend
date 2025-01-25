<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { toast } from '../../../../store/toast.store';
	import { createImagePublic } from '../../../../api/image';
	import Loader from '$lib/components/Loader.svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { html } from '@codemirror/lang-html';
	import { css } from '@codemirror/lang-css';
	import { javascript } from '@codemirror/lang-javascript';
	import { EditorView } from '@codemirror/view';
	import Toast from '$lib/components/Toast.svelte';
	import OgImageTemplate from '$lib/components/tools/OgImageTemplate.svelte';

	const dispatch = createEventDispatcher();

	export let template;
	export let isUserLoggedIn = false;
	export let isSavedTemplate = false;

	// Editor state
	let isGenerating = false;
	let isLoading = false;
	let imageUrl = '';
	let currentTab = 'visual'; // visual or code
	let codeHTML = '';
	let settings = {
		heading: '',
		subHeading: '',
		logo: null,
		width: 1200,
		height: 630,
		backgroundColor: { r: 255, g: 255, b: 255 },
		headingColor: { r: 0, g: 0, b: 0 },
		subHeadingColor: { r: 0, g: 0, b: 0 }
	};

	let backgroundColorRgb = {r: 255, g: 255, b: 255};
	let headingColorRgb = {r: 0, g: 0, b: 0};
	let subHeadingColorRgb = {r: 0, g: 0, b: 0};
	let logoWidth = 150;

	let previewFrame;
	let previewDoc;
	let previewContainer;
	let scale = 1;
	let resizeTimeout;
	let lastContainerWidth = 0;

	// Function to calculate scale
	const calculateScale = () => {
		if (previewContainer) {
			const containerWidth = previewContainer.clientWidth;
			// Only update if width actually changed
			if (containerWidth !== lastContainerWidth) {
				lastContainerWidth = containerWidth;
				const newScale = containerWidth / 1200 ;
				if (newScale !== scale) {
					scale = newScale;
					if (previewFrame) {
						previewFrame.style.transform = `scale(${scale})`;
					}
				}
			}
		}
	};

	// Add resize observer with debouncing
	onMount(() => {
		const resizeObserver = new ResizeObserver(() => {
			// Clear existing timeout
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			// Set new timeout
			resizeTimeout = setTimeout(() => {
				calculateScale();
			}, 100); // 100ms debounce
		});

		if (previewContainer) {
			resizeObserver.observe(previewContainer);
			// Initial calculation
			calculateScale();
		}

		return () => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			resizeObserver.disconnect();
		};
	});

	// Reactive statement to sync template with codeHTML
	$: {
		if (template) {
			if (typeof template === 'string') {
				codeHTML = template.trim();
			} else if (template?.html) {
				codeHTML = template.html.trim();
			}
			updateHTML(template);
		}
	}

	// Reactive statement to sync preview frame with codeHTML
	$: {
		if (currentTab === 'visual' && previewFrame) {
			previewFrame.srcdoc = codeHTML;
		}
	}

	const editorConfig = {
		basicSetup: true,
		extensions: [EditorView.lineWrapping],
		lang: css({
			selfClosingTags: true,
			matchClosingTags: true
		})
	};

	// Font options
	const popularFonts = [
		{id:'Arial', name: 'Arial', className: 'arial'},
		{ id: 'Roboto', name: 'Roboto', className: 'roboto' },
		{ id: 'Open Sans', name: 'Open Sans', className: 'open-sans' },
		{ id: 'Montserrat', name: 'Montserrat', className: 'montserrat' },
		{ id: 'Poppins', name: 'Poppins', className: 'poppins' },
		{ id: 'Inter', name: 'Inter', className: 'inter' }
	];

	let selectedFont = popularFonts[0];

	// Functions
	const updateHeading = (event) => {
		settings.heading = event.target.value;
		updatePreview();
	};

	const updateSubHeading = (event) => {
		settings.subHeading = event.target.value;
		updatePreview();
	};

	const updateLogo = async (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				settings.logo = e.target.result;
				updatePreview();
			};
			reader.readAsDataURL(file);
		}
	};

	const updateBackgroundColor = (event) => {
		backgroundColorRgb = event.detail.rgb;
		updatePreview();
	};

	const updateHeadingColor = (event) => {
		headingColorRgb = event.detail.rgb;
		updatePreview();
	};

	const updateFont = (event) => {
		selectedFont = popularFonts[event.target.selectedIndex];
		updatePreview();
	};

	const updateLogoWidth = (event) => {
		logoWidth = event.target.value;
		updatePreview();
	};

	const handleIframeLoad = () => {
		if (currentTab === 'visual') {
			previewDoc = previewFrame?.contentDocument;
			calculateScale();
			updatePreview();
		}
	};

	const updatePreview = () => {
		if (currentTab === 'visual' && previewDoc) {
			const heading = previewDoc.querySelector('#template-heading');
			const subHeading = previewDoc.querySelector('#template-subheading');
			const logo = previewDoc.querySelector('#template-logo');

			if (heading) heading.innerHTML = settings.heading;
			if (subHeading) subHeading.innerHTML = settings.subHeading;

			if (logo && settings.logo) {
				const img = document.createElement('img');
				img.src = settings.logo;
				img.width = logoWidth;
				img.id = 'template-logo';
				logo.replaceWith(img);
			}

			try {
				// Update colors in the preview
				const root = previewDoc.documentElement;
				root.style.setProperty('--primary-color', `rgb(${backgroundColorRgb.r}, ${backgroundColorRgb.g}, ${backgroundColorRgb.b})`);
				root.style.setProperty('--secondary-color', `rgb(${headingColorRgb.r}, ${headingColorRgb.g}, ${headingColorRgb.b})`);
				root.style.fontFamily = selectedFont.id;
				
				// Update codeHTML with the current state of the preview
				codeHTML = previewDoc.documentElement.outerHTML;
			} catch (error) {
				console.error('Error updating preview:', error);
			}
		}
	};

	function updateHTML(template) {
		try {
			// Create a temporary DOM parser to extract values from HTML
			const parser = new DOMParser();
			const doc = parser.parseFromString(typeof template === 'string' ? template : template.html, 'text/html');

			// Extract heading and subheading
			const heading = doc.querySelector('#template-heading');
			const subHeading = doc.querySelector('#template-subheading');
			const logo = doc.querySelector('#template-logo');

			// Update settings with extracted values
			settings = {
				...settings,
				heading: heading?.textContent || '',
				subHeading: subHeading?.textContent || '',
				logo: logo?.src || null,
				width: template?.width || 1200,
				height: template?.height || 630
			};

			// Function to extract RGB values from different formats
			const extractRGB = (colorString) => {
				if (!colorString) return null;
				
				// Handle hex colors
				if (colorString.startsWith('#')) {
					const hex = colorString.replace('#', '');
					return {
						r: parseInt(hex.substring(0, 2), 16),
						g: parseInt(hex.substring(2, 4), 16),
						b: parseInt(hex.substring(4, 6), 16)
					};
				}
				
				// Handle rgb/rgba colors
				const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
				if (rgbMatch) {
					return {
						r: parseInt(rgbMatch[1]),
						g: parseInt(rgbMatch[2]),
						b: parseInt(rgbMatch[3])
					};
				}
				return null;
			};

			// Function to extract CSS variables from style tag
			const extractCSSVariables = () => {
				const styleTag = doc.querySelector('style');
				if (!styleTag) return null;

				const cssText = styleTag.textContent;
				const rootMatch = cssText.match(/:root\s*{([^}]+)}/);
				if (!rootMatch) return null;

				const cssVars = {};
				const varRegex = /--([^:]+):\s*([^;]+);/g;
				let match;

				while ((match = varRegex.exec(rootMatch[1])) !== null) {
					cssVars[match[1].trim()] = match[2].trim();
				}

				return cssVars;
			};

			// Extract CSS variables
			const cssVars = extractCSSVariables();
			let foundColors = false;

			if (cssVars) {
				// Extract primary color (background)
				const primaryColor = cssVars['primary-color'];
				if (primaryColor) {
					const rgb = extractRGB(primaryColor);
					if (rgb) {
						backgroundColorRgb = rgb;
						foundColors = true;
					}
				}

				// Extract secondary color (text)
				const secondaryColor = cssVars['secondary-color'];
				if (secondaryColor) {
					const rgb = extractRGB(secondaryColor);
					if (rgb) {
						headingColorRgb = rgb;
						foundColors = true;
					}
				}

				// Extract tertiary color (subheading)
				const tertiaryColor = cssVars['tertiary-color'];
				if (tertiaryColor) {
					const rgb = extractRGB(tertiaryColor);
					if (rgb) {
						subHeadingColorRgb = rgb;
						foundColors = true;
					}
				}
			}

			// If no colors found in CSS variables, try computed styles
			if (!foundColors) {
				// Create a temporary iframe to compute styles
				const tempFrame = document.createElement('iframe');
				tempFrame.style.display = 'none';
				document.body.appendChild(tempFrame);
				tempFrame.contentDocument.write(doc.documentElement.outerHTML);
				
				try {
					const computedContainer = tempFrame.contentDocument.querySelector('.container');
					const computedHeading = tempFrame.contentDocument.querySelector('#template-heading');
					const computedSubheading = tempFrame.contentDocument.querySelector('#template-subheading');

					if (computedContainer) {
						const bgColor = getComputedStyle(computedContainer).backgroundColor;
						const rgb = extractRGB(bgColor);
						if (rgb) backgroundColorRgb = rgb;
					}

					if (computedHeading) {
						const textColor = getComputedStyle(computedHeading).color;
						const rgb = extractRGB(textColor);
						if (rgb) headingColorRgb = rgb;
					}

					if (computedSubheading) {
						const textColor = getComputedStyle(computedSubheading).color;
						const rgb = extractRGB(textColor);
						if (rgb) subHeadingColorRgb = rgb;
					}
				} finally {
					document.body.removeChild(tempFrame);
				}
			}

			// Extract font family
			const fontFamily = doc.documentElement.getAttribute('style')?.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1];
			if (fontFamily) {
				const matchedFont = popularFonts.find(font => fontFamily.includes(font.id));
				if (matchedFont) {
					selectedFont = matchedFont;
				}
			}

			// Extract logo width if it exists
			if (logo) {
				logoWidth = parseInt(logo.getAttribute('width')) || 150;
			}

			// If template has settings, use them as fallback
			if (template?.settings) {
				settings = { ...settings, ...template.settings };
				backgroundColorRgb = template.settings.backgroundColor || backgroundColorRgb;
				headingColorRgb = template.settings.headingColor || headingColorRgb;
				subHeadingColorRgb = template.settings.subHeadingColor || subHeadingColorRgb;
				selectedFont = template.settings.font || selectedFont;
				logoWidth = template.settings.logoWidth || logoWidth;
			}
		} catch (error) {
			console.error('Error updating HTML:', error);
		}
	}

	function saveTemplate() {
		if (!isUserLoggedIn) {
			showSignupPrompt = true;
			return;
		}

		dispatch('save', { 
			template: codeHTML,
			settings: {
				...settings,
				backgroundColor: backgroundColorRgb,
				headingColor: headingColorRgb,
				subHeadingColor: subHeadingColorRgb,
				font: selectedFont,
				logoWidth
			}
		});
	}

	function handleClose() {
		dispatch('close');
	}

	function generateImage() {
		isGenerating = true;
		createImagePublic({
			html: codeHTML,
			width: settings.width,
			height: settings.height
		})
			.then(({ image }) => {
				imageUrl = image.url;
				dispatch('generated', { 
					imageUrl, 
					template: codeHTML,
					settings: {
						...settings,
						backgroundColor: backgroundColorRgb,
						headingColor: headingColorRgb,
						subHeadingColor: subHeadingColorRgb,
						font: selectedFont,
						logoWidth
					}
				});
				toast.set({ message: 'Image generated successfully!', duration: 1500 });
			})
			.catch((error) => {
				console.error('Error generating image:', error);
				toast.set({ message: 'Failed to generate image', duration: 1500 });
			})
			.finally(() => {
				isGenerating = false;
			});
	}
</script>

<div class="border-2 border-gray-900 rounded-md">
	<!-- Preview Section -->
	<div class="border-b-2 border-gray-900">
		<div class="flex bg-black p-2">
			<button
				on:click={() => currentTab = 'visual'}
				class="px-4 py-2 rounded text-sm {currentTab === 'visual' ? 'bg-white text-black' : 'bg-gray-500 text-white'}"
			>
				Visual Editor
			</button>
			<button
				on:click={() => currentTab = 'code'}
				class="ml-4 px-4 py-2 rounded text-sm {currentTab === 'code' ? 'bg-white text-black' : 'bg-gray-500 text-white'}"
			>
				HTML
			</button>
		</div>
		<div class="p-6">
			{#if currentTab === 'visual'}
				<div class="bg-gray-50 rounded-md overflow-hidden">
					<div bind:this={previewContainer} class="preview-container">
						<iframe
							bind:this={previewFrame}
							id="preview-frame"
							srcdoc={codeHTML}
							class="rounded-md"
							title="OG Image Preview"
							on:load={handleIframeLoad}
						/>
					</div>
				</div>
			{:else}
				<div class="bg-gray-50 rounded-md h-[400px] overflow-auto code-editor-container">
					<CodeMirror
						bind:value={codeHTML}
						{...editorConfig}
						on:change={(e) => {
							codeHTML = e.detail;
							template = e.detail;
						}}
					/>
				</div>
			{/if}
		</div>
	</div>

	{#if currentTab === 'visual'}
		<!-- Editor Controls -->
		<div class="p-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<!-- Basic Settings -->
				<div class="space-y-4">
					<h3 class="text-lg font-medium">Basic Settings</h3>
					<div>
						<label class="block text-sm font-medium text-gray-700">Heading</label>
						<input
							type="text"
							bind:value={settings.heading}
							on:input={updateHeading}
							class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:ring-0"
							placeholder="Enter heading"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Sub Heading</label>
						<textarea
							class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:ring-0"
							rows="3"
							bind:value={settings.subHeading}
							on:input={updateSubHeading}
							placeholder="Enter sub heading"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Logo</label>
						<input
							type="file"
							accept="image/*"
							on:change={updateLogo}
							class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:ring-0"
						/>
						{#if settings.logo}
							<div class="mt-2">
								<img src={settings.logo} alt="Logo Preview" class="h-12 object-contain" />
							</div>
						{/if}
					</div>
				</div>

				<!-- Style Settings -->
				<div class="space-y-4">
					<h3 class="text-lg font-medium">Style Settings</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700">Width</label>
							<input
								type="number"
								bind:value={settings.width}
								min="100"
								max="1200"
								class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:ring-0"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700">Height</label>
							<input
								type="number"
								bind:value={settings.height}
								min="100"
								max="1200"
								class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:ring-0"
							/>
						</div>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Font Family</label>
						<select
							class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:border-black focus:ring-0"
							on:change={updateFont}
						>
							{#each popularFonts as font}
								<option value={font.id}>{font.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Colors</label>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-xs text-gray-500 mb-1">Background</label>
								<ColorPicker
									bind:rgb={backgroundColorRgb}
									isDialog={true}
									on:input={updateBackgroundColor}
								/>
							</div>
							<div>
								<label class="block text-xs text-gray-500 mb-1">Text</label>
								<ColorPicker
									bind:rgb={headingColorRgb}
									isDialog={true}
									on:input={updateHeadingColor}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="p-6 border-t-2 border-gray-900">
		<div class="flex justify-between items-center">
			<button
				class="px-6 py-2 border-2 border-gray-900 text-gray-900 rounded-md hover:bg-gray-100"
				on:click={handleClose}
			>
				Cancel
			</button>
			<div class="flex gap-4">
				{#if isUserLoggedIn}
					{#if isSavedTemplate}
						<button
							class="px-6 py-2 border-2 border-gray-900 text-gray-900 rounded-md hover:bg-gray-100"
							on:click={() => dispatch('update', { template: currentTab === 'code' ? codeHTML : (typeof template === 'string' ? template : template.html), settings })}
						>
							Update Template
						</button>
					{:else}
						<button
							class="px-6 py-2 border-2 border-gray-900 text-gray-900 rounded-md hover:bg-gray-100"
							on:click={saveTemplate}
						>
							Save Template
						</button>
					{/if}
				{/if}
				<button
					class="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={generateImage}
					disabled={isGenerating}
				>
					{#if isGenerating}
						<div class="flex items-center gap-2">
							<Loader size="4" show={true} />
							<span>Generating...</span>
						</div>
					{:else}
						Generate Image
					{/if}
				</button>
			</div>
		</div>

		<!-- Generated Image -->
		{#if imageUrl}
			<div class="mt-8 p-4 border-2 border-gray-900 rounded-md">
				<h3 class="text-lg font-bold mb-4">Generated Image</h3>
				<div class="flex items-start gap-4">
					<img src={imageUrl} alt="Generated OG Image" class="w-48 rounded-md border-2 border-gray-900" />
					<div class="flex-1">
						<p class="text-sm font-bold mb-2">Image URL:</p>
						<div class="flex items-center gap-2">
							<input
								type="text"
								value={imageUrl}
								readonly
								class="flex-1 bg-gray-50 border-2 border-gray-900 rounded-md px-3 py-1 text-sm"
							/>
							<button
								class="px-3 py-1 bg-black text-white rounded-md text-sm hover:bg-gray-900"
								on:click={() => {
									navigator.clipboard.writeText(imageUrl);
									toast.set({ message: 'URL copied to clipboard', duration: 1500 });
								}}
							>
								Copy URL
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<Toast />

<style>
	:global(.color-picker-dialog),
	:global(.color-picker) {
		z-index: 9999 !important;
	}

	:global(.color-picker-container) {
		position: relative !important;
		z-index: 9999 !important;
	}

	:global(.code-editor-container .cm-scroller::-webkit-scrollbar) {
		width: 10px;
		height: 10px;
	}

	:global(.code-editor-container .cm-scroller::-webkit-scrollbar-track) {
		background: #f1f1f1;
		border-radius: 5px;
	}

	:global(.code-editor-container .cm-scroller::-webkit-scrollbar-thumb) {
		background: #888;
		border-radius: 5px;
	}

	:global(.code-editor-container .cm-scroller::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}

	:global(#preview-frame) {
		width: 1200px !important;
		height: 630px !important;
		transform-origin: 0 0 !important;
	}

	.preview-container {
		width: 100%;
		height: 0;
		padding-bottom: 52.5%;
		position: relative;
		overflow: hidden;
	}
</style> 