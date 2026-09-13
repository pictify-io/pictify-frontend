<script>
	import { maskApiKey } from '$lib/utils/api-key.js';
	/**
	 * The guide slot, fal-style: a dismissible strip whose columns depend on
	 * stage. S0 teaches the path to a first file; S1 keeps only the key (the
	 * remaining step is the connect row below) plus the one-time team invite.
	 * Completion retires it — dismissal is the escape hatch, not the mechanism.
	 */
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/** 's0' — checklist + key + fillers list. 's1' — key + invite. */
	export let variant = 's0';
	export let apiKey = '';
	export let hasTemplate = false;
	export let inviteBusy = false;
	export let inviteResult = '';

	let inviteEmail = '';
	let copied = false;

	$: keyTail = maskApiKey(apiKey);
	$: doneCount = 1 + (hasTemplate ? 1 : 0);

	async function copySnippet() {
		const snippet = `curl -X POST https://api.pictify.io/image \\\n  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\\n  -d '{ "template": "{your template}", "variables": { } }'`;
		try {
			await navigator.clipboard.writeText(snippet);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			// Clipboard denied — the snippet is still readable in place.
		}
	}

	function invite() {
		if (!inviteEmail.trim() || inviteBusy) return;
		dispatch('invite', { email: inviteEmail.trim() });
	}
</script>

<div class="flex flex-col overflow-hidden rounded-[10px] border-[1.5px] border-brand-rule lg:flex-row">
	{#if variant === 's0'}
		<div class="flex flex-1 flex-col gap-2.5 border-b border-brand-rule px-5 py-4 lg:border-b-0 lg:border-r">
			<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
				Getting set up — {doneCount} of 3 done
			</span>
			<span class="flex items-center gap-2">
				<span class="block h-2 w-2 bg-brand-proof"></span>
				<span class="font-sans text-[13px] text-brand-ink line-through decoration-black/40">Create your account</span>
			</span>
			<span class="flex items-center gap-2">
				{#if hasTemplate}
					<span class="block h-2 w-2 bg-brand-proof"></span>
					<span class="font-sans text-[13px] text-brand-ink line-through decoration-black/40">Create your first template</span>
				{:else}
					<span class="block h-2 w-2 animate-pulse bg-brand-field"></span>
					<span class="font-sans text-[13px] font-semibold text-brand-ink">Create your first template</span>
				{/if}
			</span>
			{#if !hasTemplate}
				<span class="pl-4 font-sans text-xs text-brand-slate">
					Describe it above, or pick a starter.
				</span>
			{/if}
			<span class="flex items-center gap-2">
				<span class="block h-2 w-2 border-[1.5px] border-brand-mute"></span>
				<span class="font-sans text-[13px] text-brand-slate">Render one from your own code</span>
			</span>
		</div>
	{/if}

	<div class="flex flex-1 flex-col justify-between gap-2 border-b border-brand-rule px-5 py-4 lg:border-b-0 lg:border-r">
		<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">
			Your API key, ready to paste
		</span>
		<button
			type="button"
			on:click={copySnippet}
			class="flex flex-col gap-1 rounded-btn bg-brand-press px-3 py-2.5 text-left"
			title="Copy snippet"
		>
			<span class="font-mono text-[11px] text-[#7D8494]">curl api.pictify.io/image \</span>
			<span class="font-mono text-[11px] text-[#7D8494]">&nbsp;&nbsp;-H "Authorization: Bearer</span>
			<span class="flex items-center justify-between">
				<span class="font-mono text-[11px] text-brand-field">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{keyTail}"</span>
				<span class="font-mono text-[10px] {copied ? 'text-brand-proof' : 'text-brand-press-text'}">
					{copied ? 'COPIED' : 'COPY'}
				</span>
			</span>
		</button>
		<span class="flex items-center gap-2 opacity-55">
			<span class="block h-2 w-2 border-[1.5px] border-brand-mute"></span>
			<span class="font-mono text-[10.5px] text-brand-mute">waiting for your first render…</span>
		</span>
	</div>

	{#if variant === 's0'}
		<div class="flex flex-1 flex-col gap-2 px-5 py-4">
			<div class="flex items-center justify-between">
				<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Ways to fill a template</span>
				<button type="button" on:click={() => dispatch('hide')} class="font-mono text-[10px] text-brand-mute hover:text-brand-ink">
					HIDE SETUP ✕
				</button>
			</div>
			{#each [['Your code', 'REST API'], ['A spreadsheet', 'CSV BATCH'], ['An automation', 'ZAPIER'], ['An agent', 'MCP']] as [who, how] (how)}
				<span class="flex items-center justify-between">
					<span class="font-sans text-[12.5px] font-semibold text-brand-ink">{who}</span>
					<span class="font-mono text-[10px] text-brand-slate">{how}</span>
				</span>
			{/each}
		</div>
	{:else}
		<div class="flex flex-1 flex-col gap-2.5 px-5 py-4">
			<div class="flex items-center justify-between">
				<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-brand-mute">Bring your team</span>
				<button type="button" on:click={() => dispatch('hide')} class="font-mono text-[10px] text-brand-mute hover:text-brand-ink">
					HIDE SETUP ✕
				</button>
			</div>
			<span class="font-sans text-[12.5px] leading-[18px] text-brand-slate">
				Templates are shared. Everyone gets their own key, renders share one quota.
			</span>
			<form class="flex items-center gap-2" on:submit|preventDefault={invite}>
				<input
					type="email"
					bind:value={inviteEmail}
					placeholder="teammate@yours.com"
					class="min-w-0 flex-1 rounded-btn border-[1.5px] border-brand-rule px-3 py-[7px] font-mono text-[11px] text-brand-ink outline-none placeholder:text-brand-mute focus:border-brand-ink"
				/>
				<button
					type="submit"
					disabled={!inviteEmail.trim() || inviteBusy}
					class="rounded-btn bg-brand-ink px-3.5 py-2 font-sans text-xs font-bold text-white disabled:opacity-30"
				>
					{inviteBusy ? 'Inviting…' : 'Invite'}
				</button>
			</form>
			{#if inviteResult}
				<span class="font-mono text-[10.5px] text-brand-slate">{inviteResult}</span>
			{/if}
		</div>
	{/if}
</div>
