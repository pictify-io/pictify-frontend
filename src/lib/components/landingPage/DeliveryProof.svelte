<script>
	import SignUpButton from './SignUpButton.svelte';
</script>

<section class="w-full py-24 md:py-32 bg-brand-bg border-b-[3px] border-gray-900 relative overflow-hidden">
    <!-- Graphic background dots -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	></div>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<div class="text-center mb-20 relative max-w-4xl mx-auto">
			<div
				class="inline-flex items-center gap-2 px-5 py-2 bg-brand-danger border-[3px] border-gray-900 shadow-brutal-sm rounded-full mb-6 transform -rotate-2"
			>
				<span class="text-sm font-black text-white uppercase tracking-wider">Why "delivered" is in the headline</span>
			</div>
			<h2 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
				Everything Else Stops<br class="hidden md:block" />
				<span class="relative inline-block text-brand-danger transform -rotate-1 mt-2">
					At the Send
					<svg
						class="absolute w-full h-4 sm:h-5 -bottom-2 left-0 text-gray-900 z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
			</h2>
			<p class="text-lg md:text-xl text-gray-700 font-medium">
				Generating 300 personalized documents was never the hard part. Getting all 300 into
				The hard part is getting them into 300 inboxes and knowing they arrived.
			</p>
		</div>

		<div class="flex flex-col lg:flex-row gap-12 lg:gap-8 items-center relative max-w-6xl mx-auto">
			
			<!-- VS badge on the seam -->
			<div
				class="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#ffc480] rounded-full border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] items-center justify-center z-30 rotate-12"
			>
				<span class="text-2xl font-black text-gray-900">VS</span>
			</div>

			<!-- THE OLD WAY -->
            <div class="w-full lg:w-1/2 bg-[#ff6b6b] rounded-[2.5rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 md:p-12 relative overflow-hidden group">
                <!-- Abstract pipeline breaking -->
                <svg class="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 text-gray-900 opacity-20 pointer-events-none" fill="none" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <path stroke="currentColor" stroke-width="6" stroke-dasharray="12 12" d="M0 50 Q 150 50 200 80 T 400 50" />
                    <!-- broken line mark -->
                    <line x1="180" y1="20" x2="220" y2="100" stroke="currentColor" stroke-width="12" />
                </svg>

                <div class="relative z-10 mb-10">
                    <p class="text-xs font-black uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-2">
                        <span class="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center border-2 border-transparent">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </span>
                        The Old Way
                    </p>
                    <h3 class="text-3xl sm:text-4xl font-black text-white leading-tight">
                        A black hole of errors and limits.
                    </h3>
                </div>

                <!-- Floating chaotic elements -->
                <div class="relative h-[22rem] w-full mt-4">
                    <!-- Element 1: Exception -->
                    <div class="absolute top-0 right-0 w-64 md:w-72 bg-gray-900 rounded-xl border-[3px] border-gray-900 p-4 shadow-[6px_6px_0_0_#000] transform rotate-6 group-hover:rotate-12 group-hover:translate-x-2 transition-transform duration-500 z-10">
                        <div class="flex gap-2 mb-3">
                            <div class="w-3 h-3 rounded-full bg-[#ff6b6b]"></div>
                            <div class="w-3 h-3 rounded-full bg-[#ffc480]"></div>
                            <div class="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                        </div>
                        <p class="font-mono text-xs md:text-sm text-[#ff6b6b] leading-relaxed">
                            > Exception: Exceeded max execution time (6 min)
                        </p>
                    </div>

                    <!-- Element 2: Word dialog -->
                    <div class="absolute top-24 -left-2 w-64 md:w-72 bg-white rounded-xl border-[3px] border-gray-900 p-5 shadow-[6px_6px_0_0_#1f2937] transform -rotate-3 group-hover:-rotate-6 group-hover:-translate-x-2 transition-transform duration-500 z-20">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 rounded-xl bg-gray-100 border-[3px] border-gray-900 flex items-center justify-center shrink-0 shadow-brutal-sm">
                                <span class="text-2xl font-black text-blue-600">W</span>
                            </div>
                            <div>
                                <p class="text-sm font-black text-gray-900 mb-2 leading-snug">Mail merge can't include attachments.</p>
                                <button class="px-5 py-2 bg-gray-100 border-[2px] border-gray-900 rounded-lg text-xs font-black uppercase shadow-[2px_2px_0_0_#1f2937]">OK</button>
                            </div>
                        </div>
                    </div>

                    <!-- Element 3: Canva Toast -->
                    <div class="absolute bottom-32 right-4 w-60 bg-white rounded-xl border-[3px] border-gray-900 p-3 shadow-[6px_6px_0_0_#1f2937] transform rotate-3 group-hover:-rotate-2 group-hover:-translate-y-2 transition-transform duration-500 z-30">
                        <div class="flex items-center gap-3">
                            <span class="w-10 h-10 bg-[#4ade80] rounded-lg border-[3px] border-gray-900 flex items-center justify-center shrink-0">
                                <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </span>
                            <p class="text-xs font-bold text-gray-900 leading-tight">certificates-240-pages.pdf downloaded</p>
                        </div>
                    </div>

                    <!-- Element 4: Gmail limit -->
                    <div class="absolute bottom-4 left-4 right-8 md:right-12 bg-white rounded-xl border-[3px] border-gray-900 p-5 shadow-[6px_6px_0_0_#1f2937] transform -rotate-2 group-hover:-rotate-4 group-hover:translate-y-2 transition-transform duration-500 z-40">
                        <div class="flex gap-4 items-center">
                            <div class="w-12 h-12 rounded-full bg-[#ff6b6b] border-[3px] border-gray-900 flex items-center justify-center shrink-0 shadow-brutal-sm">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M12 3l9.5 16.5H2.5L12 3z" /></svg>
                            </div>
                            <p class="text-sm font-black text-gray-900 leading-snug">You have reached a limit for sending mail. Try again in 24 hours.</p>
                        </div>
                    </div>
                </div>
            </div>

			<!-- WITH PICTIFY -->
            <div class="w-full lg:w-1/2 bg-[#4ade80] rounded-[2.5rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] p-8 md:p-12 relative overflow-hidden group mt-4 lg:mt-0">
                <!-- Abstract successful pipeline -->
                <svg class="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 text-gray-900 opacity-10 pointer-events-none" fill="none" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <path stroke="currentColor" stroke-width="12" d="M0 50 L 400 50" />
                    <!-- Checkmarks along the line -->
                    <circle cx="100" cy="50" r="14" fill="currentColor" />
                    <circle cx="200" cy="50" r="14" fill="currentColor" />
                    <circle cx="300" cy="50" r="14" fill="currentColor" />
                </svg>

                <div class="relative z-10 mb-10">
                    <p class="text-xs font-black uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-2">
                        <span class="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center border-2 border-transparent">
                            <svg class="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>
                        </span>
                        With Pictify
                    </p>
                    <h3 class="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                        Every row verified.<br/>Zero limits.
                    </h3>
                </div>

                <!-- Neatly stacked success receipts -->
                <div class="relative h-[22rem] w-full flex flex-col mt-4">
                    <!-- Main Dashboard Window Mockup -->
                    <div class="absolute inset-0 bg-[#FFFDF8] rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] flex flex-col overflow-hidden group-hover:scale-[1.02] group-hover:-translate-y-2 transition-transform duration-500 z-10">
                        <div class="bg-white border-b-[3px] border-gray-900 px-6 py-4 flex items-center justify-between shrink-0">
                            <p class="text-xs font-black uppercase tracking-widest text-gray-900">Run summary</p>
                            <span class="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border-[3px] border-gray-900 bg-[#4ade80] text-gray-900 shadow-[2px_2px_0_0_#1f2937]">240/240 Sent</span>
                        </div>
                        <div class="flex-1 flex flex-col p-5 gap-4 bg-gray-50 overflow-hidden">
                            <!-- Row 1 -->
                            <div class="bg-white border-[3px] border-gray-900 rounded-xl p-4 flex items-center justify-between shadow-brutal-sm hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1f2937] transition-all">
                                <div class="flex items-center gap-4">
                                    <span class="text-base font-black text-gray-400 w-8">#1</span>
                                    <span class="text-base font-bold text-gray-900">Aisha Kamara</span>
                                </div>
                                <span class="text-xs font-black uppercase tracking-wider text-[#4ade80] flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border-2 border-[#4ade80]/30">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>
                                    Delivered
                                </span>
                            </div>
                            <!-- Row 2 -->
                            <div class="bg-white border-[3px] border-gray-900 rounded-xl p-4 flex items-center justify-between shadow-brutal-sm hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1f2937] transition-all">
                                <div class="flex items-center gap-4">
                                    <span class="text-base font-black text-gray-400 w-8">#2</span>
                                    <span class="text-base font-bold text-gray-900">Tom Okafor</span>
                                </div>
                                <span class="text-xs font-black uppercase tracking-wider text-[#4ade80] flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border-2 border-[#4ade80]/30">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" /></svg>
                                    Delivered
                                </span>
                            </div>
                            <!-- Row 3 (Bounced) -->
                            <div class="bg-[#FFFDF8] border-[3px] border-gray-900 rounded-xl p-4 flex items-center justify-between shadow-brutal-sm group-hover:bg-[#ffc480]/20 transition-colors">
                                <div class="flex items-center gap-4">
                                    <span class="text-base font-black text-gray-400 w-8">#3</span>
                                    <span class="text-base font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">Mei-Ling Chen</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span class="text-xs font-black uppercase tracking-wider text-[#ff6b6b] bg-red-50 px-3 py-1.5 rounded-lg border-2 border-[#ff6b6b]/30">Bounced</span>
                                    <button class="px-4 py-2 bg-[#ffc480] border-[3px] border-gray-900 rounded-lg text-[10px] font-black uppercase shadow-[3px_3px_0_0_#1f2937] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">Re-send</button>
                                </div>
                            </div>
                            <!-- More -->
                            <div class="text-center mt-auto mb-2">
                                <span class="text-xs font-black text-gray-400 tracking-widest uppercase">⋯ 237 more rows</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

		</div>

		<div class="flex justify-center mt-20">
			<SignUpButton
				text="Run Your First Batch Free →"
				location="delivery_proof"
				href="/signup"
				class="bg-[#ff6b6b] text-white text-lg md:text-xl px-10 py-5 rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:translate-y-2 hover:translate-x-2 hover:shadow-[2px_2px_0_0_#1f2937] transition-all font-black uppercase tracking-wider"
			/>
		</div>
	</div>
</section>
