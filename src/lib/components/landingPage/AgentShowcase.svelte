<script>
	/**
	 * AgentShowcase — differentiator ③ as three independent cards, each
	 * with its own graphic (no shared panel):
	 *   1. Describe → Template: prompt in, editable template out (real render)
	 *   2. MCP-Native: the agent conversation making real tool calls
	 *   3. Always-On Workflows: signed webhook in, rendered + emailed out
	 * Every claim shipped-true (positioning-synthesis-2026-08-04).
	 */
	import { analytics } from '$lib/analytics.js';

	const ADA_CERT = 'https://media.pictify.io/template-renders/cj944exs-1785797479873.png';
</script>

<section class="w-full py-16 md:py-24 bg-brand-bg border-b-[3px] border-gray-900 relative overflow-hidden">
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/4 -right-64 w-[700px] h-[700px] bg-data-violet/20 rounded-full blur-[110px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<div class="text-center mb-14 max-w-3xl mx-auto">
			<div
				class="inline-block mb-5 px-5 py-2 bg-data-violet border-[3px] border-gray-900 shadow-brutal-xl rounded-full transform -rotate-2"
			>
				<span class="text-sm font-black text-white uppercase tracking-wider">Agent-Native</span>
			</div>
			<h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight">
				Your AI Agents Can<br />
				<span class="relative inline-block text-brand-danger transform -rotate-1 mt-2">
					Ship Deliverables
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
			<!-- Card 1: Describe → Template -->
			<div
				class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-xl hover:shadow-brutal-2xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
			>
				<div class="p-5 pb-4">
					<div class="flex items-center gap-3 mb-1">
						<div
							class="w-10 h-10 bg-brand-accent rounded-xl border-[3px] border-gray-900 shadow-brutal-sm flex items-center justify-center"
						>
							<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0013 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg
							>
						</div>
						<h3 class="text-lg font-black text-gray-900 leading-tight">Describe → Template</h3>
					</div>
					<p class="text-[12px] font-bold text-gray-500">Docs &amp; video. A category of one.</p>
				</div>

				<div class="flex-1 bg-brand-accent/15 border-t-[3px] border-gray-900 p-4 flex flex-col gap-2.5">
					<!-- the prompt -->
					<div class="bg-white rounded-xl border-[2px] border-gray-900 shadow-brutal-sm px-3.5 py-2.5">
						<p class="text-[11px] font-bold text-gray-900 leading-snug">
							✨ "Elegant certificate — serif name, gold seal, signature line"
						</p>
					</div>
					<!-- arrow -->
					<div class="flex justify-center -my-1">
						<span
							class="w-7 h-7 bg-gray-900 rounded-full border-[2px] border-white shadow-brutal-sm flex items-center justify-center"
						>
							<svg class="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg
							>
						</span>
					</div>
					<!-- the template, variables exposed -->
					<div class="relative">
						<img
							loading="lazy"
							src={ADA_CERT}
							alt="AI-drafted certificate template"
							class="w-full rounded-lg border-[2px] border-gray-900 shadow-brutal-sm bg-white"
						/>
						<span
							class="absolute top-2 left-2 px-2 py-0.5 bg-white rounded border-[2px] border-gray-900 text-[8px] font-black font-mono shadow-brutal-sm"
							>{'{{name}}'}</span
						>
						<span
							class="absolute bottom-2 right-2 px-2 py-0.5 bg-white rounded border-[2px] border-gray-900 text-[8px] font-black font-mono shadow-brutal-sm"
							>{'{{course}}'}</span
						>
						<span
							class="absolute -top-2 -right-2 px-2 py-0.5 bg-data-green rounded border-[2px] border-gray-900 text-[8px] font-black uppercase tracking-widest shadow-brutal-sm"
							>Editable</span
						>
					</div>
				</div>
			</div>

			<!-- Card 2: MCP-Native -->
			<div
				class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-xl hover:shadow-brutal-2xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
			>
				<div class="p-5 pb-4">
					<div class="flex items-center gap-3 mb-1">
						<div
							class="w-10 h-10 bg-data-violet rounded-xl border-[3px] border-gray-900 shadow-brutal-sm flex items-center justify-center"
						>
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg
							>
						</div>
						<h3 class="text-lg font-black text-gray-900 leading-tight">MCP-Native</h3>
					</div>
					<p class="text-[12px] font-bold text-gray-500">Claude, Cursor, any MCP client.</p>
				</div>

				<div class="flex-1 bg-data-violet/15 border-t-[3px] border-gray-900 p-4 flex flex-col gap-2.5 justify-center">
					<!-- ask -->
					<div class="flex justify-end">
						<div class="max-w-[90%] bg-brand-accent border-[2px] border-gray-900 rounded-xl rounded-br-sm px-3 py-2 shadow-brutal-sm">
							<p class="text-[11px] font-bold text-gray-900 leading-snug">
								Get everyone their certificate 🎓
							</p>
						</div>
					</div>
					<!-- tool calls -->
					<div class="space-y-1.5">
						<div class="flex items-center gap-2 bg-gray-950 rounded-lg px-3 py-2 border-[2px] border-gray-900">
							<span class="w-3 h-3 bg-data-green rounded-sm border border-gray-900 shrink-0" />
							<code class="text-[10px] font-mono font-bold text-brand-accent">pictify_create_template</code>
						</div>
						<div class="flex items-center gap-2 bg-gray-950 rounded-lg px-3 py-2 border-[2px] border-gray-900">
							<span class="w-3 h-3 bg-data-green rounded-sm border border-gray-900 shrink-0" />
							<code class="text-[10px] font-mono font-bold text-brand-accent">pictify_batch_render</code>
							<span class="text-[8px] font-black uppercase tracking-widest text-gray-500 ml-auto">240 rows</span>
						</div>
					</div>
					<!-- result -->
					<div class="flex justify-start">
						<div class="bg-white border-[2px] border-gray-900 rounded-xl rounded-bl-sm px-3 py-2 shadow-brutal-sm flex items-center gap-2.5">
							<p class="text-[11px] font-bold text-gray-900">Done ✅</p>
							<span
								class="px-2 py-0.5 rounded-full border-[2px] border-gray-900 bg-data-green text-black text-[8px] font-black uppercase tracking-widest"
								>239 delivered</span
							>
						</div>
					</div>
					<!-- server chip -->
					<div class="flex justify-center pt-1">
						<code
							class="px-3 py-1.5 bg-white rounded-lg border-[2px] border-gray-900 text-[10px] font-mono font-bold text-gray-900 shadow-brutal-sm"
							>mcp.pictify.io</code
						>
					</div>
				</div>
			</div>

			<!-- Card 3: Always-On Workflows -->
			<div
				class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-xl hover:shadow-brutal-2xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
			>
				<div class="p-5 pb-4">
					<div class="flex items-center gap-3 mb-1">
						<div
							class="w-10 h-10 bg-data-green rounded-xl border-[3px] border-gray-900 shadow-brutal-sm flex items-center justify-center"
						>
							<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg
							>
						</div>
						<h3 class="text-lg font-black text-gray-900 leading-tight">Always-On Workflows</h3>
					</div>
					<p class="text-[12px] font-bold text-gray-500">Signed webhooks: n8n, Zapier, agents.</p>
				</div>

				<div class="flex-1 bg-data-green/15 border-t-[3px] border-gray-900 p-4 flex flex-col gap-2.5 justify-center">
					<!-- incoming request -->
					<div class="bg-gray-950 rounded-xl border-[2px] border-gray-900 overflow-hidden shadow-brutal-sm">
						<div class="px-3 py-1.5 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
							<code class="text-[9px] font-mono font-bold text-gray-400">POST /hooks/8f3k…/run</code>
							<span
								class="px-1.5 py-0.5 bg-data-green/20 rounded border border-data-green text-[7px] font-black uppercase tracking-widest text-data-green"
								>HMAC ✓</span
							>
						</div>
						<pre class="px-3 py-2 font-mono text-[10px] leading-relaxed text-gray-300">{`{ "name": "Ada",
  "email": "ada@acme.com" }`}</pre>
					</div>
					<!-- arrow -->
					<div class="flex justify-center -my-1">
						<span
							class="w-7 h-7 bg-gray-900 rounded-full border-[2px] border-white shadow-brutal-sm flex items-center justify-center"
						>
							<svg class="w-3.5 h-3.5 text-data-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg
							>
						</span>
					</div>
					<!-- outcome chips -->
					<div class="flex items-center justify-center gap-2 flex-wrap">
						<span
							class="px-3 py-1.5 bg-white rounded-full border-[2px] border-gray-900 text-[9px] font-black uppercase tracking-widest shadow-brutal-sm"
							>Rendered ✓</span
						>
						<span
							class="px-3 py-1.5 bg-data-green rounded-full border-[2px] border-gray-900 text-[9px] font-black uppercase tracking-widest shadow-brutal-sm"
							>Emailed ✓</span
						>
						<span
							class="px-3 py-1.5 bg-white rounded-full border-[2px] border-gray-900 text-[9px] font-black uppercase tracking-widest shadow-brutal-sm"
							>Per-row status</span
						>
					</div>
					<p class="text-center text-[10px] font-bold text-gray-500 pt-1">
						One permanent URL per workflow — fires on every row.
					</p>
				</div>
			</div>
		</div>

		<div class="flex justify-center mt-12">
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
				class="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-brutal-lg hover:translate-y-1 hover:translate-x-1 hover:shadow-brutal-sm transition-all font-black uppercase tracking-wider text-sm"
			>
				Connect Your Agent
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg
				>
			</a>
		</div>
	</div>
</section>
