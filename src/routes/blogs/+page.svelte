<script>
	import Nav from '$lib/components/landingPage/Nav.svelte';
	import Footer from '$lib/components/landingPage/Footer.svelte';
	import { onMount } from 'svelte';
	import { getAllBlogs } from '../../api/blog';

	let blogs = [];
	let email = '';
	let firstBlog;

	onMount(async () => {
		const resp = await getAllBlogs();
		blogs = resp.blogs;
		firstBlog = blogs[0];
	});
</script>

<section class="bg-[#FFFDF8] min-h-screen md:h-screen">
	<Nav />
	<div class="w-full flex flex-col md:flex-row">
		<div class="flex-1 md:border-r-2 border-black px-4 py-8 flex flex-col justify-center">
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
		<div class="flex-1 bg-[#FFF4DA] flex items-center justify-center py-10 p-4 md:py-14 md:px-14">
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
						{firstBlog?.title}
					</div>
					<div class="flex mt-4">
						<div>
							-by {firstBlog?.author}
						</div>
					</div>
				</div>
				<div class="absolute rounded-xl bg-gray-800 translate-y-2 translate-x-2 inset-0 z-10" />
			</div>
		</div>
	</div>

	<Footer />
</section>
