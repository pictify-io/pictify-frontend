<script>
	import '../../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUser } from '../../store/user.store';
	import { completeOnboardingStep } from '../../api/onboarding';
	import Loader from '$lib/components/Loader.svelte';

	let isVerifying = true;

	onMount(async () => {
		const currentUser = await getUser();
		if (!currentUser || !currentUser.email) {
			goto('/login');
			return;
		}

		// Complete the try_editor onboarding step
		completeOnboardingStep('try_editor').catch(() => {
			// Silently ignore errors - onboarding is not critical
		});

		isVerifying = false;
	});
</script>

<svelte:head>
	<title>Pictify.io · Template Workspace</title>
</svelte:head>

{#if isVerifying}
	<div class="flex h-screen w-screen items-center justify-center bg-gray-50">
		<Loader size="12" show />
	</div>
{:else}
	<div class="h-screen w-screen overflow-hidden bg-white">
		<slot />
	</div>
{/if}

