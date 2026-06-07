<script>
	import { createEventDispatcher } from 'svelte';
	import UsageWidget from '../plg/UsageWidget.svelte';
	import { trialInfo } from '../../../store/plg.store';
	import { openUpgradeModal } from '../../../store/upgrade-modal.store';

	const dispatch = createEventDispatcher();

	function toggleSidebar() {
		dispatch('toggleSidebar');
	}
</script>

<header
	class="w-full min-h-[64px] h-16 sm:min-h-[80px] sm:h-20 z-30 border-b-[3px] border-gray-900 bg-brand-bg flex justify-between items-stretch sticky top-0 flex-shrink-0"
>
	<!-- Left Section: Brand -->
	<div class="flex items-stretch flex-shrink-0">
		<!-- Mobile Menu Toggle (only on small screens) -->
		<button
			class="lg:hidden w-14 min-h-[64px] sm:min-h-[80px] flex items-center justify-center border-r-[3px] border-gray-900 hover:bg-gray-100 transition-colors"
			on:click={toggleSidebar}
			aria-label="Toggle sidebar"
		>
			<svg
				class="w-5 h-5 sm:w-6 sm:h-6 text-gray-900"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>

		<!-- Brand Logo Area - Match sidebar width exactly -->
		<a
			href="/"
			class="hidden lg:flex w-64 min-w-[16rem] min-h-[64px] sm:min-h-[80px] flex-shrink-0 items-center justify-center px-4 sm:px-6 no-underline cursor-pointer border-r-[3px] border-gray-900 hover:bg-brand-accent transition-all group relative overflow-hidden"
		>
			<div class="flex items-center gap-2 sm:gap-3">
				<!-- Logo Icon (Abstract Shapes) -->
				<div
					class="w-7 h-7 sm:w-8 sm:h-8 bg-gray-900 rounded-md flex items-center justify-center shadow-brutal-accent-sm sm:shadow-[3px_3px_0_0_#ffc480] group-hover:shadow-none group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-all border-2 border-transparent"
				>
					<svg
						class="w-4 h-4 sm:w-5 sm:h-5 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="3"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				</div>

				<!-- Text - Always show on larger screens, hide when collapsed on desktop -->
				<div class="flex flex-col">
					<span
						class="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-none group-hover:translate-x-1 transition-transform"
						>PICTIFY</span
					>
					<span
						class="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none group-hover:text-gray-900 transition-colors"
						>Dashboard</span
					>
				</div>
			</div>
		</a>
	</div>

	<!-- Center Area: Context / Breadcrumbs Placeholder (Optional) -->
	<div class="hidden lg:flex flex-1 items-center px-4 xl:px-8">
		<!-- Could add breadcrumbs here later -->
	</div>

	<!-- Right Side: System Status / Usage -->
	<div class="flex items-stretch border-l-[3px] border-gray-900 flex-shrink-0">
		{#if $trialInfo.isOnTrial}
			{@const days = $trialInfo.daysRemaining ?? 0}
			{@const iconColor =
				days <= 3 ? 'text-brand-danger' : days <= 7 ? 'text-[#c88a3b]' : 'text-gray-900'}
			<!-- Trial countdown -->
			<div class="hidden items-center px-3 sm:flex md:px-4 border-r-[3px] border-gray-900">
				<button
					type="button"
					on:click={() => openUpgradeModal('trial_badge')}
					aria-label={`Free trial: ${days} day${days === 1 ? '' : 's'} left. Upgrade your plan.`}
					class="group flex items-stretch overflow-hidden rounded-lg border-2 border-gray-900 bg-white shadow-brutal-sm transition-all duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal-md active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0_0_#1f2937] focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-brand-accent motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
				>
					<span class="flex items-center gap-1.5 py-1.5 pl-2.5 pr-2.5">
						<svg
							class="h-4 w-4 shrink-0 {iconColor}"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="9" />
							<path d="M12 7.5V12l2.5 1.5" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<span class="whitespace-nowrap leading-none">
							<span class="text-sm font-bold tabular-nums text-gray-900">{days}</span>
							<span class="ml-0.5 hidden text-[11px] font-medium text-gray-600 md:inline"
								>day{days === 1 ? '' : 's'} left</span
							>
						</span>
					</span>
					<span
						class="flex items-center border-l-2 border-gray-900 bg-brand-accent px-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-900 transition-colors group-hover:bg-[#ffb968]"
					>
						Upgrade
					</span>
				</button>
			</div>
		{/if}
		<!-- Usage Widget Container -->
		<div
			class="flex items-center px-3 sm:px-4 md:px-6 min-h-[64px] sm:min-h-[80px] hover:bg-gray-50 transition-colors relative group"
		>
			<UsageWidget compact={true} />
		</div>

		<!-- User Profile Placeholder (If needed in future, or added here) -->
		<!-- For now, sticking to the request to just fix the header design language -->
	</div>
</header>
