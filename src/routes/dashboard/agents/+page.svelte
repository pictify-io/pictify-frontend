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

	// Brand marks (simple-icons, 24x24 single-path, fill-based). Claude's mark
	// covers all three Claude surfaces; "other" gets the official MCP logo.
	const LOGOS = {
		claude:
			'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
		cursor:
			'M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23',
		windsurf:
			'M23.55 5.067c-1.2038-.002-2.1806.973-2.1806 2.1765v4.8676c0 .972-.8035 1.7594-1.7597 1.7594-.568 0-1.1352-.286-1.4718-.7659l-4.9713-7.1003c-.4125-.5896-1.0837-.941-1.8103-.941-1.1334 0-2.1533.9635-2.1533 2.153v4.8957c0 .972-.7969 1.7594-1.7596 1.7594-.57 0-1.1363-.286-1.4728-.7658L.4076 5.1598C.2822 4.9798 0 5.0688 0 5.2882v4.2452c0 .2147.0656.4228.1884.599l5.4748 7.8183c.3234.462.8006.8052 1.3509.9298 1.3771.313 2.6446-.747 2.6446-2.0977v-4.893c0-.972.7875-1.7593 1.7596-1.7593h.003a1.798 1.798 0 0 1 1.4718.7658l4.9723 7.0994c.4135.5905 1.05.941 1.8093.941 1.1587 0 2.1515-.9645 2.1515-2.153v-4.8948c0-.972.7875-1.7594 1.7596-1.7594h.194a.22.22 0 0 0 .2204-.2202v-4.622a.22.22 0 0 0-.2203-.2203Z',
		mcp: 'M13.85 0a4.16 4.16 0 0 0-2.95 1.217L1.456 10.66a.835.835 0 0 0 0 1.18.835.835 0 0 0 1.18 0l9.442-9.442a2.49 2.49 0 0 1 3.541 0 2.49 2.49 0 0 1 0 3.541L8.59 12.97l-.1.1a.835.835 0 0 0 0 1.18.835.835 0 0 0 1.18 0l.1-.098 7.03-7.034a2.49 2.49 0 0 1 3.542 0l.049.05a2.49 2.49 0 0 1 0 3.54l-8.54 8.54a1.96 1.96 0 0 0 0 2.755l1.753 1.753a.835.835 0 0 0 1.18 0 .835.835 0 0 0 0-1.18l-1.753-1.753a.266.266 0 0 1 0-.394l8.54-8.54a4.185 4.185 0 0 0 0-5.9l-.05-.05a4.16 4.16 0 0 0-2.95-1.218c-.2 0-.401.02-.6.048a4.17 4.17 0 0 0-1.17-3.552A4.16 4.16 0 0 0 13.85 0m0 3.333a.84.84 0 0 0-.59.245L6.275 10.56a4.186 4.186 0 0 0 0 5.902 4.186 4.186 0 0 0 5.902 0L19.16 9.48a.835.835 0 0 0 0-1.18.835.835 0 0 0-1.18 0l-6.985 6.984a2.49 2.49 0 0 1-3.54 0 2.49 2.49 0 0 1 0-3.54l6.983-6.985a.835.835 0 0 0 0-1.18a.84.84 0 0 0-.59-.245'
	};

	// Each agent: exact click-path steps plus one copyable block. Steps stay
	// specific (real menu names), because vague steps are why nobody finds MCP.
	$: agents = [
		{
			id: 'claude-ai',
			name: 'Claude',
			sub: 'claude.ai web',
			logo: LOGOS.claude,
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
			logo: LOGOS.claude,
			steps: ['Run this one command in your terminal, then start a new Claude Code session.'],
			snippetLabel: 'Terminal command',
			snippet: `claude mcp add pictify -e PICTIFY_API_KEY=${keyForSnippets} -- npx -y @pictify/mcp-server`,
			snippetLang: 'bash'
		},
		{
			id: 'claude-desktop',
			name: 'Claude Desktop',
			sub: 'macOS / Windows',
			logo: LOGOS.claude,
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
			logo: LOGOS.cursor,
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
			logo: LOGOS.windsurf,
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
			logo: LOGOS.mcp,
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
					<svg
						class="w-6 h-6 mb-2 {selectedAgent === agent.id ? 'text-gray-900' : 'text-gray-700'}"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d={agent.logo} />
					</svg>
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
