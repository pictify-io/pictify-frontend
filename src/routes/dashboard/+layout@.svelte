<script>
	import Wordmark from '$lib/components/landing/Wordmark.svelte';
	import '../../app.css';
	import RailV2 from '$lib/components/dashboard/v2/RailV2.svelte';
	import CommandPalette from '$lib/components/dashboard/CommandPalette.svelte';
	import PLGProvider from '$lib/components/plg/PLGProvider.svelte';
	import ProactiveUpgradeModal from '$lib/components/plg/ProactiveUpgradeModal.svelte';
	import { getUser } from '../../store/user.store';
	import { initOnboarding } from '../../store/onboarding.store';

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let user = null;
	let isUserLoaded = false;
	let railOpen = false;

	// Close the mobile rail on navigation.
	$: if ($page.url.pathname) railOpen = false;

	onMount(async () => {
		user = await getUser();
		if (!user || !user?.email) {
			goto('/login');
			return;
		}
		await initOnboarding();
		isUserLoaded = true;
	});
</script>

<svelte:head>
	<title>Pictify.io: Dashboard</title>
</svelte:head>

<PLGProvider>
	<div class="flex h-screen flex-col overflow-hidden bg-brand-paper">
		<!-- Email verification lives in the rail (VerifyEmailCard), not a banner. -->

		<!-- Mobile top bar: the rail is desktop furniture; small screens get the
		     mark and a toggle. -->
		<header
			class="flex h-14 flex-shrink-0 items-center justify-between border-b border-brand-rule px-4 lg:hidden"
		>
			<a href="/dashboard" class="flex items-center" aria-label="Pictify home">
				<Wordmark responsive={false} />
			</a>
			<button
				type="button"
				on:click={() => (railOpen = !railOpen)}
				class="flex h-9 w-9 flex-col items-center justify-center gap-[3px] rounded-btn border border-brand-rule"
				aria-label="Toggle navigation"
				aria-expanded={railOpen}
			>
				<span class="block h-0.5 w-4 bg-brand-ink" />
				<span class="block h-0.5 w-4 bg-brand-ink" />
				<span class="block h-0.5 w-4 bg-brand-ink" />
			</button>
		</header>

		<div class="relative flex w-full flex-grow overflow-hidden">
			{#if railOpen}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="fixed inset-0 z-40 bg-black/50 lg:hidden"
					on:click={() => (railOpen = false)}
					on:keydown={(e) => e.key === 'Escape' && (railOpen = false)}
					role="button"
					tabindex="0"
					aria-label="Close navigation"
				/>
			{/if}

			<div
				class="fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:relative lg:z-0 lg:translate-x-0
				{railOpen ? 'translate-x-0' : '-translate-x-full'}"
			>
				<RailV2 />
			</div>

			<main
				class="min-w-0 flex-grow overflow-y-auto overflow-x-hidden"
				style="scrollbar-gutter: stable;"
			>
				{#if isUserLoaded}
					<slot />
				{:else}
					<div class="flex h-full items-center justify-center">
						<span class="block h-3 w-3 animate-pulse bg-brand-field" aria-label="Loading" />
					</div>
				{/if}
			</main>
		</div>
	</div>

	{#if isUserLoaded}
		<ProactiveUpgradeModal />
	{/if}

	<CommandPalette />
</PLGProvider>
