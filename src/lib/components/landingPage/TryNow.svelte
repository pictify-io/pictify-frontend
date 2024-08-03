<script>
	import { goto } from '$app/navigation';
	let email = '';

	function handleSubmit() {
		goto('/signup?email=' + email);
	}
</script>

<div class="w-100 sm:w-90 flex-col justify-center items-center mx-auto py-10 px-10 md:px-0">
	<div class="relative">
		<div class="w-full h-full absolute inset-0 bg-black rounded-xl translate-y-2 translate-x-2" />
		<div
			class="rounded-xl relative z-20 pl-8 sm:pl-10 pr-8 sm:pr-16 py-8 border-[3px] border-gray-900 bg-[#fff4da]"
		>
			<img
				src="https://cdn.devdojo.com/images/january2023/shape-1.png"
				class="absolute md:block hidden left-0 h-[4.5rem] w-[4.5rem] bottom-0 -translate-x-full ml-3"
				alt="pictify-ui-element1"
			/>
			<form
				onsubmit="event.preventDefault(); return false"
				class="flex md:flex-row flex-col w-full h-full justify-center items-stretch space-y-5 md:space-y-0 md:space-x-5"
			>
				<div class="relative w-full h-full">
					<div
						class="w-full h-full rounded bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10"
					/>
					<input
						type="text"
						class="border-[3px] w-full relative z-20 border-gray-900 placeholder-gray-600 text-lg font-medium focus:outline-none py-3.5 px-6 rounded"
						placeholder="Email Address"
						bind:value={email}
					/>
				</div>
				<div class="relative w-auto flex-shrink-0 h-full group">
					<div
						class="w-full h-full rounded bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10"
					/>
					<button
						class="py-3.5 rounded px-6 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-[#ffc480] tracking-wide text-lg flex-shrink-0 text-gray-900"
						on:click={handleSubmit}>Sign Up</button
					>
					<img
						src="https://cdn.devdojo.com/images/january2023/shape-2.png"
						class="absolute sm:translate-y-0 translate-y-full sm:mt-0 mt-16 w-16 right-0 translate-x-full top-0 h-16 mr-8 sm:mr-1"
						alt="pictify-ui-element2"
					/>
				</div>
			</form>
			<p class="opacity-70 mt-4">
				Sign up for free and start converting HTML to images and GIFs today.
			</p>
		</div>
	</div>
</div>
