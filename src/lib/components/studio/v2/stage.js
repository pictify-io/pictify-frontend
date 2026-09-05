import DOMPurify from 'dompurify';
import { ATTR } from './node-ids.js';

/**
 * The visual stage. B02.
 *
 * Adapted from src/routes/test/visual-html/dom-editor.js, which stays as the
 * dev-only prototype. Three rules from the handoff are enforced here that the
 * prototype did not have, and each one protects a design from being quietly
 * restructured by a drag:
 *
 *   FLOW ELEMENTS ARE OFFSET, NEVER REPOSITIONED. Dragging something that sits
 *   in normal flow applies a transform. It does not switch it to absolute.
 *   NEVER AUTO-CONVERT A FLEX CHILD. The prototype set `flex: none` on every
 *   resize, which silently takes an element out of its parent's layout — the
 *   design then looks right at that size and breaks for every other value.
 *   UNSUPPORTED TRANSFORMS DISABLE THE HANDLES, WITH A REASON. An element
 *   inside an already-transformed ancestor cannot be dragged predictably, so it
 *   says so rather than moving to somewhere the renderer will not reproduce.
 */

/** Editor chrome is marked so it can never be serialized into the design. */
const UI = 'data-editor-ui';

export function cleanHtml(html) {
	return DOMPurify.sanitize(html, {
		WHOLE_DOCUMENT: true,
		FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'meta', 'link', 'form'],
		FORBID_ATTR: ['srcdoc', 'autofocus']
	});
}

/** Elements whose text is not editable in place. */
const ATOMIC = new Set(['IMG', 'SVG', 'PATH', 'HR', 'BR', 'INPUT', 'VIDEO']);

/**
 * How an element participates in layout, which decides what a drag may do.
 *
 * `free` — already absolutely or fixed positioned: a drag sets left/top.
 * `flow` — in normal flow: a drag applies a transform OFFSET only.
 * `flex` — a child of a flex or grid parent: offset only, and resizing must
 *          not add `flex: none`, because that removes it from the layout.
 */
export function layoutRole(el, view) {
	const css = view.getComputedStyle(el);
	if (css.position === 'absolute' || css.position === 'fixed') return 'free';
	const parent = el.parentElement;
	if (parent) {
		const parentDisplay = view.getComputedStyle(parent).display;
		if (/flex|grid/.test(parentDisplay)) return 'flex';
	}
	return 'flow';
}

/**
 * An ancestor transform makes drag maths unreliable, and the renderer would not
 * reproduce the result. Report it rather than allowing a move that lands
 * somewhere else in the output.
 */
export function blockedReason(el, view) {
	let node = el.parentElement;
	while (node && node.tagName !== 'BODY') {
		const t = view.getComputedStyle(node).transform;
		if (t && t !== 'none') return 'Inside a rotated or scaled group — move that group instead.';
		node = node.parentElement;
	}
	return null;
}

/**
 * Serialize the design.
 *
 * Strips editor chrome, `contenteditable`, and any selection markers — the
 * saved HTML must be exactly what the renderer will receive, with nothing the
 * editor added to make itself work.
 */
export function serialize(doc) {
	const clone = doc.body.cloneNode(true);
	clone.querySelectorAll(`[${UI}]`).forEach((el) => el.remove());
	clone
		.querySelectorAll('[contenteditable]')
		.forEach((el) => el.removeAttribute('contenteditable'));
	clone.querySelectorAll('[data-selected]').forEach((el) => el.removeAttribute('data-selected'));
	return clone.innerHTML;
}

/**
 * Attach the editor to an iframe document.
 *
 * `onTransaction(label, html)` is called ONCE per completed gesture — a drag,
 * a resize, a text commit — never per mousemove and never per keystroke. That
 * is what makes one undo step equal one thing the buyer did.
 */
export async function attachStage(frame, { onTransaction, onSelection, onStatus, width, height }) {
	const [{ default: Moveable }, { default: Selecto }] = await Promise.all([
		import('moveable'),
		import('selecto')
	]);

	const doc = frame.contentDocument;
	const view = frame.contentWindow;
	if (!doc?.body) throw new Error('Stage document is unavailable');

	let targets = [];
	let editing = null;

	const overlay = doc.createElement('div');
	overlay.setAttribute(UI, 'controls');
	doc.body.appendChild(overlay);

	const moveable = new Moveable(overlay, {
		container: doc.body,
		dragContainer: view,
		target: [],
		draggable: true,
		resizable: true,
		// Rotation is off for anything bound to a field: rotated text with a
		// variable length is the fastest way to produce a card that fits the
		// sample and clips a real customer's name.
		rotatable: false,
		snappable: true,
		snapThreshold: 6,
		origin: false,
		horizontalGuidelines: [0, height / 2, height],
		verticalGuidelines: [0, width / 2, width]
	});

	// Moveable and Selecto inject their styles into the OUTER document; the
	// stage lives in an iframe, so they have to be mirrored in.
	for (const style of document.querySelectorAll('style')) {
		if (/moveable-|selecto-/.test(style.textContent || '')) {
			const clone = style.cloneNode(true);
			clone.setAttribute(UI, 'style');
			doc.head.appendChild(clone);
		}
	}

	const selecto = new Selecto({
		container: overlay,
		dragContainer: doc.body,
		keyContainer: view,
		selectableTargets: [`[${ATTR}]`],
		selectByClick: false,
		selectFromInside: false,
		hitRate: 100,
		toggleContinueSelect: ['shift']
	});

	const commit = (label) => {
		onTransaction(label, serialize(doc));
		moveable.updateRect();
	};

	function describe() {
		if (targets.length !== 1) {
			onSelection({ count: targets.length, ids: targets.map((t) => t.getAttribute(ATTR)) });
			return;
		}
		const el = targets[0];
		const css = view.getComputedStyle(el);
		const rect = el.getBoundingClientRect();
		const text = el.childElementCount ? '' : el.textContent || '';
		// A binding is shown as a chip, never as caret-editable text: editing
		// the inside of {{account_name}} is how a field silently stops binding.
		const bindings = [...text.matchAll(/\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g)].map((m) => m[1]);

		onSelection({
			count: 1,
			id: el.getAttribute(ATTR),
			tag: el.tagName.toLowerCase(),
			role: layoutRole(el, view),
			blocked: blockedReason(el, view),
			bindings,
			text: bindings.length ? '' : text,
			leaf: !el.childElementCount,
			width: Math.round(rect.width),
			height: Math.round(rect.height),
			fontSize: parseFloat(css.fontSize),
			fontWeight: css.fontWeight,
			textAlign: css.textAlign,
			color: css.color,
			background: css.backgroundColor
		});
	}

	function select(elements) {
		targets = elements.filter((el) => el && el !== doc.body && !el.closest(`[${UI}]`));
		// An element the renderer cannot reproduce a move for gets no handles.
		const blocked = targets.length === 1 && blockedReason(targets[0], view);
		moveable.draggable = !blocked;
		moveable.resizable = !blocked;
		moveable.target = targets.length === 1 ? targets[0] : targets;
		selecto.setSelectedTargets(targets);
		if (blocked) onStatus(blocked);
		describe();
	}

	/* ------------------------------------------------------------- drag */

	moveable.on('drag', ({ target, transform, left, top }) => {
		if (layoutRole(target, view) === 'free') {
			target.style.left = `${left}px`;
			target.style.top = `${top}px`;
		} else {
			// Flow and flex children are OFFSET. Switching them to absolute would
			// take them out of the layout, and the design would then only be
			// correct at the size it was dragged at.
			target.style.transform = transform;
		}
	});

	moveable.on('resize', ({ target, width: w, height: h, drag }) => {
		target.style.width = `${w}px`;
		// A height is only pinned when the element already had one. Pinning it
		// otherwise makes text clip instead of growing, which is the single most
		// common way a card breaks on a longer customer name.
		if (target.style.height) target.style.height = `${h}px`;
		if (layoutRole(target, view) !== 'flex') {
			// Deliberately NOT setting flex:none for a flex child (handoff B02-2).
			target.style.transform = drag.transform;
		}
	});

	moveable.on('dragGroup', ({ events }) =>
		events.forEach(({ target, transform }) => (target.style.transform = transform))
	);
	moveable.on('resizeGroup', ({ events }) =>
		events.forEach(({ target, width: w }) => (target.style.width = `${w}px`))
	);

	moveable.on('dragEnd', () => commit('move'));
	moveable.on('resizeEnd', () => commit('resize'));
	moveable.on('dragGroupEnd', () => commit('move group'));
	moveable.on('resizeGroupEnd', () => commit('resize group'));

	/* -------------------------------------------------------- selection */

	selecto.on('dragStart', (e) => {
		if (editing || e.inputEvent.target.closest?.(`[${UI}]`)) e.stop();
	});
	selecto.on('selectEnd', (e) => {
		if (e.isClick) return;
		// Never transform a parent and its own descendant in the same gesture.
		select(e.selected.filter((el) => !e.selected.some((o) => o !== el && o.contains(el))));
	});

	function onClick(e) {
		if (editing || e.target.closest?.(`[${UI}]`)) return;
		e.preventDefault();
		const el = e.target.closest?.(`[${ATTR}]`);
		if (e.shiftKey && el) {
			select(
				targets.includes(el)
					? targets.filter((t) => t !== el)
					: [...targets.filter((t) => !t.contains(el) && !el.contains(t)), el]
			);
		} else {
			// Clicking empty space deselects, which is how you get out.
			select(el ? [el] : []);
		}
	}

	function onDoubleClick(e) {
		const el = e.target.closest?.(`[${ATTR}]`);
		if (!el || el.childElementCount || ATOMIC.has(el.tagName)) return;
		e.preventDefault();
		select([]);
		editing = el;
		el.contentEditable = 'true';
		el.focus();
		onStatus('Editing text. Escape or click away to finish. Keep {{field}} tokens intact.');

		const before = el.innerHTML;
		const finish = () => {
			el.removeAttribute('contenteditable');
			el.removeEventListener('blur', finish);
			el.removeEventListener('keydown', onEditKey);
			editing = null;
			select([el]);
			// ONE transaction for the whole edit, on blur or Escape — not one per
			// keystroke, which would make undo useless for anything else.
			if (el.innerHTML !== before) commit('edit text');
			onStatus(null);
		};
		const onEditKey = (ev) => {
			if (ev.key === 'Escape') {
				ev.preventDefault();
				el.blur();
			}
		};
		el.addEventListener('blur', finish);
		el.addEventListener('keydown', onEditKey);
	}

	/** Select the parent — the way out of a deep selection. */
	function selectParent() {
		if (targets.length !== 1) return;
		const parent = targets[0].parentElement;
		if (parent && parent !== doc.body && parent.hasAttribute(ATTR)) select([parent]);
	}

	function nudge(dx, dy) {
		if (!targets.length) return;
		for (const target of targets) {
			if (layoutRole(target, view) === 'free') {
				target.style.left = `${(parseFloat(target.style.left) || 0) + dx}px`;
				target.style.top = `${(parseFloat(target.style.top) || 0) + dy}px`;
			} else {
				const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(target.style.transform || '');
				const x = (m ? parseFloat(m[1]) : 0) + dx;
				const y = (m ? parseFloat(m[2]) : 0) + dy;
				target.style.transform = `translate(${x}px, ${y}px)`;
			}
		}
		commit('nudge');
	}

	function removeSelected() {
		if (!targets.length) return;
		targets.forEach((t) => t.remove());
		select([]);
		commit('delete');
	}

	function duplicateSelected() {
		if (targets.length !== 1) return;
		const clone = targets[0].cloneNode(true);
		// The copy must not inherit the original's identity; the caller's
		// node-id pass assigns fresh ones on commit.
		clone.removeAttribute(ATTR);
		clone.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
		targets[0].after(clone);
		commit('duplicate');
	}

	doc.addEventListener('click', onClick, true);
	doc.addEventListener('dblclick', onDoubleClick, true);

	return {
		select,
		selectParent,
		nudge,
		removeSelected,
		duplicateSelected,
		serialize: () => serialize(doc),
		destroy() {
			doc.removeEventListener('click', onClick, true);
			doc.removeEventListener('dblclick', onDoubleClick, true);
			moveable.destroy();
			selecto.destroy();
			overlay.remove();
		}
	};
}
