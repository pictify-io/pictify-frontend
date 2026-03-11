<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import BlogList from '$lib/components/blog/BlogList.svelte';
	import SectionSeparator from '$lib/components/landingPage/SectionSeparator.svelte';

	export let data;
	let articles = data.props.articles;
	let guides = data.props.guides;
	let featured = data.props.featured;
</script>

<svelte:head>
	<title>Programmatic Media Automation: Tips, Templates, and Tutorials | Pictify</title>
	<meta
		name="description"
		content="Guides and articles on programmatic media: templates, HTML-to-image, OG generation, and rendering workflows with Pictify."
	/>
</svelte:head>

<div
	class="bg-[#FFFDF8] min-h-screen flex flex-col font-sans text-gray-900 selection:bg-[#ffc480] selection:text-black"
>
	<Nav />

	<!-- Hero Section -->
	<div class="w-full flex flex-col md:flex-row border-b-[3px] border-gray-900">
		<!-- Left Content -->
		<div
			class="flex-1 px-6 md:px-12 py-12 md:py-20 flex flex-col justify-center md:border-r-[3px] border-gray-900 bg-[#FFFDF8]"
		>
			<div class="mb-8">
				<div
					class="inline-block bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] px-4 py-1 mb-6 transform -rotate-2"
				>
					<span class="font-black uppercase tracking-widest text-sm">Resources</span>
				</div>
				<h1
					class="text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tighter mb-6 uppercase"
				>
					Programmatic Media:<br />
					<span class="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700"
						>Templates & Tutorials</span
					>
				</h1>
				<p class="text-xl md:text-2xl font-bold text-gray-600 max-w-lg leading-relaxed">
					Learn how teams design templates once and render variants via API — the infrastructure
					layer for media generation.
				</p>
			</div>

			<div class="w-full max-w-lg mt-4">
				<a
					href="/signup?redirect=/blogs"
					class="inline-flex items-center justify-center w-full sm:w-auto bg-gray-900 text-white border-[3px] border-gray-900 px-8 py-3.5 text-lg font-black uppercase tracking-wide shadow-[4px_4px_0_0_#ffc480] hover:bg-black hover:shadow-[6px_6px_0_0_#ffc480] hover:-translate-y-0.5 transition-all"
				>
					Get started free →
				</a>
			</div>
		</div>

		<!-- Right Content (Featured) -->
		<div
			class="flex-1 bg-[#ffc480] pattern-grid flex items-center justify-center p-8 md:p-16 relative overflow-hidden"
		>
			<!-- Decorative Elements -->
			<div
				class="absolute top-10 right-10 w-20 h-20 bg-white border-[3px] border-gray-900 rounded-full opacity-50"
			/>
			<div
				class="absolute bottom-10 left-10 w-12 h-12 bg-gray-900 border-[3px] border-white rounded-none opacity-20 transform rotate-45"
			/>

			{#if featured}
				<a href="/blogs/{featured.slug}" class="relative block w-full max-w-xl group z-10">
					<!-- Card -->
					<div
						class="relative bg-white border-[3px] border-gray-900 rounded-2xl p-4 shadow-[8px_8px_0_0_#1f2937] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[12px_12px_0_0_#1f2937]"
					>
						<!-- Featured Badge -->
						<div
							class="absolute -top-4 -right-4 bg-[#ff6b6b] text-white border-[3px] border-gray-900 px-4 py-1 transform rotate-3 shadow-[4px_4px_0_0_#1f2937] z-20"
						>
							<span class="font-black uppercase tracking-widest text-sm">Featured</span>
						</div>

						<div
							class="h-[280px] border-[3px] border-gray-900 rounded-xl overflow-hidden bg-gray-100 mb-6 relative"
						>
							<img
								src={featured?.heroImage}
								class="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
								alt={featured?.title}
							/>
							<div
								class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"
							/>
						</div>

						<div class="px-2">
							<h3
								class="font-black text-2xl md:text-3xl mb-4 leading-tight group-hover:text-gray-800 transition-colors"
							>
								{featured?.title}
							</h3>

							<div class="flex items-center justify-between pt-4 border-t-2 border-gray-100">
								<div class="flex items-center gap-2">
									<div
										class="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold border-2 border-gray-900"
									>
										{featured?.author.charAt(0)}
									</div>
									<span class="font-bold text-sm uppercase tracking-wide">{featured?.author}</span>
								</div>
								<div
									class="bg-gray-100 px-3 py-1 rounded border-2 border-gray-300 text-xs font-bold uppercase"
								>
									{featured?.readingTime} min read
								</div>
							</div>
						</div>
					</div>
				</a>
			{/if}
		</div>
	</div>

	<!-- Blog Lists -->
	<div class="max-w-[1800px] mx-auto px-6 py-20 w-full">
		{#if guides.length !== 0}
			<div class="mb-24">
				<BlogList blogs={guides} title={'🛠️  Guides'} />
			</div>
		{/if}

		{#if guides.length > 0 && articles.length > 0}
			<SectionSeparator icon="bolt" />
		{/if}

		{#if articles.length !== 0}
			<div class="mt-24">
				<BlogList blogs={articles} title={'📚  Articles'} />
			</div>
		{/if}
	</div>

	<div class="mt-auto border-t-[3px] border-gray-900">
		<TryNow />
	</div>

	<Footer />
</div>

<style>
	.pattern-grid {
		background-image: radial-gradient(#1f2937 1px, transparent 1px);
		background-size: 20px 20px;
	}
</style>
