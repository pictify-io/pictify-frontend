<script>
	/**
	 * The activation step. One step, seven doors.
	 *
	 * Tabs rather than a "what kind of user are you?" question: the same choice,
	 * self-selected in a glance, after they already have a file. The snippet
	 * renders the template they just made, so the only new variable is where the
	 * call comes from.
	 */
	import { createEventDispatcher } from 'svelte';

	export let apiKey = '';
	export let templateId = '';
	export let variables = [];
	/** Flips when the backend sees a render land. Never a self-reported button. */
	export let received = false;

	const dispatch = createEventDispatcher();

	const callers = ['curl', 'Node', 'Python', 'Zapier', 'n8n', 'MCP', 'CSV upload'];
	let caller = 'curl';
	let copied = false;

	$: varBlock = variables.map((v) => `        "${v.name}": "${v.value}"`).join(',\n');

	$: snippet =
		caller === 'curl'
			? `curl -X POST https://api.pictify.io/v1/render \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{ "template": "${templateId}", "variables": {
${varBlock} } }'`
			: caller === 'Node'
				? `import { Pictify } from '@pictify/sdk';

const pictify = new Pictify('${apiKey}');

const file = await pictify.render({
  template: '${templateId}',
  variables: {
${variables.map((v) => `    ${v.name}: '${v.value}'`).join(',\n')}
  }
});`
				: caller === 'Python'
					? `from pictify import Pictify

pictify = Pictify("${apiKey}")

file = pictify.render(
    template="${templateId}",
    variables={
${variables.map((v) => `        "${v.name}": "${v.value}"`).join(',\n')}
    },
)`
					: caller === 'MCP'
						? `npm i @pictify/mcp-server

# then, from your agent:
render_template(
  template="${templateId}",
  variables={ ${variables.map((v) => `"${v.name}": "${v.value}"`).join(', ')} }
)`
						: `Add the Pictify step to your ${caller} flow, paste this key,
and pick the template "${templateId}".

${apiKey}`;

	function copy() {
		navigator.clipboard?.writeText(snippet);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}
</script>

<div class="flex w-full flex-col items-center gap-8 px-5 py-10 lg:px-20 lg:py-12">
	<div class="flex w-[760px] max-w-full flex-col items-center gap-2.5">
		<h1 class="text-balance text-center font-display text-[46px] font-extrabold leading-[46px] tracking-[-0.04em] text-brand-ink">
			Now make the same file from your stack.
		</h1>
		<p class="max-w-[560px] text-center font-sans text-[17px] leading-[26px] text-brand-slate">
			Same template, same variables — this time the call comes from you. That's the part that has to
			work in production.
		</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		{#each callers as c (c)}
			<button
				type="button"
				on:click={() => (caller = c)}
				class="flex h-[38px] items-center rounded-btn px-[18px] font-mono text-[13px] transition-colors {caller ===
				c
					? 'bg-brand-ink text-brand-paper'
					: 'border border-brand-rule text-brand-slate hover:border-brand-ink'}"
			>
				{c}
			</button>
		{/each}
	</div>

	<div class="flex w-full max-w-[960px] flex-col overflow-hidden rounded-card bg-brand-press">
		<div class="flex w-full items-center justify-between border-b border-white/10 px-5 py-3.5">
			<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-brand-press-text">
				Your key is already in it
			</span>
			<button
				type="button"
				on:click={copy}
				class="flex h-8 items-center rounded-btn bg-white/10 px-3.5 font-sans text-[13px] font-semibold text-brand-paper transition-colors hover:bg-white/20"
			>
				{copied ? 'Copied' : 'Copy'}
			</button>
		</div>
		<pre class="overflow-x-auto px-5 py-[22px] font-mono text-sm leading-[26px] text-[#7D8494]">{snippet}</pre>
	</div>

	<!--
		No "I've done it" button — there would be nothing behind it. The backend
		sees the render land and this flips on its own.
	-->
	<div
		class="flex w-full max-w-[960px] flex-col items-start gap-3.5 rounded-card border px-[22px] py-[18px] lg:flex-row lg:items-center {received
			? 'border-brand-proof bg-brand-proof/5'
			: 'border-dashed border-brand-mute'}"
	>
		<span
			class="block h-2.5 w-2.5 flex-shrink-0 rounded-full {received
				? 'bg-brand-proof'
				: 'animate-pulse bg-brand-field'}"
			aria-hidden="true"
		></span>
		<div class="flex flex-1 flex-col gap-0.5">
			<span class="font-sans text-base font-bold text-brand-ink">
				{received ? 'That was you. Nice one.' : 'Listening for your first call…'}
			</span>
			<span class="font-sans text-sm text-brand-slate">
				{received
					? 'Your render came in from outside the dashboard — that was the whole point.'
					: 'This ticks over on its own the moment a render lands. Nothing to click.'}
			</span>
		</div>
		{#if received}
			<button
				type="button"
				on:click={() => dispatch('done')}
				class="flex h-11 flex-shrink-0 items-center rounded-btn bg-brand-ink px-5 font-sans text-[15px] font-bold text-brand-paper"
			>
				Go to the dashboard →
			</button>
		{:else}
			<button
				type="button"
				on:click={() => dispatch('skip')}
				class="flex-shrink-0 font-sans text-[15px] font-semibold text-brand-slate underline underline-offset-[3px]"
			>
				Skip for now
			</button>
		{/if}
	</div>
</div>
