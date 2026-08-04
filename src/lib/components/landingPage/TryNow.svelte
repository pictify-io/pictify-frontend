<script>
	import SignUpButton from './SignUpButton.svelte';
	import { analytics } from '$lib/analytics.js';
</script>

<section class="w-full py-16 md:py-24 bg-brand-bg overflow-hidden relative z-0">

	<div class="max-w-6xl mx-auto px-6 relative z-10">
		<div class="grid lg:grid-cols-12 gap-12 items-center">
			
			<!-- Left Column: CTA Text & Buttons -->
			<div class="lg:col-span-7 flex flex-col items-start text-left relative z-20">
				<div
					class="inline-flex items-center gap-2 px-4 py-1.5 bg-data-green border-[3px] border-gray-900 shadow-brutal-sm rounded-full mb-6 transform -rotate-2"
				>
					<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/></svg
					>
					<span class="text-sm font-black text-gray-900 uppercase tracking-wider">Free Tier Available</span>
				</div>

				<h2 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
					Run Your First Batch <br class="hidden md:block" />
					<span class="relative inline-block text-white bg-brand-danger px-4 py-1.5 mt-2 transform rotate-1 border-[4px] border-gray-900 shadow-[6px_6px_0_0_#1f2937]">
						In Under 5 Minutes
					</span>
				</h2>

				<p class="text-lg md:text-xl text-gray-700 max-w-lg mb-10 font-medium leading-relaxed">
					Sign up, pick a template, add your data. Get pixel-perfect documents rendered and delivered in minutes.
				</p>

				<div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
					<SignUpButton
						class="w-full sm:w-auto px-8 py-4 bg-brand-accent text-gray-900 font-black text-base md:text-lg rounded-2xl border-[4px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all uppercase tracking-wider text-center whitespace-nowrap"
						text="Start Building Free"
						location="cta_section"
					/>

					<a
						href="https://docs.pictify.io"
						target="_blank"
						class="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-black text-base md:text-lg uppercase tracking-wider rounded-2xl border-[4px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all flex items-center justify-center gap-3 group whitespace-nowrap"
						on:click={() =>
							analytics.trackOutboundLink({
								url: 'https://docs.pictify.io',
								link_text: 'View API Docs',
								location: 'cta_section'
							})}
					>
						<span>Read Docs</span>
						<svg
							class="w-5 h-5 group-hover:translate-x-1 transition-transform"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M14 5l7 7m0 0l-7 7m7-7H3"
							/></svg
						>
					</a>
				</div>
			</div>

			<!-- Right Column: Visual Graphic -->
			<div class="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center items-center">
				<div class="relative w-full aspect-square max-w-[320px] lg:max-w-[360px] mx-auto scale-90 sm:scale-100">
					<!-- Back layer circle -->
					<div class="absolute inset-2 bg-brand-danger rounded-full border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] transform translate-x-3 translate-y-3"></div>
					
					<!-- Middle layer squircle -->
					<div class="absolute inset-2 bg-[#c084fc] rounded-[2.5rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] transform -rotate-3 flex items-center justify-center overflow-hidden">
						<!-- Background pattern -->
						<div class="absolute inset-0 opacity-[0.15] bg-[radial-gradient(#000_2px,transparent_2px)] bg-[size:16px_16px]"></div>
						
						<!-- Inner Timer Card -->
						<div class="relative z-10 bg-white px-8 py-8 rounded-2xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] transform rotate-3 flex flex-col items-center group">
							<div class="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-brutal-sm group-hover:scale-110 transition-transform duration-300">
								<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
							</div>
							<div class="text-5xl font-black text-gray-900 font-mono tracking-tighter">4:59</div>
							<div class="text-[11px] font-black text-[#ff6b6b] uppercase tracking-widest mt-3 border-t-[3px] border-gray-900 pt-3 w-full text-center">Time to first batch</div>
						</div>
					</div>
					
					<!-- Floating element 1 -->
					<div class="absolute -right-2 top-10 bg-white px-3 py-2 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform rotate-6 flex items-center gap-2 hover:-translate-y-1 transition-transform cursor-default z-20">
						<div class="w-2.5 h-2.5 bg-data-green rounded-full border-[2px] border-gray-900 animate-[pulse_2s_ease-in-out_infinite]"></div>
						<span class="text-[11px] font-black uppercase tracking-widest text-gray-900">API Ready</span>
					</div>

					<!-- Floating element 2 -->
					<div class="absolute -left-2 bottom-12 bg-brand-accent px-3 py-2 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-6 flex items-center gap-2 hover:-translate-y-1 transition-transform cursor-default z-20">
						<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<span class="text-[11px] font-black uppercase tracking-widest text-gray-900">50 Free Credits</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 3 Trust / Feature Blocks -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-20">
			<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-sm p-6 flex flex-col items-start gap-4 hover:-translate-y-1 hover:shadow-brutal-md transition-all cursor-default">
				<div class="w-10 h-10 rounded-xl bg-data-green border-[2px] border-gray-900 shadow-brutal-sm flex items-center justify-center shrink-0">
					<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
				</div>
				<div>
					<h4 class="text-base font-black text-gray-900 mb-1">Instant Access</h4>
					<p class="text-sm font-bold text-gray-600">Get your API key immediately upon signup. Start integrating in seconds.</p>
				</div>
			</div>
			<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-sm p-6 flex flex-col items-start gap-4 hover:-translate-y-1 hover:shadow-brutal-md transition-all cursor-default">
				<div class="w-10 h-10 rounded-xl bg-brand-accent border-[2px] border-gray-900 shadow-brutal-sm flex items-center justify-center shrink-0">
					<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				</div>
				<div>
					<h4 class="text-base font-black text-gray-900 mb-1">50 Free Credits</h4>
					<p class="text-sm font-bold text-gray-600">No credit card required. Test the API for free and see the pixel-perfect results.</p>
				</div>
			</div>
			<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-sm p-6 flex flex-col items-start gap-4 hover:-translate-y-1 hover:shadow-brutal-md transition-all cursor-default">
				<div class="w-10 h-10 rounded-xl bg-[#c084fc] border-[2px] border-gray-900 shadow-brutal-sm flex items-center justify-center shrink-0">
					<svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
				</div>
				<div>
					<h4 class="text-base font-black text-gray-900 mb-1">Secure Infra</h4>
					<p class="text-sm font-bold text-gray-600">Enterprise-ready security and isolation. Your data is processed safely.</p>
				</div>
			</div>
		</div>
	</div>
</section>
