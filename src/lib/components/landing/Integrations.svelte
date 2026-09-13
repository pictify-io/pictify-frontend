<script>
	import CtaStrip from './CtaStrip.svelte';
	import PixelCluster from './PixelCluster.svelte';
	import { reveal } from '$lib/actions/reveal.js';
	import Capsule from './Capsule.svelte';
	import BrandMark from './BrandMark.svelte';

	// Only integrations that actually exist. No invented logo wall.
	const noCode = [
		{ name: 'Zapier', unit: 'action step', mark: 'zapier' },
		{ name: 'Make', unit: 'scenario module', mark: 'make' },
		{ name: 'n8n', unit: 'n8n-nodes-pictify', mark: 'n8n' }
	];

	const mcpTools = ['create_template', 'get_template_variables', 'render_template', 'batch_render'];

	const bleed = [
		[2, 0, 'blue'], [1, 1, 'ink'], [2, 1, 'field'],
		[0, 2, 'blue'], [1, 2, 'pink'], [3, 2, 'blue'],
		[0, 3, 'ink'], [2, 3, 'blue'], [1, 4, 'powder']
	];

	// Five-step run straddling the seam into the closing CTA.
	const zigzag = [
		[0, 1, 'blue'], [1.45, 0, 'ink'], [2.9, 1, 'blue'],
		[4.35, 0, 'powder'], [5.7, 1, 'blue']
	];
</script>

<section id="integrations" class="relative w-full overflow-hidden bg-brand-sky py-14 lg:py-28">
	<PixelCluster cells={bleed} cell={38} origin="w" cycle={4} class="-left-[76px] top-[292px] hidden lg:block" />
	<PixelCluster cells={zigzag} cell={36} origin="w" class="-bottom-[28px] left-[520px] hidden lg:block" />
	<Capsule from="r" drift={14} class="-right-20 top-16 hidden h-12 w-[220px] -rotate-[30deg] bg-brand-blue lg:block" />

	<div class="relative mx-auto flex w-full max-w-page flex-col gap-6 px-5 lg:gap-14 lg:px-10">
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16" use:reveal>
			<h2 class="max-w-[640px] font-display text-heading-sm font-extrabold text-brand-ink lg:text-heading">
				Call it from wherever you already are.
			</h2>
			<p class="font-sans text-base leading-6 text-black/70 lg:w-[380px] lg:pb-2 lg:text-[17px] lg:leading-[26px]">
				Three ways in. Pick whichever already matches your stack.
			</p>
		</div>

		<!-- Three columns, uneven, divided by rules rather than boxed as cards. -->
		<div class="flex flex-col divide-y divide-black/15 lg:flex-row lg:divide-x lg:divide-y-0">
			<!-- 01 In code -->
			<div class="flex flex-col gap-3.5 pb-6 lg:flex-[2] lg:pb-0 lg:pr-12">
				<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-black/55 lg:text-xs">01 — In code</span>
				<h3 class="font-display text-card font-bold text-brand-ink lg:text-subtitle">Install the package</h3>
				<div class="flex flex-col overflow-hidden rounded-tile bg-brand-press">
					<p class="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 lg:px-[18px] lg:py-4">
						<BrandMark mark="node" size={17} />
						<code class="font-mono text-[13px] text-white lg:text-sm">npm i @pictify/sdk</code>
					</p>
					<p class="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 lg:px-[18px] lg:py-4">
						<BrandMark mark="python" size={17} />
						<code class="font-mono text-[13px] text-white lg:text-sm">pip install pictify</code>
					</p>
					<div class="flex flex-col gap-1.5 px-4 py-3.5 lg:px-[18px] lg:py-[18px]">
						<code class="font-mono text-xs text-[#7D8494] lg:text-[13px]">
							<span class="text-brand-field">POST</span> /v1/render &nbsp;&#123; template, variables &#125;
						</code>
						<code class="font-mono text-xs text-brand-press-text lg:text-[13px]">→ https://media.pictify.io/…</code>
					</div>
				</div>
				<p class="font-sans text-sm leading-5 text-black/70 lg:text-[15px] lg:leading-[22px]">
					Official Node and Python SDKs, so you're not writing a fetch wrapper on day one. Or plain
					REST from anything that sends JSON.
				</p>
			</div>

			<!-- 02 No code -->
			<div class="flex flex-col gap-3.5 py-6 lg:flex-1 lg:py-0 lg:px-12">
				<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-black/55 lg:text-xs">02 — No code</span>
				<h3 class="font-display text-card font-bold text-brand-ink lg:text-subtitle">Wire it up</h3>
				<ul class="flex list-none flex-col">
					{#each noCode as tool (tool.name)}
						<li class="flex items-center gap-3 border-b border-black/15 py-3 lg:py-3.5">
							<BrandMark mark={tool.mark} size={21} />
							<span class="flex flex-1 flex-col">
								<span class="font-display text-lg font-bold tracking-[-0.02em] text-brand-ink lg:text-xl">
									{tool.name}
								</span>
								<span class="font-mono text-[10px] text-black/50 lg:text-[11px]">{tool.unit}</span>
							</span>
						</li>
					{/each}
				</ul>
				<p class="font-sans text-sm leading-5 text-black/70 lg:text-[15px] lg:leading-[22px]">
					Drop a render step into a flow you've already built.
				</p>
			</div>

			<!-- 03 Agents -->
			<div class="flex flex-col gap-3.5 pt-6 lg:flex-1 lg:pl-12 lg:pt-0">
				<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-black/55 lg:text-xs">03 — Agents</span>
				<h3 class="font-display text-card font-bold text-brand-ink lg:text-subtitle">Hand it to an agent</h3>
				<div class="flex flex-col gap-2.5 rounded-tile border-2 border-brand-ink p-3.5 lg:p-4">
					<code class="font-mono text-xs text-brand-ink lg:text-[13px]">npm i @pictify/mcp-server</code>
					<span class="h-px w-full bg-black/15"></span>
					<ul class="flex list-none flex-col font-mono text-[11px] leading-[18px] text-black/60 lg:text-xs lg:leading-5">
						{#each mcpTools as t (t)}
							<li>{t}</li>
						{/each}
					</ul>
				</div>
				<p class="font-sans text-sm leading-5 text-black/70 lg:text-[15px] lg:leading-[22px]">
					Four tools. Enough for an agent to author a template and run it.
				</p>
			</div>
		</div>

		<!-- Platform plugins -->
		<!--
			The label, the two brands and the closing line each hold their own line on
			mobile; letting the whole thing wrap as one run split "Shopify" from its
			separator and jammed it against the sentence.
		-->
		<div class="flex flex-col gap-3 border-t border-black/15 pt-4 lg:flex-row lg:items-center lg:gap-[18px] lg:pt-[18px]">
			<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-black/55 lg:text-xs">
				Also as a plugin
			</span>
			<span class="flex items-center gap-4 lg:contents">
				<span class="flex items-center gap-2.5">
					<BrandMark mark="wordpress" size={21} />
					<span class="font-display text-lg font-bold tracking-[-0.02em] text-brand-ink lg:text-[21px]">WordPress</span>
				</span>
				<span class="h-1 w-1 flex-shrink-0 rounded-full bg-black/30" aria-hidden="true"></span>
				<span class="flex items-center gap-2.5">
					<BrandMark mark="shopify" size={21} />
					<span class="font-display text-lg font-bold tracking-[-0.02em] text-brand-ink lg:text-[21px]">Shopify</span>
				</span>
			</span>
			<span class="hidden h-px flex-1 bg-black/15 lg:block"></span>
			<span class="font-sans text-sm text-black/60 lg:text-[15px]">
				Everything else talks to the same endpoint.
			</span>
		</div>

		<CtaStrip
			variant="dark"
			text="One API key covers all three."
			action="Get an API key"
			link="Browse all integrations"
			linkHref="/integrations"
		/>
	</div>
</section>
