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

<section class="w-full pt-32 pb-20 md:pt-40 md:pb-32 bg-[#FFFDF8] relative overflow-hidden">
	<!-- Background Grid -->
	<div class="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none"></div>
	
	<!-- Decorative Blobs -->
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#ffc480]/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
	<div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ff6b6b]/5 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
		
		<!-- Left Column: Text -->
		<div class="flex flex-col items-start text-left space-y-8">
			<!-- Eyebrow -->
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1">
				<div class="flex gap-1">
					<span class="w-2 h-2 bg-[#ff6b6b] rounded-full animate-pulse"></span>
					<span class="w-2 h-2 bg-[#ffc480] rounded-full animate-pulse delay-75"></span>
					<span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse delay-150"></span>
				</div>
				<span class="text-sm font-bold text-gray-900 tracking-wide uppercase">Dynamic Media Infrastructure</span>
			</div>

			<!-- Headline -->
			<h1 class="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
				Design once. <br />
				<span class="relative inline-block text-[#ff6b6b]">
					Render
					<svg class="absolute w-full h-4 -bottom-2 left-0 text-gray-900 opacity-20" viewBox="0 0 100 10" preserveAspectRatio="none">
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="4" fill="none" />
					</svg>
				</span>
				Dynamic Media
				<span class="block text-4xl sm:text-5xl md:text-6xl text-gray-500 mt-2 font-extrabold">at Scale.</span>
			</h1>

			<!-- Subheadline -->
			<p class="text-xl text-gray-700 max-w-lg leading-relaxed font-medium border-l-[4px] border-[#ffc480] pl-6">
				The template-first engine for companies that need dynamic media infrastructure.
				Designers build on-brand templates. Developers integrate via API to generate pixel-perfect images, GIFs, and PDFs.
			</p>

			<!-- CTAs -->
			<div class="flex flex-wrap items-center gap-4 w-full">
				<SignUpButton class="bg-[#ff6b6b] text-white text-lg px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all font-bold uppercase tracking-wider" />
				
				<a href="https://docs.pictify.io" target="_blank" class="group flex items-center gap-2 px-8 py-4 bg-white text-gray-900 text-lg rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all font-bold">
					<span>View API Docs</span>
					<svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
					</svg>
				</a>
			</div>

			<!-- Trust/Stats -->
			<div class="pt-8 flex items-center gap-8 opacity-80">
				<div class="flex items-center gap-2">
					<svg class="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
					<span class="font-bold text-gray-700">Template-First Workflow</span>
				</div>
				<div class="flex items-center gap-2">
					<svg class="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
					<span class="font-bold text-gray-700">API + Webhooks</span>
				</div>
			</div>
		</div>

		<!-- Right Column: Interactive Visual -->
		<div 
			class="relative h-[500px] md:h-[600px] w-full perspective-1000 hidden lg:block"
			on:mousemove={handleMouseMove}
			on:mouseleave={() => { mouseX = 0; mouseY = 0; }}
			role="presentation"
			aria-hidden="true"
		>
			<!-- Animated wrapper with slight parallax tilt -->
			<div 
				class="relative w-full h-full transition-transform duration-200 ease-out"
				style="transform: rotateX({-mouseY * 10}deg) rotateY({mouseX * 10}deg)"
			>
				<!-- Back Layer: Code Editor -->
				<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[20px_20px_0_0_rgba(0,0,0,0.1)] z-10 transform -translate-x-12 -translate-y-12">
					<!-- Window Controls -->
					<div class="h-8 bg-gray-800 rounded-t-lg flex items-center px-3 gap-2 border-b border-gray-700">
						<div class="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
						<div class="w-3 h-3 rounded-full bg-[#ffc480]"></div>
						<div class="w-3 h-3 rounded-full bg-[#4ade80]"></div>
					</div>
					<!-- Code Content -->
					<div class="p-6 font-mono text-sm">
						<div class="text-gray-500 mb-2">// Template.html</div>
						{#key activeExample}
							<div in:fade={{ duration: 300 }}>
								<div class="text-[#ff6b6b]">&lt;div <span class="text-[#ffc480]">class</span>=<span class="text-[#4ade80]">"canvas"</span>&gt;</div>
								<div class="pl-4 text-white">{examples[activeExample].code.split('\n')[0]}</div>
								<div class="pl-4 text-white">{examples[activeExample].code.split('\n')[1]}</div>
								<div class="pl-4 text-white">{examples[activeExample].code.split('\n')[2]}</div>
								<div class="text-[#ff6b6b]">&lt;/div&gt;</div>
							</div>
						{/key}
						<div class="mt-4 animate-pulse text-gray-500">|</div>
					</div>
				</div>

				<!-- Connecting Arrow -->
				<div class="absolute top-1/2 left-1/2 w-24 h-24 z-40 transform translate-x-12 -translate-y-24 pointer-events-none">
					<svg class="w-full h-full text-[#ff6b6b] drop-shadow-[3px_3px_0_#fff]" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4">
						<path d="M20 20 Q 80 20 80 80" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M60 70 L 80 80 L 95 65" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>

				<!-- Front Layer: Rendered Result -->
				<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] z-30 transform translate-x-12 translate-y-12 transition-all duration-500">
					{#key activeExample}
						<div 
							in:fly={{ y: 50, duration: 500, delay: 200 }}
							out:fade={{ duration: 200 }}
							class="w-full h-full bg-white rounded-xl border-[4px] border-gray-900 shadow-[15px_15px_0_0_#1f2937] flex flex-col overflow-hidden relative"
						>
							<!-- Header -->
							<div class="h-10 border-b-[3px] border-gray-900 flex items-center justify-between px-4 bg-[#f3f4f6]">
								<span class="font-bold text-xs uppercase tracking-wider text-gray-600">{examples[activeExample].title}</span>
								<div class="px-2 py-0.5 bg-[#4ade80] border-[2px] border-gray-900 text-[10px] font-bold rounded">RENDERED</div>
							</div>
							
							<!-- Content Placeholder -->
							<div class="flex-1 {examples[activeExample].color} p-6 flex items-center justify-center relative overflow-hidden group">
								<!-- Geometric Patterns -->
								<div class="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
								<div class="absolute bottom-0 left-0 w-24 h-24 bg-black/10 transform rotate-45 -ml-12 -mb-12"></div>
								
								<!-- Central Element -->
								<div class="w-3/4 h-3/4 bg-white border-[3px] border-gray-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] rounded-lg flex flex-col p-4">
									<div class="w-12 h-12 bg-gray-200 rounded-full border-[2px] border-gray-900 mb-4"></div>
									<div class="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
									<div class="w-1/2 h-4 bg-gray-200 rounded"></div>
								</div>
							</div>
						</div>
					{/key}
				</div>

				<!-- Floating Badges -->
				<div class="absolute top-20 right-0 animate-bounce [animation-duration:3s]">
					<div class="px-4 py-2 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-lg transform rotate-6 font-bold text-sm">
						⚡️ Batch Rendering
					</div>
				</div>
				<div class="absolute bottom-20 left-0 animate-bounce [animation-duration:4s]">
					<div class="px-4 py-2 bg-[#fff] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-lg transform -rotate-6 font-bold text-sm">
						🚀 Template → Variants
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
</style>