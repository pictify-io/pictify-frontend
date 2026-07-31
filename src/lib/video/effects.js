/**
 * Effects for the video studio.
 *
 * An effect is its own clip: `type: 'Effect'` with an `effectKey` naming a
 * shader and a `values` bag of uniform overrides. While the clip is on screen
 * the engine runs that shader over everything beneath it.
 *
 * ── Nothing here is a hardcoded list ──────────────────────────────────────
 *
 * `@openvideo/engine-pixi` exports its own registry — `getEffectOptions()` for
 * the catalogue and `getAllEffects()` for each shader's uniforms. Copying that
 * into a constant would produce a list that silently drifts on every engine
 * bump: offering effects that no longer exist and hiding the new ones. So both
 * the catalogue and the controls are derived at call time.
 *
 * This module is the only part that touches the engine. The logic that turns a
 * uniform into a control lives in `effect-params.js` so it can be tested
 * without loading PixiJS.
 */
import { getEffectOptions, getAllEffects } from '@openvideo/engine-pixi';
import { prettyLabel, specsFromUniforms } from './effect-params.js';

export {
	DEFAULT_EFFECT_US,
	MIN_EFFECT_US,
	createEffectClip,
	readEffectValues,
	effectValuePatch,
	resetEffectValues,
	prettyLabel
} from './effect-params.js';

/**
 * The effect catalogue as picker options.
 *
 * `previewStatic` / `previewDynamic` are remote CDN URLs the engine derives
 * from the key. They are passed through untouched, and the picker has to
 * survive them failing to load: that host is a third party, not part of this
 * application, and an effect with a broken thumbnail must still be selectable.
 *
 * @returns {Array<{value: string, label: string, previewStatic: string, previewDynamic: string, isCustom: boolean}>}
 */
export const EFFECT_OPTIONS = () => {
	let options = [];
	try {
		options = getEffectOptions() || [];
	} catch {
		// A registry that throws should cost the effects tab, not the studio.
		return [];
	}
	return options
		.map((option) => ({
			value: option.key,
			label: option.label || prettyLabel(option.key),
			previewStatic: option.previewStatic || '',
			previewDynamic: option.previewDynamic || '',
			isCustom: Boolean(option.isCustom)
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Control descriptors for one effect's uniforms.
 *
 * @param {string} effectKey
 */
export const effectParamSpecs = (effectKey) => {
	try {
		return specsFromUniforms((getAllEffects() || {})[effectKey]?.uniforms);
	} catch {
		return [];
	}
};
