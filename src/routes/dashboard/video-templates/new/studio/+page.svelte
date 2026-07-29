<script>
	/**
	 * A brand-new timeline template. The studio runs with `template = null`
	 * until its first save, which mints a uid and swaps the URL to
	 * /dashboard/video-templates/[uid]/studio without remounting the engine.
	 *
	 * Format comes in as ?w=&h=&fps= from the mode chooser, so the artboard is
	 * right from the first frame instead of defaulting to 9:16 and forcing a
	 * resize.
	 */
	import { page } from '$app/stores';
	import VideoStudio from '$lib/components/video/VideoStudio.svelte';

	const int = (value, fallback) => {
		const parsed = Math.round(Number(value));
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	};

	$: draft = {
		uid: null,
		name: $page.url.searchParams.get('name') || 'Untitled video',
		kind: 'timeline',
		projectJson: null,
		variableDefinitions: [],
		width: int($page.url.searchParams.get('w'), 1080),
		height: int($page.url.searchParams.get('h'), 1920),
		fps: int($page.url.searchParams.get('fps'), 30),
		status: 'draft'
	};
</script>

<VideoStudio template={draft} />
