<script>
	import BetalistLogo from '$lib/assets/landing-page/betalist-logo.svg';
	import PeerlistLogo from '$lib/assets/landing-page/POM.svg';
</script>

<div class="max-w-5xl px-4 py-16 md:py-20 mx-auto">
	<!-- Section Header -->
	<div class="text-center space-y-3 mb-12">
		<div
			class="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ffc480]/30 rounded-full border-2 border-gray-900 text-sm font-bold"
		>
			<span>🏆</span> Trusted & Recognized
		</div>
		<h2 class="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
			Featured on <span class="text-[#ff6b6b]">Leading Platforms</span>
		</h2>
		<p class="text-lg text-gray-600 max-w-xl mx-auto">
			Trusted by 10K+ teams to generate 50M+ images
		</p>
	</div>

	<!-- Recognition Grid -->
	<div class="grid md:grid-cols-3 gap-5 mb-10">
		<a
			href="https://peerlist.io/suyashthakur/project/pictifyio"
			target="_blank"
			class="group flex flex-col items-center p-6 bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
		>
			<div class="w-20 h-20 md:w-24 md:h-24 mb-4 p-3 bg-white rounded-xl border-2 border-gray-900">
				<img src={PeerlistLogo} alt="Peerlist Logo" class="w-full h-full object-contain" />
			</div>
			<span
				class="px-3 py-1 bg-[#ffc480] rounded-full border-2 border-gray-900 text-xs font-bold text-gray-900 mb-1"
			>
				Product of the Month
			</span>
			<span class="text-sm text-gray-600">on Peerlist</span>
		</a>

		<a
			href="https://betalist.com/startups/pictify-io"
			target="_blank"
			class="group flex flex-col items-center p-6 bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
		>
			<div class="w-20 h-20 md:w-24 md:h-24 mb-4 p-3 bg-white rounded-xl border-2 border-gray-900">
				<img src={BetalistLogo} alt="Betalist Logo" class="w-full h-full object-contain" />
			</div>
			<span
				class="px-3 py-1 bg-[#ff6b6b] text-white rounded-full border-2 border-gray-900 text-xs font-bold mb-1"
			>
				Featured Startup
			</span>
			<span class="text-sm text-gray-600">on Betalist</span>
		</a>

		<a
			href="https://www.saashub.com/pictify-io"
			target="_blank"
			class="group flex flex-col items-center p-6 bg-[#FFFDF8] rounded-xl border-[3px] border-gray-900 shadow-[4px_4px_0_0_#1f293780] hover:shadow-[2px_2px_0_0_#1f293780] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
		>
			<div class="w-20 h-20 md:w-24 md:h-24 mb-4 p-3 bg-white rounded-xl border-2 border-gray-900">
				<img
					src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
					alt="SaaSHub Badge"
					class="w-full h-full object-contain"
				/>
			</div>
			<span
				class="px-3 py-1 bg-green-400 rounded-full border-2 border-gray-900 text-xs font-bold text-gray-900 mb-1"
			>
				Approved Product
			</span>
			<span class="text-sm text-gray-600">on SaaSHub</span>
		</a>
	</div>

	<!-- Stats Row -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div
			class="text-center p-4 bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f293780]"
		>
			<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">&lt;500ms</div>
			<div class="text-xs text-gray-600 mt-1">Avg. Response</div>
		</div>
		<div
			class="text-center p-4 bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f293780]"
		>
			<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">50M+</div>
			<div class="text-xs text-gray-600 mt-1">Images Generated</div>
		</div>
		<div
			class="text-center p-4 bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f293780]"
		>
			<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">99.9%</div>
			<div class="text-xs text-gray-600 mt-1">Uptime SLA</div>
		</div>
		<div
			class="text-center p-4 bg-white rounded-xl border-[3px] border-gray-900 shadow-[3px_3px_0_0_#1f293780]"
		>
			<div class="text-2xl md:text-3xl font-bold text-[#ff6b6b]">10K+</div>
			<div class="text-xs text-gray-600 mt-1">Companies</div>
		</div>
	</div>
</div>
