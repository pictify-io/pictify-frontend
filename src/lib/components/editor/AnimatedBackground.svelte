<div class="absolute inset-0 overflow-hidden pointer-events-none opacity-60 z-0">
	<div
		class="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ff6b6b]/20 to-transparent rounded-full blur-[100px] transform -translate-y-1/2 animate-float"
	/>
	<div
		class="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-[#ffc480]/20 to-transparent rounded-full blur-[100px] transform translate-y-1/2 animate-float-delayed"
	/>
	<div
		class="absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-[#6b95ff]/10 to-transparent rounded-full blur-[80px] transform -translate-x-1/2 animate-pulse-slow"
	/>
</div>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) translateX(0px);
		}
		33% {
			transform: translateY(-20px) translateX(10px);
		}
		66% {
			transform: translateY(10px) translateX(-10px);
		}
	}

	@keyframes float-delayed {
		0%,
		100% {
			transform: translateY(0px) translateX(0px);
		}
		33% {
			transform: translateY(10px) translateX(-10px);
		}
		66% {
			transform: translateY(-20px) translateX(10px);
		}
	}

	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.6;
		}
	}

	.animate-float {
		animation: float 20s ease-in-out infinite;
	}

	.animate-float-delayed {
		animation: float-delayed 20s ease-in-out infinite;
		animation-delay: -10s;
	}

	.animate-pulse-slow {
		animation: pulse-slow 8s ease-in-out infinite;
	}
</style>
