<script>
	import { analytics } from '$lib/analytics.js';

	function trackLane(laneId, href) {
		analytics.track?.('Landing Lane Clicked', { lane: laneId, href: href });
	}
</script>

<section class="w-full py-20 md:py-32 bg-brand-bg border-b-[3px] border-gray-900 relative overflow-hidden">
	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<div class="mb-16 max-w-3xl">
			<p class="text-sm font-black uppercase tracking-wider text-[#ff6b6b] mb-4">
				One engine, three ways in
			</p>
			<h2 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
				What are you <br class="hidden md:block"/>making?
			</h2>
			<p class="text-lg md:text-xl text-gray-700 font-medium max-w-2xl">
				Invoices for a team, personalized videos for a campaign, or an AI-agent pipeline. It's one engine underneath.
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
			<!-- Documents Block (Spans 7 cols) -->
			<a
				href="/solutions"
				on:click={() => trackLane('documents', '/solutions')}
				class="group block lg:col-span-7 bg-[#FFFDF8] rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden flex flex-col relative"
			>
				<!-- Decorative Graphic Area -->
				<div class="h-64 sm:h-72 bg-[#ffc480] border-b-[3px] border-gray-900 relative overflow-hidden flex items-center justify-center p-6">
					<!-- Abstract Document Stack -->
					<!-- Back document -->
					<div class="absolute w-48 h-64 bg-white border-[3px] border-gray-900 rounded-2xl shadow-brutal-md transform rotate-12 translate-x-16 translate-y-8 group-hover:rotate-6 group-hover:translate-x-12 transition-transform duration-500">
						<div class="p-5 flex flex-col gap-4 h-full">
							<div class="w-1/2 h-4 bg-gray-200 rounded-full"></div>
							<div class="w-full h-3 bg-gray-100 rounded-full"></div>
							<div class="w-5/6 h-3 bg-gray-100 rounded-full"></div>
							<div class="mt-auto flex justify-between items-end">
								<div class="w-10 h-10 rounded-full bg-gray-200"></div>
							</div>
						</div>
					</div>
					<!-- Front document -->
					<div class="absolute w-52 h-72 bg-[#FFFDF8] border-[3px] border-gray-900 rounded-2xl shadow-[6px_6px_0_0_#1f2937] transform -rotate-6 -translate-x-6 -translate-y-4 group-hover:-rotate-3 group-hover:-translate-x-4 transition-transform duration-500 z-10">
						<div class="p-6 flex flex-col gap-4 h-full">
							<div class="w-3/4 h-5 bg-gray-900 rounded-full mb-2"></div>
							<div class="w-full h-3 bg-gray-200 rounded-full"></div>
							<div class="w-full h-3 bg-gray-200 rounded-full"></div>
							<div class="w-2/3 h-3 bg-gray-200 rounded-full"></div>
							<div class="mt-auto flex items-center gap-4">
								<div class="w-10 h-10 rounded-full bg-[#ff6b6b] border-[3px] border-gray-900"></div>
								<div class="w-20 h-3 bg-gray-900 rounded-full"></div>
							</div>
						</div>
					</div>
					<!-- Icon badge in top left -->
					<div class="absolute top-5 left-5 w-14 h-14 bg-white rounded-xl border-[3px] border-gray-900 shadow-brutal-sm flex items-center justify-center z-20">
						<svg class="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
					</div>
				</div>
				<!-- Content Area -->
				<div class="p-8 sm:p-10 lg:p-12 flex-1 flex flex-col">
					<p class="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
						For teams & organizers
					</p>
					<h3 class="text-3xl sm:text-4xl font-black text-gray-900 mb-5 group-hover:text-[#ff6b6b] transition-colors">
						Documents at Scale
					</h3>
					<p class="text-base sm:text-lg text-gray-600 font-medium leading-relaxed mb-10 max-w-md">
						Invoices, certificates, reports, badges, tickets. Upload your list, pick a template, and every person gets theirs by email. No design skills, no Gmail limits.
					</p>
					<div class="mt-auto">
						<span class="inline-flex items-center gap-3 text-sm sm:text-base font-black uppercase tracking-wider text-white bg-[#ff6b6b] px-6 py-4 rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] group-hover:shadow-[2px_2px_0_0_#1f2937] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all">
							See how it works
							<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
						</span>
					</div>
				</div>
			</a>

			<!-- Video Block (Spans 5 cols) -->
			<a
				href="/signup"
				on:click={() => trackLane('video', '/signup')}
				class="group block lg:col-span-5 bg-[#FFFDF8] rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden flex flex-col relative"
			>
				<div class="h-64 sm:h-72 bg-[#4ade80] border-b-[3px] border-gray-900 relative overflow-hidden flex items-center justify-center p-6">
					<!-- Abstract Video Player -->
					<div class="w-full max-w-[280px] aspect-video bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-brutal-lg relative overflow-hidden group-hover:scale-[1.03] transition-transform duration-500 z-10 flex flex-col">
						<!-- Video screen area -->
						<div class="flex-1 bg-gray-900 border-b-[3px] border-gray-900 relative overflow-hidden">
							<div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
							<!-- Play button -->
							<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#ffc480] rounded-full border-[3px] border-gray-900 flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:scale-110 transition-transform">
								<svg class="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
							</div>
						</div>
						<!-- Player controls -->
						<div class="h-12 bg-[#FFFDF8] flex items-center px-4 gap-4">
							<div class="w-3.5 h-3.5 rounded-full bg-[#ff6b6b] border-2 border-gray-900"></div>
							<div class="h-2.5 bg-gray-200 rounded-full flex-1 border border-gray-300 overflow-hidden">
								<div class="h-full bg-[#4ade80] border-r-2 border-gray-900 w-2/5"></div>
							</div>
						</div>
					</div>
					<!-- Decorative floating elements -->
					<div class="absolute right-6 top-10 w-20 h-20 bg-[#ffc480] border-[3px] border-gray-900 rounded-full shadow-brutal-sm transform translate-x-10 -translate-y-6 group-hover:translate-x-6 transition-transform duration-700"></div>
					<div class="absolute left-10 bottom-6 w-12 h-12 bg-white border-[3px] border-gray-900 shadow-brutal-sm transform -rotate-12 group-hover:rotate-12 transition-transform duration-700 z-0"></div>
					
					<!-- Icon badge in top left -->
					<div class="absolute top-5 left-5 w-14 h-14 bg-white rounded-xl border-[3px] border-gray-900 shadow-brutal-sm flex items-center justify-center z-20">
						<svg class="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
					</div>
				</div>
				<div class="p-8 sm:p-10 flex-1 flex flex-col">
					<p class="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
						For builders
					</p>
					<h3 class="text-3xl sm:text-4xl font-black text-gray-900 mb-5 group-hover:text-[#4ade80] transition-colors">
						Personalized Video
					</h3>
					<p class="text-base sm:text-lg text-gray-600 font-medium leading-relaxed mb-10">
						Describe a video or build a template, then render one, or five thousand, personalized from your data. No render farm to babysit.
					</p>
					<div class="mt-auto">
						<span class="inline-flex items-center gap-3 text-sm sm:text-base font-black uppercase tracking-wider text-gray-900 bg-white px-6 py-4 rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] group-hover:shadow-[2px_2px_0_0_#1f2937] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all">
							Start rendering
							<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
						</span>
					</div>
				</div>
			</a>

			<!-- API Block (Spans 12 cols) -->
			<a
				href="https://docs.pictify.io"
				target="_blank"
				rel="noopener noreferrer"
				on:click={() => trackLane('api-agents', 'https://docs.pictify.io')}
				class="group block lg:col-span-12 bg-gray-900 rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[4px_4px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden flex flex-col md:flex-row relative mt-2"
			>
				<!-- Terminal Graphic -->
				<div class="w-full md:w-5/12 lg:w-1/2 bg-gray-800 border-b-[3px] md:border-b-0 md:border-r-[3px] border-gray-900 p-6 md:p-10 lg:p-12 flex flex-col relative overflow-hidden shrink-0">
					<!-- Window controls -->
					<div class="flex items-center gap-2 mb-8">
						<div class="w-4 h-4 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]"></div>
						<div class="w-4 h-4 rounded-full bg-[#ffc480] border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]"></div>
						<div class="w-4 h-4 rounded-full bg-[#4ade80] border-[2px] border-gray-900 shadow-[2px_2px_0_0_#000]"></div>
					</div>
					<!-- Code -->
					<pre class="text-xs sm:text-sm lg:text-base text-[#4ade80] font-mono leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity z-10"><code><span class="text-[#ff6b6b]">const</span> pictify = <span class="text-[#ff6b6b]">new</span> <span class="text-white">PictifyClient</span>(KEY);

<span class="text-[#ff6b6b]">await</span> pictify.generate(&#123;
  template: <span class="text-[#ffc480]">'ticket-v2'</span>,
  data: &#123;
    name: <span class="text-[#ffc480]">'Alex'</span>,
    role: <span class="text-[#ffc480]">'VIP'</span>
  &#125;
&#125;);

<span class="text-gray-400 mt-4 block">// MCP Tool Call</span>
<span class="text-white">></span> pictify_generate_image
<span class="text-white font-bold">✓ Job queued successfully</span></code></pre>
					<!-- Floating graphic elements in terminal -->
					<div class="absolute -right-16 -bottom-16 opacity-[0.03] transform rotate-12 group-hover:rotate-6 group-hover:opacity-[0.05] transition-all duration-700 z-0 pointer-events-none">
						<svg class="w-80 h-80 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
					</div>
					
					<!-- Icon badge in top right (absolute) -->
					<div class="absolute top-6 right-6 w-14 h-14 bg-gray-900 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#000] flex items-center justify-center z-20 hidden sm:flex">
						<svg class="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
					</div>
				</div>

				<div class="p-8 sm:p-10 md:p-12 lg:p-16 flex-1 flex flex-col justify-center bg-gray-900 relative overflow-hidden">
					<!-- Background subtle pattern/icon -->
					<div class="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-gray-800 to-transparent opacity-20 z-0 pointer-events-none"></div>
					
					<div class="relative z-10">
						<div class="w-12 h-12 bg-gray-800 rounded-xl border-[3px] border-gray-900 flex items-center justify-center mb-6 sm:hidden shadow-[4px_4px_0_0_#000]">
							<svg class="w-6 h-6 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
						</div>
						<p class="text-xs font-black uppercase tracking-widest text-[#4ade80] mb-3">
							For pipelines & agents
						</p>
						<h3 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 group-hover:text-[#ffc480] transition-colors leading-tight">
							API, Webhooks <br class="hidden xl:block"/>& MCP
						</h3>
						<p class="text-base sm:text-lg lg:text-xl text-gray-400 font-medium leading-relaxed mb-10 max-w-2xl">
							REST API, SDKs in four languages, signed webhooks, and a first-party MCP server. Every template is callable by your code and your AI agents.
						</p>
						<div class="mt-auto">
							<span class="inline-flex items-center gap-3 text-sm sm:text-base font-black uppercase tracking-wider text-gray-900 bg-[#ffc480] px-6 py-4 rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#000] group-hover:shadow-[2px_2px_0_0_#000] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-all">
								Read the docs
								<svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
							</span>
						</div>
					</div>
				</div>
			</a>
		</div>
	</div>
</section>
