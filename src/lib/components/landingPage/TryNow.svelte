<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import SignUpButton from './SignUpButton.svelte';
	
	let email = '';
	let savings = 1000;
	let showCalculator = false;
    let visible = false;

	const features = [
		{
			icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
			title: "Affordable Plans",
			description: "Start free, then choose from our budget-friendly monthly plans"
		},
		{
			icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
			title: "Enterprise Ready",
			description: "Built for scale with advanced security and support"
		},
		{
			icon: "M13 10V3L4 14h7v7l9-11h-7z",
			title: "Start Instantly",
			description: "Get your API key and start converting in under 5 minutes"
		}
	];

	function handleSubmit() {
		goto('/signup?email=' + email);
	}

	function calculateSavings(value) {
		savings = Math.floor(value * 20.8);
	}

	onMount(() => {
		visible = true;
		const interval = setInterval(() => {
			savings = Math.floor(Math.random() * 500) + 800;
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<section class="py-12 sm:py-16 w-full relative" id="try-now">
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/10 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"></div>
		<div class="absolute bottom-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/10 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"></div>
	</div>

	<div class="container mx-auto px-4 md:px-6 max-w-5xl relative">
		{#if visible}
		<div class="text-center space-y-4 md:space-y-6 mb-8 md:mb-12" in:fade={{ duration: 1000, delay: 200 }}>
			<h2 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
				Start Building <span class="text-[#ff6b6b]">Today</span>
			</h2>
			<p class="text-lg md:text-xl text-gray-800 max-w-2xl mx-auto font-medium">Join thousands of developers who trust Pictify for their image generation needs</p>
		</div>

		<!-- Feature Highlights -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
			{#each features as feature}
				<div class="bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-xl border border-gray-200 transition-all duration-300 hover:border-[#ff6b6b]/30 hover:shadow-md">
					<div class="flex items-center gap-3 mb-3 md:mb-4">
						<div class="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-[#ff6b6b]/10 rounded-full flex items-center justify-center">
							<svg class="w-4 h-4 md:w-5 md:h-5 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d={feature.icon} clip-rule="evenodd"/>
							</svg>
						</div>
						<h3 class="text-base md:text-lg font-semibold text-gray-900">{feature.title}</h3>
					</div>
					<p class="text-sm md:text-base text-gray-700">{feature.description}</p>
				</div>
			{/each}
		</div>

		<!-- Promotional Banner -->
		<div class="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-xl md:rounded-2xl shadow-lg relative overflow-hidden mb-8 md:mb-12 border border-gray-200" in:fade={{ duration: 1000, delay: 400 }}>
			<!-- Decorative elements -->
			<div class="absolute inset-0">
				<div class="absolute -left-8 -bottom-8 w-40 h-40 bg-[#ff6b6b]/5 rounded-full blur-2xl"></div>
				<div class="absolute -right-8 -top-8 w-40 h-40 bg-[#ffc480]/5 rounded-full blur-2xl"></div>
			</div>
			
			<div class="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
				<div class="text-center md:text-left space-y-2 md:space-y-3">
					<div class="flex items-center justify-center md:justify-start gap-2 mb-1">
						<div class="w-6 h-6 flex items-center justify-center rounded-full bg-[#ff6b6b]/10">
							<svg class="w-4 h-4 text-[#ff6b6b]" fill="currentColor" viewBox="0 0 20 20">
								<path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
							</svg>
						</div>
						<h3 class="text-lg md:text-xl font-bold text-gray-900">Limited Time Offer</h3>
					</div>
					<div class="space-y-1">
						<p class="text-2xl md:text-3xl font-bold text-gray-900">
							Double Credits + <span class="text-[#ff6b6b]">Priority Support</span>
						</p>
						<p class="text-sm md:text-base text-gray-700">
							Limited time offer for early adopters. Sign up now!
						</p>
					</div>
				</div>
				<div class="w-full md:w-auto">
					<SignUpButton />
				</div>
			</div>
		</div>

		{/if}
	</div>
</section>

<style>
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
</style>
