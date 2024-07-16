<script>
	import { goto } from '$app/navigation';
	export let blogs = [];
	export let title = '';

	console.log(title);
	const handleBlogClick = async (slug) => {
		goto(`/blogs/${slug}`);
	};
</script>

<section>
	<div class="py-2 px-4 bg-[#FFF4DA] w-fit border-[3px] border-black rounded-xl">
		<h2 class="text-2xl font-bold">{title}</h2>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-10 mt-12">
		{#each blogs as blog}
			<div
				class="flex flex-col bg-[#FFFDF8] border-black border-4 pb-4 pt-0 rounded-xl gap-2 cursor-pointer"
				on:click={() => handleBlogClick(blog.slug)}
				role="button"
			>
				<div class="h-[200px] border-black border-b-4 rounded-top-xl">
					<img src={blog.heroImage} class="object-cover w-full h-full" alt={blog.title} />
				</div>
				<div class="font-bold text-xl md:text-xl px-2">
					<h3 class="cursor-pointer">{blog.title}</h3>
				</div>
				<div class="flex px-2 pt-2 font-semibold text-gray-700 justify-between">
					<div>
						-by {blog.author}
					</div>
					<div class="">
						{blog.readingTime} min read
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
