<script>
	/**
	 * DeliveryProof — "everything else stops at the send."
	 * Differentiator ① from positioning-synthesis-2026-08-04: the failure
	 * vignettes are live-verified claims (sources in the positioning canvas
	 * sheet) rendered as the error UIs people have actually seen.
	 *
	 * Layout: the four error-windows CASCADE like dialogs piling up on a
	 * desktop — alternating left/right with slight overlaps and rotations —
	 * so the column reads as one composition (no ragged grid) and its height
	 * matches the run-summary card, the section's other artifact.
	 */
	import SignUpButton from './SignUpButton.svelte';

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

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-14 items-start relative max-w-5xl mx-auto">
			<!-- VS badge on the seam -->
			<div
				class="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-brand-accent rounded-full border-[3px] border-gray-900 shadow-brutal-lg items-center justify-center z-30 rotate-12"
			>
				<span class="text-sm font-black text-gray-900">VS</span>
			</div>

			<!-- THE OLD WAY: error dialogs piling up on the desktop -->
			<div>
				<p class="text-[11px] font-black uppercase tracking-widest text-brand-danger mb-5 flex items-center gap-2">
					<span class="w-5 h-5 bg-brand-danger rounded border-[2px] border-gray-900 inline-flex items-center justify-center">
						<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M6 18L18 6M6 6l12 12" /></svg>
					</span>
					The old way
				</p>

				<div class="flex flex-col items-stretch">
					<!-- Gmail: sending limit banner -->
					<div class="w-[88%] self-start bg-white rounded-xl border-[2px] border-gray-900 shadow-brutal-md overflow-hidden transform -rotate-1 relative z-[1]">
						<div class="bg-gray-100 border-b-[2px] border-gray-900 px-3 py-1.5 flex items-center gap-1.5">
							<span class="w-2 h-2 rounded-full bg-brand-danger border border-gray-900" />
							<span class="w-2 h-2 rounded-full bg-brand-accent border border-gray-900" />
							<span class="w-2 h-2 rounded-full bg-data-green border border-gray-900" />
							<span class="ml-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">Gmail</span>
						</div>
						<div class="p-3">
							<div class="bg-brand-danger/10 border-[2px] border-brand-danger rounded-lg px-3 py-2 flex items-start gap-2">
								<svg class="w-4 h-4 text-brand-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" /></svg>
								<p class="text-[11px] font-bold text-gray-900 leading-snug">
									You have reached a limit for sending mail. Try again in 24 hours.
									<span class="block text-[10px] text-gray-400 mt-0.5 font-medium">Row 137 of 240 — batch dead</span>
								</p>
							</div>
						</div>
					</div>

					<!-- Word: attachments dialog -->
					<div class="w-[88%] self-end -mt-3 bg-white rounded-xl border-[2px] border-gray-900 shadow-brutal-md overflow-hidden transform rotate-1 relative z-[2]">
						<div class="bg-gray-100 border-b-[2px] border-gray-900 px-3 py-1.5 flex items-center gap-1.5">
							<span class="w-2 h-2 rounded-full bg-brand-danger border border-gray-900" />
							<span class="w-2 h-2 rounded-full bg-brand-accent border border-gray-900" />
							<span class="w-2 h-2 rounded-full bg-data-green border border-gray-900" />
							<span class="ml-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">Word — Mail Merge</span>
						</div>
						<div class="p-3 flex items-center gap-2.5">
							<span class="w-8 h-8 bg-gray-100 rounded-lg border-[2px] border-gray-900 flex items-center justify-center shrink-0">
								<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
							</span>
							<p class="text-[11px] font-bold text-gray-900 leading-snug flex-1">
								Mail merge can't include attachments.
								<span class="block text-[10px] text-gray-500 font-medium mt-0.5">Recipients get an icon — not the certificate.</span>
							</p>
							<span class="px-3 py-1 bg-gray-100 rounded border-[2px] border-gray-900 text-[9px] font-black uppercase self-end">OK</span>
						</div>
					</div>

					<!-- Canva: download complete, now what -->
					<div class="w-[88%] self-start -mt-3 bg-white rounded-xl border-[2px] border-gray-900 shadow-brutal-md overflow-hidden transform -rotate-1 relative z-[3]">
						<div class="bg-gray-100 border-b-[2px] border-gray-900 px-3 py-1.5 flex items-center gap-1.5">
							<span class="w-2 h-2 rounded-full bg-brand-danger border border-gray-900" />
							<span class="w-2 h-2 rounded-full bg-brand-accent border border-gray-900" />
							<span class="w-2 h-2 rounded-full bg-data-green border border-gray-900" />
							<span class="ml-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500">Design tool</span>
						</div>
						<div class="p-3 flex items-center gap-2.5">
							<span class="w-8 h-8 bg-data-green/30 rounded-lg border-[2px] border-gray-900 flex items-center justify-center shrink-0">
								<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
							</span>
							<p class="text-[11px] font-bold text-gray-900 leading-snug">
								certificates-240-pages.pdf downloaded
								<span class="block text-[10px] text-gray-500 font-medium mt-0.5">Splitting, naming & emailing 240 files: still you.</span>
							</p>
						</div>
					</div>

					<!-- Apps Script: timeout console -->
					<div class="w-[88%] self-end -mt-3 bg-gray-950 rounded-xl border-[2px] border-gray-900 shadow-brutal-md overflow-hidden transform rotate-1 relative z-[4]">
						<div class="bg-gray-900 border-b-[2px] border-gray-700 px-3 py-1.5 flex items-center gap-1.5">
							<span class="w-2 h-2 rounded-full bg-brand-danger border border-gray-700" />
							<span class="w-2 h-2 rounded-full bg-brand-accent border border-gray-700" />
							<span class="w-2 h-2 rounded-full bg-data-green border border-gray-700" />
							<span class="ml-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">Free add-on — logs</span>
						</div>
						<div class="p-3 font-mono text-[10px] leading-relaxed">
							<p class="text-gray-400">Sending 240 emails…</p>
							<p class="text-data-red font-bold">Exception: Exceeded maximum execution time (6 min)</p>
							<p class="text-gray-500">Support: none. Retry: tomorrow.</p>
						</div>
					</div>
				</div>
			</div>

			<!-- WITH PICTIFY: the per-row run summary -->
			<div>
				<p class="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-5 flex items-center gap-2">
					<span class="w-5 h-5 bg-data-green rounded border-[2px] border-gray-900 inline-flex items-center justify-center">
						<svg class="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" /></svg>
					</span>
					With Pictify
				</p>
				<div class="relative">
					<div
						class="absolute inset-0 bg-data-green rounded-2xl transform rotate-1 translate-x-2 translate-y-2 pointer-events-none"
					/>
					<div
						class="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden"
					>
						<div class="bg-gray-100 border-b-[3px] border-gray-900 px-5 py-4 flex items-center justify-between gap-3">
							<p class="text-xs font-black uppercase tracking-widest text-gray-900">
								Run summary — 240 recipients
							</p>
							<span
								class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-[2px] border-black bg-data-green text-black whitespace-nowrap"
							>
								239 delivered
							</span>
						</div>
						<ul class="divide-y-[2px] divide-gray-200">
							{#each rows as row}
								<li class="px-5 py-3.5 flex items-center gap-3">
									<span class="text-sm font-black text-gray-400 w-7 shrink-0">#{row.n}</span>
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
							<li class="px-5 py-2.5 text-center bg-gray-50">
								<span class="text-xs font-bold text-gray-400 tracking-widest">⋯ 236 more rows</span>
							</li>
						</ul>
						<div class="border-t-[3px] border-gray-900 bg-gray-50 px-5 py-3">
							<p class="text-[11px] font-bold text-gray-600">
								Own email infrastructure — no Gmail quotas. Per-row delivered / bounced,
								auto-suppression, one-click re-send.
							</p>
						</div>
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
