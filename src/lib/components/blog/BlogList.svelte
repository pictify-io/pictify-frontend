<script>
	import { goto } from '$app/navigation';
	export let blogs = [];
	export let title = '';
</script>

<section>
	<div class="flex items-center gap-4 mb-12">
		<div
			class="py-3 px-6 bg-[#ffc480] border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f2937] transform -rotate-1"
		>
			<h2 class="text-2xl font-black uppercase tracking-tighter text-gray-900">{title}</h2>
		</div>
		<div class="h-[3px] flex-grow bg-gray-900 rounded-full opacity-20" />
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
		{#each blogs as blog}
			<a href="/blogs/{blog.slug}" class="block group h-full">
				<div
					class="flex flex-col h-full bg-white border-[3px] border-gray-900 rounded-xl shadow-[6px_6px_0_0_#1f2937] transition-all duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:shadow-[8px_8px_0_0_#1f2937] overflow-hidden"
					role="button"
				>
					<!-- Image Container -->
					<div
						class="aspect-[16/10] border-b-[3px] border-gray-900 bg-gray-100 relative overflow-hidden group-hover:brightness-105 transition-all"
					>
						<div
							class="absolute inset-0 opacity-10 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:8px_8px]"
						/>
						<img
							src={blog.heroImage}
							class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
							alt={blog.title}
						/>
					</div>

					<!-- Content -->
					<div class="flex flex-col flex-grow p-6 relative">
						<div class="mb-4">
							<h3
								class="font-black text-xl leading-tight group-hover:text-gray-700 transition-colors line-clamp-3"
							>
								{blog.title}
							</h3>
						</div>

						<div class="mt-auto pt-4 border-t-2 border-gray-100 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="w-8 h-8 rounded-full bg-[#ffc480] border-2 border-gray-900 flex items-center justify-center text-xs font-black shadow-[2px_2px_0_0_#1f2937]"
								>
									{blog.author.charAt(0)}
								</div>
								<div class="flex flex-col">
									<span class="text-xs font-bold uppercase tracking-wider text-gray-900"
										>{blog.author}</span
									>
									<span class="text-[10px] font-bold text-gray-500 uppercase"
										>{blog.readingTime} min read</span
									>
								</div>
							</div>

							<div
								class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-transparent group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-all"
							>
								<i
									class="fa-solid fa-arrow-right text-sm transform -rotate-45 group-hover:rotate-0 transition-transform duration-300"
								/>
							</div>
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>
</section>
