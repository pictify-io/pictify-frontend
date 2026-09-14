<script>
	import Wordmark from './Wordmark.svelte';

	/*
	 * Every target here is a page that exists and wears the v2 chrome. The
	 * previous list pointed at /docs/api, /docs/sdks, /docs/mcp, /status and
	 * /video, none of which existed (five 404s in the footer of every page),
	 * and at "Templates", which silently redirected to the tools hub. Docs
	 * links go to docs.pictify.io directly rather than through a redirect.
	 */
	const columns = [
		{
			title: 'Product',
			links: [
				['HTML to image', '/tools/html-to-image'],
				['Free tools', '/tools'],
				['Campaigns', '/campaigns/customer-value-updates'],
				['Pricing', '/pricing']
			]
		},
		{
			title: 'Developers',
			links: [
				['Documentation', 'https://docs.pictify.io'],
				['API reference', 'https://docs.pictify.io/api-reference/overview'],
				['SDKs', 'https://docs.pictify.io/sdks/nodejs'],
				['MCP server', 'https://docs.pictify.io/agent-integration/mcp-server']
			]
		},
		{
			title: 'Integrations',
			links: [
				['Zapier', '/integrations/zapier'],
				['Make', '/integrations/make'],
				['n8n', '/integrations/n8n'],
				['WordPress', '/integrations/wordpress']
			]
		},
		{
			title: 'Company',
			links: [
				['Blog', '/blogs'],
				['Alternatives', '/alternatives'],
				['Support', 'mailto:support@pictify.io'],
				['Terms', '/terms'],
				['Privacy', '/privacy']
			]
		}
	];
</script>

<footer class="relative w-full overflow-hidden bg-brand-press-deep px-5 pt-12 lg:px-10 lg:pt-20">
	<div class="mx-auto flex w-full max-w-page flex-col gap-8 lg:gap-14">
		<div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-14">
			<div class="flex flex-col gap-3 lg:w-[300px] lg:flex-shrink-0">
				<a href="/" aria-label="Pictify home"><Wordmark inverted /></a>
				<p
					class="font-sans text-sm leading-[21px] text-brand-press-text lg:max-w-[260px] lg:text-[15px] lg:leading-[23px]"
				>
					A template declares variables. Anything that can fill them makes a file.
				</p>
			</div>

			<div class="flex flex-1 flex-wrap gap-6 lg:gap-14">
				{#each columns as col (col.title)}
					<nav class="flex min-w-[110px] flex-1 flex-col gap-3" aria-label={col.title}>
						<!--
							A <p>, not an <h2>. These four labels are furniture on every
							page of the site, so as headings they put "Product",
							"Developers", "Integrations" and "Company" into the outline of
							pages that rank on their own H2s. The <nav>'s aria-label
							already names the group.
						-->
						<p
							class="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B7280] lg:text-[11px]"
						>
							{col.title}
						</p>
						{#each col.links as [label, href] (href)}
							<a {href} class="font-sans text-sm text-white hover:underline lg:text-[15px]"
								>{label}</a
							>
						{/each}
					</nav>
				{/each}
			</div>
		</div>

		<div class="flex items-center justify-between border-t border-white/10 pt-5 lg:pt-7">
			<p class="font-mono text-[11px] text-[#6B7280] lg:text-xs">© 2026 Pictify</p>
			<ul class="flex items-center gap-4 lg:gap-[22px]">
				<li>
					<a href="https://status.pictify.io" class="font-mono text-[11px] text-[#6B7280] hover:text-white lg:text-xs"
						>status</a
					>
				</li>
				<li>
					<a
						href="https://github.com/pictify-io"
						class="font-mono text-[11px] text-[#6B7280] hover:text-white lg:text-xs">github</a
					>
				</li>
			</ul>
		</div>
	</div>

	<!-- Wordmark clipped by the bottom edge: felt more than read. -->
	<div
		class="flex h-[74px] w-full items-start justify-center overflow-hidden pt-5 lg:h-[190px] lg:pt-9"
		aria-hidden="true"
	>
		<span
			class="font-display text-[118px] font-extrabold leading-[0.8] tracking-[-0.05em] text-[#1E2126] lg:text-[300px]"
		>
			Pictify
		</span>
	</div>
</footer>
