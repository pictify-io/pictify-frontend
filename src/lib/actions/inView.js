/**
 * Svelte action: dispatches `enter` the first time a node scrolls into the
 * viewport, then stops observing. Reveals are one-shot by design — replaying
 * them on every scroll past turns a page into a slot machine.
 *
 * It dispatches an event rather than setting an attribute itself: Svelte's CSS
 * pruning drops selectors whose hooks never appear in the template, so a
 * runtime-only `[data-in-view]` would silently compile away. Let the component
 * flip a `class:` it declares, and the rule survives.
 *
 * @param {Element} node
 * @param {{ rootMargin?: string, threshold?: number }} [options]
 */
export function inView(node, options = {}) {
	/*
	 * The huge top margin extends the observer's root far above the viewport, so
	 * anything the user has already scrolled past counts as intersecting and
	 * fires at once. Without it an anchor jump, a restored scroll position or a
	 * press of End leaves everything it skipped permanently hidden — which is
	 * survivable for a decoration and not survivable for content.
	 *
	 * The negative bottom margin is the actual trigger line: reveal a little
	 * before the element reaches the bottom edge.
	 */
	const { rootMargin = '10000px 0px -12% 0px', threshold = 0 } = options;
	const fire = () => node.dispatchEvent(new CustomEvent('enter'));

	if (typeof IntersectionObserver === 'undefined') {
		// Land on the finished state rather than leaving the node hidden. Deferred
		// so the component's listener is attached before it fires.
		queueMicrotask(fire);
		return {};
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				observer.disconnect();
				fire();
			}
		},
		{ rootMargin, threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
