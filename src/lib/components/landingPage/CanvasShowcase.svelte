<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let activeTool = 0;
	let isDragging = false;
	let canvasItems = [
		{ id: 1, type: 'text', text: 'Start Editing', x: 30, y: 20, w: 40, h: 10, bg: 'bg-transparent', border: 'border-gray-300' },
		{ id: 2, type: 'image', text: '', x: 25, y: 40, w: 50, h: 40, bg: 'bg-gray-100', border: 'border-gray-300' }
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
				setTimeout(() => isClicking = false, 150);
			} else if (step.action === 'drag') {
				const item = canvasItems.find(i => i.id === step.id);
				if (item) {
					item.x = step.x - (item.w / 2); // approximate center drag
					canvasItems = [...canvasItems]; // trigger update
				}
			} else if (step.action === 'resize') {
				const item = canvasItems.find(i => i.id === step.id);
				if (item) {
					item.w = (step.x - item.x) * 2; // simple resize logic
					item.h = (step.y - item.y) * 2;
					canvasItems = [...canvasItems];
				}
			} else if (step.action === 'reset') {
				// Reset items to initial state
				canvasItems = [
					{ id: 1, type: 'text', text: 'Start Editing', x: 30, y: 20, w: 40, h: 10, bg: 'bg-transparent', border: 'border-gray-300' },
					{ id: 2, type: 'image', text: '', x: 25, y: 40, w: 50, h: 40, bg: 'bg-gray-100', border: 'border-gray-300' }
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
		{ icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z', label: 'Edit' },
		{ icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Image' },
		{ icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z', label: 'Text' },
		{ icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Grid' },
		{ icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', label: 'Settings' }
	];

	$: selectedItem = canvasItems.find(i => i.id === selectedId);
</script>

<section class="w-full py-20 md:py-32 bg-[#FFFDF8] relative overflow-hidden">
	<div class="max-w-7xl mx-auto px-6">
		<div class="text-center mb-16">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-[#ffc480] rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-6 transform rotate-1">
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider">Visual Editor</span>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				Design Without <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Writing Code
					<svg class="absolute w-full h-3 -bottom-1 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Drag, drop, and design pixel-perfect templates. Export as HTML/CSS or use directly with our API.
			</p>
		</div>

		<div class="relative mx-auto max-w-5xl perspective-1000">
			<!-- Browser Frame -->
			<div class="bg-white rounded-xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] overflow-hidden relative z-10 transform transition-transform duration-500 hover:rotate-1"
				on:mouseenter={() => isHovering = true}
				on:mouseleave={() => isHovering = false}>
				<!-- Toolbar -->
				<div class="h-12 bg-gray-100 border-b-[3px] border-gray-900 flex items-center px-4 gap-3 select-none">
					<div class="flex gap-2">
						<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
						<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900"></div>
						<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900"></div>
					</div>
					<div class="flex-1 flex justify-center">
						<div class="bg-white border-[2px] border-gray-900 rounded px-4 py-1 text-xs font-bold text-gray-500 flex items-center gap-2">
							<span>🔒</span> pictify.io/editor
						</div>
					</div>
				</div>
				
				<!-- Canvas Interface Mockup -->
				<div class="flex h-[500px] md:h-[600px] bg-gray-50 overflow-hidden relative">

					<!-- Try Canvas Editor CTA Overlay -->
					{#if isHovering}
						<div
							class="absolute inset-0 z-40 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300"
							in:fade={{ duration: 200 }}
						>
							<button
								on:click={() => goto('/canvas/try')}
								class="group relative px-8 py-4 bg-[#ffc480] text-gray-900 font-black text-lg md:text-xl rounded-xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#1f2937] transition-all duration-200"
							>
								<div class="flex items-center gap-3">
									<span>Try Canvas Editor</span>
									<svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</div>
								<div class="absolute -top-2 -right-2 px-2 py-1 bg-[#4ade80] text-[10px] font-bold text-gray-900 border-[2px] border-gray-900 rounded animate-pulse">
									NEW
								</div>
							</button>
							<div class="absolute bottom-8 text-white text-sm font-medium opacity-80">
								Click to start designing with our visual editor
							</div>
						</div>
					{/if}

					<!-- Simulated Cursor -->
					<div 
						class="absolute w-6 h-6 z-50 pointer-events-none transition-all duration-300 ease-out"
						style="left: {cursorX}%; top: {cursorY}%; transform: translate(-50%, -50%) scale({isClicking ? 0.9 : 1})"
					>
						<svg class="w-full h-full drop-shadow-md text-gray-900 fill-gray-900" viewBox="0 0 24 24">
							<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="white" stroke-width="2"/>
						</svg>
					</div>

					<!-- Left Sidebar -->
					<div class="w-16 md:w-20 border-r-[3px] border-gray-900 bg-white flex flex-col items-center py-6 gap-6 relative z-20">
						{#each tools as tool, i}
							<div class="w-10 h-10 rounded-lg border-[2px] border-gray-900 flex items-center justify-center transition-all cursor-pointer shadow-[2px_2px_0_0_#000]
								{activeTool === i ? 'bg-[#ffc480] translate-x-0.5 translate-y-0.5 shadow-none' : 'bg-white hover:bg-gray-50'}"
								on:mouseenter={() => activeTool = i}
							>
								<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tool.icon} />
								</svg>
							</div>
						{/each}
					</div>
					
					<!-- Main Canvas Area -->
					<div class="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
						<!-- The Canvas -->
						<div class="w-[80%] aspect-video bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] relative group">
							
							<!-- Grid Lines (Subtle) -->
							<div class="absolute inset-0 pointer-events-none opacity-5" 
								style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 50px 50px;">
							</div>

							{#each canvasItems as item (item.id)}
								<div 
									class="absolute transition-all duration-200 {item.bg} {item.border} rounded flex items-center justify-center
									{selectedId === item.id ? 'border-[2px] border-blue-400' : 'border-[1px] border-dashed'}"
									style="left: {item.x}%; top: {item.y}%; width: {item.w}%; height: {item.h}%"
								>
									{#if item.type === 'text'}
										<span class="font-bold text-gray-400 text-sm md:text-base whitespace-nowrap">{item.text}</span>
									{:else if item.type === 'image'}
										<div class="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden relative">
											<svg class="w-1/3 h-1/3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
											{#if selectedId === item.id}
												<div class="absolute inset-0 bg-[#4ade80] opacity-10"></div>
											{/if}
										</div>
									{/if}

									<!-- Selection Box (Active Element Overlay) -->
									{#if selectedId === item.id}
										<div class="absolute inset-0 border-[3px] border-[#4ade80] pointer-events-none">
											<!-- Resize Handles -->
											<div class="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"></div>
											<div class="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"></div>
											<div class="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"></div>
											<div class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-[2px] border-[#4ade80]"></div>
											
											<!-- Label -->
											<span class="bg-[#4ade80] text-[10px] font-bold px-2 py-0.5 border-[2px] border-gray-900 absolute -top-6 left-0 shadow-[2px_2px_0_0_#000] uppercase tracking-wider whitespace-nowrap">
												{item.type} Layer
											</span>
										</div>
									{/if}
								</div>
							{/each}

						</div>
					</div>

					<!-- Right Sidebar -->
					<div class="w-64 border-l-[3px] border-gray-900 bg-white hidden md:flex flex-col z-20 transition-all duration-300">
						<div class="p-4 border-b-[3px] border-gray-900 font-bold text-sm flex justify-between items-center">
							<span>Properties</span>
							<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
						</div>
						
						{#if selectedItem}
							<div class="p-4 space-y-6" in:fade={{ duration: 200 }}>
								<!-- Position -->
								<div class="space-y-2">
									<label class="text-xs font-bold text-gray-500 uppercase">Position</label>
									<div class="flex gap-2">
										<div class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono">X: {Math.round(selectedItem.x)}</div>
										<div class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono">Y: {Math.round(selectedItem.y)}</div>
									</div>
								</div>

								<!-- Size -->
								<div class="space-y-2">
									<label class="text-xs font-bold text-gray-500 uppercase">Size</label>
									<div class="flex gap-2">
										<div class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono">W: {Math.round(selectedItem.w)}</div>
										<div class="flex-1 p-2 bg-gray-50 border-[2px] border-gray-200 rounded text-xs font-mono">H: {Math.round(selectedItem.h)}</div>
									</div>
								</div>

								<!-- Specific Props -->
								{#if selectedItem.type === 'text'}
									<div class="space-y-2">
										<label class="text-xs font-bold text-gray-500 uppercase">Content</label>
										<div class="w-full h-8 bg-white border-[2px] border-gray-900 rounded shadow-[2px_2px_0_0_#000] flex items-center px-2 text-xs">
											{selectedItem.text}
										</div>
									</div>
								{:else}
									<div class="space-y-2">
										<label class="text-xs font-bold text-gray-500 uppercase">Source</label>
										<div class="w-full h-8 bg-gray-100 border-[2px] border-gray-300 rounded flex items-center px-2 text-xs text-gray-400 truncate">
											https://assets...
										</div>
									</div>
								{/if}

								<div class="pt-4">
									<div class="w-full py-2 bg-[#ff6b6b] text-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000] font-bold text-center text-xs hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer rounded">
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

			<!-- Decorative Elements -->
			<div class="absolute -top-10 -right-10 w-32 h-32 bg-[#ffc480] border-[3px] border-gray-900 -z-10 rotate-12 animate-[float_6s_ease-in-out_infinite]"></div>
			<div class="absolute -bottom-10 -left-10 w-40 h-40 bg-[#ff6b6b] border-[3px] border-gray-900 -z-10 rotate-[-12deg] animate-[float_7s_ease-in-out_infinite_reverse]">
				<div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,#000_45%,#000_55%,transparent_55%)] [background-size:10px_10px] opacity-10"></div>
			</div>
		</div>
	</div>
</section>

<style>
	.perspective-1000 {
		perspective: 1000px;
	}
	@keyframes float {
		0%, 100% { transform: translateY(0) rotate(12deg); }
		50% { transform: translateY(-15px) rotate(15deg); }
	}
</style>