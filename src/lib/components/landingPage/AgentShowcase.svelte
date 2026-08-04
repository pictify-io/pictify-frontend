<script>
	/**
	 * AgentShowcase — differentiator ③, graphic-first.
	 * One lavender bento panel: an agent conversation that ENDS IN THE
	 * DELIVERABLE (a real Pictify render), three one-line capability chips,
	 * one CTA. Every claim shipped-true (positioning-synthesis-2026-08-04).
	 */
	import { analytics } from '$lib/analytics.js';

	const toolCalls = [
		{ tool: 'pictify_create_template', detail: '3 variables' },
		{ tool: 'pictify_batch_render', detail: '240 rows' },
		{ tool: 'workflow_webhook', detail: 'emailed' }
	];

	const capabilities = [
		{ title: 'Describe → Template', caption: 'Docs & video. A category of one.', accent: 'bg-brand-accent', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0013 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
		{ title: 'MCP-Native', caption: 'Claude, Cursor, any MCP client.', accent: 'bg-white', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
		{ title: 'Always-On Workflows', caption: 'Signed webhooks: n8n, Zapier, agents.', accent: 'bg-data-green', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
	];

	const ADA_CERT = 'https://media.pictify.io/template-renders/cj944exs-1785797479873.png';
</script>

<section class="w-full py-16 md:py-24 bg-brand-bg border-b-[3px] border-gray-900 relative overflow-hidden">
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- One big bento panel, same language as ScaleUseCases blocks -->
		<div
			class="bg-[#c4b5fd] rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl relative overflow-hidden"
		>
			<div
				class="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12] pointer-events-none"
			/>

			<div class="grid lg:grid-cols-12 relative z-10">
				<!-- Left: heading + chips + CTA -->
				<div class="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-center gap-6">
					<div>
						<div
							class="inline-block mb-4 px-4 py-1.5 bg-gray-900 border-[3px] border-gray-900 shadow-brutal-lg rounded-full transform -rotate-2"
						>
							<span class="text-xs font-black text-white uppercase tracking-wider">Agent-Native</span>
						</div>
						<h2 class="text-3xl md:text-4xl xl:text-5xl font-black text-gray-900 leading-[1.05]">
							Your AI Agents<br />
							<span class="relative inline-block text-white drop-shadow-[3px_3px_0_rgba(31,41,55,1)] mt-1">
								Ship Deliverables
							</span>
						</h2>
					</div>

					<div class="flex flex-col gap-3">
						{#each capabilities as capability}
							<div
								class="flex items-center gap-3 bg-white/70 backdrop-blur rounded-xl border-[3px] border-gray-900 px-4 py-3 shadow-brutal-md hover:-translate-y-0.5 transition-transform"
							>
								<div
									class="w-9 h-9 {capability.accent} rounded-lg border-[2px] border-gray-900 flex items-center justify-center shrink-0"
								>
									<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d={capability.icon} />
									</svg>
								</div>
								<div class="flex-1 min-w-0 flex flex-col">
									<span class="text-sm font-black text-gray-900">{capability.title}</span>
									<span class="text-[11px] font-bold text-gray-600">{capability.caption}</span>
								</div>
							</div>
						{/each}
					</div>

					<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
						<a
							href="https://docs.pictify.io"
							target="_blank"
							rel="noopener noreferrer"
							on:click={() =>
								analytics.trackOutboundLink({
									url: 'https://docs.pictify.io',
									link_text: 'Connect your agent',
									location: 'agent_showcase'
								})}
							class="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl border-[3px] border-gray-900 shadow-brutal-lg hover:translate-y-1 hover:translate-x-1 hover:shadow-brutal-sm transition-all font-black uppercase tracking-wider text-sm"
						>
							Connect Your Agent
						</a>
						<code
							class="inline-flex items-center justify-center px-4 py-3 bg-white rounded-xl border-[3px] border-gray-900 text-[12px] font-mono font-bold text-gray-900 shadow-brutal-sm"
							>mcp.pictify.io</code
						>
					</div>
				</div>

				<!-- Right: the conversation that ends in a deliverable -->
				<div
					class="lg:col-span-7 p-6 md:p-10 flex items-center justify-center border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-gray-900 bg-white/20"
				>
					<div class="w-full max-w-[480px] bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden">
						<div class="bg-gray-100 border-b-[3px] border-gray-900 px-4 py-2.5 flex items-center gap-2">
							<span class="w-3 h-3 rounded-full bg-brand-danger border-[2px] border-gray-900" />
							<span class="w-3 h-3 rounded-full bg-brand-accent border-[2px] border-gray-900" />
							<span class="w-3 h-3 rounded-full bg-data-green border-[2px] border-gray-900" />
							<span class="ml-2 text-[9px] font-black uppercase tracking-widest text-gray-500"
								>Your agent + Pictify MCP</span
							>
						</div>

						<div class="p-4 md:p-5 space-y-3">
							<!-- user -->
							<div class="flex justify-end">
								<div class="max-w-[85%] bg-brand-accent border-[2px] border-gray-900 rounded-xl rounded-br-sm px-3.5 py-2.5 shadow-brutal-sm">
									<p class="text-[12px] font-bold text-gray-900 leading-snug">
										Course wrapped — get everyone their certificate 🎓
									</p>
								</div>
							</div>

							<!-- tool calls -->
							<div class="space-y-1.5">
								{#each toolCalls as call}
									<div class="flex items-center gap-2.5 bg-gray-950 rounded-lg px-3 py-2 border-[2px] border-gray-900">
										<span class="w-3.5 h-3.5 bg-data-green rounded-sm border border-gray-900 flex items-center justify-center shrink-0">
											<svg class="w-2.5 h-2.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg
											>
										</span>
										<code class="text-[10.5px] font-mono font-bold text-brand-accent">{call.tool}</code>
										<span class="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-auto whitespace-nowrap"
											>{call.detail}</span
										>
									</div>
								{/each}
							</div>

							<!-- agent result: the deliverable itself -->
							<div class="flex justify-start">
								<div class="max-w-[92%] bg-gray-100 border-[2px] border-gray-900 rounded-xl rounded-bl-sm p-3 shadow-brutal-sm">
									<div class="flex items-center justify-between gap-3 mb-2">
										<p class="text-[12px] font-bold text-gray-900">Done — rendered &amp; emailed ✅</p>
										<span
											class="px-2.5 py-0.5 rounded-full border-[2px] border-gray-900 bg-data-green text-black text-[8px] font-black uppercase tracking-widest whitespace-nowrap"
											>239 delivered</span
										>
									</div>
									<div class="relative">
										<img
											loading="lazy"
											src={ADA_CERT}
											alt="Certificate rendered by the agent"
											class="w-full rounded-lg border-[2px] border-gray-900 bg-white"
										/>
										<span
											class="absolute -top-2 -right-2 px-2 py-0.5 bg-white rounded border-[2px] border-gray-900 text-[8px] font-black uppercase tracking-widest shadow-brutal-sm"
											>1 of 240</span
										>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
