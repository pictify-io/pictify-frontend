<script>
	/**
	 * DeliveryProof — "everything else stops at the send."
	 * Differentiator ① from positioning-synthesis-2026-08-04: every claim on
	 * the left is live-verified (sources in the positioning canvas sheet);
	 * the run-summary table on the right is the product answering them.
	 */
	import SignUpButton from './SignUpButton.svelte';

	const receipts = [
		{
			who: 'Gmail & mail merge',
			claim: 'Caps you at 500–1,500 emails a day — and locks sending mid-batch when you hit it.'
		},
		{
			who: 'Word mail merge',
			claim: "Can't attach the file to each email. The file is the whole point."
		},
		{
			who: 'Canva & design tools',
			claim: 'Stop at download. Splitting, naming and sending 200 files is still your evening.'
		},
		{
			who: 'Free add-ons',
			claim: 'Ride 6-minute scripts on Gmail quotas — and when they break, there is nobody to call.'
		}
	];

	// The per-row run summary — real product states, not a mockup of vapor
	const rows = [
		{ n: 1, name: 'Aisha Kamara', render: 'rendered', delivery: 'delivered' },
		{ n: 2, name: 'Tom Okafor', render: 'rendered', delivery: 'delivered' },
		{ n: 3, name: 'Mei-Ling Chen', render: 'rendered', delivery: 'bounced', action: 'Re-send' },
		{ n: 4, name: 'Sam Alvarez', render: 'rendered', delivery: 'delivered' },
		{ n: 5, name: 'Priya Nair', render: 'rendered', delivery: 'sent' }
	];

	const badge = (status) => {
		if (status === 'delivered' || status === 'rendered')
			return 'bg-data-green text-black border-black';
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
		<div class="text-center mb-14 max-w-3xl mx-auto">
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

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
			<!-- The wall -->
			<div class="space-y-4">
				{#each receipts as receipt}
					<div
						class="flex items-start gap-4 bg-gray-50 border-[3px] border-gray-900 rounded-xl p-4 shadow-brutal-sm"
					>
						<span
							class="flex-shrink-0 w-7 h-7 bg-brand-danger rounded-lg border-[2px] border-gray-900 flex items-center justify-center mt-0.5"
						>
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</span>
						<div>
							<p class="text-xs font-black uppercase tracking-widest text-gray-500">
								{receipt.who}
							</p>
							<p class="text-sm font-bold text-gray-900 leading-snug mt-0.5">{receipt.claim}</p>
						</div>
					</div>
				{/each}

				<p class="text-sm font-bold text-gray-600 pt-2 pl-1">
					Pictify sends from its own email infrastructure — no Gmail quotas, no scripts — and shows
					you what happened to every single row. Bounced? Fix the address and re-send that one.
				</p>
			</div>

			<!-- The answer: per-row run summary -->
			<div class="relative">
				<div
					class="absolute inset-0 bg-data-green rounded-2xl transform rotate-2 translate-x-2 translate-y-2 pointer-events-none"
				/>
				<div
					class="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden"
				>
					<div class="bg-gray-100 border-b-[3px] border-gray-900 px-5 py-3 flex items-center justify-between">
						<p class="text-xs font-black uppercase tracking-widest text-gray-900">
							Run summary — 240 rows
						</p>
						<span
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-data-green text-black"
						>
							239 delivered
						</span>
					</div>
					<table class="w-full text-left">
						<thead>
							<tr class="border-b-[2px] border-gray-900 bg-gray-50">
								<th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600">Row</th>
								<th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600">Render</th>
								<th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600">Delivery</th>
								<th class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600" />
							</tr>
						</thead>
						<tbody class="divide-y-[2px] divide-gray-200">
							{#each rows as row}
								<tr>
									<td class="px-4 py-3 text-sm font-black text-gray-500">
										#{row.n}
										<span class="text-gray-900 font-bold text-xs ml-1 hidden sm:inline">{row.name}</span>
									</td>
									<td class="px-4 py-3">
										<span
											class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] {badge(row.render)}"
											>{row.render}</span
										>
									</td>
									<td class="px-4 py-3">
										<span
											class="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] {badge(row.delivery)}"
											>{row.delivery}</span
										>
									</td>
									<td class="px-4 py-3">
										{#if row.action}
											<span
												class="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border-[2px] border-gray-900 bg-brand-accent text-gray-900 shadow-brutal-sm whitespace-nowrap"
												>{row.action}</span
											>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<div class="border-t-[3px] border-gray-900 bg-gray-50 px-5 py-3">
						<p class="text-[11px] font-bold text-gray-600">
							Per-row status is live product, not a mockup: sent → delivered / bounced, automatic
							suppression of bad addresses, one-click re-send.
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="flex justify-center mt-12">
			<SignUpButton
				text="Run Your First Batch Free"
				location="delivery_proof"
				href="/signup"
				class="bg-gray-900 text-white text-lg lg:text-base px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-brutal-lg hover:translate-y-1 hover:translate-x-1 hover:shadow-brutal-sm transition-all font-black uppercase tracking-wider"
			/>
		</div>
	</div>
</section>
