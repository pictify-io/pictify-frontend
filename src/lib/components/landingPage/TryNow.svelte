<script>
	import SignUpButton from './SignUpButton.svelte';
</script>

<section class="w-full py-24 md:py-32 bg-[#FFFDF8] border-t-[3px] border-gray-900">
	<div class="max-w-6xl mx-auto px-4">
		<!-- The Monolith CTA Card -->
		<div class="relative group">
			<!-- Decorative Under-layers for depth -->
			<div
				class="absolute top-4 left-4 w-full h-full bg-gray-900 rounded-3xl border-[3px] border-gray-900 opacity-20"
			/>
			<div
				class="absolute top-2 left-2 w-full h-full bg-[#ffc480] rounded-3xl border-[3px] border-gray-900"
			/>

			<!-- Main Container -->
			<div
				class="relative bg-white rounded-[2.5rem] border-[3px] border-gray-900 overflow-hidden shadow-2xl"
			>
				<!-- Terminal Header / Window Controls -->
				<div
					class="h-12 bg-gray-50 border-b-[3px] border-gray-900 flex items-center justify-between px-6"
				>
					<div class="flex gap-2">
						<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border border-gray-900" />
						<div class="w-3 h-3 rounded-full bg-[#ffc480] border border-gray-900" />
						<div class="w-3 h-3 rounded-full bg-[#4ade80] border border-gray-900" />
					</div>
					<div class="font-mono text-xs text-gray-500 font-bold flex items-center gap-2">
						<span class="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse border border-gray-900" />
						SYSTEM_READY
					</div>
				</div>

				<!-- Main Content Area -->
				<div class="relative p-8 md:p-20 text-center overflow-hidden">
					<!-- Grid Background inside the card -->
					<div
						class="absolute inset-0 opacity-10 pointer-events-none"
						style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 30px 30px;"
					/>

					<!-- Content -->
					<div class="relative z-10 flex flex-col items-center">
						<div
							class="inline-block px-4 py-1.5 rounded-full border-[2px] border-gray-900 bg-[#4ade80] shadow-[2px_2px_0_0_#000] mb-8 transform -rotate-2"
						>
							<span class="text-gray-900 text-xs font-mono font-bold uppercase tracking-wider"
								>🚀 Launch_Sequence_Initiated</span
							>
						</div>

						<h2
							class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight"
						>
							Ready to <br class="md:hidden" />
							<span class="text-[#ff6b6b]">Scale?</span>
						</h2>

						<p class="text-xl text-gray-600 max-w-xl mx-auto mb-12 leading-relaxed font-medium">
							Join teams building the next generation of dynamic media workflows — designers create
							templates, developers integrate the API.
						</p>

						<div class="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
							<SignUpButton
								class="w-full sm:w-auto px-8 py-4 bg-[#ffc480] text-gray-900 font-bold text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all uppercase tracking-wide relative overflow-hidden after:absolute after:inset-0 after:bg-white/20 after:translate-x-[-100%] after:animate-[shimmer_2s_infinite]"
								text="Start Building Now"
							/>

							<a
								href="https://docs.pictify.io"
								target="_blank"
								class="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] transition-all flex items-center justify-center gap-2 group"
							>
								<span>View API Docs</span>
								<svg
									class="w-5 h-5 group-hover:translate-x-1 transition-transform"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/></svg
								>
							</a>
						</div>
					</div>
				</div>

				<!-- Status Footer -->
				<div
					class="bg-gray-50 border-t-[3px] border-gray-900 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x-[3px] divide-gray-900"
				>
					<div
						class="p-6 flex items-center justify-center gap-4 group hover:bg-gray-100 transition-colors"
					>
						<div
							class="w-10 h-10 rounded-lg bg-[#4ade80] border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#000]"
						>
							<svg
								class="w-5 h-5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/></svg
							>
						</div>
						<div class="text-left">
							<div class="text-gray-900 font-bold">Instant Access</div>
							<div class="text-gray-600 text-xs font-medium">Get API Key immediately</div>
						</div>
					</div>

					<div
						class="p-6 flex items-center justify-center gap-4 group hover:bg-gray-100 transition-colors"
					>
						<div
							class="w-10 h-10 rounded-lg bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#000]"
						>
							<svg
								class="w-5 h-5 text-gray-900"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/></svg
							>
						</div>
						<div class="text-left">
							<div class="text-gray-900 font-bold">50 Free Credits</div>
							<div class="text-gray-600 text-xs font-medium">No credit card required</div>
						</div>
					</div>

					<div
						class="p-6 flex items-center justify-center gap-4 group hover:bg-gray-100 transition-colors"
					>
						<div
							class="w-10 h-10 rounded-lg bg-[#ff6b6b] border-[2px] border-gray-900 flex items-center justify-center shadow-[2px_2px_0_0_#000]"
						>
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/></svg
							>
						</div>
						<div class="text-left">
							<div class="text-gray-900 font-bold">Secure Infrastructure</div>
							<div class="text-gray-600 text-xs font-medium">Enterprise-ready security</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes shimmer {
		100% { transform: translateX(100%); }
	}
</style>
