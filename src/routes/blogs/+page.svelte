<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import BlogList from '$lib/components/blog/BlogList.svelte';

	let email = '';

	export let data;
	let articles = data.props.articles;
	let guides = data.props.guides;
	let featured = data.props.featured;

</script>

<svelte:head>
	<title>HTML to Images: Tips, Tricks, and Tutorials</title>
	<meta
		name="description"
		content="List of guides and articles to help you get started with HTML to Images"
	/>
</svelte:head>

<section class="bg-[#FFFDF8] min-h-screen md:h-screen">
	<Nav />

	<div class="w-full flex flex-col md:flex-row">
		<div
			class="flex-1 md:border-r-[3px] border-b-[3px] border-black px-4 py-8 flex flex-col justify-center"
		>
			<div class="flex justify-between">
				<div>
					<h1 class="text-4xl md:text-5xl lg:text-5xl xl:text-6-xl font-bold leading-[1.2]">
						HTML to Images: <br />
						Tips, Tricks, and Tutorials
					</h1>
				</div>
				<div>
					<img
						src="https://cdn.devdojo.com/images/january2023/shape-2.png"
						class=" w-[4.5rem]"
						alt="pictify-ui-element1"
					/>
				</div>
			</div>
			<div>
				<p class="mt-6 mb-4 text-xl">
					Sign up now to unlock the full potential of HTML with stunning visuals
				</p>
			</div>
			<div class="my-2">
				<form
					onsubmit="event.preventDefault(); return false"
					class="flex md:flex-row flex-col w-full h-full items-stretch space-y-5 md:space-y-0 md:space-x-10 mr-20"
				>
					<div class="relative w-full h-full md:max-w-md">
						<div
							class="w-full h-full rounded bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10"
						/>
						<input
							type="text"
							class="border-[3px] w-full relative z-20 border-gray-900 placeholder-gray-60mb-4 0 text-lg font-medium focus:outline-none py-3.5 px-6 rounded"
							placeholder="Email Address"
							bind:value={email}
						/>
					</div>
					<div class="relative w-auto flex-shrink-0 h-full group">
						<div
							class="w-full h-full rounded bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10"
						/>
						<button
							class="py-3.5 rounded px-8 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-[#ffc480] tracking-wide text-lg flex-shrink-0 text-gray-900"
							>Sign Up</button
						>
					</div>
				</form>
			</div>
		</div>
		<div
			class="flex-1 bg-[#FFF4DA] flex items-center justify-center py-10 p-4 md:py-14 md:px-14 border-b-[3px] border-black"
		>
			{#if featured}
				<a href="/blogs/{featured.slug}">
					<div class="relative flex flex-col max-w-2xl cursor-pointer group">
						<div
							class="flex flex-col bg-[#FFFDF8] border-black border-4 p-4 rounded-xl z-20 gap-2 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 tracking-wide"
						>
							<div class="h-[250px] border-black border-4 rounded-md">
								<img
									src={featured?.heroImage}
									class="object-cover w-full h-full"
									alt={featured?.title}
								/>
							</div>
							<div class="font-bold text-xl md:text-2xl">
								<h3 class="cursor-pointer">
									{featured?.title}
								</h3>
							</div>
							<div class="flex mt-4 justify-between font-semibold text-gray-700">
								<div>
									-by {featured?.author}
								</div>
								<div class="">
									{featured?.readingTime} min read
								</div>
							</div>
						</div>
						<div class="absolute rounded-xl bg-gray-800 translate-y-2 translate-x-2 inset-0 z-10" />
					</div>
				</a>
			{/if}
		</div>
	</div>
	<div class="px-4 py-8">
		{#if guides.length !== 0}
			<BlogList blogs={guides} title={'🛠️  Guides'} />
		{/if}
		{#if articles.length !== 0}
			<div class="my-20">
				<BlogList blogs={articles} title={'📚  Articles'} />
			</div>
		{/if}
	</div>
	<div class="flex w-full justify-center mt-20 border-t-[3px]  border-gray-900 ">
		<div class="w-full">
			<TryNow />
		</div>
	</div>
	<div class="">
		<Footer />
	</div>
</section>
