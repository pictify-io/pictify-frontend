<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let activeTool = 0;
	let isDragging = false;
	let canvasItems = [
		{
			id: 1,
			type: 'text',
			text: 'Start Editing',
			x: 30,
			y: 20,
			w: 40,
			h: 10,
			bg: 'bg-transparent',
			border: 'border-gray-300'
		},
		{
			id: 2,
			type: 'image',
			text: '',
			x: 25,
			y: 40,
			w: 50,
			h: 40,
			bg: 'bg-gray-100',
			border: 'border-gray-300'
		}
	];
	let selectedId = 2;
	let cursorX = 50;
	let cursorY = 50;
	let isClicking = false;
	let isHovering = false;

	// Simulate cursor movement and interaction
	onMount(() => {
		const steps = [
			// Move to Text
			{ x: 35, y: 25, duration: 1000, action: 'hover', id: 1 },
			{ x: 35, y: 25, duration: 200, action: 'click', id: 1 },
			{ x: 35, y: 25, duration: 500, action: 'wait' },

			// Move to Image
			{ x: 50, y: 60, duration: 1000, action: 'hover', id: 2 },
			{ x: 50, y: 60, duration: 200, action: 'click', id: 2 },

			// Drag Image
			{ x: 60, y: 60, duration: 800, action: 'drag', id: 2 },
			{ x: 60, y: 60, duration: 200, action: 'release' },

			// Resize Image (bottom-right handle)
			{ x: 85, y: 80, duration: 800, action: 'hover-handle' },
			{ x: 75, y: 70, duration: 1000, action: 'resize', id: 2 },
			{ x: 75, y: 70, duration: 200, action: 'release' },

			// Reset position for loop
			{ x: 50, y: 50, duration: 500, action: 'reset' }
		];

		let currentStep = 0;
		let animationTimeout;

		const animate = () => {
			const step = steps[currentStep];

			// Smoothly interpolate cursor position
			cursorX = step.x;
			cursorY = step.y;

			if (step.action === 'click') {
				isClicking = true;
				selectedId = step.id;
				setTimeout(() => (isClicking = false), 150);
			} else if (step.action === 'drag') {
				const item = canvasItems.find((i) => i.id === step.id);
				if (item) {
					item.x = step.x - item.w / 2; // approximate center drag
					canvasItems = [...canvasItems]; // trigger update
				}
			} else if (step.action === 'resize') {
				const item = canvasItems.find((i) => i.id === step.id);
				if (item) {
					item.w = (step.x - item.x) * 2; // simple resize logic
					item.h = (step.y - item.y) * 2;
					canvasItems = [...canvasItems];
				}
			} else if (step.action === 'reset') {
				// Reset items to initial state
				canvasItems = [
					{
						id: 1,
						type: 'text',
						text: 'Start Editing',
						x: 30,
						y: 20,
						w: 40,
						h: 10,
						bg: 'bg-transparent',
						border: 'border-gray-300'
					},
					{
						id: 2,
						type: 'image',
						text: '',
						x: 25,
						y: 40,
						w: 50,
						h: 40,
						bg: 'bg-gray-100',
						border: 'border-gray-300'
					}
				];
				selectedId = 2;
			}

			currentStep = (currentStep + 1) % steps.length;
			animationTimeout = setTimeout(animate, step.duration);
		};

		// Start animation loop
		animationTimeout = setTimeout(animate, 1000);

		return () => clearTimeout(animationTimeout);
	});

	const tools = [
		{
			icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
			label: 'Edit'
		},
		{
			icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			label: 'Image'
		},
		{
			icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
			label: 'Text'
		},
		{
			icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
			label: 'Grid'
		},
		{
			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
			label: 'Settings'
		}
	];

	$: selectedItem = canvasItems.find((i) => i.id === selectedId);
</script>

<section class="w-full py-20 md:py-32 bg-[#FFFDF8] relative overflow-hidden">
	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-16">
			<div
				class="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc480] rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-6 transform rotate-1"
			>
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Visual Editor</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				Build Templates <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Without Writing HTML.
					<svg
						class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Drag-and-drop editor with variables, conditions, and layer controls. Your designers can
				build templates that your API consumes.
			</p>
		</div>

		<div class="relative mx-auto max-w-5xl perspective-1000">
			<!-- Browser Frame -->
			<div
				class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] overflow-hidden relative z-10 transform transition-transform duration-500 hover:rotate-1"
				on:mouseenter={() => (isHovering = true)}
				on:mouseleave={() => (isHovering = false)}
			>
				<!-- Toolbar -->
				<div
					class="h-12 bg-gray-100 border-b-[3px] border-gray-900 flex items-center px-4 gap-3 select-none"
				>
					<div class="flex gap-2">
						<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900" />
						<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900" />
						<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900" />
					</div>
					<div class="flex-1 flex justify-center">
						<div
							class="bg-white border-[2px] border-gray-900 rounded px-4 py-1 text-xs font-bold text-gray-500 flex items-center gap-2"
						>
							<span>🔒</span> pictify.io/editor
						</div>
					</div>
				</div>

				<!-- Canvas Interface Mockup -->
				<div class="flex h-[350px] sm:h-[450px] md:h-[600px] bg-gray-50 overflow-hidden relative">
					<!-- Try Canvas Editor CTA Overlay -->
					{#if isHovering}
						<div
							class="absolute inset-0 z-40 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300"
							in:fade={{ duration: 200 }}
						>
							<button
								on:click={() => goto('/canvas/try')}
								class="group relative px-8 py-4 bg-[#ffc480] text-gray-900 font-black text-lg uppercase tracking-wider rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#1f2937] transition-all duration-200"
							>
								<div class="flex items-center gap-3">
									<span>Try Canvas Editor</span>
									<svg
										class="w-6 h-6 group-hover:translate-x-1 transition-transform"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="3"
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								</div>
								<div
									class="absolute -top-2 -right-2 px-2 py-1 bg-[#4ade80] text-[10px] font-bold text-gray-900 border-[2px] border-gray-900 rounded animate-pulse"
								>
									NEW
								</div>
							</button>
							<div class="absolute bottom-8 text-white text-sm font-medium opacity-80">
								Click to start building with the template editor
							</div>
						</div>
					{/if}

					<!-- Simulated Cursor -->
					<div
						class="absolute w-6 h-6 z-50 pointer-events-none transition-all duration-300 ease-out"
						style="left: {cursorX}%; top: {cursorY}%; transform: translate(-50%, -50%) scale({isClicking
							? 0.9
							: 1})"
					>
						<svg
							class="w-full h-full drop-shadow-md text-gray-900 fill-gray-900"
							viewBox="0 0 24 24"
						>
							<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="white" stroke-width="2" />
						</svg>
					</div>

					<!-- Left Sidebar -->
					<div
						class="w-16 md:w-20 border-r-[3px] border-gray-900 bg-white flex flex-col items-center py-6 gap-6 relative z-20"
					>
						{#each tools as tool, i}
							<div
								class="w-10 h-10 rounded-lg border-[2px] border-gray-900 flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0_0_#000]
								{activeTool === i
									? 'bg-[#ffc480] translate-x-0.5 translate-y-0.5 shadow-none'
									: 'bg-white hover:bg-gray-50'}"
								on:mouseenter={() => (activeTool = i)}
							>
								<svg
									class="w-5 h-5 text-gray-900"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={tool.icon}
									/>
								</svg>
							</div>
						{/each}
					</div>

					<!-- Main Canvas Area -->
					<div
						class="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"
					>
						<!-- The Canvas -->
						<div
							class="w-[80%] aspect-video bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] relative group"
						>
							<!-- Grid Lines (Subtle) -->
							<div
								class="absolute inset-0 pointer-events-none opacity-5"
								style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 50px 50px;"
							/>

							{#each canvasItems as item (item.id)}
								<div
									class="absolute transition-all duration-200 {item.bg} {item.border} rounded flex items-center justify-center
									{selectedId === item.id ? 'border-[2px] border-blue-400' : 'border-[1px] border-dashed'}"
									style="left: {item.x}%; top: {item.y}%; width: {item.w}%; height: {item.h}%"
								>
									{#if item.type === 'text'}
										<span class="font-bold text-gray-400 text-sm md:text-base whitespace-nowrap"
											>{item.text}</span
										>
									{:else if item.type === 'image'}
										<div
											class="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden relative"
										>
											<svg
												class="w-1/3 h-1/3 text-gray-300"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/></svg
											>
											{#if selectedId === item.id}
												<div class="absolute inset-0 bg-[#4ade80] opacity-10" />
											{/if}
										</div>
									{/if}

									<!-- Selection Box (Active Element Overlay) -->
									{#if selectedId === item.id}
										<div class="absolute inset-0 border-[3px] border-[#4ade80] pointer-events-none">
											<!-- Resize Handles -->
											<div
												class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"
											/>
											<div
												class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"
											/>
											<div
												class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"
											/>
											<div
												class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"
											/>

											<!-- Label -->
											<span
												class="bg-[#4ade80] text-[10px] font-bold px-2 py-0.5 border-[2px] border-gray-900 absolute -top-6 left-0 shadow-[2px_2px_0_0_#000] uppercase tracking-wider whitespace-nowrap"
											>
												{item.type} Layer
											</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Right Sidebar -->
					<div
						class="w-64 border-l-[3px] border-gray-900 bg-white hidden md:flex flex-col z-20 transition-all duration-300"
					>
						<div
							class="p-4 border-b-[3px] border-gray-900 font-bold text-sm flex justify-between items-center"
						>
							<span>Properties</span>
							<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
						</div>

						{#if selectedItem}
							<div class="p-4 space-y-6" in:fade={{ duration: 200 }}>
								<!-- Position -->
								<div class="space-y-2">
									<label class="text-xs font-bold text-gray-500 uppercase">Position</label>
									<div class="flex gap-2">
										<div
											class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono"
										>
											X: {Math.round(selectedItem.x)}
										</div>
										<div
											class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono"
										>
											Y: {Math.round(selectedItem.y)}
										</div>
									</div>
								</div>

								<!-- Size -->
								<div class="space-y-2">
									<label class="text-xs font-bold text-gray-500 uppercase">Size</label>
									<div class="flex gap-2">
										<div
											class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono"
										>
											W: {Math.round(selectedItem.w)}
										</div>
										<div
											class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono"
										>
											H: {Math.round(selectedItem.h)}
										</div>
									</div>
								</div>

								<!-- Specific Props -->
								{#if selectedItem.type === 'text'}
									<div class="space-y-2">
										<label class="text-xs font-bold text-gray-500 uppercase">Content</label>
										<div
											class="w-full h-8 bg-white border-[2px] border-gray-900 rounded shadow-[2px_2px_0_0_#000] flex items-center px-2 text-xs"
										>
											{selectedItem.text}
										</div>
									</div>
								{:else}
									<div class="space-y-2">
										<label class="text-xs font-bold text-gray-500 uppercase">Source</label>
										<div
											class="w-full h-8 bg-gray-100 border-[2px] border-gray-300 rounded flex items-center px-2 text-xs text-gray-400 truncate"
										>
											https://assets...
										</div>
									</div>
								{/if}

								<div class="pt-4">
									<div
										class="w-full py-2 bg-[#ff6b6b] text-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000] font-bold text-center text-xs hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer rounded"
									>
										DELETE LAYER
									</div>
								</div>
							</div>
						{:else}
							<div class="p-8 text-center text-gray-400 text-xs" in:fade>
								Select an element to edit properties
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Mobile CTA (no hover on touch devices) -->
			<div class="md:hidden mt-6 flex justify-center">
				<button
					on:click={() => goto('/canvas/try')}
					class="px-8 py-4 bg-[#ffc480] text-gray-900 font-black text-lg rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_0_#1f2937] transition-all uppercase tracking-wider flex items-center gap-3"
				>
					<span>Try Canvas Editor</span>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M13 7l5 5m0 0l-5 5m5-5H6"
						/>
					</svg>
				</button>
			</div>

			<!-- Decorative Elements -->
			<div
				class="hidden md:block absolute -top-10 -right-10 w-32 h-32 bg-[#ffc480] border-[3px] border-gray-900 -z-10 rotate-12 animate-[float_6s_ease-in-out_infinite]"
			/>
			<div
				class="hidden md:block absolute -bottom-10 -left-10 w-40 h-40 bg-[#ff6b6b] border-[3px] border-gray-900 -z-10 rotate-[-12deg] animate-[float_7s_ease-in-out_infinite_reverse]"
			>
				<div
					class="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#000_45%,#000_55%,transparent_55%)] [background-size:10px_10px] opacity-10"
				/>
			</div>
		</div>

		<!-- Figma Import Showcase -->
		<div class="mt-24 max-w-5xl mx-auto group relative">
			<!-- Decorative offset background -->
			<div class="hidden sm:block absolute inset-0 bg-[#a259ff] rounded-3xl border-[3px] border-black transform translate-x-3 translate-y-3 z-0 pointer-events-none"></div>
			
			<div class="relative bg-white rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] overflow-hidden z-10 transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1 duration-300">
				<!-- Mac Header -->
				<div class="bg-[#facc15] px-4 py-3 border-b-[3px] border-black flex items-center justify-between">
					<div class="flex gap-2">
						<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-black"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-white border-2 border-black"></div>
						<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-black"></div>
					</div>
					<div class="flex items-center gap-2 bg-white/40 px-3 py-1 rounded-md border-[2px] border-black">
						<svg width="10" height="10" viewBox="0 0 38 57" fill="none"><path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="black"/><path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="black"/><path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="black"/><path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="black"/><path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="black"/></svg>
						<span class="text-[10px] font-bold text-black uppercase tracking-widest">Figma Sync</span>
					</div>
				</div>

				<div class="flex flex-col md:flex-row bg-[#FFFDF8]">
					<!-- Left: Visual Flow -->
					<div class="flex-1 p-8 md:p-14 flex items-center justify-center border-b-[3px] md:border-b-0 md:border-r-[3px] border-black relative overflow-hidden">
						<!-- Grid Background -->
						<div class="absolute inset-0 pointer-events-none opacity-5" style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 20px 20px;" />
						
						<div class="flex items-center gap-6 relative z-10">
							<!-- Figma Frame -->
							<div class="relative group/frame hover:-translate-y-2 hover:rotate-3 transition-transform duration-300">
								<div class="w-28 h-36 md:w-40 md:h-48 bg-white rounded-xl border-[3px] border-black shadow-[6px_6px_0_0_#a259ff] overflow-hidden p-3 flex flex-col gap-2 relative z-10">
									<!-- Figma mini layers mockup -->
									<div class="w-full h-4 bg-[#a259ff] rounded-sm border-2 border-black"></div>
									<div class="flex-1 bg-gray-100 rounded-sm border-2 border-black flex items-center justify-center relative overflow-hidden">
										<!-- Graphic lines -->
										<div class="absolute -right-4 -bottom-4 w-12 h-12 border-4 border-black rounded-full text-transparent"></div>
										<svg class="w-10 h-10 md:w-12 md:h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
									</div>
									<div class="flex gap-2">
										<div class="flex-1 h-3 bg-[#4ade80] rounded-sm border-2 border-black"></div>
										<div class="w-8 h-3 bg-[#ff6b6b] rounded-sm border-2 border-black"></div>
									</div>
								</div>
								<!-- Figma logo badge -->
								<div class="absolute -top-4 -left-4 w-10 h-10 bg-[#a259ff] rounded-lg border-[3px] border-black shadow-[4px_4px_0_0_black] flex items-center justify-center z-20 group-hover/frame:scale-110 transition-transform">
									<svg width="16" height="16" viewBox="0 0 38 57" fill="none"><path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="white"/><path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="white"/><path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="white"/><path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="white"/><path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="white"/></svg>
								</div>
							</div>

							<!-- Arrow -->
							<div class="flex flex-col items-center gap-2 relative">
								<div class="bg-black text-white px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-widest border-[3px] border-black transform rotate-3 z-10 shadow-[4px_4px_0_0_#ffc480]">1-Click</div>
							</div>

							<!-- Pictify Template -->
							<div class="relative group/template hover:-translate-y-2 hover:-rotate-3 transition-transform duration-300">
								<div class="w-28 h-36 md:w-40 md:h-48 bg-white rounded-xl border-[3px] border-black shadow-[6px_6px_0_0_#4ade80] overflow-hidden p-3 flex flex-col gap-2 relative z-10">
									<!-- Pictify mini template mockup -->
									<div class="w-full h-4 bg-[#ffc480] rounded-sm border-2 border-black"></div>
									<div class="flex-1 bg-gray-100 rounded-sm border-2 border-black relative overflow-hidden flex flex-col items-center justify-center">
										<!-- Graphic lines -->
										<div class="absolute -left-4 -top-4 w-12 h-12 border-4 border-black rounded-full text-transparent"></div>
										<!-- Template variable indicators -->
										<div class="px-2 py-1 bg-[#4ade80] border-[2px] border-black shadow-[2px_2px_0_0_black] rounded text-[9px] font-black text-black transform -rotate-2 relative z-10">{'{{name}}'}</div>
									</div>
									<div class="flex gap-2">
										<div class="flex-1 h-3 bg-gray-300 rounded-sm border-2 border-black"></div>
										<div class="w-8 h-3 bg-black rounded-sm border-2 border-black"></div>
									</div>
								</div>
								<!-- Pictify logo badge -->
								<div class="absolute -bottom-4 -right-4 w-10 h-10 bg-[#4ade80] rounded-lg border-[3px] border-black shadow-[4px_4px_0_0_black] flex items-center justify-center z-20 group-hover/template:scale-110 transition-transform">
									<span class="text-lg font-black text-black">P</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Right: Copy + CTA -->
					<div class="flex-1 p-8 md:p-14 flex flex-col justify-center">
						<div class="inline-block px-4 py-1.5 bg-[#a259ff] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full transform rotate-2 mb-6 self-start">
							<span class="text-[11px] font-black text-white uppercase tracking-wider">Figma Plugin</span>
						</div>

						<h3 class="text-4xl md:text-5xl font-black text-black leading-[1.1] mb-6">
							Design in Figma.<br />
							<span class="relative inline-block mt-2">
								Render in Code.
								<svg
									class="absolute w-full h-3 sm:h-4 -bottom-1 sm:-bottom-2 left-0 text-[#facc15] -z-10"
									viewBox="0 0 100 10"
									preserveAspectRatio="none"
								>
									<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
								</svg>
							</span>
						</h3>

						<p class="text-lg text-black/70 font-medium mb-8 max-w-lg leading-relaxed">
							Select frames in Figma, send them to Pictify with one click. Layers become native image objects ready for our API.
						</p>

						<!-- Steps -->
						<div class="space-y-4 mb-10">
							<div class="flex items-center gap-4 group/step">
								<div class="w-8 h-8 bg-[#a259ff] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_black] group-hover/step:-translate-y-1 group-hover/step:-translate-x-1 group-hover/step:shadow-[4px_4px_0_0_black] transition-all">
									<span class="text-sm font-black text-white">1</span>
								</div>
								<span class="text-base font-bold text-black">Install the plugin</span>
							</div>
							<div class="flex items-center gap-4 group/step">
								<div class="w-8 h-8 bg-[#ffc480] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_black] group-hover/step:-translate-y-1 group-hover/step:-translate-x-1 group-hover/step:shadow-[4px_4px_0_0_black] transition-all">
									<span class="text-sm font-black text-black">2</span>
								</div>
								<span class="text-base font-bold text-black">Select frames</span>
							</div>
							<div class="flex items-center gap-4 group/step">
								<div class="w-8 h-8 bg-[#4ade80] border-[3px] border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_black] group-hover/step:-translate-y-1 group-hover/step:-translate-x-1 group-hover/step:shadow-[4px_4px_0_0_black] transition-all">
									<span class="text-sm font-black text-black">3</span>
								</div>
								<span class="text-base font-bold text-black">Send to Pictify</span>
							</div>
						</div>

						<a
							href="/signup"
							class="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-base font-black uppercase tracking-wider rounded-xl border-[3px] border-black shadow-[6px_6px_0_0_#a259ff] hover:shadow-[2px_2px_0_0_#a259ff] hover:translate-x-1 hover:translate-y-1 transition-all self-start"
						>
							Get Started
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
	@keyframes float {
		0%,
		100% {
			transform: translateY(0) rotate(12deg);
		}
		50% {
			transform: translateY(-15px) rotate(15deg);
		}
	}
</style>
