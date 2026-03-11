<script>
	import { onMount, onDestroy } from 'svelte';
	import MilestoneCelebration from './MilestoneCelebration.svelte';
	import UpgradeModal from './UpgradeModal.svelte';
	import OverageWarningModal from './OverageWarningModal.svelte';
	import {
		initPLG,
		refreshUsageWidget,
		plgStatus,
		checkRenderMilestone
	} from '../../../store/plg.store';

	let refreshInterval;
	let initialized = false;

	onMount(async () => {
		await initPLG();
		initialized = true;

		// Refresh usage widget every 2 minutes
		refreshInterval = setInterval(refreshUsageWidget, 120000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	// Expose methods for child components
	export function triggerMilestoneCheck(count) {
		checkRenderMilestone(count);
	}
</script>

<!-- Main slot for app content -->
<slot />

<!-- Global PLG components -->
{#if initialized}
	<MilestoneCelebration />
	<UpgradeModal />
	<OverageWarningModal />
{/if}
