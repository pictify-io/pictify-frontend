<script>
	import { fade, fly, scale } from 'svelte/transition';

	// State for the delivery (Block 3) interactions — spreadsheet rows whose
	// certificate renders are REAL Pictify outputs (demo template 6E3AHG9PYB)
	let activeRecipient = 0;
	const recipients = [
		{
			row: 1,
			name: 'Ada Lovelace',
			email: 'ada@acme.com',
			course: 'Advanced Analytics Bootcamp',
			cert: 'https://media.pictify.io/template-renders/cj944exs-1785797479873.png',
			color: 'bg-brand-accent'
		},
		{
			row: 2,
			name: 'Tom Okafor',
			email: 'tom@northwind.io',
			course: 'Cloud Architecture 101',
			cert: 'https://media.pictify.io/template-renders/dqk5p2xy-1785800750071.png',
			color: 'bg-data-violet'
		},
		{
			row: 3,
			name: 'Mei-Ling Chen',
			email: 'mei@brightpath.co',
			course: 'Leadership Essentials',
			cert: 'https://media.pictify.io/template-renders/6atuz9pd-1785800751255.png',
			color: 'bg-brand-danger'
		}
	];

	// State for the video (Block 2) interactions
	let activeVideoVariant = 0;
	const videoVariants = [
		{ name: 'Ada', full: 'Ada Lovelace', course: 'Advanced Analytics Bootcamp' },
		{ name: 'Tom', full: 'Tom Okafor', course: 'Cloud Architecture 101' },
		{ name: 'Mei-Ling', full: 'Mei-Ling Chen', course: 'Leadership Essentials' }
	];

	const socialVariations = [
		{
			title: '10 Tips for Better SEO',
			tag: 'Marketing',
			readTime: '5 MIN',
			author: { name: 'Sarah J.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
			bgImg:
				'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop'
		},
		{
			title: 'React vs Vue in 2026',
			tag: 'Dev',
			readTime: '8 MIN',
			author: { name: 'Mike R.', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
			bgImg:
				'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop'
		},
		{
			title: 'Q3 Growth Report',
			tag: 'Business',
			readTime: '12 MIN',
			author: { name: 'Team', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team' },
			bgImg:
				'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop'
		}
	];

</script>

<section
	class="w-full py-16 md:py-20 2xl:py-32 bg-brand-bg relative overflow-hidden border-y-[3px] border-gray-900"
>
	<!-- Background Pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none"
		style="background-image: linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px); background-size: 40px 40px;"
	/>
	<div
		class="absolute top-1/4 -right-64 w-[800px] h-[800px] bg-data-green/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>
	<div
		class="absolute bottom-1/4 -left-64 w-[800px] h-[800px] bg-brand-accent/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Header -->
		<div class="text-center mb-20 relative max-w-4xl mx-auto">
			<div
				class="inline-flex items-center gap-2 px-5 py-2 bg-brand-accent border-[3px] border-gray-900 shadow-brutal-sm rounded-full mb-6 transform -rotate-2"
			>
				<span class="text-sm font-black text-gray-900 uppercase tracking-wider">Versatility</span>
			</div>
			<h2 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
				One Template. <br class="hidden md:block" />
				<span class="relative inline-block text-brand-danger transform -rotate-1 mt-2">
					Million Variations
					<svg
						class="absolute w-full h-4 sm:h-5 -bottom-2 left-0 text-gray-900 z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>.
			</h2>
			<p class="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
				Invoices, certificates, product cards, reports, social banners, personalized videos — or
				bring your own HTML via the API. One template, one data source, done.
			</p>
		</div>

		<!-- Bento Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-8">
			<!-- Block 1: Social Automation (Spans 7 cols) -->
			<div
				class="md:col-span-2 xl:col-span-7 bg-[#7dd3fc] rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl hover:shadow-brutal-3xl transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]"
			>
				<!-- Subtle texture -->
				<div
					class="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"
				/>

				<div
					class="p-6 md:p-8 relative z-10 flex items-center justify-between border-b-[3px] border-gray-900 bg-[#7dd3fc]/50"
				>
					<div class="flex items-center gap-4">
						<div
							class="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-brutal-lg group-hover:-rotate-3 transition-transform"
						>
							<svg
								class="w-6 h-6 md:w-7 md:h-7 text-black"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
								/></svg
							>
						</div>
						<h3 class="text-2xl md:text-3xl font-black text-gray-900 leading-tight drop-shadow-sm">
							Content & Social Cards
						</h3>
					</div>
				</div>

				<!-- Split Layout: Blueprint vs Outputs -->
				<div class="flex-1 flex flex-col md:flex-row relative z-10 min-h-0">
					<!-- Left: The Blueprint (Wireframe) -->
					<div
						class="flex-1 flex items-center justify-center p-6 md:p-8 border-b-[3px] md:border-b-0 md:border-r-[3px] border-gray-900 border-dashed relative"
					>
						<!-- Connection Arrow to Outputs -->
						<div
							class="hidden md:flex absolute right-[-24px] top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-900 rounded-full z-20 items-center justify-center border-[3px] border-[#7dd3fc]"
						>
							<svg
								class="w-6 h-6 text-[#7dd3fc]"
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
						</div>

						<div
							class="w-full max-w-[280px] aspect-[1200/630] rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_rgba(0,0,0,0.15)] bg-white p-3 md:p-4 flex flex-col justify-end relative overflow-hidden group-hover:-translate-y-1 transition-transform duration-500"
						>
							<!-- Blueprint background lines -->
							<div
								class="absolute inset-0 opacity-[0.1] bg-[linear-gradient(#000_2px,transparent_2px),linear-gradient(90deg,#000_2px,transparent_2px)] bg-[size:20px_20px]"
							/>

							<!-- Wireframe Elements -->
							<div
								class="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
							>
								<svg
									class="w-12 h-12 text-gray-900/10"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/></svg
								>
							</div>

							<div class="relative z-10 w-full space-y-2 md:space-y-3">
								<div
									class="px-2 py-1 bg-gray-200 border-[2px] border-gray-900 w-max rotate-[-2deg] flex items-center gap-1.5 shadow-sm"
								>
									<div class="w-2 h-2 rounded-full bg-gray-900 animate-pulse" />
									<span
										class="text-gray-900 text-[8px] md:text-[9px] font-black uppercase tracking-wider block leading-none"
										>Tag</span
									>
								</div>

								<div
									class="px-3 py-1.5 md:py-2 bg-gray-200 border-[2px] border-gray-900 w-3/4 rotate-[1deg] flex items-center gap-1.5 shadow-sm"
								>
									<div class="w-2 h-2 rounded-full bg-gray-900 animate-pulse" />
									<span
										class="text-gray-900 text-[10px] md:text-xs font-black uppercase tracking-wider block leading-none"
										>Main Title</span
									>
								</div>

								<div class="flex items-center gap-2 mt-2">
									<div
										class="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-200 border-[2px] border-gray-900 flex items-center justify-center rotate-[-5deg] shadow-sm"
									>
										<div class="w-1.5 h-1.5 rounded-full bg-gray-900 animate-pulse" />
									</div>
									<div
										class="px-2 py-1 bg-gray-200 border-[2px] border-gray-900 rotate-[2deg] flex items-center gap-1 shadow-sm"
									>
										<div class="w-1.5 h-1.5 rounded-full bg-gray-900 animate-pulse" />
										<span
											class="text-gray-900 text-[8px] font-black uppercase tracking-wider block leading-none"
											>Name</span
										>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Right: The Outputs (Cluster) -->
					<!-- Removed overflow-hidden from this container to prevent severe clipping -->
					<div class="flex-1 flex items-center justify-center p-6 md:p-8 bg-black/5 relative">
						<!-- Making the central cluster container slightly smaller to guarantee fit -->
						<div class="relative w-full max-w-[240px] aspect-[1200/630]">
							{#each socialVariations as variant, i}
								<!-- Compact overlapping cluster look within tighter bounds -->
								{@const rotate = i === 0 ? '-rotate-6' : i === 1 ? 'rotate-2' : 'rotate-12'}
								{@const zIndex = i === 0 ? 'z-[1]' : i === 1 ? 'z-[2]' : 'z-[3]'}
								{@const translateX =
									i === 0
										? '-translate-x-3 md:-translate-x-4 translate-y-3 md:translate-y-4'
										: i === 1
										? 'translate-x-0 -translate-y-2'
										: 'translate-x-3 md:translate-x-4 translate-y-4 md:translate-y-6'}

								<div
									class="absolute w-full h-full left-0 top-0 rounded-xl border-[3px] border-gray-900 shadow-brutal-lg overflow-hidden flex flex-col justify-end p-2.5 md:p-3 bg-black transition-all duration-300 hover:scale-[1.05] group-hover:shadow-brutal-2xl {rotate} {zIndex} {translateX} hover:!z-20 origin-bottom"
								>
									<div class="absolute inset-0 pointer-events-none">
										<img
											loading="lazy"
											src={variant.bgImg}
											alt="abstract"
											class="w-full h-full object-cover filter grayscale contrast-125 opacity-70"
										/>
										<div class="absolute inset-0 bg-gray-900/80" />
									</div>

									<div class="relative z-10 w-full pointer-events-none">
										<div class="flex items-center gap-1.5 mb-1.5">
											<span
												class="px-1.5 py-0.5 bg-[#7dd3fc] border-[1.5px] border-white text-gray-900 text-[7px] md:text-[8px] font-black uppercase tracking-wider shadow-[1px_1px_0_0_white]"
											>
												{variant.tag}
											</span>
										</div>
										<h2
											class="text-xs md:text-sm font-black text-white leading-tight mb-1.5 drop-shadow-md line-clamp-2"
										>
											{variant.title}
										</h2>
										<div class="flex items-center gap-1.5">
											<img
												loading="lazy"
												src={variant.author.img}
												alt="author"
												class="w-4 h-4 md:w-5 md:h-5 bg-white border border-white shadow-[1px_1px_0_0_rgba(255,255,255,0.5)] rounded-none"
											/>
											<div
												class="text-white/90 text-[7px] md:text-[8px] font-black uppercase tracking-wider"
											>
												By {variant.author.name}
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Block 2: Personalized Video (Spans 5 cols) -->
			<div class="xl:col-span-5 bg-[#ffc480] rounded-[2.5rem] border-[3px] border-gray-900 shadow-[10px_10px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]">
				<div class="p-8 md:p-10 flex flex-col relative z-10 border-b-[3px] border-gray-900 bg-white/50">
					<div class="flex items-center gap-4">
						<div class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-6 transition-transform">
							<svg class="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
						</div>
						<h3 class="text-3xl font-black text-gray-900 leading-tight">Personalized Video</h3>
					</div>
				</div>

				<div class="flex-1 flex flex-col justify-center p-6 md:p-10 z-10 gap-6 relative">
					<!-- Player Mockup -->
					<div class="w-full bg-gray-900 rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden relative aspect-video group-hover:-translate-y-2 transition-transform duration-500 z-10 flex flex-col">
						<!-- Screen area -->
						<div class="flex-1 relative overflow-hidden bg-black">
							<div class="absolute inset-0 bg-gradient-to-tr from-[#ff6b6b]/40 via-purple-500/20 to-transparent"></div>
							
							<!-- Play button -->
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="w-16 h-16 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
									<svg class="w-6 h-6 text-gray-900 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
								</div>
							</div>

							<!-- Lower third dynamic content -->
							{#key activeVideoVariant}
							<div class="absolute left-4 bottom-4" in:fly={{ y: 20, duration: 400, opacity: 0 }}>
								<div class="bg-white border-[3px] border-gray-900 rounded-xl px-4 py-2 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1 group-hover:rotate-0 transition-transform">
									<p class="text-[13px] md:text-[14px] font-black text-gray-900 leading-tight">Congrats, {videoVariants[activeVideoVariant].full}! 🎉</p>
									<p class="text-[10px] md:text-[11px] font-bold text-[#ff6b6b] uppercase tracking-wider mt-0.5">{videoVariants[activeVideoVariant].course}</p>
								</div>
							</div>
							{/key}
						</div>
						<!-- Player controls bar -->
						<div class="h-12 bg-white border-t-[3px] border-gray-900 flex items-center px-4 gap-4">
							<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900 hidden sm:block"></div>
							<div class="flex-1 h-2 bg-gray-200 rounded-full border-[1.5px] border-gray-900 overflow-hidden">
								<div class="h-full w-1/3 bg-[#ffc480] border-r-[2px] border-gray-900"></div>
							</div>
							<span class="text-[10px] font-black text-gray-900 font-mono">0:08 / 0:24</span>
						</div>
					</div>

					<!-- Variant Switcher -->
					<div class="bg-white rounded-2xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-3 flex items-center gap-2 flex-wrap z-10 justify-center">
						<span class="text-[10px] font-black uppercase text-gray-500 tracking-widest mr-2 hidden sm:block">Preview Variant:</span>
						{#each videoVariants as variant, i}
							<button
								class="px-4 py-2 rounded-xl border-[2px] border-gray-900 text-[11px] font-black uppercase tracking-wider transition-all
									{activeVideoVariant === i
									? 'bg-[#ff6b6b] text-white shadow-[2px_2px_0_0_#1f2937] translate-y-[2px]'
									: 'bg-gray-100 text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#1f2937]'}"
								on:click={() => (activeVideoVariant = i)}
							>
								{variant.name}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Block 3: Email Personalization (Spans 12 cols, Split) -->
			<div class="xl:col-span-12 bg-[#FFFDF8] rounded-[2.5rem] border-[3px] border-gray-900 shadow-[10px_10px_0_0_#1f2937] hover:shadow-[6px_6px_0_0_#1f2937] hover:translate-x-1 hover:translate-y-1 transition-all duration-300 relative overflow-hidden group">
				<div class="grid lg:grid-cols-12 h-full">
					<!-- Interactive Selector (Left Side, 5 columns) -->
					<div class="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-center relative z-20 bg-white border-b-[3px] lg:border-b-0 lg:border-r-[3px] border-gray-900 order-1">
						<div class="flex items-center gap-4 mb-8">
							<div class="w-14 h-14 bg-[#4ade80] border-[3px] border-gray-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] transform -rotate-3 transition-transform group-hover:rotate-0">
								<svg class="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"/></svg>
							</div>
							<h3 class="text-3xl md:text-4xl font-black text-gray-900 leading-tight">Delivered by Email</h3>
						</div>

						<p class="text-lg text-gray-700 font-medium mb-10 max-w-sm">
							Every CSV row or webhook event renders a personalized document and lands in each recipient's inbox automatically.
						</p>

						<div class="flex flex-col gap-4">
							<div class="flex items-center gap-3 mb-2">
								<span class="w-8 h-8 rounded-full bg-[#ffc480] border-[2px] border-gray-900 flex items-center justify-center">
									<svg class="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
								</span>
								<span class="text-xs font-black uppercase text-gray-900 tracking-widest">Select a row to preview</span>
							</div>
							{#each recipients as recipient, i}
								<button
									class="group/btn flex items-center gap-4 px-5 py-4 rounded-2xl border-[3px] border-gray-900 font-bold transition-all text-left w-full max-w-md relative
										{activeRecipient === i
										? 'bg-gray-900 text-white shadow-[4px_4px_0_0_#4ade80] translate-x-2'
										: 'bg-gray-50 text-gray-900 shadow-[6px_6px_0_0_#1f2937] hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#1f2937]'}"
									on:click={() => (activeRecipient = i)}
								>
									<span class="text-sm font-black {activeRecipient === i ? 'text-[#4ade80]' : 'text-gray-400'}">#{recipient.row}</span>
									<div class="flex-1 min-w-0">
										<div class="text-base font-black leading-tight truncate">{recipient.name}</div>
										<div class="text-xs font-bold {activeRecipient === i ? 'text-gray-300' : 'text-gray-500'} mt-1 truncate">
											{recipient.email}
										</div>
									</div>
									{#if activeRecipient === i}
										<span class="absolute -right-3 -top-3 px-3 py-1 rounded-xl border-[3px] border-gray-900 bg-[#4ade80] text-gray-900 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_#fff] rotate-6">Delivered</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- Visual Canvas (Right Side, 7 columns) -->
					<div class="lg:col-span-7 p-6 md:p-12 lg:p-16 flex flex-col justify-center items-center relative bg-[#4ade80] min-h-[500px] order-2 pt-16 md:pt-20 lg:pt-20">
						<!-- Background pattern -->
						<div class="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none"></div>

						<!-- The pipeline arrow graphic connecting the two sides -->
						<div class="hidden lg:block absolute -left-6 top-1/2 -translate-y-1/2 z-30">
							<div class="w-12 h-12 bg-white rounded-full border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] flex items-center justify-center">
								<svg class="w-6 h-6 text-gray-900 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
							</div>
						</div>

						<div class="relative z-10 w-full max-w-[420px] flex flex-col">
							<!-- Row payload JSON ticket -->
							<div class="self-start bg-[#ffc480] rounded-xl border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] p-4 w-[260px] md:w-[280px] transform -rotate-3 group-hover:-rotate-6 transition-transform duration-500 relative z-20 -mb-8 -ml-4 md:-ml-8">
								<div class="text-[10px] md:text-[11px] font-black text-gray-900 mb-3 flex items-center justify-between uppercase tracking-widest border-b-[3px] border-gray-900 pb-2">
									<span class="flex items-center gap-2">
										<div class="w-3 h-3 bg-white rounded-full border-[2px] border-gray-900 animate-pulse"></div>
										Data Payload
									</span>
									<span>Row {recipients[activeRecipient].row}</span>
								</div>
								{#key activeRecipient}
									<pre class="font-mono text-[10px] md:text-[11px] text-gray-900 font-bold overflow-hidden whitespace-pre-wrap" in:fade={{ duration: 200 }}>
{`{
  "name": "${recipients[activeRecipient].name}",
  "course": "${recipients[activeRecipient].course.length > 16 ? recipients[activeRecipient].course.slice(0, 15) + '…' : recipients[activeRecipient].course}",
  "email": "${recipients[activeRecipient].email}"
}`}
									</pre>
								{/key}
							</div>

							<!-- Output: the recipient's inbox -->
							<div class="w-full bg-white rounded-2xl border-[3px] border-gray-900 shadow-[12px_12px_0_0_#1f2937] overflow-hidden transition-transform duration-500 hover:-translate-y-2 relative z-10">
								{#key activeRecipient}
								<div in:fade={{ duration: 300, delay: 100 }}>
									<!-- inbox chrome -->
									<div class="h-10 bg-gray-100 border-b-[3px] border-gray-900 flex items-center px-4 justify-between">
										<div class="flex flex-1 gap-2 h-full items-center">
											<div class="w-3 h-3 rounded-full bg-[#ff6b6b] border-[2px] border-gray-900"></div>
											<div class="w-3 h-3 rounded-full bg-[#ffc480] border-[2px] border-gray-900"></div>
											<div class="w-3 h-3 rounded-full bg-[#4ade80] border-[2px] border-gray-900"></div>
										</div>
										<div class="text-[10px] font-black font-mono uppercase tracking-widest text-gray-500 truncate max-w-[200px]">
											inbox — {recipients[activeRecipient].email}
										</div>
									</div>

									<!-- email header -->
									<div class="px-6 pt-5 pb-4 border-b-[3px] border-gray-100">
										<div class="flex items-center justify-between gap-2 mb-2">
											<p class="text-[12px] font-black text-gray-900 uppercase tracking-widest truncate">
												Acme Academy <span class="text-gray-400">via Pictify</span>
											</p>
										</div>
										<p class="text-lg font-black text-gray-900 leading-tight">
											Your certificate is ready, {recipients[activeRecipient].name.split(' ')[0]} 🎓
										</p>
									</div>

									<!-- email body -->
									<div class="px-6 py-5 bg-[#FFFDF8]">
										<p class="text-[13px] font-bold text-gray-700 mb-4 leading-relaxed">
											Congratulations on completing <span class="text-gray-900 bg-[#ffc480]/30 px-1 rounded">{recipients[activeRecipient].course}</span>! Your personalized certificate is attached below.
										</p>
										<div class="relative group/img">
											<img
												loading="lazy"
												src={recipients[activeRecipient].cert}
												alt="Certificate"
												class="w-full rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] bg-white group-hover/img:-translate-y-1 transition-transform duration-300"
											/>
										</div>
										<div class="mt-6 flex justify-center">
											<button class="px-6 py-3 bg-[#ff6b6b] text-white rounded-xl border-[3px] border-gray-900 text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_#1f2937] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all">
												Download Document
											</button>
										</div>
									</div>
								</div>
								{/key}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes scrollVertical {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-50%);
		}
	}
	@keyframes scrollVerticalReverse {
		0% {
			transform: translateY(-50%);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>
