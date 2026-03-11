<script>
	const pillars = [
		{
			id: 'programmable',
			icon: 'code',
			title: 'Fully Programmable',
			subtitle: 'API-first workflow for teams',
			color: 'bg-[#ffc480]',
			features: [
				{ title: 'RESTful API', desc: 'Simple HTTP calls to generate any image' },
				{ title: 'Template Variables', desc: 'Inject dynamic data into your designs' },
				{ title: 'Webhooks', desc: 'Get notified when images are ready' },
				{ title: 'SDK Support', desc: 'Node.js, Python, and more coming' }
			]
		},
		{
			id: 'visual',
			icon: 'image',
			title: 'Visual Power',
			subtitle: 'Pixel-perfect rendering every time',
			color: 'bg-[#ff6b6b]',
			features: [
				{ title: 'Full CSS Support', desc: 'Flexbox, Grid, animations, custom fonts' },
				{ title: 'Retina Ready', desc: '4K resolution with custom DPI' },
				{ title: 'Multiple Formats', desc: 'PNG, JPG, WebP, GIF, PDF' },
				{ title: 'Brand Consistency', desc: 'Asset library for logos and fonts' }
			]
		},
		{
			id: 'scale',
			icon: 'bolt',
			title: 'Speed at Scale',
			subtitle: 'Enterprise-grade infrastructure',
			color: 'bg-green-400',
			features: [
				{ title: 'Sub-500ms', desc: 'Average generation time' },
				{ title: 'No Rate Limits', desc: 'Scale to millions without throttling' },
				{ title: 'Global CDN', desc: '12 edge locations worldwide' },
				{ title: '99.9% Uptime', desc: 'Enterprise SLA guarantee' }
			]
		}
	];

	import { onMount } from 'svelte';

	let visible = false;
	let sectionRef;

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						visible = true;
					}
				});
			},
			{ threshold: 0.1 }
		);

		if (sectionRef) observer.observe(sectionRef);
		return () => observer.disconnect();
	});

	function getIcon(icon) {
		const icons = {
			code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
			image:
				'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
			bolt: 'M13 10V3L4 14h7v7l9-11h-7z'
		};
		return icons[icon] || icons.code;
	}
</script>

<section bind:this={sectionRef} class="w-full py-20 md:py-32 bg-white relative overflow-hidden">
	<!-- Decorative Background -->
	<div
		class="absolute top-0 right-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 left-0 w-96 h-96 bg-gray-50 rounded-full blur-3xl -z-10 pointer-events-none"
	/>

	<div class="max-w-6xl mx-auto px-4">
		<!-- Section Header -->
		<div class="text-center mb-16">
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				What Makes Pictify <span class="text-[#ff6b6b]">Different</span>
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Designers design. Devs integrate. Everyone ships.
			</p>
		</div>

		<!-- Bento Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
			<!-- Cell 1: Programmable (Large, spans 2 cols) -->
			<div
				class="md:col-span-2 bg-[#FFFDF8] rounded-3xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f293780] overflow-hidden relative group hover:-translate-y-1 transition-all duration-700 delay-0 transform {visible
					? 'translate-y-0 opacity-100'
					: 'translate-y-10 opacity-0'}"
			>
				<div class="absolute inset-0 bg-[#ffc480]/10" />
				<div class="p-8 h-full flex flex-col md:flex-row gap-8 items-center">
					<div class="flex-1 z-10">
						<div
							class="inline-flex items-center gap-2 px-3 py-1 bg-[#ffc480] rounded-full border-2 border-gray-900 text-xs font-bold mb-4"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
								/></svg
							>
							Programmable
						</div>
						<h3 class="text-3xl font-bold text-gray-900 mb-3">API-First Design</h3>
						<p class="text-gray-600 mb-6">
							Designers create reusable templates with the visual editor. Developers integrate once
							and render variants with JSON.
						</p>
						<div class="flex gap-2">
							<span class="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono"
								>REST API</span
							>
							<span class="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono"
								>Webhooks</span
							>
							<span class="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs font-mono"
								>SDKs</span
							>
						</div>
					</div>
					<div class="flex-1 w-full max-w-sm">
						<div
							class="bg-[#1e1e1e] rounded-xl border-2 border-gray-900 p-4 shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform duration-500"
						>
							<div class="flex gap-1.5 mb-3">
								<div class="w-2.5 h-2.5 rounded-full bg-red-500" />
								<div class="w-2.5 h-2.5 rounded-full bg-yellow-500" />
								<div class="w-2.5 h-2.5 rounded-full bg-green-500" />
							</div>
							<pre class="font-mono text-xs text-gray-300 overflow-x-auto"><code
									><span class="text-purple-400">POST</span> /v1/image/generate
{`{`}
  <span class="text-blue-400">"template"</span>: <span class="text-green-400">"welcome-email"</span
									>,
  <span class="text-blue-400">"data"</span>: {`{`}
    <span class="text-blue-400">"name"</span>: <span class="text-green-400">"Alex"</span>,
    <span class="text-blue-400">"role"</span>: <span class="text-green-400">"Admin"</span>
  {`}`}
{`}`}</code
								></pre>
						</div>
					</div>
				</div>
			</div>

			<!-- Cell 2: Visual Power (Tall) -->
			<div
				class="md:row-span-2 bg-[#FFFDF8] rounded-3xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f293780] overflow-hidden relative group hover:-translate-y-1 transition-all duration-700 delay-150 transform {visible
					? 'translate-y-0 opacity-100'
					: 'translate-y-10 opacity-0'}"
			>
				<div class="absolute inset-0 bg-[#ff6b6b]/10" />
				<div class="p-8 h-full flex flex-col">
					<div class="z-10">
						<div
							class="inline-flex items-center gap-2 px-3 py-1 bg-[#ff6b6b] rounded-full border-2 border-gray-900 text-xs font-bold mb-4"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/></svg
							>
							Visual Power
						</div>
						<h3 class="text-3xl font-bold text-gray-900 mb-3">Retina Ready</h3>
						<p class="text-gray-600 mb-6">
							Full CSS support. Flexbox, Grid, custom fonts, and animations. Up to 4K resolution.
						</p>
					</div>

					<div
						class="mt-auto relative h-64 w-full flex items-center justify-center perspective-1000"
					>
						<!-- Layer Stack Visualization -->
						<div
							class="w-40 h-48 bg-white border-2 border-gray-900 rounded-lg shadow-sm absolute top-0 left-1/2 -translate-x-1/2 transform translate-z-0 group-hover:translate-y-4 transition-transform duration-500 z-10 flex items-center justify-center"
						>
							<span class="font-bold text-gray-300 text-4xl">BG</span>
						</div>
						<div
							class="w-40 h-48 bg-white/80 border-2 border-gray-900 rounded-lg shadow-sm absolute top-4 left-1/2 -translate-x-1/2 transform translate-z-10 group-hover:translate-y-0 transition-transform duration-500 z-20 flex items-center justify-center backdrop-blur-sm"
						>
							<span class="font-bold text-gray-400 text-4xl">IMG</span>
						</div>
						<div
							class="w-40 h-48 bg-white/60 border-2 border-gray-900 rounded-lg shadow-sm absolute top-8 left-1/2 -translate-x-1/2 transform translate-z-20 group-hover:-translate-y-4 transition-transform duration-500 z-30 flex items-center justify-center backdrop-blur-sm"
						>
							<span class="font-bold text-gray-900 text-4xl">TXT</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Cell 3: Speed (Medium) -->
			<div
				class="bg-[#FFFDF8] rounded-3xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f293780] overflow-hidden relative group hover:-translate-y-1 transition-all duration-700 delay-300 transform {visible
					? 'translate-y-0 opacity-100'
					: 'translate-y-10 opacity-0'}"
			>
				<div class="absolute inset-0 bg-green-100/50" />
				<div class="p-8 h-full flex flex-col justify-between">
					<div>
						<div
							class="inline-flex items-center gap-2 px-3 py-1 bg-green-400 rounded-full border-2 border-gray-900 text-xs font-bold mb-4"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/></svg
							>
							Speed
						</div>
						<h3 class="text-2xl font-bold text-gray-900 mb-2">Sub-500ms Latency</h3>
					</div>
					<div
						class="w-full bg-gray-200 rounded-full h-4 border-2 border-gray-900 overflow-hidden mt-4"
					>
						<div class="bg-green-500 h-full w-[85%] animate-pulse" />
					</div>
				</div>
			</div>

			<!-- Cell 4: Scale (Medium) -->
			<div
				class="bg-[#FFFDF8] rounded-3xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#1f293780] overflow-hidden relative group hover:-translate-y-1 transition-all duration-700 delay-450 transform {visible
					? 'translate-y-0 opacity-100'
					: 'translate-y-10 opacity-0'}"
			>
				<div class="absolute inset-0 bg-blue-100/50" />
				<div class="p-8 h-full flex flex-col justify-between">
					<div>
						<div
							class="inline-flex items-center gap-2 px-3 py-1 bg-blue-400 rounded-full border-2 border-gray-900 text-xs font-bold mb-4"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/></svg
							>
							Global Scale
						</div>
						<h3 class="text-2xl font-bold text-gray-900 mb-2">Global CDN</h3>
					</div>
					<div class="flex gap-2 flex-wrap mt-4">
						<span class="w-2 h-2 rounded-full bg-gray-900" />
						<span class="w-2 h-2 rounded-full bg-gray-900 opacity-50" />
						<span class="w-2 h-2 rounded-full bg-gray-900" />
						<span class="w-2 h-2 rounded-full bg-gray-900 opacity-50" />
						<span class="w-2 h-2 rounded-full bg-gray-900" />
						<span class="w-2 h-2 rounded-full bg-gray-900 opacity-50" />
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
