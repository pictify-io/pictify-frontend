<script>
	/**
	 * S1's expansion surface: two banner-weight cards for the two ways a
	 * template starts filling itself — an agent over MCP, or an automation.
	 * Retires to the FillsFrom line once any external caller has rendered.
	 */
	import { analytics } from '$lib/telemetry.js';

	const MCP_COMMAND = 'npx -y @pictify/mcp-server';
	let copied = false;

	async function copyCommand() {
		try {
			await navigator.clipboard.writeText(MCP_COMMAND);
			copied = true;
			analytics.track('home_mcp_command_copied');
			setTimeout(() => (copied = false), 1600);
		} catch {
			// Clipboard denied — the command is still readable in place.
		}
	}
</script>

<div class="flex flex-col gap-4 lg:flex-row">
	<div class="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-[10px] bg-brand-press px-[22px] py-5">
		<div class="absolute right-0 top-0 flex" aria-hidden="true">
			<span class="block h-3 w-3 bg-brand-field"></span>
			<span class="block h-3 w-3 bg-brand-pink"></span>
		</div>
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-press-text">Give your agent the press</span>
		<span class="font-display text-xl font-extrabold leading-[26px] tracking-[-0.02em] text-white">
			Your agent runs the press
		</span>
		<span class="font-sans text-[13px] leading-[19px] text-[#9AA1AF]">
			One MCP server: your agent lists templates, fills them, and ships the files.
		</span>
		<button
			type="button"
			on:click={copyCommand}
			class="flex items-center justify-between rounded-btn bg-white/[0.07] px-3.5 py-2.5 text-left transition-colors hover:bg-white/10"
		>
			<span class="font-mono text-xs text-brand-field">{MCP_COMMAND}</span>
			<span class="font-mono text-[10px] {copied ? 'text-brand-proof' : 'text-brand-press-text'}">
				{copied ? 'COPIED' : 'COPY'}
			</span>
		</button>
		<div class="flex gap-2">
			{#each ['CLAUDE', 'CURSOR', 'CHATGPT'] as target (target)}
				<span class="rounded-[4px] border border-white/20 px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-brand-press-text">
					{target}
				</span>
			{/each}
		</div>
	</div>

	<div class="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-[10px] bg-brand-canvas px-[22px] py-5">
		<div class="absolute bottom-0 right-0 flex" aria-hidden="true">
			<span class="block h-3 w-3 bg-brand-blue"></span>
			<span class="block h-3 w-3 bg-brand-ink"></span>
		</div>
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B6B68]">Put the press in a pipeline</span>
		<span class="font-display text-xl font-extrabold leading-[26px] tracking-[-0.02em] text-brand-ink">
			Renders fire when your tools do
		</span>
		<span class="font-sans text-[13px] leading-[19px] text-brand-slate">
			New row in a sheet, new signup, new order — a file goes out. No code on your side.
		</span>
		<div class="flex items-center gap-2 pt-1">
			<a
				href="/dashboard/integrations"
				on:click={() => analytics.track('home_connect_zapier_clicked')}
				class="rounded-btn bg-brand-ink px-4 py-[9px] font-sans text-[12.5px] font-bold text-white transition-opacity hover:opacity-90"
			>
				Connect Zapier
			</a>
			{#each ['MAKE', 'N8N'] as target (target)}
				<span class="rounded-[4px] border-[1.5px] border-brand-rule px-2.5 py-[5px] font-mono text-[10px] tracking-[0.06em] text-brand-slate">
					{target}
				</span>
			{/each}
		</div>
	</div>
</div>
