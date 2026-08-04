<script>
	/**
	 * AgentShowcase — differentiator ③ given its own stage.
	 * Every claim here is shipped-true (positioning-synthesis-2026-08-04):
	 * AI template authoring (docs AND video) is a verified category-zero in
	 * both markets; the MCP server (mcp.pictify.io) ships template CRUD,
	 * render, batch, PDF, GIF and video tools; every workflow gets a
	 * permanent HMAC-signed webhook. The chat mock uses real tool names.
	 */
	import { analytics } from '$lib/analytics.js';

	const capabilities = [
		{
			title: 'Describe → Template',
			body: 'Tell it what you want — a certificate, a report, a personalized video — and get back an editable, variable-ready template. No other document or video API ships this.',
			accent: 'bg-brand-accent',
			icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0013 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
		},
		{
			title: 'MCP-Native',
			body: 'mcp.pictify.io exposes templates, renders, batches, PDFs, GIFs and video as tools your agents already know how to call — from Claude, Cursor, or any MCP client.',
			accent: 'bg-data-violet',
			icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
		},
		{
			title: 'Always-On Workflows',
			body: 'Every workflow gets a permanent, HMAC-signed webhook: one row of JSON in, a rendered document out — emailed to its recipient. Wire it to n8n, Zapier, or your agent.',
			accent: 'bg-data-green',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z'
		}
	];

	const toolCalls = [
		{ tool: 'pictify_create_template', detail: 'certificate · 3 variables', state: 'done' },
		{ tool: 'pictify_batch_render', detail: '240 rows queued', state: 'done' },
		{ tool: 'workflow webhook', detail: 'per-recipient email delivery', state: 'done' }
	];
</script>

<section
	class="w-full py-20 md:py-28 bg-gray-950 border-b-[3px] border-gray-900 relative overflow-hidden"
>
	<!-- dark grid -->
	<div
		class="absolute inset-0 opacity-[0.06] pointer-events-none"
		style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-0 -left-64 w-[700px] h-[700px] bg-data-violet/20 rounded-full blur-[120px] pointer-events-none"
	/>
	<div
		class="absolute bottom-0 -right-64 w-[700px] h-[700px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none"
	/>

	<div class="max-w-6xl mx-auto px-6 relative z-10">
		<div class="text-center mb-16 max-w-3xl mx-auto">
			<div
				class="inline-block mb-5 px-5 py-2 bg-data-violet border-[3px] border-gray-900 shadow-[4px_4px_0_0_#ffffff33] rounded-full transform rotate-1"
			>
				<span class="text-sm font-black text-white uppercase tracking-wider">Agent-Native</span>
			</div>
			<h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4">
				Your AI Agents Can<br />
				<span class="relative inline-block text-brand-accent transform -rotate-1 mt-2">
					Ship Deliverables
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-white z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-base md:text-lg text-gray-400 font-medium">
				Agents produce text all day. Pictify is how they produce — and deliver — the branded
				documents and videos behind it.
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
			<!-- Agent conversation mock -->
			<div class="relative">
				<div
					class="absolute inset-0 bg-data-violet rounded-2xl transform -rotate-1 -translate-x-2 translate-y-2 pointer-events-none opacity-70"
				/>
				<div
					class="relative bg-gray-900 rounded-2xl border-[3px] border-gray-700 shadow-[8px_8px_0_0_#00000066] overflow-hidden"
				>
					<div class="bg-gray-800 border-b-[3px] border-gray-700 px-4 py-3 flex items-center gap-2">
						<span class="w-3 h-3 rounded-full bg-brand-danger border-[2px] border-gray-900" />
						<span class="w-3 h-3 rounded-full bg-brand-accent border-[2px] border-gray-900" />
						<span class="w-3 h-3 rounded-full bg-data-green border-[2px] border-gray-900" />
						<span class="ml-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
							>Your agent + Pictify MCP</span
						>
					</div>

					<div class="p-5 space-y-4">
						<!-- user message -->
						<div class="flex justify-end">
							<div
								class="max-w-[85%] bg-brand-accent border-[2px] border-gray-900 rounded-xl rounded-br-sm px-4 py-3"
							>
								<p class="text-[13px] font-bold text-gray-900 leading-snug">
									Cloud Architecture 101 just wrapped — get everyone their certificate.
								</p>
							</div>
						</div>

						<!-- agent reply with tool calls -->
						<div class="flex justify-start">
							<div class="max-w-[92%] space-y-2.5">
								<div
									class="bg-gray-800 border-[2px] border-gray-700 rounded-xl rounded-bl-sm px-4 py-3"
								>
									<p class="text-[13px] font-medium text-gray-300 leading-snug">
										On it — drafting the template and rendering one per graduate.
									</p>
								</div>
								{#each toolCalls as call}
									<div
										class="flex items-center gap-2.5 bg-gray-950 border-[2px] border-gray-700 rounded-lg px-3.5 py-2.5"
									>
										<span
											class="w-4 h-4 bg-data-green rounded border border-gray-900 flex items-center justify-center shrink-0"
										>
											<svg class="w-2.5 h-2.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
												><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg
											>
										</span>
										<code class="text-[11px] font-mono font-bold text-brand-accent">{call.tool}</code>
										<span class="text-[10px] font-bold text-gray-500 ml-auto whitespace-nowrap"
											>{call.detail}</span
										>
									</div>
								{/each}
								<div
									class="bg-gray-800 border-[2px] border-gray-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
								>
									<p class="text-[13px] font-medium text-gray-300 leading-snug">
										Done — 240 certificates rendered and emailed.
									</p>
									<span
										class="px-2.5 py-1 rounded-full border-[2px] border-gray-900 bg-data-green text-black text-[9px] font-black uppercase tracking-widest whitespace-nowrap"
										>239 delivered</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Capability tiles -->
			<div class="space-y-5">
				{#each capabilities as capability}
					<div
						class="flex items-start gap-5 bg-gray-900 border-[3px] border-gray-700 rounded-2xl p-5 hover:border-gray-500 hover:-translate-y-0.5 transition-all"
					>
						<div
							class="w-12 h-12 {capability.accent} rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#00000066] flex items-center justify-center shrink-0"
						>
							<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d={capability.icon} />
							</svg>
						</div>
						<div>
							<h3 class="text-lg font-black text-white mb-1">{capability.title}</h3>
							<p class="text-[13px] font-medium text-gray-400 leading-relaxed">{capability.body}</p>
						</div>
					</div>
				{/each}

				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
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
						class="inline-flex items-center justify-center gap-2 bg-brand-accent text-gray-900 px-6 py-3.5 rounded-xl border-[3px] border-gray-900 shadow-[5px_5px_0_0_#ffffff33] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all font-black uppercase tracking-wider text-sm"
					>
						Connect Your Agent
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg
						>
					</a>
					<code
						class="inline-flex items-center justify-center px-5 py-3.5 bg-gray-900 border-[3px] border-gray-700 rounded-xl text-[12px] font-mono font-bold text-gray-300"
						>mcp.pictify.io</code
					>
				</div>
			</div>
		</div>
	</div>
</section>
