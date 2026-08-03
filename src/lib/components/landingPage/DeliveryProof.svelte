<script>
	/**
	 * DeliveryProof — "everything else stops at the send."
	 * Differentiator ① from positioning-synthesis-2026-08-04; every failure
	 * row is a live-verified claim (sources in the positioning canvas sheet).
	 *
	 * Layout: TWIN ARTIFACTS. The old-way window mirrors the run-summary
	 * card's anatomy exactly — header pill, four rows, footer — so the
	 * comparison reads row-for-row: 0 delivered vs 239 delivered.
	 */
	import SignUpButton from './SignUpButton.svelte';

	const failures = [
		{
			app: 'Gmail',
			text: 'Sending limit reached — try again in 24 hours',
			sub: 'died at row 137 of 240',
			pill: 'blocked'
		},
		{
			app: 'Word',
			text: "Mail merge can't attach the certificate",
			sub: 'recipients get an icon, not the file',
			pill: 'no file'
		},
		{
			app: 'Canva',
			text: 'One 240-page PDF downloaded',
			sub: 'splitting, naming & sending: still you',
			pill: 'manual'
		},
		{
			app: 'Script',
			text: 'Exceeded max execution time (6 min)',
			sub: 'free add-on, nobody to call',
			pill: 'timeout'
		}
	];

	// The per-row run summary — real product states, not a mockup of vapor
	const rows = [
		{ n: 1, name: 'Aisha Kamara', delivery: 'delivered' },
		{ n: 2, name: 'Tom Okafor', delivery: 'delivered' },
		{ n: 3, name: 'Mei-Ling Chen', delivery: 'bounced', action: 'Re-send' },
		{ n: 4, name: 'Priya Nair', delivery: 'delivered' }
	];

	const badge = (status) => {
		if (status === 'delivered') return 'bg-data-green text-black border-black';
		if (status === 'bounced') return 'bg-brand-danger text-white border-black';
		return 'bg-brand-accent text-black border-black';
	};
</script>

<section class="w-full py-20 md:py-28 bg-white border-b-[3px] border-gray-900 relative overflow-hidden">
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div class="max-w-6xl mx-auto px-6 relative z-10">
		<div class="text-center mb-16 max-w-3xl mx-auto">
			<p class="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
				Why "delivered" is in the headline
			</p>
			<h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
				Everything Else Stops<br />
				<span class="relative inline-block text-brand-danger transform -rotate-1 mt-2">
					At the Send
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-base md:text-lg text-gray-700 font-medium">
				Generating 300 personalized documents was never the hard part. Getting all 300 into
				inboxes — and knowing they arrived — is.
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-stretch relative max-w-5xl mx-auto">
			<!-- VS badge on the seam -->
			<div
				class="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-brand-accent rounded-full border-[3px] border-gray-900 shadow-brutal-lg items-center justify-center z-20 rotate-12"
			>
				<span class="text-sm font-black text-gray-900">VS</span>
			</div>

			<!-- THE OLD WAY: same anatomy as the run summary, opposite outcome -->
			<div class="relative">
				<div
					class="absolute inset-0 bg-brand-danger rounded-2xl transform -rotate-1 -translate-x-2 translate-y-2 pointer-events-none"
				/>
				<div
					class="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden h-full flex flex-col"
				>
					<div class="bg-gray-100 border-b-[3px] border-gray-900 px-5 py-4 flex items-center justify-between gap-3">
						<p class="text-xs font-black uppercase tracking-widest text-gray-900">
							The old way — 240 to send
						</p>
						<span
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-brand-danger text-white whitespace-nowrap"
						>
							0 confirmed
						</span>
					</div>
					<ul class="divide-y-[2px] divide-gray-200 flex-1">
						{#each failures as failure}
							<li class="px-5 py-4 flex items-center gap-3">
								<span
									class="w-16 shrink-0 text-center px-1.5 py-1 text-[9px] font-black uppercase tracking-widest rounded border-[2px] border-gray-900 bg-gray-100 text-gray-700"
									>{failure.app}</span
								>
								<div class="flex-1 min-w-0">
									<p class="text-[13px] font-bold text-gray-900 leading-snug">
										{failure.text}
									</p>
									<p class="text-[11px] font-medium text-gray-500 truncate">{failure.sub}</p>
								</div>
								<span
									class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-brand-danger/10 text-brand-danger whitespace-nowrap"
									>{failure.pill}</span
								>
							</li>
						{/each}
					</ul>
					<div class="border-t-[3px] border-gray-900 bg-gray-50 px-5 py-3">
						<p class="text-[11px] font-bold text-gray-600">
							No per-recipient status. No bounce handling. No re-send.
						</p>
					</div>
				</div>
			</div>

			<!-- WITH PICTIFY: the per-row run summary -->
			<div class="relative">
				<div
					class="absolute inset-0 bg-data-green rounded-2xl transform rotate-1 translate-x-2 translate-y-2 pointer-events-none"
				/>
				<div
					class="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden h-full flex flex-col"
				>
					<div class="bg-gray-100 border-b-[3px] border-gray-900 px-5 py-4 flex items-center justify-between gap-3">
						<p class="text-xs font-black uppercase tracking-widest text-gray-900">
							With Pictify — same 240
						</p>
						<span
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-data-green text-black whitespace-nowrap"
						>
							239 delivered
						</span>
					</div>
					<ul class="divide-y-[2px] divide-gray-200 flex-1">
						{#each rows as row}
							<li class="px-5 py-4 flex items-center gap-3">
								<span class="text-sm font-black text-gray-400 w-8 shrink-0">#{row.n}</span>
								<span class="text-[13px] font-bold text-gray-900 flex-1 truncate">{row.name}</span>
								<span
									class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] {badge(row.delivery)} whitespace-nowrap"
									>{row.delivery}</span
								>
								{#if row.action}
									<span
										class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border-[2px] border-gray-900 bg-brand-accent text-gray-900 shadow-brutal-sm whitespace-nowrap"
										>{row.action}</span
									>
								{/if}
							</li>
						{/each}
						<li class="px-5 py-3 text-center">
							<span class="text-xs font-bold text-gray-400 tracking-widest">⋯ 236 more rows</span>
						</li>
					</ul>
					<div class="border-t-[3px] border-gray-900 bg-gray-50 px-5 py-3">
						<p class="text-[11px] font-bold text-gray-600">
							Own email infrastructure. Per-row delivered / bounced, auto-suppression, one-click
							re-send.
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex justify-center mt-14">
			<SignUpButton
				text="Run Your First Batch Free"
				location="delivery_proof"
				href="/signup"
				class="bg-gray-900 text-white text-lg lg:text-base px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-brutal-lg hover:translate-y-1 hover:translate-x-1 hover:shadow-brutal-sm transition-all font-black uppercase tracking-wider"
			/>
		</div>
	</div>
</section>
