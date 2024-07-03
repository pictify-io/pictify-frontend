<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import TryNow from '$lib/components/landingPage/TryNow.svelte';
	import { onMount } from 'svelte';
	import { getAllBlogs, getFeaturedBlog } from '../../api/blog';

	let articles = [];
	let guides = [];
	let email = '';
	let firstBlog;

	onMount(async () => {
		const {blog} = await getFeaturedBlog();
		firstBlog = blog;

		const{blogs:guidesList} = await getAllBlogs({
			type: 'guide',
		});
		guides = guidesList;

	for(let i = 0; i < 8; i++){
		guides.push(guidesList[0]);
	}

		const {blogs:articlesList} = await getAllBlogs({
			type: 'article',
		});
		articles = articlesList;

		for(let i = 0; i < 8; i++){
		articles.push(articlesList[0]);
	}
	});
</script>

<section class="bg-[#FFFDF8] min-h-screen md:h-screen">
		<Nav />

	<div class="w-full flex flex-col md:flex-row">
		<div class="flex-1 md:border-r-[3px] border-b-[3px] border-black px-4 py-8 flex flex-col justify-center">
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
		<div class="flex-1 bg-[#FFF4DA] flex items-center justify-center py-10 p-4 md:py-14 md:px-14 border-b-[3px] border-black">
      {#if firstBlog}
			<div class="relative flex flex-col max-w-2xl cursor-pointer group">
				<div
					class="flex flex-col bg-[#FFFDF8] border-black border-4 p-4 rounded-xl z-20 gap-2 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 tracking-wide"
				>
					<div class="h-[250px] border-black border-4 rounded-md">
						<img
							src={firstBlog?.heroImage}
							class="object-cover w-full h-full"
							alt={firstBlog?.title}
						/>
					</div>
					<div class="font-bold text-xl md:text-2xl">
						<h3 class="cursor-pointer">
              {firstBlog?.title}
            </h3>
					</div>
					<div class="flex mt-4 justify-between font-semibold text-gray-700">
						<div>
							-by {firstBlog?.author}
						</div>
						<div class="">
							 {firstBlog?.readingTime} min read
						</div>
					</div>
				</div>
				<div class="absolute rounded-xl bg-gray-800 translate-y-2 translate-x-2 inset-0 z-10" />
			</div>
      {/if}
		</div>
	</div>
  <div class="px-4 py-8">
    <div class="py-2 px-6 bg-[#FFF4DA] w-fit border-[3px] border-black rounded-xl">
      <h2 class="text-3xl font-bold">💻 &nbsp; Guides</h2>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4  gap-6 xl:gap-10 mt-12">
		{#each guides as guide}
		<div class="flex flex-col bg-[#FFFDF8] border-black border-4 pb-4 pt-0 rounded-xl gap-2 cursor-pointer">
			<div class="h-[200px] border-black border-b-4 rounded-top-xl">
				<img
					src={guide.heroImage}
					class="object-cover w-full h-full"
					alt={guide.title}
				/>
			</div>
			<div class="font-bold text-xl md:text-xl px-2">
				<h3 class="cursor-pointer">{guide.title}</h3>
			</div>
			<div class="flex px-2 pt-2 font-semibold  text-gray-700 justify-between">
				<div>
					-by {guide.author}
				</div>
				<div class="">
					{guide.readingTime} min read
					</div>
			</div>
		</div>
		{/each}
	</div>

	<div class="py-2 px-6 bg-[#FFF4DA] w-fit border-[3px] border-black rounded-xl my-20">
		<h2 class="text-3xl font-bold">📰 &nbsp; Articles</h2>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-10 mt-12">
		{#each articles as article}
		<div class="flex flex-col bg-[#FFFDF8] border-black border-4 pb-4 pt-0 rounded-xl gap-2 cursor-pointer">
			<div class="h-[200px] border-black border-b-4 rounded-top-xl">
				<img
					src={article.heroImage}
					class="object-cover w-full h-full"
					alt={article.title}
				/>
			</div>
			<div class="font-bold text-xl md:text-xl px-2">
				<h3 class="cursor-pointer">{article.title}</h3>
			</div>
			<div class="flex px-2 pt-2 font-semibold  text-gray-700 justify-between">
				<div>
					-by {article.author}
				</div>
				<div class="">
					{article.readingTime} min read
				</div>
			</div>
		</div>
		{/each}
	</div>
	<div class="flex w-full justify-center mt-20">
		<div class="max-w-3xl">
			<TryNow />	
		</div>
	</div>
	<div class="mt-10">
		<Footer />
	</div>
</section>
