<script>
	/**
	 * S1's single ask, walked rather than asserted: tabs pick the exact target,
	 * numbered steps carry real account facts (key, template, its variables),
	 * and the listening row is the verification — the card retires itself the
	 * moment the declared path actually renders.
	 */
	import { browser } from '$app/environment';
	import { analytics } from '$lib/telemetry.js';

	/** 'api' | 'mcp' | 'automation' | 'csv' */
	export let variant = 'api';
	export let apiKey = '';
	export let templateName = '';
	/** The template's declared variables — strings or { name } objects. */
	export let variables = [];

	const MCP_COMMAND = 'npx -y @pictify/mcp-server';
	const MCP_URL = 'https://mcp.pictify.io';

	const TABS = {
		mcp: ['CLAUDE', 'CLAUDE CODE', 'CURSOR', 'CHATGPT'],
		api: ['CURL', 'NODE', 'PYTHON'],
		automation: ['ZAPIER', 'MAKE', 'N8N']
	};
	const AUTOMATION_LINKS = {
		ZAPIER: 'https://zapier.com/apps/pictify',
		MAKE: 'https://make.com/en/integrations/pictify',
		N8N: 'https://n8n.io/integrations/pictify'
	};

	const tabKey = () => `pictify_next_step_tab_${variant}`;
	let tab = '';
	$: tabs = TABS[variant] || [];
	$: if (tabs.length && !tabs.includes(tab)) {
		tab = (browser && localStorage.getItem(tabKey())) || tabs[0];
		if (!tabs.includes(tab)) tab = tabs[0];
	}

	function pickTab(t) {
		tab = t;
		if (browser) localStorage.setItem(tabKey(), t);
		analytics.track('home_next_step_tab', { variant, tab: t });
	}

	$: key = apiKey || 'YOUR_API_KEY';
	$: keyTail = apiKey ? `pic_live_••••${apiKey.slice(-5)}` : 'YOUR_API_KEY';
	$: templateSlug = templateName || 'your-template';
	$: varNames = (variables || []).map((v) => (typeof v === 'string' ? v : v?.name)).filter(Boolean);
	$: samplePrompt = `Render my "${templateSlug}" template with sample data`;

	$: cursorConfig = `{\n  "mcpServers": {\n    "pictify": {\n      "command": "npx",\n      "args": ["-y", "@pictify/mcp-server"],\n      "env": { "PICTIFY_API_KEY": "${key}" }\n    }\n  }\n}`;
	$: claudeCodeCommand = `claude mcp add pictify -e PICTIFY_API_KEY=${key} -- ${MCP_COMMAND}`;

	$: apiSnippets = {
		CURL: `curl -X POST https://api.pictify.io/image \\\n  -H "Authorization: Bearer ${key}" \\\n  -d '{ "template": "${templateSlug}", "variables": { } }'`,
		NODE: `await fetch('https://api.pictify.io/image', {\n  method: 'POST',\n  headers: { Authorization: 'Bearer ${key}' },\n  body: JSON.stringify({ template: '${templateSlug}', variables: { } })\n})`,
		PYTHON: `import requests\n\nrequests.post('https://api.pictify.io/image',\n  headers={'Authorization': 'Bearer ${key}'},\n  json={'template': '${templateSlug}', 'variables': {}})`
	};

	let copiedWhat = '';
	async function copy(text, what) {
		try {
			await navigator.clipboard.writeText(text);
			copiedWhat = what;
			analytics.track('home_next_step_copied', { variant, what });
			setTimeout(() => (copiedWhat = ''), 1600);
		} catch {
			// Clipboard denied — the text stays readable in place.
		}
	}

	function downloadSampleCsv() {
		const columns = varNames.length ? varNames : ['variable'];
		const sampleRow = columns.map(() => '');
		const csv = `${columns.join(',')}\n${sampleRow.join(',')}\n`;
		const blob = new Blob([csv], { type: 'text/csv' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${templateSlug}-batch.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
		analytics.track('home_next_step_clicked', { variant, what: 'sample_csv' });
	}

	// Masked in the UI, real on the clipboard — the panel mirrors the form
	// it's feeding.
	$: connectorRows = [
		{ label: 'URL', shown: MCP_URL, copyValue: MCP_URL },
		{ label: 'CLIENT ID', shown: 'pictify', copyValue: 'pictify' },
		{ label: 'SECRET', shown: keyTail, copyValue: key, lime: true }
	];

	$: listeningLabel =
		variant === 'api'
			? 'render'
			: variant === 'mcp'
				? 'agent render'
				: variant === 'automation'
					? 'automation render'
					: 'batch';

	const HEADLINE = {
		api: 'Render from your code',
		mcp: 'Let your agent render for you',
		automation: 'Renders fire when your tools do',
		csv: 'Render from a spreadsheet'
	};
	$: dark = variant === 'api' || variant === 'mcp';
</script>

<div
	class="relative flex flex-col gap-4 overflow-hidden rounded-[10px] px-[26px] py-[22px] {dark
		? 'bg-brand-press'
		: 'bg-brand-canvas'}"
>
	<div class="absolute right-0 top-0 flex" aria-hidden="true">
		{#if dark}
			<span class="block h-3 w-3 bg-brand-field"></span>
			<span class="block h-3 w-3 bg-brand-pink"></span>
		{/if}
	</div>
	{#if !dark}
		<div class="absolute bottom-0 right-0 flex" aria-hidden="true">
			<span class="block h-3 w-3 bg-brand-blue"></span>
			<span class="block h-3 w-3 bg-brand-ink"></span>
		</div>
	{/if}

	<div class="flex flex-col justify-between gap-3 lg:flex-row lg:items-baseline">
		<span class="font-display text-xl font-extrabold tracking-[-0.02em] {dark ? 'text-white' : 'text-brand-ink'}">
			{HEADLINE[variant]}
		</span>
		{#if tabs.length}
			<div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Setup target">
				{#each tabs as t (t)}
					<button
						type="button"
						role="tab"
						aria-selected={tab === t}
						on:click={() => pickTab(t)}
						class="rounded-[4px] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.06em] transition-colors {tab === t
							? 'bg-brand-field text-brand-ink'
							: dark
								? 'border border-white/20 text-brand-press-text hover:border-white/50'
								: 'border-[1.5px] border-brand-rule text-brand-slate hover:border-brand-ink'}"
					>
						{t}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if variant === 'mcp'}
		<div class="flex flex-col gap-5 lg:flex-row">
			<div class="flex flex-1 flex-col gap-4">
				{#if tab === 'CLAUDE' || tab === 'CHATGPT'}
					<span class="flex items-start gap-2.5">
						<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-white/10 font-mono text-[10px] text-brand-field">1</span>
						<span class="font-sans text-[13px] leading-5 text-[#C9CED6]">
							Open <span class="font-semibold text-white">
								{tab === 'CLAUDE' ? 'claude.ai → Settings → Connectors' : 'ChatGPT → Settings → Connectors'}
							</span>
							and click <span class="font-semibold text-white">Add custom connector</span>.
						</span>
					</span>
					<span class="flex items-start gap-2.5">
						<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-white/10 font-mono text-[10px] text-brand-field">2</span>
						<span class="font-sans text-[13px] leading-5 text-[#C9CED6]">Paste the connector details — they carry your real key.</span>
					</span>
				{:else if tab === 'CLAUDE CODE'}
					<span class="flex items-start gap-2.5">
						<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-white/10 font-mono text-[10px] text-brand-field">1</span>
						<span class="font-sans text-[13px] leading-5 text-[#C9CED6]">Run this once in your terminal — it carries your real key.</span>
					</span>
				{:else}
					<span class="flex items-start gap-2.5">
						<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-white/10 font-mono text-[10px] text-brand-field">1</span>
						<span class="font-sans text-[13px] leading-5 text-[#C9CED6]">
							Open <span class="font-semibold text-white">Cursor → Settings → MCP Servers</span> and paste the config.
						</span>
					</span>
				{/if}
				<span class="flex items-start gap-2.5">
					<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-white/10 font-mono text-[10px] text-brand-field">
						{tab === 'CLAUDE CODE' || tab === 'CURSOR' ? 2 : 3}
					</span>
					<span class="font-sans text-[13px] leading-5 text-[#C9CED6]">
						Ask for a file:
						<button
							type="button"
							on:click={() => copy(samplePrompt, 'prompt')}
							class="font-mono text-[11.5px] text-brand-field hover:underline"
						>
							"{samplePrompt}"
						</button>
						<span class="font-mono text-[9px] {copiedWhat === 'prompt' ? 'text-brand-proof' : 'text-brand-press-text'}">
							{copiedWhat === 'prompt' ? 'COPIED' : 'COPY'}
						</span>
					</span>
				</span>
				<span class="flex items-center gap-2 pl-[30px] opacity-60">
					<span class="block h-2 w-2 border-[1.5px] border-brand-press-text"></span>
					<span class="font-mono text-[10.5px] text-brand-press-text">
						waiting for your first {listeningLabel} — this card disappears once it lands
					</span>
				</span>
			</div>

			{#if tab === 'CLAUDE' || tab === 'CHATGPT'}
				<div class="flex w-full flex-shrink-0 flex-col gap-2 self-start rounded-btn bg-white/[0.07] px-4 py-3.5 lg:w-[400px]">
					<span class="font-mono text-[10px] tracking-[0.08em] text-brand-press-text">CONNECTOR — EACH FIELD COPIES ITSELF</span>
					{#each connectorRows as row (row.label)}
						<span class="flex items-center gap-2.5">
							<span class="w-[70px] flex-shrink-0 font-mono text-[11px] text-[#7D8494]">{row.label}</span>
							<span class="flex-1 truncate font-mono text-[11.5px] {row.lime || row.label === 'URL' ? 'text-brand-field' : 'text-[#C9CED6]'}">
								{row.shown}
							</span>
							<button
								type="button"
								on:click={() => copy(row.copyValue, row.label)}
								class="rounded-[3px] border border-white/[0.18] px-1.5 py-0.5 font-mono text-[9px] {copiedWhat === row.label
									? 'text-brand-proof'
									: 'text-brand-press-text hover:text-white'}"
							>
								{copiedWhat === row.label ? 'COPIED' : 'COPY'}
							</button>
						</span>
					{/each}
				</div>
			{:else if tab === 'CLAUDE CODE'}
				<button
					type="button"
					on:click={() => copy(claudeCodeCommand, 'command')}
					class="flex w-full flex-shrink-0 items-start justify-between gap-3 self-start rounded-btn bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:bg-white/10 lg:w-[400px]"
				>
					<span class="break-all font-mono text-[11px] leading-[17px] text-brand-field">
						claude mcp add pictify -e PICTIFY_API_KEY={keyTail} -- {MCP_COMMAND}
					</span>
					<span class="flex-shrink-0 font-mono text-[10px] {copiedWhat === 'command' ? 'text-brand-proof' : 'text-brand-press-text'}">
						{copiedWhat === 'command' ? 'COPIED' : 'COPY'}
					</span>
				</button>
			{:else}
				<button
					type="button"
					on:click={() => copy(cursorConfig, 'config')}
					class="flex w-full flex-shrink-0 flex-col gap-1 self-start rounded-btn bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:bg-white/10 lg:w-[400px]"
				>
					<span class="flex justify-between">
						<span class="font-mono text-[10px] tracking-[0.08em] text-brand-press-text">MCP.JSON — YOUR KEY IS IN IT</span>
						<span class="font-mono text-[10px] {copiedWhat === 'config' ? 'text-brand-proof' : 'text-brand-press-text'}">
							{copiedWhat === 'config' ? 'COPIED' : 'COPY'}
						</span>
					</span>
					<pre class="whitespace-pre-wrap font-mono text-[10.5px] leading-[16px] text-[#9AA1AF]">{cursorConfig.replace(key, keyTail)}</pre>
				</button>
			{/if}
		</div>
	{:else if variant === 'api'}
		<button
			type="button"
			on:click={() => copy(apiSnippets[tab], 'snippet')}
			class="flex flex-col gap-1.5 rounded-btn bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:bg-white/10"
		>
			<span class="flex justify-between">
				<span class="font-mono text-[10px] tracking-[0.08em] text-brand-press-text">{tab} — RUNS AS-IS, YOUR KEY IS IN IT</span>
				<span class="font-mono text-[10px] {copiedWhat === 'snippet' ? 'text-brand-proof' : 'text-brand-press-text'}">
					{copiedWhat === 'snippet' ? 'COPIED' : 'COPY'}
				</span>
			</span>
			<pre class="overflow-x-auto whitespace-pre font-mono text-[11.5px] leading-[18px] text-[#7D8494]">{(apiSnippets[tab] || '').replace(key, keyTail)}</pre>
		</button>
		<span class="flex items-center gap-2 opacity-60">
			<span class="block h-2 w-2 border-[1.5px] border-brand-press-text"></span>
			<span class="font-mono text-[10.5px] text-brand-press-text">
				waiting for your first {listeningLabel} — this card disappears once it lands
			</span>
		</span>
	{:else if variant === 'automation'}
		<div class="flex flex-col gap-4">
			<span class="flex items-center gap-2.5">
				<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black/[0.07] font-mono text-[10px] text-brand-ink">1</span>
				<span class="font-sans text-[13px] text-brand-slate">Connect your {tab === 'ZAPIER' ? 'Zapier' : tab === 'MAKE' ? 'Make' : 'n8n'} account to Pictify.</span>
				<a
					href={AUTOMATION_LINKS[tab]}
					target="_blank"
					rel="noopener noreferrer"
					on:click={() => analytics.track('home_next_step_clicked', { variant, tab })}
					class="rounded-[4px] bg-brand-ink px-3.5 py-1.5 font-sans text-xs font-bold text-white transition-opacity hover:opacity-90"
				>
					Open Pictify on {tab === 'ZAPIER' ? 'Zapier' : tab === 'MAKE' ? 'Make' : 'n8n'} ↗
				</a>
			</span>
			<span class="flex items-start gap-2.5">
				<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black/[0.07] font-mono text-[10px] text-brand-ink">2</span>
				<span class="font-sans text-[13px] leading-5 text-brand-slate">Pick a trigger — new signup, new order, new row.</span>
			</span>
			<span class="flex items-start gap-2.5">
				<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black/[0.07] font-mono text-[10px] text-brand-ink">3</span>
				<span class="font-sans text-[13px] leading-5 text-brand-slate">
					Add the action <span class="font-semibold text-brand-ink">"Create Image with Pictify"</span> and map your trigger's fields to
					<span class="font-mono text-[11.5px] text-brand-royal">{templateSlug}</span>'s variables.
				</span>
			</span>
			<span class="flex items-center gap-2 pl-[30px] opacity-60">
				<span class="block h-2 w-2 border-[1.5px] border-brand-mute"></span>
				<span class="font-mono text-[10.5px] text-brand-mute">
					waiting for your first {listeningLabel} — this card disappears once it lands
				</span>
			</span>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			<span class="flex items-center gap-2.5">
				<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black/[0.07] font-mono text-[10px] text-brand-ink">1</span>
				<span class="font-sans text-[13px] text-brand-slate">
					Download the sample sheet — its columns are <span class="font-mono text-[11.5px] text-brand-royal">{templateSlug}</span>'s variables.
				</span>
				<button
					type="button"
					on:click={downloadSampleCsv}
					class="rounded-[4px] bg-brand-ink px-3.5 py-1.5 font-sans text-xs font-bold text-white transition-opacity hover:opacity-90"
				>
					Download sample CSV
				</button>
			</span>
			<span class="flex items-start gap-2.5">
				<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black/[0.07] font-mono text-[10px] text-brand-ink">2</span>
				<span class="font-sans text-[13px] leading-5 text-brand-slate">Fill it — one row per file, up to 500 rows a batch.</span>
			</span>
			<span class="flex items-center gap-2.5">
				<span class="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-black/[0.07] font-mono text-[10px] text-brand-ink">3</span>
				<span class="font-sans text-[13px] text-brand-slate">Upload it and every row renders.</span>
				<a
					href="/dashboard/workflows/new"
					on:click={() => analytics.track('home_next_step_clicked', { variant, what: 'upload' })}
					class="rounded-[4px] border-[1.5px] border-brand-ink px-3.5 py-[5px] font-sans text-xs font-bold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white"
				>
					Upload CSV
				</a>
			</span>
			<span class="flex items-center gap-2 pl-[30px] opacity-60">
				<span class="block h-2 w-2 border-[1.5px] border-brand-mute"></span>
				<span class="font-mono text-[10.5px] text-brand-mute">
					waiting for your first {listeningLabel} — this card disappears once it lands
				</span>
			</span>
		</div>
	{/if}
</div>
