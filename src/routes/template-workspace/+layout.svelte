<script>
	import '../../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getUser } from '../../store/user.store';
	import { completeOnboardingStep } from '../../api/onboarding';
	import { initPLG } from '../../store/plg.store';
	import { initializeTeamState } from '../../store/team.store';
	import Loader from '$lib/components/Loader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { notify } from '../../store/toast.store';

	let isVerifying = true;

	onMount(async () => {
		let currentUser = null;
		try {
			currentUser = await getUser();
		} catch (err) {
			// Unreachable server, not a signed-out visitor: show the studio
			// chrome and say so rather than redirecting to /login.
			notify.fail('Load workspace', err, { retry: () => window.location.reload() });
			isVerifying = false;
			return;
		}
		if (!currentUser || !currentUser.email) {
			goto('/login');
			return;
		}

		// Initialize team state and PLG in parallel (needed for feature gating like AI Copilot)
		await Promise.all([initializeTeamState().catch(() => {}), initPLG().catch(() => {})]);

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

<!-- One mount for the studio, outside the verifying branch so a failure that
     arrives while the user check is still running is not swallowed. -->
<Toast />
