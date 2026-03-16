<script>
	import { editor } from '../../../store/editor.store';
	import { IText, Group, Rect, ActiveSelection } from 'fabric';

	const presets = [
		{
			id: 'quick-win',
			name: 'Quick Win',
			category: 'Bold',
			elements: [
				{
					text: 'quick',
					fontSize: 32,
					fontFamily: 'Satisfy',
					fill: '#1a1a1a',
					fontWeight: 400,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 0,
					offsetX: -45
				},
				{
					text: 'WIN',
					fontSize: 56,
					fontFamily: 'Montserrat',
					fill: '#3b82f6',
					fontWeight: 900,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 35,
					offsetX: 20
				}
			]
		},
		{
			id: 'team-sync',
			name: 'Team Sync',
			category: 'Modern',
			elements: [
				{
					text: '> <',
					fontSize: 42,
					fontFamily: 'Courier New',
					fill: '#475569',
					fontWeight: 700,
					letterSpacing: -200,
					lineHeight: 1,
					offsetY: 0,
					offsetX: 0
				},
				{
					text: 'team',
					fontSize: 36,
					fontFamily: 'Montserrat',
					fill: '#475569',
					fontWeight: 600,
					letterSpacing: 20,
					lineHeight: 1,
					offsetY: 50,
					offsetX: 0
				},
				{
					text: 'sync',
					fontSize: 36,
					fontFamily: 'Montserrat',
					fill: '#475569',
					fontWeight: 600,
					letterSpacing: 20,
					lineHeight: 1,
					offsetY: 90,
					offsetX: 0
				}
			]
		},
		{
			id: 'tech-stack',
			name: 'Tech Stack',
			category: 'Modern',
			elements: [
				{
					text: 'TECH',
					fontSize: 52,
					fontFamily: 'Montserrat',
					fill: 'transparent',
					fontWeight: 700,
					letterSpacing: 0,
					lineHeight: 1,
					stroke: '#64748b',
					strokeWidth: 2,
					offsetY: 0,
					offsetX: -20
				},
				{
					text: 'STACK',
					fontSize: 44,
					fontFamily: 'Georgia',
					fill: '#1e293b',
					fontWeight: 400,
					letterSpacing: 0,
					lineHeight: 1,
					fontStyle: 'italic',
					offsetY: 50,
					offsetX: 15
				}
			]
		},
		{
			id: 'big-strategy',
			name: 'Big Strategy',
			category: 'Professional',
			elements: [
				{
					text: 'BIG',
					fontSize: 58,
					fontFamily: 'Oswald',
					fill: 'transparent',
					fontWeight: 700,
					letterSpacing: 50,
					lineHeight: 1,
					stroke: '#6366f1',
					strokeWidth: 2.5,
					offsetY: 0,
					offsetX: 0
				},
				{
					text: 'strategy',
					fontSize: 38,
					fontFamily: 'Georgia',
					fill: '#6366f1',
					fontWeight: 400,
					letterSpacing: 10,
					lineHeight: 1,
					fontStyle: 'italic',
					offsetY: 60,
					offsetX: 0
				}
			]
		},
		{
			id: 'new-project',
			name: 'New Project',
			category: 'Professional',
			elements: [
				{
					text: 'new',
					fontSize: 40,
					fontFamily: 'Montserrat',
					fill: '#0d9488',
					fontWeight: 600,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 0,
					offsetX: -30
				},
				{
					text: 'PROJECT',
					fontSize: 32,
					fontFamily: 'Montserrat',
					fill: '#134e4a',
					fontWeight: 400,
					letterSpacing: 100,
					lineHeight: 1,
					offsetY: 48,
					offsetX: 0
				}
			]
		},
		{
			id: 'roll-out',
			name: 'Roll Out',
			category: 'Bold',
			elements: [
				{
					text: 'ROLL',
					fontSize: 42,
					fontFamily: 'Oswald',
					fill: '#1e1b4b',
					fontWeight: 400,
					letterSpacing: 120,
					lineHeight: 1,
					offsetY: 0,
					offsetX: -15
				},
				{
					text: 'OUT',
					fontSize: 48,
					fontFamily: 'Oswald',
					fill: '#312e81',
					fontWeight: 700,
					letterSpacing: 0,
					lineHeight: 1,
					fontStyle: 'italic',
					offsetY: 50,
					offsetX: 20,
					background: '#c4b5fd'
				}
			]
		},
		{
			id: 'mood-board',
			name: 'Mood Board',
			category: 'Creative',
			elements: [
				{
					text: 'mood',
					fontSize: 36,
					fontFamily: 'Georgia',
					fill: '#1f2937',
					fontWeight: 400,
					letterSpacing: 0,
					lineHeight: 1,
					fontStyle: 'italic',
					offsetY: 0,
					offsetX: -25
				},
				{
					text: 'board',
					fontSize: 52,
					fontFamily: 'Montserrat',
					fill: '#a855f7',
					fontWeight: 800,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 42,
					offsetX: 10
				}
			]
		},
		{
			id: 'data-power',
			name: 'Data Power',
			category: 'Modern',
			elements: [
				{
					text: 'data',
					fontSize: 48,
					fontFamily: 'Courier New',
					fill: '#0ea5e9',
					fontWeight: 700,
					letterSpacing: -50,
					lineHeight: 1,
					offsetY: 0,
					offsetX: -20
				},
				{
					text: 'is power',
					fontSize: 32,
					fontFamily: 'Montserrat',
					fill: '#0f172a',
					fontWeight: 500,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 55,
					offsetX: 20
				}
			]
		},
		{
			id: 'smart-move',
			name: 'Smart Move',
			category: 'Professional',
			elements: [
				{
					text: 'smart',
					fontSize: 42,
					fontFamily: 'Montserrat',
					fill: '#94a3b8',
					fontWeight: 300,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 0,
					offsetX: -20
				},
				{
					text: 'move',
					fontSize: 48,
					fontFamily: 'Montserrat',
					fill: '#0f172a',
					fontWeight: 700,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 50,
					offsetX: 15
				}
			]
		},
		{
			id: 'fashion-icon',
			name: 'Fashion Icon',
			category: 'Elegant',
			elements: [
				{
					text: 'Fashion',
					fontSize: 52,
					fontFamily: 'Dancing Script',
					fill: '#1f2937',
					fontWeight: 700,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 0,
					offsetX: 0
				},
				{
					text: 'icon',
					fontSize: 28,
					fontFamily: 'Montserrat',
					fill: '#6b7280',
					fontWeight: 300,
					letterSpacing: 150,
					lineHeight: 1,
					offsetY: 58,
					offsetX: 0
				}
			]
		},
		{
			id: 'idea-hub',
			name: 'Idea Hub',
			category: 'Bold',
			elements: [
				{
					text: 'idea',
					fontSize: 58,
					fontFamily: 'Montserrat',
					fill: '#2563eb',
					fontWeight: 900,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 0,
					offsetX: 0
				},
				{
					text: 'HUB',
					fontSize: 36,
					fontFamily: 'Montserrat',
					fill: '#ffffff',
					fontWeight: 700,
					letterSpacing: 80,
					lineHeight: 1,
					offsetY: 65,
					offsetX: 0,
					background: '#2563eb'
				}
			]
		},
		{
			id: 'pick-week',
			name: 'Pick of Week',
			category: 'Bold',
			elements: [
				{
					text: 'PICK',
					fontSize: 56,
					fontFamily: 'Oswald',
					fill: '#1e3a8a',
					fontWeight: 700,
					letterSpacing: 20,
					lineHeight: 1,
					offsetY: 0,
					offsetX: 0
				},
				{
					text: 'of the week',
					fontSize: 24,
					fontFamily: 'Montserrat',
					fill: '#1e40af',
					fontWeight: 500,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 62,
					offsetX: 0
				}
			]
		},
		{
			id: 'fresh-start',
			name: 'Fresh Start',
			category: 'Creative',
			elements: [
				{
					text: 'fresh',
					fontSize: 38,
					fontFamily: 'Georgia',
					fill: '#059669',
					fontWeight: 400,
					letterSpacing: 0,
					lineHeight: 1,
					fontStyle: 'italic',
					offsetY: 0,
					offsetX: -25
				},
				{
					text: 'START',
					fontSize: 52,
					fontFamily: 'Montserrat',
					fill: '#065f46',
					fontWeight: 800,
					letterSpacing: 100,
					lineHeight: 1,
					offsetY: 45,
					offsetX: 10
				}
			]
		},
		{
			id: 'bold-vision',
			name: 'Bold Vision',
			category: 'Bold',
			elements: [
				{
					text: 'BOLD',
					fontSize: 54,
					fontFamily: 'Oswald',
					fill: 'transparent',
					fontWeight: 700,
					letterSpacing: 0,
					lineHeight: 1,
					stroke: '#dc2626',
					strokeWidth: 2.5,
					offsetY: 0,
					offsetX: -15
				},
				{
					text: 'vision',
					fontSize: 40,
					fontFamily: 'Satisfy',
					fill: '#dc2626',
					fontWeight: 400,
					letterSpacing: 20,
					lineHeight: 1,
					offsetY: 58,
					offsetX: 20
				}
			]
		},
		{
			id: 'next-level',
			name: 'Next Level',
			category: 'Modern',
			elements: [
				{
					text: 'next',
					fontSize: 36,
					fontFamily: 'Montserrat',
					fill: '#6b7280',
					fontWeight: 400,
					letterSpacing: 0,
					lineHeight: 1,
					offsetY: 0,
					offsetX: -25
				},
				{
					text: 'LEVEL',
					fontSize: 50,
					fontFamily: 'Montserrat',
					fill: '#111827',
					fontWeight: 900,
					letterSpacing: 80,
					lineHeight: 1,
					offsetY: 48,
					offsetX: 15
				}
			]
		}
	];

	async function applyPreset(preset) {
		if (!$editor) return;

		const center = $editor.getCenter();
		const allObjects = [];

		// Load fonts first
		for (const element of preset.elements) {
			try {
				await document.fonts.load(
					`${element.fontWeight} ${element.fontSize}px "${element.fontFamily}"`
				);
			} catch (e) { /* ignored */ }
		}

		// Create text objects
		for (const element of preset.elements) {
			const textOptions = {
				fontSize: element.fontSize,
				fontFamily: element.fontFamily,
				fill: element.fill,
				fontWeight: element.fontWeight,
				charSpacing: element.letterSpacing || 0,
				lineHeight: element.lineHeight || 1.16,
				textAlign: 'center'
			};

			// Add fontStyle if defined (e.g., 'italic')
			if (element.fontStyle) {
				textOptions.fontStyle = element.fontStyle;
			}

			// Add shadow if defined
			if (element.shadow) {
				textOptions.shadow = element.shadow;
			}

			// Add stroke if defined
			if (element.stroke) {
				textOptions.stroke = element.stroke;
				textOptions.strokeWidth = element.strokeWidth || 1;
			}

			const textObj = new IText(element.text, textOptions);

			// If element has background, create background rect behind text
			if (element.background) {
				// Create text first to measure it
				textObj.set({
					originX: 'center',
					originY: 'center'
				});

				// Measure text bounds
				const textWidth = textObj.width;
				const textHeight = textObj.height;

				// Calculate positions
				const textLeft = center.left + (element.offsetX || 0);
				const textTop = center.top + element.offsetY;

				// Create background rectangle with padding
				const padding = 8;
				const rectWidth = textWidth + padding * 2;
				const rectHeight = textHeight + padding * 1.5;

				const bgRect = new Rect({
					width: rectWidth,
					height: rectHeight,
					fill: element.background,
					rx: 4,
					ry: 4,
					left: textLeft,
					top: textTop + rectHeight / 2, // Position so top edge is at textTop
					originX: 'center',
					originY: 'center'
				});

				// Position text at same center
				textObj.set({
					left: textLeft,
					top: textTop + rectHeight / 2,
					originX: 'center',
					originY: 'center'
				});

				// Add rect first so it's behind
				allObjects.push(bgRect);
				$editor.add(bgRect);

				allObjects.push(textObj);
				$editor.add(textObj);
			} else {
				// Position text without background
				textObj.set({
					left: center.left + (element.offsetX || 0),
					top: center.top + element.offsetY,
					originX: 'center',
					originY: 'top'
				});

				allObjects.push(textObj);
				$editor.add(textObj);
			}
		}

		// Select all created objects
		if (allObjects.length > 0) {
			if (allObjects.length === 1) {
				$editor.setActiveObject(allObjects[0]);
			} else {
				// Create a selection with all objects
				const selection = new ActiveSelection(allObjects, {
					canvas: $editor
				});
				$editor.setActiveObject(selection);
			}
		}

		$editor.renderAll();
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-3">
		{#each presets as preset}
			<button
				class="relative w-full p-4 bg-white border-[2px] border-gray-900 rounded-lg shadow-[2px_2px_0_0_#1f2937] text-left hover:shadow-[4px_4px_0_0_#ffc480] hover:-translate-y-1 transition-all group overflow-hidden"
				on:click={() => applyPreset(preset)}
			>
				<!-- Preset Preview -->
				<div class="mb-2 min-h-[80px] py-2 relative">
					{#each preset.elements as element, idx}
						<div
							class="transition-transform group-hover:scale-105 absolute"
							style="
							font-family: {element.fontFamily};
							font-size: {element.fontSize / 4}px;
							color: {element.fill === 'transparent' ? '#000' : element.fill};
							font-weight: {element.fontWeight};
							letter-spacing: {(element.letterSpacing || 0) / 100}px;
							line-height: {element.lineHeight || 1.16};
							{element.fontStyle ? `font-style: ${element.fontStyle};` : ''}
							{element.stroke && element.fill === 'transparent'
								? `-webkit-text-stroke: ${element.strokeWidth / 2}px ${element.stroke};`
								: ''}
							{element.shadow
								? `text-shadow: ${element.shadow.offsetX / 3}px ${element.shadow.offsetY / 3}px ${
										element.shadow.blur / 3
								  }px ${element.shadow.color};`
								: ''}
							{element.background
								? `background-color: ${element.background}; padding: 2px 8px; border-radius: 4px;`
								: ''}
							top: {element.offsetY / 6 + 40}px;
							left: {50 + (element.offsetX || 0) / 6}%;
							transform: translateX(-50%);
						"
						>
							{element.text}
						</div>
					{/each}
				</div>

				<!-- Preset Name & Category -->
				<div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
					<span class="text-sm font-semibold text-gray-700 group-hover:text-[#ff6b6b]">
						{preset.name}
					</span>
					<span
						class="text-xs px-2 py-1 bg-white text-gray-900 border border-gray-900 rounded-md font-bold uppercase tracking-wide group-hover:bg-gray-900 group-hover:text-white"
					>
						{preset.category}
					</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	/* Ensure fonts are loaded */
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Montserrat:wght@500;900&family=Playfair+Display:wght@600;700&family=Merriweather:wght@300;700&family=Poppins:wght@400;500;600;700;800&family=Oswald:wght@400;700&family=Lato:wght@400&family=Bangers&family=Satisfy&family=Dancing+Script:wght@400&family=Roboto:wght@400;700&family=Open+Sans:wght@300&display=swap');
</style>
