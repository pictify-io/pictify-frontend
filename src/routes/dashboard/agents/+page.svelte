<script>
	/**
	 * MCP & Agents hub. Modeled on the strongest reference pattern for this job
	 * (mymind's "Manage Mind Extensions": one page, pick your agent, get the
	 * exact click-path and a copyable config with your real key in it).
	 * Three numbered steps: key, agent setup, verify.
	 */
	import { onMount } from 'svelte';
	import { user, getAPITokenAction, createAPITokenAction } from '../../../store/user.store';
	import { toast } from '../../../store/toast.store';
	import { analytics } from '$lib/analytics.js';
	import { PUBLIC_DOCS_URL } from '$env/static/public';

	const MCP_URL = 'https://mcp.pictify.io';
	const VERIFY_PROMPT =
		'Create a 1200x630 OG image that says "Hello from Pictify" on a bold gradient background.';

	let selectedAgent = 'claude-ai';
	let isLoadingKey = true;
	let isCreatingKey = false;
	let keyRevealed = false;

	$: apiTokens = $user?.apiTokens || [];
	$: apiKey = apiTokens[0]?.token || '';
	$: keyForSnippets = apiKey || 'YOUR_API_KEY';

	onMount(async () => {
		analytics.track('agent_hub_viewed', {});
		try {
			await getAPITokenAction();
		} catch {
			/* key card falls back to the create state */
		}
		isLoadingKey = false;
	});

	async function createKey() {
		if (isCreatingKey) return;
		isCreatingKey = true;
		try {
			await createAPITokenAction();
			toast.set({ message: 'API key created', type: 'success', duration: 2000 });
		} catch {
			toast.set({ message: 'Could not create a key. Please try again.', type: 'error', duration: 3000 });
		} finally {
			isCreatingKey = false;
		}
	}

	function selectAgent(id) {
		selectedAgent = id;
		analytics.track('agent_selected', { agent: id });
	}

	async function copyText(text, item) {
		try {
			await navigator.clipboard.writeText(text);
			toast.set({ message: 'Copied to clipboard', type: 'success', duration: 1500 });
			analytics.track('agent_config_copied', { agent: selectedAgent, item });
		} catch {
			toast.set({ message: 'Copy failed. Select the text manually.', type: 'error', duration: 2500 });
		}
	}

	function maskKey(key) {
		if (!key) return '';
		return `${key.slice(0, 12)}...${key.slice(-4)}`;
	}

	function stdioConfig(key) {
		return JSON.stringify(
			{
				mcpServers: {
					pictify: {
						command: 'npx',
						args: ['-y', '@pictify/mcp-server'],
						env: { PICTIFY_API_KEY: key }
					}
				}
			},
			null,
			2
		);
	}

	// Each agent: exact click-path steps plus one copyable block. Steps stay
	// specific (real menu names), because vague steps are why nobody finds MCP.
	$: agents = [
		{
			id: 'claude-ai',
			name: 'Claude',
			sub: 'claude.ai web',
			steps: [
				'In claude.ai open Settings, then Connectors.',
				'Click "Add custom connector" and paste the server URL below.',
				'Open Advanced settings. Set Client ID to "pictify" and paste your API key as the Client Secret.',
				'Click Add. Pictify tools appear in every new chat.'
			],
			snippetLabel: 'Server URL',
			snippet: MCP_URL,
			snippetLang: 'url'
		},
		{
			id: 'claude-code',
			name: 'Claude Code',
			sub: 'terminal',
			steps: ['Run this one command in your terminal, then start a new Claude Code session.'],
			snippetLabel: 'Terminal command',
			snippet: `claude mcp add pictify -e PICTIFY_API_KEY=${keyForSnippets} -- npx -y @pictify/mcp-server`,
			snippetLang: 'bash'
		},
		{
			id: 'claude-desktop',
			name: 'Claude Desktop',
			sub: 'macOS / Windows',
			steps: [
				'Open your Claude Desktop config file: ~/Library/Application Support/Claude/claude_desktop_config.json on macOS, or %APPDATA%\\Claude\\claude_desktop_config.json on Windows.',
				'Add the block below inside the file (merge with existing mcpServers if present).',
				'Restart Claude Desktop. Pictify shows up under the tools icon.'
			],
			snippetLabel: 'claude_desktop_config.json',
			snippet: stdioConfig(keyForSnippets),
			snippetLang: 'json'
		},
		{
			id: 'cursor',
			name: 'Cursor',
			sub: 'IDE',
			steps: [
				'Open Cursor Settings, then MCP, then "Add new global MCP server". This opens ~/.cursor/mcp.json.',
				'Paste the block below (merge with existing mcpServers if present). For one project only, put it in .cursor/mcp.json inside the repo instead.',
				'Save. Cursor picks it up immediately; the Pictify tools appear in Agent mode.'
			],
			snippetLabel: '.cursor/mcp.json',
			snippet: stdioConfig(keyForSnippets),
			snippetLang: 'json'
		},
		{
			id: 'windsurf',
			name: 'Windsurf',
			sub: 'IDE',
			steps: [
				'Open ~/.codeium/windsurf/mcp_config.json (or use Windsurf Settings, then Cascade, then MCP).',
				'Paste the block below (merge with existing mcpServers if present).',
				'Click the refresh button in the Cascade MCP panel.'
			],
			snippetLabel: 'mcp_config.json',
			snippet: stdioConfig(keyForSnippets),
			snippetLang: 'json'
		},
		{
			id: 'other',
			name: 'Other MCP client',
			sub: 'hosted or stdio',
			steps: [
				`Remote (streamable HTTP): point your client at ${MCP_URL} and authenticate with your API key (OAuth client ID "pictify", or a Bearer token).`,
				'Local (stdio): run the npm package with the config below. Works with any client that speaks MCP.'
			],
			snippetLabel: 'Generic stdio config',
			snippet: stdioConfig(keyForSnippets),
			snippetLang: 'json'
		}
	];

	$: current = agents.find((a) => a.id === selectedAgent) || agents[0];
</script>

<svelte:head>
	<title>MCP & Agents | Pictify</title>
</svelte:head>

<div class="p-4 sm:p-6 md:p-8 max-w-5xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">
			MCP & Agents
		</h1>
		<p class="text-gray-600 font-medium mt-2 max-w-2xl">
			Use Pictify straight from your AI agent. Connect once and your agent can render images,
			GIFs, videos, and PDFs from natural language: OG images, certificates, invoices, batch
			renders, and more.
		</p>
	</div>

	<!-- Step 1: API key -->
	<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-md p-5 sm:p-6 mb-6">
		<div class="flex items-center gap-3 mb-3">
			<span
				class="w-8 h-8 flex items-center justify-center bg-gray-900 text-white font-black rounded-lg border-[3px] border-gray-900"
				>1</span
			>
			<h2 class="text-lg font-black text-gray-900 uppercase tracking-tight">Your API key</h2>
		</div>
		{#if isLoadingKey}
			<p class="text-sm font-bold text-gray-500">Loading your key...</p>
		{:else if apiKey}
			<div class="flex flex-wrap items-center gap-3">
				<code
					class="px-4 py-2 bg-gray-100 border-[2px] border-gray-900 rounded-lg font-mono text-sm text-gray-900"
					>{keyRevealed ? apiKey : maskKey(apiKey)}</code
				>
				<button
					on:click={() => (keyRevealed = !keyRevealed)}
					class="px-3 py-2 bg-white text-gray-900 border-[2px] border-gray-900 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
					>{keyRevealed ? 'Hide' : 'Show'}</button
				>
				<button
					on:click={() => copyText(apiKey, 'api_key')}
					class="px-3 py-2 bg-brand-accent text-gray-900 border-[2px] border-gray-900 rounded-lg text-xs font-bold uppercase tracking-wide shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
					>Copy</button
				>
				<a
					href="/dashboard/api-token"
					class="text-xs font-bold text-gray-500 uppercase tracking-wide hover:text-gray-900 transition-colors"
					>Manage keys</a
				>
			</div>
			<p class="text-xs font-medium text-gray-500 mt-3">
				This key is filled into every setup snippet below, so you can copy and paste as is.
			</p>
		{:else}
			<p class="text-sm font-medium text-gray-600 mb-4">
				Agents authenticate with an API key. Create one and it gets filled into the setup
				snippets below automatically.
			</p>
			<button
				on:click={createKey}
				disabled={isCreatingKey}
				class="px-5 py-2.5 bg-brand-accent text-gray-900 border-[3px] border-gray-900 rounded-xl text-sm font-black uppercase tracking-wide shadow-brutal-md hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60 disabled:cursor-wait"
				>{isCreatingKey ? 'Creating...' : 'Create your first key'}</button
			>
		{/if}
	</div>

	<!-- Step 2: pick agent + setup -->
	<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-md p-5 sm:p-6 mb-6">
		<div class="flex items-center gap-3 mb-4">
			<span
				class="w-8 h-8 flex items-center justify-center bg-gray-900 text-white font-black rounded-lg border-[3px] border-gray-900"
				>2</span
			>
			<h2 class="text-lg font-black text-gray-900 uppercase tracking-tight">
				Select your agent
			</h2>
		</div>

		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6" role="tablist">
			{#each agents as agent}
				<button
					role="tab"
					aria-selected={selectedAgent === agent.id}
					on:click={() => selectAgent(agent.id)}
					class="px-3 py-3 rounded-xl border-[3px] text-left transition-all
						{selectedAgent === agent.id
						? 'bg-brand-accent border-gray-900 shadow-brutal-md text-gray-900'
						: 'bg-white border-gray-300 hover:border-gray-900 text-gray-700'}"
				>
					<span class="block text-sm font-black leading-tight">{agent.name}</span>
					<span class="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mt-1"
						>{agent.sub}</span
					>
				</button>
			{/each}
		</div>

		<!-- Setup panel -->
		<div class="border-t-[3px] border-gray-900 pt-5">
			<ol class="space-y-2 mb-5">
				{#each current.steps as step, i}
					<li class="flex gap-3 text-sm font-medium text-gray-700">
						<span class="font-black text-gray-900 shrink-0">{i + 1}.</span>
						<span>{step}</span>
					</li>
				{/each}
			</ol>

			<div class="bg-gray-900 rounded-xl border-[3px] border-gray-900 overflow-hidden">
				<div class="flex items-center justify-between px-4 py-2 bg-gray-800">
					<span class="text-[10px] font-black text-gray-300 uppercase tracking-widest"
						>{current.snippetLabel}</span
					>
					<button
						on:click={() => copyText(current.snippet, current.snippetLabel)}
						class="px-3 py-1 bg-brand-accent text-gray-900 border-[2px] border-gray-900 rounded-md text-[10px] font-black uppercase tracking-wide hover:translate-y-[1px] transition-transform"
						>Copy</button
					>
				</div>
				<pre
					class="px-4 py-3 text-xs sm:text-sm font-mono text-gray-100 overflow-x-auto whitespace-pre-wrap break-all">{current.snippet}</pre>
			</div>

			{#if !apiKey && !isLoadingKey}
				<p class="text-xs font-bold text-brand-danger mt-3">
					Replace YOUR_API_KEY with a real key from step 1.
				</p>
			{/if}
		</div>
	</div>

	<!-- Step 3: verify -->
	<div class="bg-white border-[3px] border-gray-900 rounded-xl shadow-brutal-md p-5 sm:p-6 mb-6">
		<div class="flex items-center gap-3 mb-3">
			<span
				class="w-8 h-8 flex items-center justify-center bg-gray-900 text-white font-black rounded-lg border-[3px] border-gray-900"
				>3</span
			>
			<h2 class="text-lg font-black text-gray-900 uppercase tracking-tight">Try it</h2>
		</div>
		<p class="text-sm font-medium text-gray-600 mb-3">
			Ask your agent for its first render. If it comes back with an image URL, you are connected.
		</p>
		<div class="flex flex-wrap items-center gap-3">
			<code
				class="px-4 py-2.5 bg-gray-100 border-[2px] border-gray-900 rounded-lg font-mono text-xs sm:text-sm text-gray-900 max-w-full"
				>{VERIFY_PROMPT}</code
			>
			<button
				on:click={() => copyText(VERIFY_PROMPT, 'verify_prompt')}
				class="px-3 py-2 bg-brand-accent text-gray-900 border-[2px] border-gray-900 rounded-lg text-xs font-bold uppercase tracking-wide shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
				>Copy prompt</button
			>
		</div>
	</div>

	<!-- Footer links -->
	<div class="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
		<a href={PUBLIC_DOCS_URL} target="_blank" class="hover:text-gray-900 transition-colors"
			>MCP documentation</a
		>
		<span class="text-gray-300">|</span>
		<a
			href="https://www.npmjs.com/package/@pictify/mcp-server"
			target="_blank"
			rel="noopener"
			class="hover:text-gray-900 transition-colors">@pictify/mcp-server on npm</a
		>
		<span class="text-gray-300">|</span>
		<a href="/dashboard/api-playground" class="hover:text-gray-900 transition-colors"
			>Prefer raw HTTP? API Playground</a
		>
	</div>
</div>
