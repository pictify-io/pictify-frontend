<script>
	import { fade, fly, scale } from 'svelte/transition';

	// State for the email (Block 3) interactions
	let activeEmailTier = 0;
	const emailTiers = [
		{
			id: 'gold',
			label: 'Gold Member',
			greeting: 'Welcome, Alex!',
			status: 'GOLD',
			points: '450',
			nextReward: 'Free Ship',
			color: 'bg-[#ffc480]'
		},
		{
			id: 'silver',
			label: 'Silver Member',
			greeting: 'Hi, Jordan!',
			status: 'SILVER',
			points: '120',
			nextReward: '5% Off',
			color: 'bg-gray-300'
		},
		{
			id: 'platinum',
			label: 'Platinum Member',
			greeting: 'Hello, Sam!',
			status: 'PLATINUM',
			points: '890',
			nextReward: '$50 Credit',
			color: 'bg-[#ff6b6b]'
		}
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

	const retailVariations = [
		{
			product: 'Nike Air Max',
			price: '$129',
			discount: '-20%',
			rating: '4.8',
			image:
				'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
			color: 'bg-[#ff6b6b]'
		},
		{
			product: 'Adidas Ultra',
			price: '$180',
			discount: 'NEW',
			rating: '4.9',
			image:
				'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=500&q=80',
			color: 'bg-blue-500'
		}
	];
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
		class="absolute top-1/4 -right-64 w-[800px] h-[800px] bg-[#4ade80]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>
	<div
		class="absolute bottom-1/4 -left-64 w-[800px] h-[800px] bg-[#ffc480]/20 rounded-full blur-[100px] pointer-events-none -z-10"
	/>

	<div class="max-w-7xl mx-auto px-6 relative z-10">
		<!-- Header -->
		<div class="text-center mb-24 relative max-w-4xl mx-auto">
			<div
				class="inline-block mb-6 px-6 py-2 bg-[#ffc480] border-[3px] border-gray-900 shadow-[6px_6px_0_0_#1f2937] rounded-full transform rotate-2 hover:-rotate-1 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_0_#1f2937] transition-all cursor-default"
			>
				<span class="text-sm font-bold text-gray-900 uppercase tracking-wider"
					>Dynamic Generation</span
				>
			</div>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
				One Template. <br />
				<span class="relative inline-block text-[#ff6b6b] transform -rotate-1 mt-2">
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
				OG images, social cards, product visuals, email headers — every team builds these
				eventually. We did it right so you don't have to.
			</p>
		</div>

		<!-- Bento Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-8">
			<!-- Block 1: Social Automation (Spans 7 cols) -->
			<div
				class="md:col-span-2 xl:col-span-7 bg-[#7dd3fc] rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]"
			>
				<!-- Subtle texture -->
				<div
					class="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"
				/>

				<div
					class="p-6 md:p-8 relative z-10 flex items-center justify-between border-b-[3px] border-gray-900 bg-[#7dd3fc]/50 backdrop-blur-sm"
				>
					<div class="flex items-center gap-4">
						<div
							class="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:-rotate-3 transition-transform"
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
							Infinite Variations
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
									class="absolute w-full h-full left-0 top-0 rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] overflow-hidden flex flex-col justify-end p-2.5 md:p-3 bg-black transition-all duration-300 hover:scale-[1.05] group-hover:shadow-[8px_8px_0_0_#1f2937] {rotate} {zIndex} {translateX} hover:!z-20 origin-bottom"
								>
									<div class="absolute inset-0 pointer-events-none">
										<img
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

			<!-- Block 2: Dynamic Retail (Spans 5 cols) -->
			<div
				class="xl:col-span-5 bg-white rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group flex flex-col min-h-[400px] md:min-h-[500px]"
			>
				<div
					class="absolute inset-0 bg-[radial-gradient(#ff6b6b_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.15] pointer-events-none"
				/>

				<div class="p-8 md:p-10 flex flex-col relative z-10 text-gray-900">
					<div class="flex items-center gap-4">
						<div
							class="w-14 h-14 bg-[#ff6b6b] border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] group-hover:rotate-6 transition-transform"
						>
							<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
								/></svg
							>
						</div>
						<h3 class="text-3xl md:text-3xl font-black leading-tight text-gray-900 drop-shadow-sm">
							Dynamic Retail
						</h3>
					</div>
				</div>

				<div class="flex-1 flex flex-col justify-end items-center gap-4 px-6 md:px-10 z-10 pb-10">
					{#each retailVariations as variant, i}
						<div
							class="w-full bg-[#f8f9fa] rounded-[1rem] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-4 flex items-center gap-2 relative overflow-hidden transition-all duration-300 group-hover:scale-[1.03] {i ===
							0
								? '-rotate-1 group-hover:-translate-y-2 group-hover:-rotate-2'
								: 'rotate-1 group-hover:-translate-y-1 group-hover:rotate-2'}"
						>
							<div
								class="absolute top-0 right-0 w-3/5 h-full {variant.color}/10 skew-x-12 translate-x-10"
							/>

							<div class="flex-1 relative z-10 pl-2">
								<div
									class="inline-block px-1.5 py-0.5 {variant.color} text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-2 rounded border-[1.5px] border-gray-900 shadow-[1px_1px_0_0_#1f2937]"
								>
									{variant.discount}
								</div>
								<h2 class="text-lg md:text-xl font-black text-gray-900 leading-none mb-1">
									{variant.product}
								</h2>
								<div class="text-xl md:text-2xl font-bold text-gray-900">
									{variant.price}
								</div>
							</div>
							<div
								class="w-[100px] md:w-[130px] relative z-10 h-full flex flex-col justify-center items-center"
							>
								<img
									src={variant.image}
									alt="product"
									class="w-full h-auto object-contain drop-shadow-lg transform transition-transform duration-500"
								/>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Block 3: Email Personalization (Spans 12 cols, Split) -->
			<div
				class="xl:col-span-12 bg-[#4ade80] rounded-[2rem] border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] hover:shadow-[12px_12px_0_0_#1f2937] transition-all duration-300 relative overflow-hidden group"
			>
				<div class="grid lg:grid-cols-12 h-full">
					<!-- Interactive Selector (Right via order, Left in DOM, 5 columns) -->
					<div
						class="lg:col-span-5 p-8 md:p-10 lg:p-12 flex flex-col justify-center relative z-20 bg-white/30 order-1"
					>
						<div class="flex items-center gap-4 mb-6">
							<div
								class="w-14 h-14 bg-white border-[3px] border-gray-900 rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#1f2937] transform rotate-3 transition-transform group-hover:rotate-0"
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
							<h3 class="text-3xl md:text-4xl font-black text-gray-900">Email Headers</h3>
						</div>

						<p class="text-base md:text-lg text-gray-800 font-medium mb-8 max-w-sm">
							Pass customer data to instantly render personalized loyalty cards, greetings, and
							dynamic rewards.
						</p>

						<div class="flex flex-col gap-3">
							<div
								class="text-[10px] font-black uppercase text-gray-600 tracking-widest pl-2 drop-shadow-sm mb-1"
							>
								Click to Simulate Audience
							</div>
							{#each emailTiers as tier, i}
								<button
									class="flex items-center gap-4 px-5 py-3.5 rounded-xl border-[3px] border-gray-900 font-bold transition-all text-left w-full max-w-sm
										{activeEmailTier === i
										? 'bg-black text-white shadow-[4px_4px_0_0_#ffc480] translate-x-2'
										: 'bg-white text-gray-900 shadow-[4px_4px_0_0_#1f2937] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#1f2937]'}"
									on:click={() => (activeEmailTier = i)}
									on:keydown={(e) =>
										(e.key === 'Enter' || e.key === ' ') && (() => (activeEmailTier = i))()}
								>
									<div class="w-4 h-4 rounded-full {tier.color} border-[2px] border-gray-900" />
									<div class="flex-1 text-sm uppercase tracking-wider font-black">{tier.label}</div>
									{#if activeEmailTier === i}
										<div class="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
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

						<!-- Floating JSON Card -->
						<div
							class="absolute top-8 left-8 bg-white rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] p-3 md:p-4 w-[200px] md:w-[240px] z-30 transform -rotate-2 group-hover:rotate-0 transition-transform hidden sm:block"
						>
							<div
								class="text-[9px] md:text-[10px] font-bold text-gray-600 mb-2 flex items-center gap-2 uppercase tracking-wider border-b-2 border-dashed border-gray-200 pb-2"
							>
								<div
									class="w-2 h-2 bg-[#4ade80] rounded-full border border-gray-900 animate-pulse"
								/>
								Incoming payload
							</div>
							{#key activeEmailTier}
								<pre
									class="font-mono text-[9px] md:text-[11px] text-gray-900 font-bold"
									in:fade={{ duration: 200 }}>
{`{
  "greeting": "${emailTiers[activeEmailTier].greeting}",
  "status": "${emailTiers[activeEmailTier].status}",
  "points": ${emailTiers[activeEmailTier].points}
}`}
								</pre>
							{/key}
						</div>

						<!-- Output Render Card -->
						<div
							class="relative z-10 w-full max-w-[340px] md:max-w-[400px] bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0_0_#1f2937] overflow-hidden transition-transform duration-500 hover:-translate-y-2 mt-4 sm:mt-0 xl:ml-32"
						>
							<div
								class="h-8 bg-gray-100 border-b-[3px] border-gray-900 flex items-center px-4 justify-between"
							>
								<div class="flex flex-1 gap-1.5 h-full items-center">
									<div
										class="w-2.5 h-2.5 rounded-full bg-[#ff6b6b] border-[1.5px] border-gray-900"
									/>
									<div
										class="w-2.5 h-2.5 rounded-full bg-[#ffc480] border-[1.5px] border-gray-900"
									/>
									<div
										class="w-2.5 h-2.5 rounded-full bg-[#4ade80] border-[1.5px] border-gray-900"
									/>
								</div>
								<div
									class="text-[9px] font-black font-mono uppercase tracking-widest text-gray-400"
								>
									welcome-email.png
								</div>
							</div>

							<div
								class="w-full bg-[#4ade80] relative flex flex-col items-center justify-center text-center p-8 overflow-hidden aspect-[4/3]"
							>
								<div
									class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 to-transparent"
								/>

								{#key activeEmailTier}
									<div
										class="relative z-10 w-full bg-white border-[3px] border-gray-900 p-5 md:p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] transform transition-all duration-300"
										in:scale={{ duration: 400, start: 0.95 }}
									>
										<div
											class="w-12 h-12 md:w-14 md:h-14 bg-gray-900 rounded-full mx-auto -mt-10 md:-mt-12 mb-3 md:mb-4 border-[3px] border-white flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.2)]"
										>
											<span class="text-xl md:text-2xl">🎁</span>
										</div>
										<h2 class="text-xl md:text-3xl font-black text-gray-900 mb-2 leading-none">
											{emailTiers[activeEmailTier].greeting}
										</h2>
										<div
											class="inline-block px-3 py-1 bg-gray-100 rounded text-[9px] md:text-[10px] font-black uppercase tracking-wider text-gray-800 mb-6 border-[2px] border-gray-900 shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]"
										>
											{emailTiers[activeEmailTier].status}
										</div>

										<div
											class="grid grid-cols-2 gap-4 border-t-[3px] border-dashed border-gray-200 pt-4"
										>
											<div>
												<div
													class="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1"
												>
													Points
												</div>
												<div class="text-xl md:text-2xl font-black text-[#4ade80] leading-none">
													{emailTiers[activeEmailTier].points}
												</div>
											</div>
											<div>
												<div
													class="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1"
												>
													Next Reward
												</div>
												<div
													class="text-xs md:text-sm font-black text-gray-900 leading-none mt-1 uppercase"
												>
													{emailTiers[activeEmailTier].nextReward}
												</div>
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
