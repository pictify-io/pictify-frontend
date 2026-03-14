<script>
	import SignUpButton from './SignUpButton.svelte';
</script>

<section
	class="w-full py-24 md:py-32 bg-[#FFFDF8] relative overflow-hidden border-y-[3px] border-gray-900"
>
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 32px 32px;"
	></div>
	<div
		class="absolute top-1/2 -right-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -z-10"
	></div>
	<div
		class="absolute top-1/2 -left-64 w-[800px] h-[800px] bg-[#4ade80]/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -z-10"
	></div>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<div class="relative w-full mx-auto">
			
			<!-- Main Bento-style Card -->
			<div
				class="relative bg-[#E0F2FE] rounded-[2rem] border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] p-8 md:p-12 lg:p-16 overflow-hidden group hover:shadow-[16px_16px_0_0_#1f2937] transition-all duration-300 flex flex-col lg:flex-row items-center justify-between gap-12"
			>
				<!-- Subtle texture -->
				<div
					class="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"
				></div>

				<!-- Decorative Background Pattern inside card -->
				<div
					class="absolute inset-0 opacity-[0.05] pointer-events-none"
					style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
				></div>

				<!-- Left Content -->
				<div class="relative z-10 flex flex-col items-start w-full lg:w-1/2">
					<div
						class="inline-block mb-6 px-4 py-1.5 bg-white border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] rounded-full transform rotate-2"
					>
						<span class="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider"
							>Start Building</span
						>
					</div>

					<h2
						class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-8 leading-[1.1] max-w-2xl"
					>
						Get your API key in <br class="hidden sm:block" />
						<span class="relative inline-block text-[#ff6b6b] transform -rotate-1 mt-2">
							30 seconds
							<svg
								class="absolute w-full h-4 sm:h-5 -bottom-1 sm:-bottom-2 left-0 text-gray-900 z-[-1] opacity-20"
								viewBox="0 0 100 10"
								preserveAspectRatio="none"
							>
								<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
							</svg>
						</span>
						.
					</h2>
					<p
						class="text-lg md:text-xl lg:text-2xl text-gray-800 font-medium mb-10 max-w-xl bg-white px-6 py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1"
					>
						Sign up, create a template, call the endpoint. Your first rendered image in under 5
						minutes.
					</p>

					<div class="transform transition-transform duration-300 w-full sm:w-auto z-20">
						<SignUpButton
							text="Start Building Free"
							location="mid_cta"
							class="w-full sm:w-auto bg-[#ff6b6b] text-white text-lg md:text-xl px-8 py-5 rounded-2xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all font-black uppercase tracking-wider flex-shrink-0 inline-flex items-center justify-center gap-3"
						/>
					</div>
				</div>

				<!-- Right Visual -->
				<div class="relative w-full lg:w-1/2 flex justify-center lg:justify-end z-10 hidden md:flex min-h-[400px]">
					<!-- Floating tags -->
					<div
						class="absolute top-4 left-4 z-20 animate-[bounce_3s_ease-in-out_infinite]"
					>
						<div
							class="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-black uppercase tracking-wider text-xs border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-6"
						>
							<svg class="w-4 h-4 text-[#ffc480]" fill="currentColor" viewBox="0 0 24 24">
								<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							Instant Access
						</div>
					</div>
					<div
						class="absolute bottom-10 -right-4 z-20 animate-[bounce_4s_ease-in-out_infinite] delay-150"
					>
						<div
							class="px-4 py-2 bg-[#4ade80] text-gray-900 font-black uppercase tracking-wider text-xs border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform rotate-3"
						>
							No Credit Card
						</div>
					</div>

					<!-- Visual Code Block -->
					<div
						class="w-full max-w-md bg-[#1F2937] rounded-2xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#ffffff] p-6 lg:p-8 transform rotate-2 group-hover:rotate-0 transition-transform duration-500 m-4 relative z-10 flex flex-col my-auto hover:shadow-[16px_16px_0_0_#ffffff] cursor-default"
					>
						<!-- Terminal Header -->
						<div class="flex items-center gap-2 mb-8">
							<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border border-gray-900"></div>
							<div class="w-3.5 h-3.5 rounded-full bg-[#ffc480] border border-gray-900"></div>
							<div class="w-3.5 h-3.5 rounded-full bg-[#4ade80] border border-gray-900"></div>
							<div class="ml-2 text-gray-500 text-xs font-mono font-bold tracking-wider">api_key_gen.sh</div>
						</div>

						<!-- Fake Code -->
						<div class="font-mono text-sm leading-relaxed space-y-5">
							<div class="text-gray-400">
								<span class="text-[#ff6b6b] font-bold mr-2">$</span>pictify auth login
							</div>
							<div class="text-[#4ade80] font-bold flex items-center gap-2">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
								</svg>
								Successfully authenticated
							</div>
							<div class="text-gray-400 mt-4">
								<span class="text-[#ff6b6b] font-bold mr-2">$</span>pictify keys create --name "Prod"
							</div>
							<div class="text-gray-300 bg-black/40 p-4 rounded-lg break-all border border-gray-700 font-bold relative overflow-hidden group-hover:bg-black/60 transition-colors">
								<div class="absolute inset-y-0 left-0 w-1 bg-[#4ade80]"></div>
								<div class="opacity-50 text-[10px] mb-1 uppercase tracking-widest text-[#4ade80]">Live Key</div>
								pk_live_8f92jK9x...<span class="text-gray-600">hidden</span>
							</div>
							<div class="flex items-center gap-3 text-gray-400 text-xs mt-4">
								<svg class="w-4 h-4 text-[#ffc480] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Ready to render images at scale
							</div>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
</section>
