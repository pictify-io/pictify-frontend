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
		<div class="text-center mb-24 relative max-w-4xl mx-auto">
			<h2 class="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-black text-gray-900 mb-6 leading-tight">
				One Template. <br />
				<span class="relative inline-block text-brand-danger transform -rotate-1 mt-2">
					Million Variations
					<svg
						class="absolute w-full h-4 -bottom-2 left-0 text-black z-[-1] opacity-20"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
					>
						<path d="M0 5 Q 50 10 100 5" stroke="currentColor" stroke-width="8" fill="none" />
					</svg>
				</span>
				.
			</h2>
			<p class="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
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
			<div
				class="xl:col-span-5 bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl hover:shadow-brutal-3xl transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]"
			>
				<div
					class="absolute inset-0 bg-[radial-gradient(#a78bfa_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.18] pointer-events-none"
				/>

				<div class="p-8 md:p-10 flex flex-col relative z-10 text-gray-900">
					<div class="flex items-center gap-4">
						<div
							class="w-14 h-14 bg-data-violet border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-brutal-lg group-hover:rotate-6 transition-transform"
						>
							<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
								/></svg
							>
						</div>
						<h3 class="text-3xl md:text-3xl font-black leading-tight text-gray-900 drop-shadow-sm">
							Personalized Video
						</h3>
					</div>
				</div>

				<div class="flex-1 flex flex-col justify-end px-6 md:px-10 z-10 pb-10 gap-4">
					<!-- Player -->
					<div
						class="w-full bg-gray-950 rounded-2xl border-[3px] border-gray-900 shadow-brutal-xl overflow-hidden relative aspect-video group-hover:-translate-y-1 transition-transform duration-300"
					>
						<!-- ambient gradient "footage" -->
						<div class="absolute inset-0 bg-gradient-to-br from-data-violet/50 via-gray-950 to-brand-danger/30" />
						<div
							class="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:18px_18px]"
						/>

						<!-- play button -->
						<div class="absolute inset-0 flex items-center justify-center">
							<div
								class="w-14 h-14 bg-white rounded-full border-[3px] border-gray-900 shadow-brutal-lg flex items-center justify-center group-hover:scale-110 transition-transform"
							>
								<svg class="w-6 h-6 text-gray-900 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"
									><path d="M8 5v14l11-7z" /></svg
								>
							</div>
						</div>

						<!-- personalized lower third -->
						{#key activeVideoVariant}
							<div class="absolute left-4 bottom-9" in:fly={{ y: 10, duration: 300 }}>
								<div
									class="bg-white border-[2px] border-gray-900 rounded-lg px-3 py-1.5 shadow-brutal-sm"
								>
									<p class="text-[12px] font-black text-gray-900 leading-tight">
										Congrats, {videoVariants[activeVideoVariant].full}! 🎉
									</p>
									<p class="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
										{videoVariants[activeVideoVariant].course}
									</p>
								</div>
							</div>
						{/key}

						<!-- variant counter -->
						<div
							class="absolute top-3 right-3 px-2.5 py-1 bg-gray-900/80 rounded-md border border-white/20 text-[9px] font-black uppercase tracking-widest text-white"
						>
							Variant {activeVideoVariant + 1} of 240
						</div>

						<!-- progress bar -->
						<div class="absolute bottom-0 left-0 right-0 h-5 bg-gray-900 border-t-[2px] border-gray-700 flex items-center px-3 gap-2">
							<div class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
								<div class="h-full w-1/3 bg-data-violet rounded-full" />
							</div>
							<span class="text-[8px] font-black text-gray-400 font-mono">0:08 / 0:24</span>
						</div>
					</div>

					<!-- variant switcher -->
					<div class="flex items-center gap-2 flex-wrap">
						<span class="text-[10px] font-black uppercase text-gray-500 tracking-widest mr-1"
							>Same template:</span
						>
						{#each videoVariants as variant, i}
							<button
								class="px-3 py-1.5 rounded-full border-[2px] border-gray-900 text-[10px] font-black uppercase tracking-wider transition-all
									{activeVideoVariant === i
									? 'bg-gray-900 text-white shadow-brutal-sm'
									: 'bg-white text-gray-900 hover:-translate-y-0.5 hover:shadow-brutal-sm'}"
								on:click={() => (activeVideoVariant = i)}
							>
								{variant.name}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Block 3: Email Personalization (Spans 12 cols, Split) -->
			<div
				class="xl:col-span-12 bg-data-green rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl hover:shadow-brutal-3xl transition-all duration-300 relative overflow-hidden group"
			>
				<div class="grid lg:grid-cols-12 h-full">
					<!-- Interactive Selector (Right via order, Left in DOM, 5 columns) -->
					<div
						class="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-center relative z-20 bg-white/30 order-1"
					>
						<div class="flex items-center gap-4 mb-6">
							<div
								class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-brutal-lg transform rotate-3 transition-transform group-hover:rotate-0"
							>
								<svg
									class="w-7 h-7 text-black"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
									/></svg
								>
							</div>
							<h3 class="text-3xl md:text-4xl font-black text-gray-900">Delivered by Email</h3>
						</div>

						<p class="text-base md:text-lg text-gray-800 font-medium mb-8 max-w-sm">
							Every CSV row or webhook event renders a personalized document and lands in each
							recipient's inbox automatically.
						</p>

						<div class="flex flex-col gap-3">
							<div
								class="text-[10px] font-black uppercase text-gray-600 tracking-widest pl-2 drop-shadow-sm mb-1"
							>
								Click a spreadsheet row
							</div>
							{#each recipients as recipient, i}
								<button
									class="flex items-center gap-3 px-4 py-3 rounded-xl border-[3px] border-gray-900 font-bold transition-all text-left w-full max-w-sm
										{activeRecipient === i
										? 'bg-black text-white shadow-brutal-accent translate-x-2'
										: 'bg-white text-gray-900 shadow-brutal-lg hover:-translate-y-0.5 hover:shadow-brutal-xl'}"
									on:click={() => (activeRecipient = i)}
									on:keydown={(e) =>
										(e.key === 'Enter' || e.key === ' ') && (() => (activeRecipient = i))()}
								>
									<span class="text-xs font-black {activeRecipient === i ? 'text-gray-400' : 'text-gray-400'}"
										>#{recipient.row}</span
									>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-black leading-tight truncate">{recipient.name}</div>
										<div class="text-[10px] font-bold {activeRecipient === i ? 'text-gray-400' : 'text-gray-500'} truncate">
											{recipient.email}
										</div>
									</div>
									{#if activeRecipient === i}
										<span
											class="px-2 py-0.5 rounded-full border-[2px] {activeRecipient === i ? 'border-white/40' : 'border-gray-900'} bg-data-green text-black text-[8px] font-black uppercase tracking-widest"
											>Delivered</span
										>
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- Visual Canvas (Left via order, Right in DOM, 7 columns) -->
					<div
						class="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center items-center relative bg-[#dcfce7]/40 min-h-[400px] border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-gray-900 order-2 pt-16 md:pt-16 lg:pt-16"
					>
						<div
							class="absolute inset-0 bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"
						/>

						<!-- Row payload tilted over the inbox corner — same overlap language
						     as the chips on the hero and certificate cards -->
						<div class="relative z-10 w-full max-w-[340px] md:max-w-[400px] flex flex-col">
							<!-- Row payload card -->
							<div
								class="self-start bg-white rounded-xl border-[3px] border-gray-900 shadow-brutal-lg p-3 w-[230px] md:w-[250px] overflow-hidden transform -rotate-2 group-hover:-rotate-1 transition-transform relative z-20 -mb-6 -ml-2 md:-ml-5 hidden sm:block"
							>
								<div
									class="text-[9px] md:text-[10px] font-bold text-gray-600 mb-2 flex items-center gap-2 uppercase tracking-wider border-b-2 border-dashed border-gray-200 pb-2"
								>
									<div
										class="w-2 h-2 bg-data-green rounded-full border border-gray-900 animate-pulse"
									/>
									Row {recipients[activeRecipient].row} of 240
								</div>
								{#key activeRecipient}
									<pre
										class="font-mono text-[9px] md:text-[10px] text-gray-900 font-bold overflow-hidden"
										in:fade={{ duration: 200 }}>
{`{
  "name": "${recipients[activeRecipient].name}",
  "course": "${recipients[activeRecipient].course.length > 16 ? recipients[activeRecipient].course.slice(0, 15) + '…' : recipients[activeRecipient].course}",
  "email": "${recipients[activeRecipient].email}"
}`}
									</pre>
								{/key}
							</div>

							<!-- Output: the recipient's inbox, certificate attached -->
							<div
								class="w-full bg-white rounded-2xl border-[3px] border-gray-900 shadow-brutal-2xl overflow-hidden transition-transform duration-500 hover:-translate-y-2 mt-4 sm:mt-0 relative z-10"
							>
							{#key activeRecipient}
								<div in:fade={{ duration: 200 }}>
									<!-- inbox chrome -->
									<div
										class="h-8 bg-gray-100 border-b-[3px] border-gray-900 flex items-center px-4 justify-between"
									>
										<div class="flex flex-1 gap-1.5 h-full items-center">
											<div
												class="w-2.5 h-2.5 rounded-full bg-brand-danger border-[1.5px] border-gray-900"
											/>
											<div
												class="w-2.5 h-2.5 rounded-full bg-brand-accent border-[1.5px] border-gray-900"
											/>
											<div
												class="w-2.5 h-2.5 rounded-full bg-data-green border-[1.5px] border-gray-900"
											/>
										</div>
										<div
											class="text-[9px] font-black font-mono uppercase tracking-widest text-gray-400 truncate"
										>
											inbox — {recipients[activeRecipient].email}
										</div>
									</div>

									<!-- email header -->
									<div class="px-5 pt-4 pb-3 border-b-[2px] border-gray-200">
										<div class="flex items-center justify-between gap-2 mb-1.5">
											<p class="text-[11px] font-black text-gray-900 truncate">
												Acme Academy <span class="text-gray-400 font-bold">via Pictify</span>
											</p>
											<span
												class="px-2 py-0.5 rounded-full border-[2px] border-gray-900 bg-data-green text-[8px] font-black uppercase tracking-widest shrink-0"
												>Delivered</span
											>
										</div>
										<p class="text-sm font-black text-gray-900 leading-tight">
											Your certificate is ready, {recipients[activeRecipient].name.split(' ')[0]} 🎓
										</p>
									</div>

									<!-- email body: the real rendered document -->
									<div class="px-5 py-4">
										<p class="text-[11px] font-medium text-gray-600 mb-3">
											Congratulations on completing
											<span class="font-black text-gray-900">{recipients[activeRecipient].course}</span> —
											your certificate is attached below.
										</p>
										<div class="relative">
											<img
												loading="lazy"
												src={recipients[activeRecipient].cert}
												alt="Certificate for {recipients[activeRecipient].name}"
												class="w-full rounded-lg border-[2px] border-gray-900 shadow-brutal-sm bg-white"
											/>
											<span
												class="absolute -top-2 -right-2 px-2 py-0.5 bg-white rounded border-[2px] border-gray-900 text-[8px] font-black uppercase tracking-widest shadow-brutal-sm"
												>PDF · {recipients[activeRecipient].row} of 240</span
											>
										</div>
										<div class="mt-3 flex justify-center">
											<span
												class="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg border-[2px] border-gray-900 text-[10px] font-black uppercase tracking-widest"
												>View your document</span
											>
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
