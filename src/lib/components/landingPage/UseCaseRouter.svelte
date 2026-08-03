<script>
	/**
	 * UseCaseRouter — the segmentation section right under the hero.
	 * The homepage frames one engine; these three lanes route each ICP to
	 * its own funnel (positioning-synthesis-2026-08-04: "segregate on use
	 * case later" happens here, not in the headline).
	 */
	import { analytics } from '$lib/analytics.js';

	const lanes = [
		{
			id: 'documents',
			eyebrow: 'For teams & organizers',
			title: 'Documents at Scale',
			description:
				'Invoices, certificates, reports, badges, tickets — upload your list, pick a template, every person gets theirs by email. No design skills, no Gmail limits.',
			cta: 'Browse templates',
			href: '/templates',
			accent: 'bg-brand-accent',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
		},
		{
			id: 'video',
			eyebrow: 'For builders',
			title: 'Personalized Video',
			description:
				'Describe a video or build a template — then render one, or five thousand, personalized from your data. No render farm to babysit.',
			cta: 'Start rendering',
			href: '/signup',
			accent: 'bg-data-violet/40',
			icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
		},
		{
			id: 'api-agents',
			eyebrow: 'For pipelines & agents',
			title: 'API, Webhooks & MCP',
			description:
				'REST API, SDKs in four languages, signed webhooks, and a first-party MCP server — every template is callable by your code and your AI agents.',
			cta: 'Read the docs',
			href: 'https://docs.pictify.io',
			external: true,
			accent: 'bg-data-green/40',
			icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
		}
	];

	function trackLane(lane) {
		analytics.track?.('Landing Lane Clicked', { lane: lane.id, href: lane.href });
	}
</script>

<section class="w-full py-16 md:py-20 bg-brand-bg border-b-[3px] border-gray-900">
	<div class="max-w-6xl mx-auto px-6">
		<div class="text-center mb-12">
			<p class="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
				One engine, three ways in
			</p>
			<h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight">
				What are you making?
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
			{#each lanes as lane}
				<a
					href={lane.href}
					target={lane.external ? '_blank' : undefined}
					rel={lane.external ? 'noopener noreferrer' : undefined}
					on:click={() => trackLane(lane)}
					class="group bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-lg hover:shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 transition-all p-6 lg:p-8 flex flex-col"
				>
					<div
						class="w-12 h-12 {lane.accent} rounded-xl border-[3px] border-gray-900 shadow-brutal-sm flex items-center justify-center mb-5"
					>
						<svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d={lane.icon} />
						</svg>
					</div>
					<p class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
						{lane.eyebrow}
					</p>
					<h3 class="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-3">
						{lane.title}
					</h3>
					<p class="text-sm text-gray-600 font-medium leading-relaxed mb-6">
						{lane.description}
					</p>
					<span
						class="mt-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-danger"
					>
						{lane.cta}
						<svg
							class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/>
						</svg>
					</span>
				</a>
			{/each}
		</div>
	</div>
</section>
