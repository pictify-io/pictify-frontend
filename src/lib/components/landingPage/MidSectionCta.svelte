<script>
	import SignUpButton from './SignUpButton.svelte';
</script>

<div class="w-full bg-[#FFFDF8] py-16 md:py-24">
	<div class="max-w-4xl mx-auto px-6 text-center">
		<!-- Vibrant Yellow Card -->
		<div class="relative bg-[#ffc480] rounded-3xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#000] p-8 md:p-12 overflow-hidden group hover:translate-y-[-2px] hover:shadow-[10px_10px_0_0_#000] transition-all duration-300">
			
			<!-- Decorative Background Pattern -->
			<div class="absolute inset-0 opacity-10 pointer-events-none" 
				style="background-image: radial-gradient(#000 2px, transparent 2px); background-size: 24px 24px;">
			</div>

			<!-- Floating Icon Decoration -->
			<div class="absolute top-4 right-4 md:top-8 md:right-8 transform rotate-12 opacity-80 pointer-events-none animate-pulse">
				<svg class="w-12 h-12 md:w-16 md:h-16 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
				</svg>
			</div>

			<div class="relative z-10 flex flex-col items-center">
				<h2 class="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
					Ready to automate your images?
				</h2>
				<p class="text-lg md:text-xl text-gray-900/80 font-bold mb-8 max-w-xl">
					Stop wasting time on manual screenshots. Get your API key and start generating in 30 seconds.
				</p>

				<SignUpButton
					text="Generate Your First Image"
					class="bg-white text-gray-900 text-lg px-8 py-4 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000] hover:bg-gray-50 transition-all font-black uppercase tracking-wider flex-shrink-0"
				/>
			</div>
		</div>
	</div>
</div>
