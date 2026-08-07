<script>
	/**
	 * AgentShowcase — Uncluttered, high-visibility "Your AI Agents Can Ship Deliverables" section.
	 * Strict SVG icons (no emojis), high text contrast, generous whitespace,
	 * and a spacious interactive showcase stage.
	 */
	import { fade } from 'svelte/transition';
	import { analytics } from '$lib/analytics.js';

	const ADA_CERT = 'https://media.pictify.io/template-renders/cj944exs-1785797479873.png';

	let activeTab = 'prompt'; // 'prompt' | 'mcp' | 'workflows'
	let copiedMcp = false;
	let activePromptIndex = 0;

	const examplePrompts = [
		{
			prompt: '"Executive diploma: navy border, gold seal, serif name, and QR verification line"',
			type: 'PDF Certificate',
			vars: ['{{name}}', '{{course}}', '{{issue_date}}']
		},
		{
			prompt: '"Tech conference badge: dark theme, VIP badge, attendee avatar, and schedule QR"',
			type: 'Event Badge',
			vars: ['{{attendee_name}}', '{{company}}', '{{ticket_type}}']
		},
		{
			prompt: '"Monthly performance report: brand colors, bar graph summary, and metric pills"',
			type: 'Report',
			vars: ['{{client_name}}', '{{growth_rate}}', '{{period}}']
		}
	];

	function copyMcpConfig() {
		const mcpConfig = `{
  "mcpServers": {
    "pictify": {
      "command": "npx",
      "args": ["-y", "@pictify/mcp-server"],
      "env": { "PICTIFY_API_KEY": "YOUR_API_KEY" }
    }
  }
}`;
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(mcpConfig);
		}
		copiedMcp = true;
		setTimeout(() => {
			copiedMcp = false;
		}, 2500);

		if (analytics?.trackOutboundLink) {
			analytics.trackOutboundLink({
				url: 'mcp-config-copy',
				link_text: 'Copy MCP Server Config',
				location: 'agent_showcase'
			});
		}
	}
</script>

<section class="w-full py-20 md:py-32 bg-[#FFFDF8] border-b-[3px] border-gray-900 relative overflow-hidden z-0">
	<!-- Background grid pattern -->
	<div class="absolute inset-0 bg-[linear-gradient(#1f2937_2px,transparent_2px),linear-gradient(90deg,#1f2937_2px,transparent_2px)] bg-[size:40px_40px] opacity-[0.05] pointer-events-none"></div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
		<!-- Section Header -->
		<div class="text-center mb-16 md:mb-24 max-w-4xl mx-auto relative">
			<!-- Decorative floating elements -->
			<div class="absolute -left-12 top-0 w-16 h-16 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-12 hidden md:block"></div>
			<div class="absolute -right-8 bottom-0 w-12 h-12 rounded-full bg-[#ff6b6b] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] hidden md:block"></div>

			<div
				class="inline-flex items-center gap-2 px-5 py-2 bg-gray-900 border-[3px] border-gray-900 shadow-brutal-sm rounded-full mb-6 transform -rotate-2"
			>
				<svg class="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
				<span class="text-sm font-black text-white uppercase tracking-wider">Agentic Infrastructure</span>
			</div>

			<h2 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
				Your AI Agents Can<br class="hidden md:block" />
				<span class="relative inline-block text-white bg-[#ff6b6b] px-6 py-2 mt-2 transform rotate-1 border-[4px] border-gray-900 shadow-[8px_8px_0_0_#1f2937]">
					Ship Deliverables
				</span>
			</h2>
		</div>

		<!-- Main Interactive Showcase Stage -->
		<div class="relative w-full max-w-6xl mx-auto mb-20">
			<!-- Brutalist Tabs overlaying the stage -->
			<div class="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
				<button on:click={() => (activeTab = 'prompt')} class="px-6 py-3 md:py-4 rounded-xl border-[3px] border-gray-900 text-sm md:text-base font-black uppercase tracking-wider transition-all {activeTab === 'prompt' ? 'bg-[#ffc480] text-gray-900 shadow-[6px_6px_0_0_#1f2937] -translate-y-1' : 'bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] hover:bg-gray-50 hover:-translate-y-0.5'}">
					<span class="hidden md:inline">01.</span> Prompt → Template
				</button>
				<button on:click={() => (activeTab = 'mcp')} class="px-6 py-3 md:py-4 rounded-xl border-[3px] border-gray-900 text-sm md:text-base font-black uppercase tracking-wider transition-all {activeTab === 'mcp' ? 'bg-[#c084fc] text-gray-900 shadow-[6px_6px_0_0_#1f2937] -translate-y-1' : 'bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] hover:bg-gray-50 hover:-translate-y-0.5'}">
					<span class="hidden md:inline">02.</span> MCP Protocol
				</button>
				<button on:click={() => (activeTab = 'workflows')} class="px-6 py-3 md:py-4 rounded-xl border-[3px] border-gray-900 text-sm md:text-base font-black uppercase tracking-wider transition-all {activeTab === 'workflows' ? 'bg-[#4ade80] text-gray-900 shadow-[6px_6px_0_0_#1f2937] -translate-y-1' : 'bg-white text-gray-700 shadow-[2px_2px_0_0_#1f2937] hover:bg-gray-50 hover:-translate-y-0.5'}">
					<span class="hidden md:inline">03.</span> Workflows
				</button>
			</div>

			<!-- Stage Container -->
			<div class="rounded-[2.5rem] border-[4px] border-gray-900 shadow-[16px_16px_0_0_#1f2937] overflow-hidden transition-colors duration-500 {activeTab === 'prompt' ? 'bg-[#FFFDF8]' : activeTab === 'mcp' ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'}">
				
				<div class="p-8 sm:p-12 lg:p-16 min-h-[500px] flex items-center">
					<!-- PROMPT TAB -->
					{#if activeTab === 'prompt'}
						<div in:fade={{ duration: 200 }} class="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
							<!-- Left Side -->
							<div class="lg:col-span-5 space-y-8">
								<div>
									<h3 class="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">Plain Text In, <br/><span class="text-[#ff6b6b] underline decoration-[4px] underline-offset-4">Pixel-Perfect Out</span></h3>
									<p class="text-lg font-bold text-gray-600 leading-relaxed">
										Agents convert prompts into dynamic templates instantly. Variables are exposed automatically for bulk data rendering.
									</p>
								</div>

								<div class="space-y-4">
									<div class="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
										<div class="w-2 h-2 bg-[#ff6b6b] rounded-full"></div>
										Test an Example
									</div>
									<div class="flex flex-col gap-3">
										{#each examplePrompts as item, idx}
											<button on:click={() => (activePromptIndex = idx)} class="text-left px-5 py-4 rounded-2xl border-[3px] border-gray-900 font-bold transition-all flex items-center justify-between {activePromptIndex === idx ? 'bg-[#ffc480] shadow-[6px_6px_0_0_#1f2937] -translate-y-1 scale-[1.02]' : 'bg-white shadow-[2px_2px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5'}">
												<span class="text-sm text-gray-900 font-bold truncate pr-4">{item.prompt}</span>
												<span class="hidden sm:block px-3 py-1 bg-white border-[2px] border-gray-900 text-[10px] font-black uppercase tracking-widest shadow-sm rounded-lg shrink-0">{item.type}</span>
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Right Side Canvas -->
							<div class="lg:col-span-7 relative">
								<div class="bg-gray-100 rounded-3xl border-[4px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] p-2 flex flex-col relative z-10">
									<!-- Browser bar -->
									<div class="h-12 bg-white rounded-t-2xl border-b-[3px] border-gray-900 flex items-center px-4 gap-3">
										<div class="flex gap-2">
											<div class="w-3.5 h-3.5 rounded-full border-[2px] border-gray-900 bg-[#ff6b6b]"></div>
											<div class="w-3.5 h-3.5 rounded-full border-[2px] border-gray-900 bg-[#ffc480]"></div>
											<div class="w-3.5 h-3.5 rounded-full border-[2px] border-gray-900 bg-[#4ade80]"></div>
										</div>
										<div class="flex-1 bg-gray-100 h-7 rounded border-[2px] border-gray-900 flex items-center px-3 mx-2">
											<span class="text-[10px] font-black font-mono text-gray-400">pictify.io/preview</span>
										</div>
									</div>
									<!-- Image area -->
									<div class="relative bg-white overflow-hidden rounded-b-2xl p-4">
										<img src={ADA_CERT} alt="Generated Template" class="w-full h-auto object-cover rounded-xl border-[2px] border-gray-900 shadow-sm" />
										
										<!-- Floating tags -->
										<div class="absolute top-8 left-8 px-4 py-2 bg-[#ffc480] border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] transform -rotate-3 text-xs font-black font-mono">
											{examplePrompts[activePromptIndex].vars[0]}
										</div>
										<div class="absolute bottom-12 right-12 px-4 py-2 bg-[#4ade80] border-[3px] border-gray-900 rounded-xl shadow-[4px_4px_0_0_#1f2937] transform rotate-6 text-xs font-black font-mono">
											{examplePrompts[activePromptIndex].vars[1]}
										</div>
									</div>
								</div>
								
								<!-- Background decorative splat -->
								<div class="absolute -right-6 -bottom-6 w-32 h-32 bg-[#c084fc] rounded-full border-[4px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] z-0 hidden sm:block"></div>
								<div class="absolute -left-6 -top-6 w-24 h-24 bg-[#ff6b6b] rounded-xl border-[4px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] z-0 transform rotate-12 hidden sm:block"></div>
							</div>
						</div>

					<!-- MCP TAB -->
					{:else if activeTab === 'mcp'}
						<div in:fade={{ duration: 200 }} class="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-white">
							<!-- Left Side -->
							<div class="lg:col-span-5 space-y-8">
								<div>
									<div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c084fc] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl transform -rotate-2 mb-6">
										Model Context Protocol
									</div>
									<h3 class="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">Plug & Play for <br/><span class="text-[#c084fc]">Claude & Cursor</span></h3>
									<p class="text-lg font-medium text-gray-300 leading-relaxed">
										Zero custom glue code. Add our server config to your agent, and it instantly learns to design templates and run massive rendering pipelines.
									</p>
								</div>

								<button on:click={copyMcpConfig} class="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#c084fc] text-gray-900 px-8 py-5 rounded-2xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-sm font-black uppercase tracking-wider">
									<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
									{copiedMcp ? 'Config Copied! ✓' : 'Copy Config JSON'}
								</button>
							</div>

							<!-- Right Side Terminal -->
							<div class="lg:col-span-7">
								<div class="bg-black rounded-3xl border-[4px] border-gray-700 shadow-[12px_12px_0_0_#c084fc] p-6 font-mono relative overflow-hidden">
									<!-- Scanlines -->
									<div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-10"></div>
									
									<div class="flex items-center justify-between mb-6 border-b-[2px] border-gray-800 pb-4 relative z-20">
										<div class="flex items-center gap-3">
											<div class="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
											<div class="w-3 h-3 rounded-full bg-[#ffc480]"></div>
											<div class="w-3 h-3 rounded-full bg-[#4ade80]"></div>
										</div>
										<span class="text-xs font-bold text-gray-500 bg-gray-900 px-3 py-1 rounded-md">mcp.pictify.io</span>
									</div>

									<div class="space-y-4 relative z-20">
										<div>
											<span class="text-[#c084fc] font-bold">▶ </span>
											<span class="text-white font-bold">User Prompt:</span>
											<p class="text-gray-300 text-sm mt-1 border-l-2 border-gray-700 pl-3 ml-2">"Generate certificates for 500 attendees and email PDFs."</p>
										</div>
										
										<div class="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
											<div>
												<span class="text-[#ffc480] text-xs font-black uppercase">Executing Tool</span>
												<div class="text-white font-bold mt-1">pictify_create_template</div>
											</div>
											<span class="px-3 py-1 bg-[#4ade80]/20 text-[#4ade80] text-xs font-black rounded-md border border-[#4ade80]/50">200 OK</span>
										</div>

										<div class="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
											<div>
												<span class="text-[#ffc480] text-xs font-black uppercase">Executing Tool</span>
												<div class="text-white font-bold mt-1">pictify_batch_render</div>
											</div>
											<span class="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-black rounded-md border border-gray-700 animate-pulse">Processing...</span>
										</div>

										<div class="text-[#4ade80] font-bold text-sm mt-4 flex items-center gap-2">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
											Job complete: 500 PDFs delivered.
										</div>
									</div>
								</div>
							</div>
						</div>

					<!-- WORKFLOWS TAB -->
					{:else if activeTab === 'workflows'}
						<div in:fade={{ duration: 200 }} class="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-white">
							<!-- Left Side -->
							<div class="lg:col-span-5 space-y-8">
								<div>
									<div class="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4ade80] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl transform rotate-2 mb-6">
										Permanent Webhooks
									</div>
									<h3 class="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">Always-On <br/><span class="text-[#4ade80]">Automations</span></h3>
									<p class="text-lg font-medium text-gray-300 leading-relaxed">
										Trigger document generation instantly from your own backend, Zapier, or n8n. Complete with HMAC signing and per-row bounce tracking.
									</p>
								</div>

								<div class="flex flex-col gap-4">
									<div class="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
										<div class="w-10 h-10 bg-[#4ade80] rounded-lg flex items-center justify-center border-[2px] border-gray-900 shrink-0">
											<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
										</div>
										<span class="text-sm font-bold text-white">HMAC Signed Secure Endpoints</span>
									</div>
									<div class="flex items-center gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
										<div class="w-10 h-10 bg-[#ffc480] rounded-lg flex items-center justify-center border-[2px] border-gray-900 shrink-0">
											<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"/></svg>
										</div>
										<span class="text-sm font-bold text-white">Email Delivery & Per-Row Status</span>
									</div>
								</div>
							</div>

							<!-- Right Side Pipeline -->
							<div class="lg:col-span-7 relative">
								<div class="bg-gray-900 rounded-3xl border-[4px] border-[#4ade80] shadow-[12px_12px_0_0_#4ade80] p-6 md:p-12 relative z-10">
									
									<div class="flex flex-col gap-6 md:gap-8">
										<!-- Pipeline Node 1 -->
										<div class="flex items-center gap-4 md:gap-6 relative">
											<!-- Connecting Line -->
											<div class="absolute left-6 md:left-8 top-12 md:top-16 w-1 h-12 md:h-16 bg-gray-700 border-l-[3px] border-dashed border-[#4ade80]"></div>
											
											<div class="w-12 h-12 md:w-16 md:h-16 bg-white border-[3px] border-gray-900 rounded-2xl shadow-[4px_4px_0_0_#000] flex items-center justify-center shrink-0 z-10">
												<svg class="w-6 h-6 md:w-8 md:h-8 text-[#ffc480]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
											</div>
											<div class="flex-1 bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-700">
												<h4 class="text-white font-black text-base md:text-lg">1. Webhook Trigger</h4>
												<p class="text-gray-400 text-[10px] md:text-xs font-mono mt-1 truncate">POST /hooks/wf_8f3k9/run</p>
											</div>
										</div>

										<!-- Pipeline Node 2 -->
										<div class="flex items-center gap-4 md:gap-6 relative">
											<!-- Connecting Line -->
											<div class="absolute left-6 md:left-8 top-12 md:top-16 w-1 h-12 md:h-16 bg-gray-700 border-l-[3px] border-dashed border-[#4ade80]"></div>

											<div class="w-12 h-12 md:w-16 md:h-16 bg-white border-[3px] border-gray-900 rounded-2xl shadow-[4px_4px_0_0_#000] flex items-center justify-center shrink-0 z-10">
												<svg class="w-6 h-6 md:w-8 md:h-8 text-[#c084fc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
											</div>
											<div class="flex-1 bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-700">
												<h4 class="text-white font-black text-base md:text-lg">2. Render Engine</h4>
												<p class="text-gray-400 text-[10px] md:text-xs font-mono mt-1 truncate">Renders PDF + MP4 assets</p>
											</div>
										</div>

										<!-- Pipeline Node 3 -->
										<div class="flex items-center gap-4 md:gap-6 relative">
											<div class="w-12 h-12 md:w-16 md:h-16 bg-[#4ade80] border-[3px] border-gray-900 rounded-2xl shadow-[4px_4px_0_0_#000] flex items-center justify-center shrink-0 z-10">
												<svg class="w-6 h-6 md:w-8 md:h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
											</div>
											<div class="flex-1 bg-gray-800 rounded-xl p-3 md:p-4 border border-[#4ade80]">
												<h4 class="text-white font-black text-base md:text-lg">3. Email Delivery</h4>
												<p class="text-gray-400 text-[10px] md:text-xs font-mono mt-1 text-[#4ade80] truncate">Sent successfully to inbox</p>
											</div>
										</div>
									</div>
								</div>
								
								<!-- Background decorative element -->
								<div class="absolute -right-4 -top-4 md:-right-8 md:-top-8 w-16 h-16 md:w-24 md:h-24 bg-white border-[4px] border-gray-900 rounded-full shadow-[8px_8px_0_0_#1f2937] z-0 flex items-center justify-center">
									<svg class="w-8 h-8 md:w-10 md:h-10 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- 3 Minimal Feature Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
			<div class="bg-[#ff6b6b] rounded-[2rem] border-[4px] border-gray-900 p-8 sm:p-10 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all text-white">
				<div class="w-16 h-16 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mb-6 transform -rotate-3 text-gray-900">
					<svg class="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
				</div>
				<h4 class="text-2xl font-black text-white mb-3 leading-tight">Zero Glue Code</h4>
				<p class="text-base font-bold text-white/90 leading-relaxed">
					Point your client to our MCP endpoint. Your agents instantly gain multi-format document capabilities out of the box.
				</p>
			</div>

			<div class="bg-[#c084fc] rounded-[2rem] border-[4px] border-gray-900 p-8 sm:p-10 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all text-white">
				<div class="w-16 h-16 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mb-6 transform rotate-3 text-gray-900">
					<svg class="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
				</div>
				<h4 class="text-2xl font-black text-white mb-3 leading-tight">Multi-Format Outputs</h4>
				<p class="text-base font-bold text-white/90 leading-relaxed">
					One single HTML template compiles seamlessly into high-res PDFs, PNG images, GIFs, and MP4 videos on demand.
				</p>
			</div>

			<div class="bg-[#4ade80] rounded-[2rem] border-[4px] border-gray-900 p-8 sm:p-10 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all text-gray-900">
				<div class="w-16 h-16 bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center mb-6 transform -rotate-3 text-gray-900">
					<svg class="w-8 h-8 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
				</div>
				<h4 class="text-2xl font-black text-gray-900 mb-3 leading-tight">Delivery Auditing</h4>
				<p class="text-base font-bold text-gray-900/90 leading-relaxed">
					Track every document with per-row delivered/bounced status, webhook events, and one-click re-send.
				</p>
			</div>
		</div>
	</div>
</section>
