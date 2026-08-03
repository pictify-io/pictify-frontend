<script>
	/**
	 * DeliveryProof — "everything else stops at the send."
	 * Differentiator ① from positioning-synthesis-2026-08-04: the receipts
	 * are live-verified claims (sources in the positioning canvas sheet).
	 *
	 * Layout principle: ONE hero artifact. The receipts are a quiet
	 * typographic ledger (no boxes) so the run-summary card — the product's
	 * answer — is the only heavy element in the section.
	 */
	import SignUpButton from './SignUpButton.svelte';

	const receipts = [
		{
			who: 'Gmail & mail merge',
			claim: 'capped at 500–1,500 emails a day, locked mid-batch when you hit it'
		},
		{
			who: 'Word mail merge',
			claim: "can't attach the file to each email — the file is the whole point"
		},
		{
			who: 'Canva & design tools',
			claim: 'stop at download; naming and sending 200 files is still your evening'
		},
		{
			who: 'Free add-ons',
			claim: '6-minute scripts on Gmail quotas, and nobody to call when they break'
		}
	];

	// The per-row run summary — real product states, not a mockup of vapor
	const rows = [
		{ n: 1, name: 'Aisha Kamara', delivery: 'delivered' },
		{ n: 2, name: 'Tom Okafor', delivery: 'delivered' },
		{ n: 3, name: 'Mei-Ling Chen', delivery: 'bounced', action: 'Re-send' },
		{ n: 4, name: 'Priya Nair', delivery: 'sent' }
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

		<div class="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
			<!-- The wall: quiet typographic ledger, no boxes -->
			<div class="lg:col-span-2">
				<ul class="divide-y-2 divide-gray-200">
					{#each receipts as receipt}
						<li class="py-5 flex items-baseline gap-3">
							<span class="text-brand-danger font-black text-lg leading-none select-none">✗</span>
							<p class="text-base leading-snug">
								<span class="font-black text-gray-900">{receipt.who}</span>
								<span class="text-gray-600 font-medium"> — {receipt.claim}.</span>
							</p>
						</li>
					{/each}
					<li class="py-5 flex items-baseline gap-3">
						<span class="text-data-green font-black text-lg leading-none select-none">✓</span>
						<p class="text-base leading-snug font-bold text-gray-900">
							Pictify sends on its own email infrastructure — and shows you what happened to
							every single row.
						</p>
					</li>
				</ul>
			</div>

			<!-- The answer: per-row run summary — the section's one artifact -->
			<div class="lg:col-span-3 relative">
				<div
					class="absolute inset-0 bg-data-green rounded-2xl transform rotate-1 translate-x-2 translate-y-2 pointer-events-none"
				/>
				<div
					class="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden"
				>
					<div class="bg-gray-100 border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between">
						<p class="text-xs font-black uppercase tracking-widest text-gray-900">
							Run summary — 240 recipients
						</p>
						<span
							class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-data-green text-black"
						>
							239 delivered
						</span>
					</div>
					<ul class="divide-y-[2px] divide-gray-200">
						{#each rows as row}
							<li class="px-6 py-4 flex items-center gap-4">
								<span class="text-sm font-black text-gray-400 w-8 shrink-0">#{row.n}</span>
								<span class="text-sm font-bold text-gray-900 flex-1 truncate">{row.name}</span>
								<span
									class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] {badge(row.delivery)}"
									>{row.delivery}</span
								>
								{#if row.action}
									<span
										class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border-[2px] border-gray-900 bg-brand-accent text-gray-900 shadow-brutal-sm whitespace-nowrap"
										>{row.action}</span
									>
								{/if}
							</li>
						{/each}
						<li class="px-6 py-3 text-center bg-gray-50">
							<span class="text-xs font-bold text-gray-400 tracking-widest">⋯ 236 more rows</span>
						</li>
					</ul>
					<div class="border-t-[3px] border-gray-900 bg-gray-50 px-6 py-3">
						<p class="text-[11px] font-bold text-gray-600">
							Live product, not a mockup: sent → delivered / bounced, automatic suppression of
							bad addresses, one-click re-send.
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
