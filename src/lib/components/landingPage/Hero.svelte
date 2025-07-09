<script>
	import { onMount } from 'svelte';
	import SignUpButton from './SignUpButton.svelte';
	import { fade } from 'svelte/transition';
	
	let activeFeature = 0;
	
	const features = [
		{ icon: "⚡", text: "5x Faster Conversion" },
		{ icon: "🎯", text: "Pixel Perfect Output" },
		{ icon: "🎨", text: "Fully Customizable" }
	];

	onMount(() => {
		const interval = setInterval(() => {
			activeFeature = (activeFeature + 1) % features.length;
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<main class="z-10 w-full md:px-0 px-4 flex flex-col items-center justify-center max-w-5xl mx-auto relative overflow-hidden">
	<div class="py-8 md:py-16 relative w-full mx-auto flex flex-col items-center">
		<!-- Enhanced Decorative Background -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
			<div class="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/20 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
			<div class="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/20 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
			<div class="absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-[#6b95ff]/10 to-transparent rounded-full blur-[80px] transform -translate-x-1/2 animate-pulse-slow"></div>
		</div>

		<!-- Primary Content -->
		<div class="flex flex-col items-center space-y-6 md:space-y-8 text-center max-w-3xl mb-8 md:mb-12 relative">
			<!-- Enhanced Feature Highlight -->
			<div class="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-full py-2 md:py-2.5 px-4 md:px-5 text-sm font-medium text-gray-800 shadow-sm transform hover:scale-105 transition-all duration-300 w-auto">
				{#each [features[activeFeature]] as feature (activeFeature)}
					<div class="flex items-center gap-2 md:gap-2.5" in:fade={{ duration: 300 }}>
						<span class="text-base md:text-lg">{feature.icon}</span>
						<span class="font-semibold">{feature.text}</span>
					</div>
				{/each}
			</div>

			<h1 class="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight">
				Convert HTML to Images<br/><span class="text-[#ff6b6b]">5x Faster</span>
			</h1>
			
			<p class="text-lg md:text-xl text-gray-800 max-w-2xl leading-relaxed font-medium px-4 md:px-0">
				The most reliable HTML to image API, trusted by 10,000+ developers. Generate pixel-perfect images in milliseconds with our powerful API or let our AI agent capture any website automatically.
			</p>

			<div class="flex flex-col sm:flex-row items-center gap-4 md:gap-5 w-full max-w-md pt-4">
				<div class="w-full transform hover:scale-105 transition-transform duration-300">
					<SignUpButton />
				</div>
			</div>
		</div>

		<!-- Enhanced Secondary Content -->
		<div class="w-full max-w-2xl space-y-4 md:space-y-6 px-4 md:px-0">
			<!-- Enhanced Limited Time Offer -->
			<div class="bg-gradient-to-r from-[#fff3e5] to-white/90 backdrop-blur-sm border border-[#ffc480]/50 rounded-xl md:rounded-2xl p-4 md:p-5 transform hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md">
				<div class="flex items-center justify-center gap-3 md:gap-4">
					<div class="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#ff6b6b]/15">
						<svg class="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
					</div>
					<p class="font-medium text-base md:text-lg text-gray-800">
						<span class="text-[#ff6b6b] font-bold">Special Offer:</span> Double Credits + Priority Support
					</p>
				</div>
			</div>

			<!-- Enhanced Social Proof Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
				<div class="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm transition-all duration-300">
					<div class="flex flex-col items-center gap-1 md:gap-2">
						<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">1M+</div>
						<div class="text-sm font-medium text-gray-700">Images Generated</div>
					</div>
				</div>
				<div class="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm transition-all duration-300">
					<div class="flex flex-col items-center gap-1 md:gap-2">
						<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">4.8/5</div>
						<div class="text-sm font-medium text-gray-700">User Rating</div>
					</div>
				</div>
				<div class="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm transition-all duration-300">
					<div class="flex flex-col items-center gap-1 md:gap-2">
						<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">5x</div>
						<div class="text-sm font-medium text-gray-700">Faster</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	@keyframes pulse {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 0.3; }
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	@keyframes float-delayed {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(20px); }
	}

	.animate-float {
		animation: float 6s ease-in-out infinite;
	}

	.animate-float-delayed {
		animation: float-delayed 8s ease-in-out infinite;
	}

	.animate-pulse-slow {
		animation: pulse 4s ease-in-out infinite;
	}
</style>