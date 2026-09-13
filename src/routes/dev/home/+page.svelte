<script>
	/**
	 * Dev harness for the home's three lifecycle states. Mock data through the
	 * real section components, zero backend — the free surface for verifying
	 * the composition against the Paper boards. ?stage=s0|s1|s2 or the switcher.
	 */
	import { page } from '$app/stores';
	import Composer from '$lib/components/dashboard/v2/Composer.svelte';
	import SetupStrip from '$lib/components/dashboard/v2/SetupStrip.svelte';
	import NextStepCard from '$lib/components/dashboard/v2/NextStepCard.svelte';
	import ProofSheet from '$lib/components/dashboard/v2/ProofSheet.svelte';
	import JustPrinted from '$lib/components/dashboard/v2/JustPrinted.svelte';
	import DaybookChart from '$lib/components/dashboard/v2/DaybookChart.svelte';
	import UpgradeNudge from '$lib/components/dashboard/v2/UpgradeNudge.svelte';
	import DitherMeter from '$lib/components/dashboard/v2/DitherMeter.svelte';

	let stage = $page.url.searchParams.get('stage') || 's1';
	let mode = $page.url.searchParams.get('mode') || 'api';

	const now = Date.now();
	const ago = (s) => new Date(now - s * 1000).toISOString();

	const mockTemplates = [
		{ uid: 't1', name: 'course-certificate', thumbnail: '', outputFormat: 'png', usageCount: 812 },
		{ uid: 't2', name: 'og-blog-post', thumbnail: '', outputFormat: 'png', usageCount: 118 },
		{ uid: 't3', name: 'invoice-a4', thumbnail: '', outputFormat: 'pdf', usageCount: 301 },
		{ uid: 't4', name: 'event-badge', thumbnail: '', outputFormat: 'png', usageCount: 53 }
	];

	const mockRenders = [
		{ url: 'https://placehold.co/344x208/D3E7F6/131417?text=Mika+Patel', format: 'PNG', createdAt: ago(12) },
		{ url: 'https://placehold.co/344x208/FFFFFF/131417?text=INV-2216', format: 'PDF', createdAt: ago(41) },
		{ url: 'https://placehold.co/344x208/242628/FFFFFF?text=Ship+faster', format: 'PNG', createdAt: ago(120) },
		{ url: 'https://placehold.co/344x208/D8F34A/131417?text=Ada+Osei', format: 'PNG', createdAt: ago(360) },
		{ url: 'https://placehold.co/344x208/FFD3E8/131417?text=Priya+W', format: 'GIF', createdAt: ago(1320) },
		{ url: 'https://placehold.co/344x208/A9D7F2/131417?text=Quote', format: 'PNG', createdAt: ago(3600) }
	];

	// Two weeks of plausible volume for the chart.
	const chartRenders = Array.from({ length: 240 }, (_, i) => ({
		createdAt: new Date(now - Math.floor(Math.pow(Math.sin(i * 7.31) * 0.5 + 0.5, 1.4) * 14 * 86_400_000)).toISOString()
	}));
</script>

<svelte:head>
	<title>Home states | dev</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-screen w-full bg-brand-paper">
	<div class="hidden w-[220px] flex-shrink-0 flex-col justify-between bg-brand-canvas p-[18px] lg:flex">
		<div class="flex flex-col gap-3">
			<span class="font-display text-[19px] font-extrabold text-brand-ink">Pictify</span>
			<div class="flex flex-col gap-1">
				{#each ['s0', 's1', 's2'] as s (s)}
					<button
						type="button"
						on:click={() => (stage = s)}
						class="rounded-btn px-2 py-1.5 text-left font-mono text-xs {stage === s
							? 'bg-white/85 text-brand-ink'
							: 'text-brand-slate'}"
					>
						{s.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-3 border-t border-black/10 pt-3.5">
			<DitherMeter
				label="Renders"
				used={stage === 's0' ? 0 : stage === 's1' ? 46 : 4212}
				total={stage === 's2' ? 5000 : 50}
				fill="bg-brand-field"
			/>
			<DitherMeter label="AI quota" used={stage === 's0' ? 3 : 31} total={50} fill="bg-brand-pink" />
		</div>
	</div>

	<div class="relative min-h-full w-full overflow-hidden px-6 py-8 lg:px-11 lg:py-9">
		<div class="mx-auto flex max-w-page flex-col gap-6">
			<span class="flex items-center gap-2">
				<span class="block h-[9px] w-[9px] bg-brand-proof"></span>
				<span class="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-mute">Press room — API up</span>
			</span>
			<div class="flex flex-col gap-4">
				<h1 class="font-display text-[38px] font-extrabold tracking-[-0.03em] text-brand-ink">
					What should we print?
				</h1>
				<Composer />
			</div>

			{#if stage === 's0'}
				<SetupStrip variant="s0" apiKey="pic_live_mock8f92a" hasTemplate={false} />
			{/if}
			{#if stage === 's1'}
				<div class="flex gap-1.5">
					{#each ['api', 'mcp', 'automation', 'csv', 'dashboard'] as m (m)}
						<button
							type="button"
							on:click={() => (mode = m)}
							class="rounded-btn px-2 py-1 font-mono text-[10px] {mode === m
								? 'bg-brand-ink text-white'
								: 'border border-brand-rule text-brand-slate'}"
						>
							{m.toUpperCase()}
						</button>
					{/each}
				</div>
				{#if mode !== 'dashboard'}
					<NextStepCard
						variant={mode}
						apiKey="pic_live_mock8f92a"
						templateName="course-certificate"
						variables={['studentName', 'courseTitle', 'completionDate', 'logoUrl']}
					/>
				{/if}
				<div class="flex items-center justify-between px-0.5">
					<span class="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-mute">
						Also fills from — everything else
					</span>
					<span class="font-sans text-[12.5px] font-semibold text-brand-slate underline underline-offset-[3px]">
						Set up another way
					</span>
				</div>
			{/if}
			{#if stage === 's2'}
				<div class="flex items-center justify-between border-y border-brand-rule py-2.5">
					<div class="flex items-center gap-2">
						<span class="font-mono text-[10px] uppercase tracking-[0.1em] text-brand-mute">Fills from</span>
						<span class="rounded-[3px] bg-brand-canvas px-[9px] py-[3px] font-mono text-[10px] text-brand-ink">YOUR CODE ✓</span>
						<span class="rounded-[3px] bg-brand-canvas px-[9px] py-[3px] font-mono text-[10px] text-brand-ink">ZAPIER ✓</span>
						<span class="rounded-[3px] border border-brand-rule px-[9px] py-[3px] font-mono text-[10px] text-brand-slate">+ MCP</span>
					</div>
					<span class="font-sans text-[12.5px] font-semibold text-brand-slate underline underline-offset-[3px]">Callers</span>
				</div>
				<DaybookChart renders={chartRenders} total={1284} trendPct={18} />
			{/if}

			<ProofSheet starters={stage === 's0'} templates={mockTemplates} />

			{#if stage === 's2'}
				<UpgradeNudge percentage={84} resetDate={new Date(now + 18 * 86_400_000).toISOString()} />
			{/if}

			<JustPrinted renders={stage === 's0' ? [] : mockRenders} empty={stage === 's0'} />
		</div>
	</div>
</div>
