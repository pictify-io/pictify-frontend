<script>
	/**
	 * A brand-new timeline template. The studio runs with `template = null`
	 * until its first save, which mints a uid and swaps the URL to
	 * /dashboard/video-templates/[uid]/studio without remounting the engine.
	 *
	 * Format comes in as ?w=&h=&fps= from the mode chooser, so the artboard is
	 * right from the first frame instead of defaulting to 9:16 and forcing a
	 * resize.
	 *
	 * ?starter=<id> seeds a scene from src/lib/video/starters.js. The clips are
	 * resolved HERE rather than inside the studio, so the studio stays a plain
	 * editor that takes clips instead of a catalogue key it would have to look
	 * up itself.
	 */
	import { page } from '$app/stores';
	import VideoStudio from '$lib/components/video/VideoStudio.svelte';
	import { buildStarterClips, starterById, starterDurationUs } from '$lib/video/starters.js';

	const int = (value, fallback) => {
		const parsed = Math.round(Number(value));
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	};

	$: starter = starterById($page.url.searchParams.get('starter') || '');
	$: width = int($page.url.searchParams.get('w'), 1080);
	$: height = int($page.url.searchParams.get('h'), 1920);
	$: fps = int($page.url.searchParams.get('fps'), 30);
	$: durationUs = starter ? starterDurationUs(starter.id) : 0;

	$: starterClips = starter
		? buildStarterClips(starter.id, { width, height, durationUs })
		: null;

	$: draft = {
		uid: null,
		// A starter names itself, so a list of saved templates does not fill up
		// with "Untitled video" rows the user has to open to tell apart.
		name: $page.url.searchParams.get('name') || starter?.name || 'Untitled video',
		kind: 'timeline',
		projectJson: null,
		variableDefinitions: [],
		width,
		height,
		fps,
		// Long enough to hold the starter's last clip, or the scene is cut short
		// the moment it loads.
		durationInFrames: starter ? Math.round((durationUs / 1_000_000) * fps) : undefined,
		status: 'draft'
	};
</script>

<VideoStudio template={draft} {starterClips} />
