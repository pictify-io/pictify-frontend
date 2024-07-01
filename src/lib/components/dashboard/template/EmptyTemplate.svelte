<script>
	import PlusIcon from '$lib/assets/dashboard/Plus.svg';
	import FileIcon from '$lib/assets/landing-page/file.svg';
	import { goto } from '$app/navigation';
</script>

<div class="m-auto max-w-6xl h-full flex justify-center">
	<div class="text-center mt-20">
		<div class="mb-5">
			<img src={FileIcon} alt="File icon" class="w-20 h-20 mx-auto" />
		</div>
		<div class="mb-5 text-lg font-bold">No Template Found</div>
		<div class="mb-3 text-lg font-light">Create a template to get started</div>
		<div>
			<button
				class="bg-black hover:bg-black text-white font-bold py-1 px-4 rounded ring-1 ring-black ring-opacity-5"
				on:click={() => {
					goto('/dashboard/template/create');
				}}
			>
				<div class="flex justify-between items-center">
					<img src={PlusIcon} alt="Plus icon" class="w-5 h-5 mr-2" />
					<div>Create</div>
				</div>
			</button>
		</div>
	</div>
</div>
