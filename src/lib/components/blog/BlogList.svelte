<script>
	import { goto } from '$app/navigation';
	export let blogs = [];
	export let title = '';
</script>

<section>
	<div class="py-2 px-4 bg-[#FFF4DA] w-fit border-[3px] border-black rounded-xl">
		<h2 class="text-2xl font-bold">{title}</h2>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-10 mt-12">
		{#each blogs as blog}
			<a href="/blogs/{blog.slug}">
				<div
					class="flex flex-col bg-[#FFFDF8] border-black border-4 pb-4 pt-0 rounded-xl gap-2 cursor-pointer"
					role="button"
				>
					<div class="h-[200px] border-black border-b-4 rounded-top-xl">
						<img src={blog.heroImage} class="object-cover w-full h-full" alt={blog.title} />
					</div>
					<div class="font-bold text-xl md:text-xl px-2 md:min-h-[5.5rem]">
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
			</a>
		{/each}
	</div>
</section>
