<script>
	/**
	 * Decorative lozenge that hangs off a page edge. Slides in along the axis it
	 * bleeds from, so the motion reads as the shape arriving from off-page rather
	 * than fading up in place.
	 *
	 * Size, rotation, colour and position all come from the caller's classes —
	 * this only owns the reveal.
	 */
	import { onMount } from 'svelte';
	import { inView } from '$lib/actions/inView.js';

	/** Edge the capsule hangs off; sets which way it travels in from. */
	/** @type {'l' | 'r'} */
	export let from = 'r';
	/** Extra classes — position, size, rotation and fill live here. */
	let className = '';
	export { className as class };

	/** Seconds for one drift cycle. Varied per capsule so they never march in step. */
	export let drift = 11;

	$: offset = from === 'l' ? '-120px' : '120px';

	let armed = false;
	let revealed = false;
	onMount(() => {
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
		armed = true;
	});
</script>

<div
	class="capsule absolute rounded-full {className}"
	class:armed
	class:revealed
	style="--cx:{offset}; --drift:{drift}s"
	aria-hidden="true"
	use:inView
	on:enter={() => (revealed = true)}
></div>

<style>
	.capsule.armed {
		opacity: 0;
	}

	/*
	 * `translate`, not `transform` — these carry a Tailwind rotate utility, and a
	 * transform here would overwrite it for the life of the animation's fill.
	 */
	/*
	 * Reveal, then an endless drift so the page is never wholly static. Both
	 * animations own `translate`; the drift carries no backwards fill, so during
	 * its delay the reveal still wins, and once live the later one takes over.
	 */
	.capsule.armed.revealed {
		animation:
			capsule-in 900ms cubic-bezier(0.16, 1, 0.3, 1) both,
			capsule-drift var(--drift) ease-in-out 900ms infinite;
	}

	@keyframes capsule-in {
		from {
			opacity: 0;
			translate: var(--cx) 0;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}

	@keyframes capsule-drift {
		0%,
		100% {
			translate: 0 0;
		}
		50% {
			translate: 0 -14px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.capsule.armed,
		.capsule.armed.revealed {
			animation: none;
			opacity: 1;
			translate: none;
		}
	}
</style>
