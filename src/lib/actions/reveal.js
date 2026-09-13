import { inView } from './inView.js';

/**
 * Svelte action: one-shot scroll reveal.
 *
 * Adds `data-reveal` on mount and `data-revealed` when the node first enters the
 * viewport. The hiding rule in app.css is gated on a `.motion` class that only
 * appears once the client has run, so a blocked or broken bundle leaves the page
 * fully visible and merely un-animated. Content must never depend on JS to be
 * readable — this page has already been caught out by that once.
 *
 * @param {Element} node
 * @param {{ delay?: number, rootMargin?: string, threshold?: number }} [options]
 */
export function reveal(node, options = {}) {
	const { delay = 0, ...ioOptions } = options;

	node.setAttribute('data-reveal', '');
	if (delay) node.style.setProperty('--rd', `${delay}ms`);

	const onEnter = () => node.setAttribute('data-revealed', '');
	node.addEventListener('enter', onEnter);
	const observer = inView(node, ioOptions);

	return {
		destroy() {
			node.removeEventListener('enter', onEnter);
			observer.destroy?.();
		}
	};
}
