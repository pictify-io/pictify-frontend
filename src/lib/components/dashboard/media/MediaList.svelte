<script>
	import { onDestroy, onMount } from 'svelte';
	import { gifs, images, fetchGifs, fetchImages } from '../../../../store/media.store';
	import Toast from '$lib/components/Toast.svelte';
	import { toast } from '../../../../store/toast.store';
	import Loader from '$lib/components/Loader.svelte';

	export let mediaType = 'images';

	let isLoading = true;

	let unsubscribe = () => {};

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			toast.set({ message: 'Copied to clipboard !!', duration: 1500 });
		});
	}

	let mediaList = [];

	onMount(async () => {
		if (unsubscribe) {
			unsubscribe();
		}

		if (mediaType === 'images') {
			unsubscribe = images.subscribe((i) => {
				mediaList = i.images || [];
			});
		} else if (mediaType === 'gifs') {
			unsubscribe = gifs.subscribe((g) => {
				mediaList = g.gifs || [];
			});
		}

		if (mediaType === 'images') {
			await fetchImages();
		} else if (mediaType === 'gifs') {
			await fetchGifs();
		}
		isLoading = false;
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		mediaList = [];
	});
</script>

<div class="max-w-6xl p-5 m-auto">
	{#if isLoading}
		<div class="mt-20">
			<Loader size="16" show={isLoading} />
		</div>
	{:else if mediaList.length === 0}
		<div class="text-center text-gray-700">No {mediaType} found</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each mediaList as media}
				<div class="relative">
					<img src={media.url} alt={media.title} class="w-full h-full object-cover rounded-lg" />
					<div class="absolute bottom-1 right-1 p-2 bg-gray-900 bg-opacity-80 rounded-lg">
						<button
							class="text-white text-xs"
							on:click={() => {
								copyToClipboard(media.url);
							}}>Copy URL</button
						>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Toast />
