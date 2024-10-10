<script>
	import { goto } from '$app/navigation';
	let email = '';

	function handleSubmit() {
		goto('/signup?email=' + email);
	}
</script>

<div class="w-full flex flex-col items-center justify-center mx-auto py-16 px-4 sm:px-6 lg:px-8 bg-[#fff4da]">
    <h2 class="text-3xl font-bold mb-8 text-center">Start Creating Stunning Visuals Today</h2>
		<ul class="text-lg mb-10 text-center max-w-2xl">
			<li class="flex items-center mb-4">
					<svg class="w-6 h-6 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
					<span class="text-xl font-semibold">5x faster than competitors</span>
			</li>
				<li class="flex items-center mb-4">
					<svg class="w-6 h-6 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
					<span class="text-xl font-semibold">No credit card required</span>
				</li>
				<li class="flex items-center">
					<svg class="w-6 h-6 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
					<span class="text-xl font-semibold">50 free monthly credits to start</span>
				</li>
		</ul>
    <form
        on:submit|preventDefault={handleSubmit}
        class="flex flex-col sm:flex-row w-full max-w-xl mx-auto justify-center items-stretch space-y-4 sm:space-y-0 sm:space-x-4"
    >
        <div class="relative flex-grow">
            <div
                class="w-full h-full rounded bg-gray-900 translate-y-1 translate-x-1 absolute inset-0 z-10"
            />
            <input
                type="email"
                class="border-[3px] w-full relative z-20 border-gray-900 placeholder-gray-600 text-base font-medium focus:outline-none py-3 px-4 rounded"
                placeholder="Enter your email"
                bind:value={email}
                required
            />
        </div>
        <div class="relative flex-shrink-0 group">
            <div
                class="w-full h-full rounded bg-gray-800 translate-y-1 translate-x-1 absolute inset-0 z-10"
            />
            <button
                type="submit"
                class="py-3 rounded px-6 group-hover:-translate-y-px group-hover:-translate-x-px ease-out duration-300 z-20 relative w-full border-[3px] border-gray-900 font-medium bg-[#ffc480] tracking-wide text-base flex-shrink-0 text-gray-900 hover:bg-[#ffb960]"
            >
                Start for Free
            </button>
        </div>
    </form>
    <p class="text-sm mt-4 text-center">No credit card required. Start for free today.</p>
	
</div>
