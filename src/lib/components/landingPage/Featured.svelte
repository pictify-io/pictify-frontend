<script>
	import BetalistLogo from '$lib/assets/landing-page/betalist-logo.svg';
	import PeerlistLogo from '$lib/assets/landing-page/POM.svg';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	
	let visible = true;


</script>

<div class="max-w-6xl px-4 md:px-6 py-12 md:py-16 m-auto relative">
	<!-- Background decorative elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/10 to-transparent rounded-full blur-[100px] transform -translate-y-1/2"></div>
		<div class="absolute bottom-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/10 to-transparent rounded-full blur-[100px] transform translate-y-1/2"></div>
	</div>

	{#if visible}
	<div class="text-center space-y-3 md:space-y-4 mb-8 md:mb-12 relative" in:fade={{ duration: 1000, delay: 200 }}>
		<h2 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
			Featured On <span class="text-[#ff6b6b]">Leading Platforms</span>
		</h2>
		<p class="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-medium">
			Recognized for our exceptional performance and developer experience
		</p>
	</div>

	<!-- Recognition Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
		<div class="flex flex-col items-center p-4 md:p-6 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-200/50 shadow-sm" in:fly={{ y: 20, duration: 1000, delay: 400 }}>
			<div class="relative mb-3 md:mb-4">
				<div class="absolute inset-0 bg-gradient-to-r from-[#ff6b6b]/10 to-[#ffc480]/10 blur-2xl"></div>
				<div class="relative p-3 bg-white/80 rounded-xl shadow-sm">
					<a href="https://peerlist.io/suyashthakur/project/pictifyio" target="_blank">
						<img
							src={PeerlistLogo}
							alt="Peerlist Logo"
							class="w-20 h-20 md:w-28 md:h-28 object-contain"
						/>
					</a>
				</div>
			</div>
			<div class="text-center">
				<span class="inline-flex items-center px-3 py-0.5 rounded-full bg-[#ff6b6b]/5 text-[#ff6b6b] text-sm font-medium mb-1">Product of the Month</span>
				<span class="block text-sm text-gray-600">on Peerlist</span>
			</div>
		</div>

		<div class="flex flex-col items-center p-4 md:p-6 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-200/50 shadow-sm" in:fly={{ y: 20, duration: 1000, delay: 600 }}>
			<div class="relative mb-3 md:mb-4">
				<div class="absolute inset-0 bg-gradient-to-r from-[#ff6b6b]/10 to-[#ffc480]/10 blur-2xl"></div>
				<div class="relative p-3 bg-white/80 rounded-xl shadow-sm">
					<a href="https://betalist.com/startups/pictify-io" target="_blank">
						<img
							src={BetalistLogo}
							alt="Betalist Logo"
							class="w-20 h-20 md:w-28 md:h-28 object-contain"
						/>
					</a>
				</div>
			</div>
			<div class="text-center">
				<span class="inline-flex items-center px-3 py-0.5 rounded-full bg-[#ff6b6b]/5 text-[#ff6b6b] text-sm font-medium mb-1">Featured Startup</span>
				<span class="block text-sm text-gray-600">on Betalist</span>
			</div>
		</div>

		<div class="flex flex-col items-center p-4 md:p-6 bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-200/50 shadow-sm" in:fly={{ y: 20, duration: 1000, delay: 800 }}>
			<div class="relative mb-3 md:mb-4">
				<div class="absolute inset-0 bg-gradient-to-r from-[#ff6b6b]/10 to-[#ffc480]/10 blur-2xl"></div>
				<div class="relative p-3 bg-white/80 rounded-xl shadow-sm">
					<a href="https://www.saashub.com/pictify-io" target="_blank">
						<img
							src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
							alt="pictify.io badge"
							class="w-20 h-20 md:w-28 md:h-28 object-contain"
						/>
					</a>
				</div>
			</div>
			<div class="text-center">
				<span class="inline-flex items-center px-3 py-0.5 rounded-full bg-[#ff6b6b]/5 text-[#ff6b6b] text-sm font-medium mb-1">Approved Product</span>
				<span class="block text-sm text-gray-600">on SaaSHub</span>
			</div>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" in:fade={{ duration: 1000, delay: 1000 }}>
		<div class="p-3 md:p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
			<div class="flex flex-col items-center">
				<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b] mb-1">&lt; 1s</div>
				<div class="text-sm text-gray-600">Avg. Response</div>
			</div>
		</div>
		<div class="p-3 md:p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
			<div class="flex flex-col items-center">
				<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b] mb-1">1M+</div>
				<div class="text-sm text-gray-600">Images Generated</div>
			</div>
		</div>
		<div class="p-3 md:p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
			<div class="flex flex-col items-center">
				<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b] mb-1">99.9%</div>
				<div class="text-sm text-gray-600">Uptime</div>
			</div>
		</div>
		<div class="p-3 md:p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
			<div class="flex flex-col items-center">
				<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b] mb-1">24/7</div>
				<div class="text-sm text-gray-600">Support</div>
			</div>
		</div>
	</div>
	{/if}
</div>

<style>
	/* Remove unused selectors */
</style>


