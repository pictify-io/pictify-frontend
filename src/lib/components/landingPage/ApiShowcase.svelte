<script>
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';

	let activeTab = 'template';
	let terminalState = 'idle'; // idle, typing, done
	let typingInterval;

	const codeExamples = {
		template: {
			title: 'Template + Data',
			description: 'Send data, get a rendered image back',
			icon: '🚀',
			color: '#4ade80',
			code: `curl -X POST https://api.pictify.io/render \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "social-card-v1",
    "variables": {
      "title": "How We Scaled to 10M Users",
      "author": "Sarah Chen",
      "avatar": "https://cdn.app.com/sarah.jpg",
      "tag": "Engineering"
    }
  }'
`
		},
		node: {
			title: 'Node.js SDK',
			description: 'First-class TypeScript support with typed responses',
			icon: '📦',
			color: '#ffc480',
			code: `import Pictify from '@pictify/sdk';

const pictify = new Pictify('YOUR_API_KEY');

const image = await pictify.render({
  templateId: 'social-card-v1',
  variables: {
    title: article.title,
    author: user.name,
    avatar: user.avatarUrl,
    tag: article.category
  }
});`
		},
		batch: {
			title: 'Batch Generation',
			description: 'Generate thousands of images in one request',
			icon: '⚡',
			color: '#a78bfa',
			code: `curl -X POST https://api.pictify.io/batch \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "template_id": "certificate-v2",
    "items": [
      { "name": "Alice Smith", "course": "Web Dev" },
      { "name": "Bob Jones", "course": "Design" },
      // ... up to 10,000 items
    ],
    "webhook": "https://your-app.com/callback"
  }'`
		},
		simple: {
			title: 'Raw HTML',
			description: 'Or just render HTML directly — no template needed',
			icon: '🌐',
			color: '#ff6b6b',
			code: `curl -X POST https://api.pictify.io/image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<div style=\\"padding:40px\\">
      <h1>Hello World</h1>
      <p>Rendered at {{now}}</p>
    </div>",
    "width": 1200,
    "height": 630
  }'`
		}
	};

	function copyCode() {
		navigator.clipboard.writeText(codeExamples[activeTab].code);
		// Could add a toast here
	}

	function handleTabChange(tab) {
		activeTab = tab;
		terminalState = 'idle';
		clearInterval(typingInterval);
		
		// Simulate network request animation
		setTimeout(() => {
			terminalState = 'typing';
			setTimeout(() => {
				terminalState = 'done';
			}, 600);
		}, 100);
	}

	onMount(() => {
		handleTabChange('template');
		return () => clearInterval(typingInterval);
	});
</script>

<section class="w-full py-20 md:py-32 bg-[#fffdf8] relative overflow-hidden">
	<!-- Decorative Background Elements -->
	<div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"></div>
	<div
		class="absolute top-20 -left-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] -z-10 pointer-events-none"
	></div>
	<div
		class="absolute bottom-[-10%] -right-64 w-[800px] h-[800px] bg-[#4ade80]/20 rounded-full blur-[100px] -z-10 pointer-events-none"
	></div>

	<div class="max-w-7xl mx-auto px-6">
		<div class="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
			
			<!-- Left: Content (V1 Layout Restored) -->
			<div class="relative z-10 w-full lg:max-w-xl">
				<div
					class="inline-block px-5 py-2 bg-[#ff6b6b] border-[3px] border-black shadow-[4px_4px_0_0_black] rounded-full transform -rotate-2 mb-8"
				>
					<span class="text-sm font-black text-white uppercase tracking-wider">Developer-First</span>
				</div>

				<h2 class="text-5xl md:text-6xl lg:text-7xl font-black text-black leading-[1.1] mb-6">
					Developer-First API.<br />
					<span class="relative inline-block mt-2">
						5 Minutes to Integrate
						<svg
							class="absolute w-full h-4 sm:h-5 -bottom-1 sm:-bottom-2 left-0 text-[#4ade80] -z-10"
							viewBox="0 0 100 10"
							preserveAspectRatio="none"
						>
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
						</svg>
					</span>
				</h2>

				<p class="text-xl text-black/70 font-medium mb-10 max-w-lg">
					One endpoint. Template + JSON in, image out. Under 200ms. Works with Node.js, Python, or
					just cURL.
				</p>

				<!-- Features List (V1 Layout, V2 Styling) -->
				<div class="space-y-6 mb-12">
					<div class="flex items-start gap-5 group">
						<div
							class="w-14 h-14 bg-[#ffc480] rounded-xl border-[3px] border-black flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_black] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_black] transition-all"
						>
							<svg class="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
						</div>
						<div class="pt-1">
							<h3 class="text-xl font-black text-black mb-1">Predictable & Fast</h3>
							<p class="text-black/70 font-medium text-lg leading-relaxed">
								Standardized JSON responses with &lt;200ms average latency.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-5 group">
						<div
							class="w-14 h-14 bg-[#4ade80] rounded-xl border-[3px] border-black flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_black] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_black] transition-all"
						>
							<svg class="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
						</div>
						<div class="pt-1">
							<h3 class="text-xl font-black text-black mb-1">Async Webhooks</h3>
							<p class="text-black/70 font-medium text-lg leading-relaxed">
								Fire-and-forget batch generation with reliable webhook delivery.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-5 group">
						<div
							class="w-14 h-14 bg-[#ff6b6b] rounded-xl border-[3px] border-black flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_black] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_black] transition-all"
						>
							<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
						</div>
						<div class="pt-1">
							<h3 class="text-xl font-black text-black mb-1">Typed SDKs</h3>
							<p class="text-black/70 font-medium text-lg leading-relaxed">
								First-class TypeScript support. Python and Go coming soon.
							</p>
						</div>
					</div>
				</div>

				<a
					href="https://docs.pictify.io"
					target="_blank"
					class="inline-flex items-center gap-3 px-8 py-5 bg-black text-white text-lg font-black uppercase tracking-wider rounded-2xl border-[3px] border-black shadow-[6px_6px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-1 hover:translate-y-1 transition-all"
				>
					<span>View API Docs</span>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</a>
			</div>

			<!-- Right: Code Terminal (V2 Styling Preserved) -->
			<div class="relative w-full z-10 mx-auto group">
				<!-- Decorative yellow offset shadow box -->
				<div class="absolute inset-0 bg-[#ffc480] rounded-3xl border-[3px] border-black transform translate-x-3 translate-y-3 z-0 pointer-events-none"></div>

				<div class="relative bg-[#1e1e1e] rounded-3xl border-[3px] border-black shadow-[8px_8px_0_0_black] flex flex-col overflow-hidden z-10 transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1 duration-300 min-h-[400px] md:min-h-[500px]">

					<!-- Mac Header -->
					<div class="bg-[#2d2d2d] px-4 py-3 border-b-[3px] border-black flex items-center justify-between">
						<div class="flex gap-2">
							<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-black"></div>
							<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border-2 border-black"></div>
							<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-black"></div>
						</div>
						<div class="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-md border border-white/10">
							<svg class="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
							<span class="text-[10px] font-mono font-bold text-gray-300">api.pictify.io</span>
						</div>
					</div>

					<!-- Tabs Navigation -->
					<div class="flex flex-wrap border-b-[3px] border-black bg-[#252526]">
						{#each Object.entries(codeExamples) as [key, tab]}
							<button 
								class="flex-1 min-w-[80px] sm:min-w-[120px] px-3 md:px-4 py-3 text-xs md:text-sm font-mono font-bold border-r-[3px] border-black last:border-r-0 transition-all flex items-center justify-center gap-2
								{activeTab === key ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-gray-500 hover:bg-[#3d3d3d] hover:text-gray-300'}"
								on:click={() => handleTabChange(key)}
							>
								<div class="w-2 h-2 rounded-full border border-black hidden sm:block" style="background-color: {activeTab === key ? tab.color : 'transparent'}"></div>
								<span class="truncate">{tab.title}</span>
							</button>
						{/each}
					</div>

					<!-- Code Area -->
					<div class="p-5 md:p-8 flex-1 relative font-mono text-xs md:text-sm leading-relaxed overflow-x-auto text-gray-300 scrollbar-hide flex flex-col justify-between">
						<!-- Copy Button -->
						<button 
							on:click={copyCode}
							class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 text-xs font-bold rounded-lg border border-white/20 transition-all z-20 hidden md:block"
							title="Copy code"
						>
							Copy
						</button>

						{#key activeTab}
							<div in:fade={{duration: 150}} class="w-full flex-1 flex flex-col">
								<div class="flex-1">
									<!-- Description Comment -->
									<div class="text-gray-500 mb-4 select-none">
										<span style="color: {codeExamples[activeTab].color}">// </span>
										{codeExamples[activeTab].description}
									</div>
									
									<!-- Syntax Highlighting -->
									<div class="w-full">
										{#each codeExamples[activeTab].code.split('\n') as line}
											<div class="w-full whitespace-pre break-normal">
												{@html line
													.replace(/curl -X POST/g, '<span class="text-[#fcd34d]">curl -X POST</span>')
													.replace(/https:\/\/api\.pictify\.io[^\s\\]*/g, '<span class="text-[#93c5fd]">$&</span>')
													.replace(/-H/g, '<span class="text-[#fca5a5]">-H</span>')
													.replace(/-d/g, '<span class="text-[#fca5a5]">-d</span>')
													.replace(/"Authorization: Bearer YOUR_API_KEY"/g, '"<span class="text-[#86efac]">Authorization: Bearer YOUR_API_KEY</span>"')
													.replace(/"Content-Type: application\/json"/g, '"<span class="text-[#86efac]">Content-Type: application/json</span>"')
													.replace(/'{/g, '<span class="text-[#e2e8f0]">\'{</span>')
													.replace(/}'/g, '<span class="text-[#e2e8f0]">}\'</span>')
													.replace(/"template_id":/g, '<span class="text-[#67e8f9]">"template_id":</span>')
													.replace(/"variables":/g, '<span class="text-[#67e8f9]">"variables":</span>')
													.replace(/"items":/g, '<span class="text-[#67e8f9]">"items":</span>')
													.replace(/"webhook":/g, '<span class="text-[#67e8f9]">"webhook":</span>')
													.replace(/"html":/g, '<span class="text-[#67e8f9]">"html":</span>')
													.replace(/"width":/g, '<span class="text-[#67e8f9]">"width":</span>')
													.replace(/"height":/g, '<span class="text-[#67e8f9]">"height":</span>')
													.replace(/"title":/g, '<span class="text-[#cbd5e1]">"title":</span>')
													.replace(/"author":/g, '<span class="text-[#cbd5e1]">"author":</span>')
													.replace(/"avatar":/g, '<span class="text-[#cbd5e1]">"avatar":</span>')
													.replace(/"tag":/g, '<span class="text-[#cbd5e1]">"tag":</span>')
													.replace(/"name":/g, '<span class="text-[#cbd5e1]">"name":</span>')
													.replace(/"course":/g, '<span class="text-[#cbd5e1]">"course":</span>')
													.replace(/import/g, '<span class="text-[#c4b5fd]">import</span>')
													.replace(/from/g, '<span class="text-[#c4b5fd]">from</span>')
													.replace(/const/g, '<span class="text-[#c4b5fd]">const</span>')
													.replace(/new/g, '<span class="text-[#c4b5fd]">new</span>')
													.replace(/await/g, '<span class="text-[#c4b5fd]">await</span>')
													.replace(/Pictify/g, '<span class="text-[#fdba74]">Pictify</span>')
													.replace(/render/g, '<span class="text-[#93c5fd]">render</span>')
												}
											</div>
										{/each}
									</div>
								</div>

								<!-- Fake Response Area (Anchored to Bottom) -->
								<div class="mt-8 border-t-[2px] border-dashed border-gray-700 pt-4">
									{#if terminalState === 'idle' || terminalState === 'typing'}
										<div class="flex items-center gap-2 text-[#4ade80]">
											<span class="animate-spin text-xl leading-none">⁕</span>
											<span class="animate-pulse">Awaiting request...</span>
										</div>
									{:else if terminalState === 'done'}
										<div in:slide={{duration: 300}} class="flex flex-col gap-2">
											<div class="flex items-center gap-2 text-gray-500">
												<span>➜</span>
												<span class="text-white bg-green-900/50 px-2 py-0.5 rounded border border-green-700/50 text-[10px]">200 OK</span>
												<span class="text-[10px]">142ms</span>
											</div>
											<div class="text-[#86efac]">
												<span class="text-gray-500">&#123;</span><br/>
												&nbsp;&nbsp;<span class="text-[#67e8f9]">"url"</span>: <span class="text-[#cbd5e1]">"https://cdn.pictify.io/render_8x92jK.png"</span><br/>
												<span class="text-gray-500">&#125;</span>
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/key}
					</div>
				</div>
			</div>

		</div>
	</div>
</section>

<style>
	/* Custom Hide Scrollbar for Code Block */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
