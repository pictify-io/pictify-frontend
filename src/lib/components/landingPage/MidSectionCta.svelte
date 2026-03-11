<script>
	import SignUpButton from './SignUpButton.svelte';
</script>

<section
	class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden border-y-[3px] border-gray-900"
>
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/2 -right-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -z-10"
	/>
	<div
		class="absolute top-1/2 -left-64 w-[800px] h-[800px] bg-[#4ade80]/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -z-10"
	/>

	<div class="max-w-6xl mx-auto px-6 relative z-10 text-center">
		<div class="relative w-full max-w-4xl mx-auto">
			<!-- Floating Decorative Tags -->
			<div
				class="absolute -top-6 -left-4 md:-top-8 md:-left-12 z-20 hidden md:block animate-[bounce_3s_ease-in-out_infinite]"
			>
				<div
					class="px-4 py-2 bg-white text-gray-900 font-black uppercase tracking-wider text-xs md:text-sm border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-6"
				>
					🚀 Instant Access
				</div>
			</div>
			<div
				class="absolute -bottom-6 -right-4 md:-bottom-8 md:-right-12 z-20 hidden md:block animate-[bounce_4s_ease-in-out_infinite]"
			>
				<div
					class="px-4 py-2 bg-[#4ade80] text-gray-900 font-black uppercase tracking-wider text-xs md:text-sm border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform rotate-3"
				>
					No Credit Card
				</div>
			</div>

			<!-- Main Card -->
			<div
				class="relative bg-[#ffc480] rounded-[2rem] border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] p-8 md:p-16 overflow-hidden group hover:-translate-y-1 hover:shadow-[16px_16px_0_0_#1f2937] transition-all duration-300 flex flex-col items-center"
			>
				<!-- Subtle texture -->
				<div
					class="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"
				/>

				<!-- Decorative Background Pattern inside card -->
				<div
					class="absolute inset-0 opacity-[0.05] pointer-events-none"
					style="background-image: radial-gradient(#000 3px, transparent 3px); background-size: 32px 32px;"
				/>

				<div class="relative z-10 flex flex-col items-center w-full">
					<div
						class="inline-block mb-6 px-4 py-1.5 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full transform rotate-2"
					>
						<span class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider"
							>Start Building</span
						>
					</div>

					<h2
						class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight max-w-3xl"
					>
						Get your API key in <br class="hidden sm:block" />
						<span class="relative inline-block text-white transform -rotate-1 mt-2">
							30 seconds
							<svg
								class="absolute w-full h-4 -bottom-1 left-0 text-gray-900 z-[-1] opacity-40"
								viewBox="0 0 100 10"
								preserveAspectRatio="none"
							>
								<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
							</svg>
						</span>
						.
					</h2>
					<p
						class="text-lg md:text-2xl text-gray-800 font-medium mb-10 max-w-2xl bg-white/50 backdrop-blur-sm px-6 py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1"
					>
						Sign up, create a template, call the endpoint. Your first rendered image in under 5
						minutes.
					</p>

					<div class="transform transition-transform duration-300 w-full sm:w-auto">
						<SignUpButton
							text="Start Building Free"
							location="mid_cta"
							class="w-full sm:w-auto bg-white text-gray-900 text-lg md:text-xl px-8 py-5 rounded-2xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#1f2937] hover:bg-gray-50 transition-all font-black uppercase tracking-wider flex-shrink-0 inline-flex items-center justify-center gap-3"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
