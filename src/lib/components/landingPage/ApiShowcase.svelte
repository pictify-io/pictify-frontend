<script>
	import { fade } from 'svelte/transition';

	let activeTab = 'simple';

	const codeExamples = {
		simple: {
			title: 'Simple Request',
			description: 'Generate an image with a single API call',
			code: `curl -X POST https://api.pictify.io/image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "html": "<h1>Hello World</h1>",
    "width": 1200,
    "height": 630
  }'`
		},
		template: {
			title: 'Template Variables',
			description: 'Inject dynamic data into reusable templates',
			code: `curl -X POST https://api.pictify.io/image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "template_id": "social-card-v1",
    "variables": {
      "title": "{{article.title}}",
      "author": "{{user.name}}",
      "avatar": "{{user.avatar_url}}",
      "date": "{{published_at}}"
    }
  }'`
		},
		batch: {
			title: 'Batch Generation',
			description: 'Generate thousands of images in one request',
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
		}
	};

	function copyCode() {
		navigator.clipboard.writeText(codeExamples[activeTab].code);
		// Could add a toast here
	}
</script>

<section class="w-full py-20 md:py-32 bg-white relative overflow-hidden">
	<!-- Decorative Background Elements -->
	<div
		class="absolute top-20 left-0 w-64 h-64 bg-[#ffc480]/10 rounded-full blur-3xl -z-10 pointer-events-none"
	/>
	<div
		class="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10 pointer-events-none"
	/>

	<div class="max-w-6xl mx-auto px-6">
		<div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
			<!-- Left: Content -->
			<div class="relative z-10">
				<div
					class="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b6b] rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] mb-8 transform -rotate-2"
				>
					<span class="text-sm font-bold text-white uppercase tracking-wider">Design → API</span>
				</div>

				<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
					Built for <br />
					<span class="relative inline-block">
						Modern Teams
						<svg
							class="absolute w-full h-3 -bottom-1 left-0 text-[#4ade80] -z-10"
							viewBox="0 0 100 10"
							preserveAspectRatio="none"
						>
							<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
						</svg>
					</span>
				</h2>

				<p class="text-xl text-gray-700 mb-10 leading-relaxed font-medium">
					Designers own templates. Your product and marketing teams move faster. Developers
					integrate once and render dynamic media reliably via API.
				</p>

				<!-- Features List -->
				<div class="space-y-6 mb-10">
					<div class="flex items-start gap-4 group">
						<div
							class="w-12 h-12 bg-[#ffc480] rounded-xl border-[3px] border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_#1f2937] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
						>
							<svg
								class="w-6 h-6 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-bold text-gray-900 mb-1">Predictable & Fast</h3>
							<p class="text-gray-600 font-medium">
								Standardized JSON responses with &lt;500ms average latency.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-4 group">
						<div
							class="w-12 h-12 bg-[#4ade80] rounded-xl border-[3px] border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_#1f2937] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
						>
							<svg
								class="w-6 h-6 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-bold text-gray-900 mb-1">Async Webhooks</h3>
							<p class="text-gray-600 font-medium">
								Fire-and-forget batch generation with reliable webhook delivery.
							</p>
						</div>
					</div>

					<div class="flex items-start gap-4 group">
						<div
							class="w-12 h-12 bg-[#ff6b6b] rounded-xl border-[3px] border-gray-900 flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_0_#1f2937] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_#1f2937] transition-all"
						>
							<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-bold text-gray-900 mb-1">Typed SDKs</h3>
							<p class="text-gray-600 font-medium">
								First-class TypeScript support. Python and Go coming soon.
							</p>
						</div>
					</div>
				</div>

				<a
					href="https://docs.pictify.io"
					target="_blank"
					class="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white text-lg font-bold rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#ffc480] hover:shadow-[2px_2px_0_0_#ffc480] hover:translate-x-1 hover:translate-y-1 transition-all"
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

			<!-- Right: Code Terminal -->
			<div class="relative">
				<!-- Decorative Elements behind terminal -->
				<div
					class="absolute -top-4 -right-4 w-24 h-24 bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:16px_16px] opacity-20"
				/>
				<div
					class="absolute -bottom-4 -left-4 w-full h-full border-[3px] border-gray-900 rounded-2xl bg-[#ffc480] -z-10"
				/>

				<div
					class="bg-[#1e1e1e] rounded-2xl border-[3px] border-gray-900 overflow-hidden shadow-[8px_8px_0_0_#1f2937]"
				>
					<!-- Terminal Header -->
					<div
						class="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b-[3px] border-gray-900"
					>
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 rounded-full bg-[#ff6b6b]" />
							<div class="w-3 h-3 rounded-full bg-[#ffc480]" />
							<div class="w-3 h-3 rounded-full bg-[#4ade80]" />
						</div>
						<div class="text-xs font-mono text-gray-400 font-bold">bash — 80x24</div>
					</div>

					<!-- Tabs -->
					<div class="flex flex-wrap bg-[#252526] border-b-[3px] border-gray-900">
						{#each Object.keys(codeExamples) as tab}
							<button
								class="flex-1 px-3 md:px-6 py-3 text-xs md:text-sm font-mono font-bold transition-colors border-r border-gray-700 whitespace-nowrap
								{activeTab === tab
									? 'bg-[#1e1e1e] text-[#4ade80] border-t-2 border-t-[#4ade80]'
									: 'text-gray-500 hover:text-gray-300 hover:bg-[#2d2d2d]'}"
								on:click={() => (activeTab = tab)}
							>
								{codeExamples[tab].title}
							</button>
						{/each}
					</div>

					<!-- Code Content -->
					<div class="p-6 min-h-[300px] relative group">
						<div
							class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<button
								class="p-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700 shadow-lg"
								on:click={copyCode}
								title="Copy to clipboard"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</button>
						</div>

						{#key activeTab}
							<div in:fade={{ duration: 200 }}>
								<div class="flex items-center gap-2 mb-4 text-gray-500 font-mono text-xs">
									<span class="text-[#ff6b6b]">$</span>
									<span>{codeExamples[activeTab].description}</span>
								</div>
								<pre class="font-mono text-sm leading-relaxed overflow-x-auto scrollbar-hide"><code
										class="language-bash">
{#each codeExamples[activeTab].code.split('\n') as line}
											<div class="flex"><span
													class="text-gray-600 w-6 select-none text-right pr-3 opacity-50"
												/><span class="text-[#d4d4d4]"
													>{@html line
														.replace(/"(.*?)"/g, '<span class="text-[#ce9178]">"$1"</span>')
														.replace(/curl/g, '<span class="text-[#4ade80]">curl</span>')
														.replace(
															/-X POST/g,
															'<span class="text-[#ffc480]">-X POST</span>'
														)}</span
												></div>
										{/each}
								</code></pre>
								<div
									class="mt-4 flex items-center gap-2 text-[#4ade80] animate-pulse font-mono text-sm"
								>
									<span>➜</span>
									<span class="w-2.5 h-5 bg-[#4ade80]" />
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
	/* Custom Scrollbar for code block */
	pre::-webkit-scrollbar {
		height: 8px;
	}
	pre::-webkit-scrollbar-track {
		background: #1e1e1e;
	}
	pre::-webkit-scrollbar-thumb {
		background: #4a4a4a;
		border-radius: 4px;
	}
	pre::-webkit-scrollbar-thumb:hover {
		background: #5a5a5a;
	}
</style>
