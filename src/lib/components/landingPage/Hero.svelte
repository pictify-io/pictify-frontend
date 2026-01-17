<script>
	import SignUpButton from './SignUpButton.svelte';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let activeExample = 0;
	const examples = [
		{
			type: 'Social',
			code: `<div class="card">\n  <h1>New Post</h1>\n  <img src="user.jpg" />\n</div>`,
			color: 'bg-[#ff6b6b]',
			title: 'Instagram Story'
		},
		{
			type: 'E-commerce',
			code: `<div class="product">\n  <h2>Nike Air</h2>\n  <span class="price">$99</span>\n</div>`,
			color: 'bg-[#4ade80]',
			title: 'Product Card'
		},
		{
			type: 'Ticket',
			code: `<div class="ticket">\n  <h3>Concert</h3>\n  <div class="qr">...</div>\n</div>`,
			color: 'bg-[#ffc480]',
			title: 'Event Ticket'
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			activeExample = (activeExample + 1) % examples.length;
		}, 4000);
		return () => clearInterval(interval);
	});

	let mouseX = 0;
	let mouseY = 0;

	function handleMouseMove(e) {
		const { clientX, clientY, currentTarget } = e;
		const { left, top, width, height } = currentTarget.getBoundingClientRect();
		mouseX = (clientX - left) / width - 0.5;
		mouseY = (clientY - top) / height - 0.5;
	}
</script>

<section class="w-full pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Grid -->
	<div
		class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"
	/>

	<!-- Decorative Blobs -->
	<div
		class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"
	/>

	<div
		class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center relative z-10"
	>
		<!-- Left Column: Text -->
		<div class="flex flex-col items-start text-left space-y-8">
			<!-- Eyebrow -->
			<div
				in:fly={{ y: 20, duration: 800, delay: 0 }}
				class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] animate-[float_6s_ease-in-out_infinite]"
			>
				<div class="flex gap-1">
					<span class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#ff6b6b] rounded-full animate-pulse" />
					<span class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#ffc480] rounded-full animate-pulse delay-75" />
					<span class="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#4ade80] rounded-full animate-pulse delay-150" />
				</div>
				<span class="text-xs sm:text-sm font-bold text-gray-900 tracking-wide uppercase"
					>Dynamic Media Infrastructure</span
				>
			</div>

			<!-- Headline -->
			<h1
				in:fly={{ y: 20, duration: 800, delay: 150 }}
				class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight"
			>
				Design Once. <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Render
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
				Forever.
			</h1>

			<!-- Subheadline -->
			<p
				in:fly={{ y: 20, duration: 800, delay: 300 }}
				class="text-lg sm:text-xl text-gray-700 max-w-lg leading-relaxed font-medium border-l-[4px] border-[#ffc480] pl-4 sm:pl-6"
			>
				The template-first engine for companies that need dynamic media infrastructure. Designers
				build on-brand templates. Developers integrate via API to generate pixel-perfect images,
				GIFs, and PDFs.
			</p>

			<!-- CTAs -->
			<div in:fly={{ y: 20, duration: 800, delay: 450 }} class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
				<SignUpButton
					class="bg-[#ff6b6b] text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all font-bold uppercase tracking-wider text-center"
				/>

				<a
					href="https://docs.pictify.io"
					target="_blank"
					class="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 text-base sm:text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] sm:shadow-[6px_6px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all font-bold"
				>
					<span>View API Docs</span>
					<svg
						class="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</a>
			</div>

			<!-- Trust/Stats -->
			<div in:fly={{ y: 20, duration: 800, delay: 600 }} class="pt-6 sm:pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 opacity-80">
				<div class="flex items-center gap-2">
					<svg class="w-5 sm:w-6 h-5 sm:h-6 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"
						><path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
						/></svg
					>
					<span class="font-bold text-sm sm:text-base text-gray-700">Template-First Workflow</span>
				</div>
				<div class="flex items-center gap-2">
					<svg class="w-5 sm:w-6 h-5 sm:h-6 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"
						><path
							d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"
						/></svg
					>
					<span class="font-bold text-sm sm:text-base text-gray-700">API + Webhooks</span>
				</div>
			</div>
		</div>

		<!-- Mobile Visual (visible on mobile, hidden on lg) -->
		<div class="block lg:hidden w-full">
			<div class="relative mx-auto max-w-md">
				<!-- Code Editor Card -->
				<div class="bg-gray-900 rounded-lg border-[3px] border-gray-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.1)] mb-6">
					<div class="h-8 bg-gray-800 rounded-t-lg flex items-center px-3 gap-2 border-b border-gray-700">
						<div class="w-2 h-2 rounded-full bg-[#ff6b6b]" />
						<div class="w-2 h-2 rounded-full bg-[#ffc480]" />
						<div class="w-2 h-2 rounded-full bg-[#4ade80]" />
					</div>
					<div class="p-4 font-mono text-xs">
						<div class="text-gray-500 mb-2">// Template.html</div>
						<div class="text-[#ff6b6b]">&lt;canvas&gt;</div>
						<div class="pl-4 text-white">Your template...</div>
						<div class="text-[#ff6b6b]">&lt;/canvas&gt;</div>
					</div>
				</div>

				<!-- Arrow -->
				<div class="flex justify-center mb-6">
					<svg class="w-12 h-12 text-[#ff6b6b]" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
						<path d="M12 5l0 14m0 0l-5-5m5 5l5-5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>

				<!-- Rendered Result Card -->
				<div class="bg-white rounded-lg border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden">
					<div class="h-8 border-b-[2px] border-gray-900 flex items-center justify-between px-3 bg-[#f3f4f6]">
						<span class="font-bold text-xs uppercase tracking-wider text-gray-600">Rendered Output</span>
						<div class="px-2 py-0.5 bg-[#4ade80] border border-gray-900 text-[9px] font-bold rounded">
							LIVE
						</div>
					</div>
					<div class="bg-gradient-to-br from-[#ff6b6b]/20 to-[#ffc480]/20 p-8 flex items-center justify-center">
						<div class="w-full max-w-[200px] bg-white border-[2px] border-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] rounded-lg p-4">
							<div class="w-10 h-10 bg-gray-200 rounded-full border border-gray-900 mb-3" />
							<div class="w-3/4 h-3 bg-gray-200 rounded mb-2" />
							<div class="w-1/2 h-3 bg-gray-200 rounded" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Desktop Interactive Visual (hidden on mobile, visible on lg) -->
		<div
			class="relative h-[400px] xl:h-[450px] w-full hidden lg:flex items-center justify-center overflow-hidden"
			on:mousemove={handleMouseMove}
			on:mouseleave={() => {
				mouseX = 0;
				mouseY = 0;
			}}
			role="presentation"
			aria-hidden="true"
		>
			<!-- Animated wrapper with slight parallax tilt -->
			<div
				class="relative w-full h-full max-w-[500px] transition-transform duration-200 ease-out"
				style="transform: perspective(1000px) rotateX({-mouseY * 5}deg) rotateY({mouseX * 5}deg)"
			>
				<!-- Back Layer: Code Editor -->
				<div
					class="absolute top-[20%] left-[5%] w-[55%] max-w-[280px] h-[200px] bg-gray-900 rounded-lg border-[3px] border-gray-900 shadow-[10px_10px_0_0_rgba(0,0,0,0.1)] z-10"
				>
					<!-- Window Controls -->
					<div
						class="h-7 bg-gray-800 rounded-t-lg flex items-center px-3 gap-1.5 border-b border-gray-700"
					>
						<div class="w-2 h-2 rounded-full bg-[#ff6b6b]" />
						<div class="w-2 h-2 rounded-full bg-[#ffc480]" />
						<div class="w-2 h-2 rounded-full bg-[#4ade80]" />
					</div>
					<!-- Code Content -->
					<div class="p-3 font-mono text-[10px]">
						<div class="text-gray-500 mb-1">// Template.html</div>
						{#key activeExample}
							<div in:fade={{ duration: 300 }}>
								<div class="text-[#ff6b6b]">
									&lt;canvas&gt;
								</div>
								<div class="pl-3 text-white text-[9px]">{examples[activeExample].code.split('\n')[0]}</div>
								<div class="pl-3 text-white text-[9px]">{examples[activeExample].code.split('\n')[1]}</div>
								<div class="text-[#ff6b6b]">&lt;/canvas&gt;</div>
							</div>
						{/key}
						<div class="mt-2 animate-pulse text-gray-500">|</div>
					</div>
				</div>

				<!-- Connecting Arrow -->
				<div
					class="absolute top-[35%] left-[45%] w-16 h-16 z-40 pointer-events-none"
				>
					<svg
						class="w-full h-full text-[#ff6b6b]"
						viewBox="0 0 100 100"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
					>
						<path d="M20 20 Q 80 20 80 80" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M60 70 L 80 80 L 95 65" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>

				<!-- Front Layer: Rendered Result -->
				<div
					class="absolute bottom-[15%] right-[10%] w-[50%] max-w-[240px] h-[180px] z-30 transition-all duration-500"
				>
					{#key activeExample}
						<div
							in:fly={{ y: 30, duration: 500, delay: 200 }}
							out:fade={{ duration: 200 }}
							class="w-full h-full bg-white rounded-lg border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] flex flex-col overflow-hidden relative"
						>
							<!-- Header -->
							<div
								class="h-6 border-b-[2px] border-gray-900 flex items-center justify-between px-2 bg-[#f3f4f6]"
							>
								<span class="font-bold text-[9px] uppercase tracking-wider text-gray-600"
									>{examples[activeExample].title}</span
								>
								<div
									class="px-1 py-0.5 bg-[#4ade80] border border-gray-900 text-[8px] font-bold rounded"
								>
									LIVE
								</div>
							</div>

							<!-- Content Placeholder -->
							<div
								class="flex-1 {examples[activeExample]
									.color} p-3 flex items-center justify-center relative overflow-hidden"
							>
								<!-- Geometric Patterns -->
								<div
									class="absolute top-0 right-0 w-12 h-12 bg-white/20 rounded-full -mr-6 -mt-6"
								/>
								<div
									class="absolute bottom-0 left-0 w-10 h-10 bg-black/10 transform rotate-45 -ml-5 -mb-5"
								/>

								<!-- Central Element -->
								<div
									class="w-[70%] h-[70%] bg-white border-[2px] border-gray-900 shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] rounded-md flex flex-col p-2"
								>
									<div
										class="w-6 h-6 bg-gray-200 rounded-full border border-gray-900 mb-2"
									/>
									<div class="w-3/4 h-2 bg-gray-200 rounded mb-1" />
									<div class="w-1/2 h-2 bg-gray-200 rounded" />
								</div>
							</div>
						</div>
					{/key}
				</div>

				<!-- Floating Badges -->
				<div class="absolute top-[5%] right-[5%] animate-bounce [animation-duration:3s]">
					<div
						class="px-2 py-1 bg-[#ffc480] border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-md transform rotate-2 font-bold text-[10px]"
					>
						⚡️ Fast
					</div>
				</div>
				<div class="absolute bottom-[5%] left-[5%] animate-bounce [animation-duration:4s]">
					<div
						class="px-2 py-1 bg-white border-[2px] border-gray-900 shadow-[2px_2px_0_0_#1f2937] rounded-md transform -rotate-2 font-bold text-[10px]"
					>
						🚀 API-First
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(-1deg); }
		50% { transform: translateY(-5px) rotate(1deg); }
	}
</style>

