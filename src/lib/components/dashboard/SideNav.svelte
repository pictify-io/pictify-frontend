<script>
	import { page } from '../../../store/pages.store';
	import { logoutAction } from '../../../store/user.store';
	import { goto } from '$app/navigation';
	import CollapseIcon from '$lib/assets/dashboard/CollapseArrow.png';
	import { PUBLIC_DOCS_URL } from '$env/static/public';
	import { getPaymentPortal } from '../../../api/user';
	import { user } from '../../../store/user.store';
	import { onMount, onDestroy } from 'svelte';

	let isMediaListExpanded = false;
	let isPaidPlan = false;
	let isToolsExpanded = false;

	function toggleMediaList() {
		isMediaListExpanded = !isMediaListExpanded;
	}

	function toggleToolsList() {
		isToolsExpanded = !isToolsExpanded;
	}

	let unsubscribe = () => {};

	onMount(async () => {
		unsubscribe = user.subscribe((u) => {
			isPaidPlan = u.currentPlan !== 'starter' && u.currentPlan !== 'free';
		});
	});

	onDestroy(() => {
		unsubscribe();
	});

	async function gotoPaymentPortal() {
		const paymentPortal = await getPaymentPortal();
		if (!paymentPortal.portalLink) {
			return;
		}
		window.open(paymentPortal.portalLink, '_blank');
	}

	function logout() {
		logoutAction();
		goto('/');
	}
</script>

<div class="flex flex-col h-full bg-white w-64">
	<!-- Navigation -->
	<div class="flex-1 overflow-y-auto py-4">
		<nav class="space-y-1 px-4">
			<!-- API Usage -->
			<a
				href="/dashboard/api-token"
				class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
			>
				<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
				</svg>
				API Usage
			</a>

			<!-- Subscription -->
			{#if isPaidPlan}
				<a
					href="#"
					on:click={gotoPaymentPortal}
					class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
				>
					<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
					Subscription
				</a>
			{:else}
				<a
					href="/pricing"
					class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
				>
					<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
					</svg>
					Subscription
				</a>
			{/if}

			<!-- Divider -->
			<div class="border-t border-gray-200 my-4"></div>

			<!-- Created Media Section -->
			<div class="space-y-1">
				<button
					on:click={toggleMediaList}
					class="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
				>
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
						</svg>
						Created Media
					</div>
					<svg
						class="w-4 h-4 text-gray-400 transform"
						class:rotate-180={isMediaListExpanded}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
					</svg>
				</button>

				{#if isMediaListExpanded}
					<div class="pl-4 space-y-1">
						<a
							href="/dashboard/media/images"
							class="group flex items-center px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
						>
							<svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
							Images
						</a>
						<a
							href="/dashboard/media/gifs"
							class="group flex items-center px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
						>
							<svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
							</svg>
							GIFs
						</a>
					</div>
				{/if}
			</div>

			<!-- Templates -->
			<a
				href="/dashboard/template"
				class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
			>
				<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
				Templates
			</a>

			<!-- API Playground -->
			<a
				href="/dashboard/api-playground"
				class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
			>
				<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
				</svg>
				API Playground
			</a>

			<!-- AI Agent Screenshot -->
			<a
				href="/dashboard/tools/agent-screenshot"
				class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
			>
				<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
				</svg>
				AI Agent Screenshot
			</a>

			<!-- Tools Section -->
			<div class="space-y-1">
				<button
					on:click={toggleToolsList}
					class="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
				>
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
						</svg>
						Tools
					</div>
					<svg
						class="w-4 h-4 text-gray-400 transform"
						class:rotate-180={isToolsExpanded}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
					</svg>
				</button>

				{#if isToolsExpanded}
					<div class="pl-4 space-y-1">
						<a
							href="/dashboard/tools/og-image-generator"
							class="group flex items-center px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
						>
							<svg class="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
							</svg>
							OG Image Generator
						</a>
					</div>
				{/if}
			</div>

			<!-- Divider -->
			<div class="border-t border-gray-200 my-4"></div>

            <!-- Docs and Support -->
			<a
				href={PUBLIC_DOCS_URL}
				target="_blank"
				class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
			>
				<svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
				</svg>
				Docs & Support
			</a>
            <a
                href="https://status.pictify.io"
                target="_blank"
                class="group flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-sm hover:border hover:border-gray-200"
            >
                <svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Status
            </a>
		</nav>
	</div>

	<!-- Footer -->
	<div class="border-t border-gray-200 p-4">
		<button
			on:click={logout}
			class="group flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
		>
			<svg class="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
			</svg>
			Logout
		</button>
	</div>
</div>
