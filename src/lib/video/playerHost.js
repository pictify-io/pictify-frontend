/**
 * React island that hosts a live @remotion/player preview inside the Svelte
 * video template editor. Browser-only — always import this module dynamically
 * from onMount, never at the top level of a component that may run in SSR.
 *
 * mountVideoPlayer(el, options) transpiles the user's TSX with sucrase,
 * evaluates it against a require shim that resolves only the modules the
 * backend security gate allows, and renders a <Player> into `el`. Calling it
 * again with the same element re-renders in place (same React root) — and an
 * unchanged TSX string skips recompilation entirely, so prop edits update
 * inputProps live without remounting the player.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import * as jsxRuntime from 'react/jsx-runtime';
import * as Remotion from 'remotion';
import * as PlayerModule from '@remotion/player';
import * as zod from 'zod';
import { transform } from 'sucrase';

// Mirrors the backend gate in service/video-template-compiler.js
// (ALLOWED_MODULES) — anything else throws a clear error at eval time.
const ALLOWED_MODULES = {
	react: React,
	'react/jsx-runtime': jsxRuntime,
	remotion: Remotion,
	zod,
	'@remotion/player': PlayerModule
};

const requireShim = (name) => {
	const mod = ALLOWED_MODULES[name];
	if (!mod) {
		throw new Error(
			`Import from '${name}' is not allowed. Allowed modules: 'react', 'remotion', 'zod', '@remotion/player'.`
		);
	}
	return mod;
};

const compileScene = (tsx) => {
	const { code } = transform(tsx, {
		transforms: ['typescript', 'jsx', 'imports'],
		jsxRuntime: 'automatic',
		production: true
	});
	const moduleShim = { exports: {} };
	// eslint-disable-next-line no-new-func
	const factory = new Function('require', 'exports', 'module', 'React', code);
	factory(requireShim, moduleShim.exports, moduleShim, React);
	const component = moduleShim.exports.default;
	if (typeof component !== 'function' && typeof component !== 'object') {
		throw new Error('The scene must `export default` a React component.');
	}
	return { component, schema: moduleShim.exports.schema };
};

// ── Schema introspection ─────────────────────────────────────────────────

const looksLikeColor = (name, value) =>
	/color|colour/i.test(String(name)) ||
	(typeof value === 'string' && /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value));

const unwrapZod = (type) => {
	let node = type;
	let fallback;
	while (node && node._def) {
		const typeName = node._def.typeName;
		if (typeName === 'ZodDefault') {
			try {
				fallback = node._def.defaultValue();
			} catch (error) {
				fallback = undefined;
			}
			node = node._def.innerType;
		} else if (typeName === 'ZodOptional' || typeName === 'ZodNullable') {
			node = node._def.innerType;
		} else {
			break;
		}
	}
	return { node, fallback };
};

const fieldsFromZod = (schema) => {
	const shape =
		schema.shape && typeof schema.shape === 'object'
			? schema.shape
			: typeof schema._def?.shape === 'function'
			? schema._def.shape()
			: null;
	if (!shape) return [];
	return Object.entries(shape).map(([name, type]) => {
		const { node, fallback } = unwrapZod(type);
		const typeName = node?._def?.typeName;
		const describe = node?._def?.description || node?.description;
		/*
		 * zod has no colour or image type, so a composition declares intent with
		 * .describe('color') / .describe('image'). That is the only way a string
		 * field can ask for a swatch instead of a text box, and the generator is
		 * told to use it.
		 */
		const described = /^(color|colour|image|video|audio)$/i.exec(String(describe || '').trim());

		let fieldType = 'string';
		if (typeName === 'ZodNumber') fieldType = 'number';
		else if (typeName === 'ZodBoolean') fieldType = 'boolean';
		else if (typeName === 'ZodEnum') fieldType = 'text';
		else if (described) fieldType = described[1].toLowerCase().replace('colour', 'color');
		else if (looksLikeColor(name, fallback)) fieldType = 'color';

		/*
		 * Everything below used to be discarded, so `z.number().min(8).max(200)`
		 * and `z.enum([...])` arrived at the panel indistinguishable from a bare
		 * string and rendered as a text box. The bounds and the choices are the
		 * whole difference between a no-code control and a typed field.
		 */
		const checks = node?._def?.checks || [];
		const min = checks.find((c) => c.kind === 'min')?.value;
		const max = checks.find((c) => c.kind === 'max')?.value;
		const enumValues = typeName === 'ZodEnum' ? node?._def?.values : null;
		const value =
			fallback !== undefined
				? fallback
				: fieldType === 'number'
				? 0
				: fieldType === 'boolean'
				? false
				: '';
		return {
			name,
			type: fieldType,
			default: value,
			...(min !== undefined ? { min } : {}),
			...(max !== undefined ? { max } : {}),
			...(Array.isArray(enumValues) && enumValues.length ? { options: enumValues } : {}),
			...(describe && !described ? { description: describe } : {})
		};
	});
};

// Kept in step with VideoTemplate.VARIABLE_TYPES, so a composition can declare
// any type the rest of the product already persists and renders.
const KNOWN_TYPES = ['string', 'text', 'number', 'boolean', 'color', 'image', 'video', 'audio'];

// Control metadata a plain-object schema may carry. Passed through verbatim —
// control-spec.js decides what any of it means, so the parser stays a parser.
const CONTROL_KEYS = ['min', 'max', 'step', 'options', 'group', 'label', 'description'];

const fieldsFromPlainObject = (schema) =>
	Object.entries(schema)
		.filter(([, def]) => def && typeof def === 'object')
		.map(([name, def]) => {
			let type = KNOWN_TYPES.includes(def.type) ? def.type : 'string';
			const fallback =
				def.default !== undefined
					? def.default
					: def.defaultValue !== undefined
					? def.defaultValue
					: type === 'number'
					? 0
					: type === 'boolean'
					? false
					: '';
			if (type === 'string' && looksLikeColor(name, fallback)) type = 'color';
			const extras = {};
			for (const key of CONTROL_KEYS) {
				if (def[key] !== undefined) extras[key] = def[key];
			}
			return { name, type, default: fallback, ...extras };
		});

const extractSchemaFields = (schema) => {
	if (!schema || typeof schema !== 'object') return [];
	if (schema._def || schema.shape) return fieldsFromZod(schema);
	return fieldsFromPlainObject(schema);
};

// ── Player wrapper (frame + runtime error events) ────────────────────────

const errorFallback = ({ error }) =>
	React.createElement(
		'div',
		{
			style: {
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: '100%',
				height: '100%',
				padding: 24,
				background: '#111',
				color: '#f87171',
				fontFamily: 'monospace',
				fontSize: 13,
				textAlign: 'center'
			}
		},
		String(error?.message || error)
	);

const PlayerView = ({
	component,
	inputProps,
	durationInFrames,
	fps,
	width,
	height,
	onFrame,
	onError
}) => {
	const ref = React.useRef(null);
	React.useEffect(() => {
		const player = ref.current;
		if (!player) return undefined;
		const handleFrame = (event) => onFrame && onFrame(event.detail.frame);
		const handleError = (event) =>
			onError && onError(event.detail?.error?.message || 'The scene crashed while playing.');
		player.addEventListener('frameupdate', handleFrame);
		player.addEventListener('error', handleError);
		return () => {
			player.removeEventListener('frameupdate', handleFrame);
			player.removeEventListener('error', handleError);
		};
	}, [onFrame, onError]);
	return React.createElement(PlayerModule.Player, {
		ref,
		component,
		durationInFrames,
		fps,
		compositionWidth: width,
		compositionHeight: height,
		inputProps,
		controls: true,
		loop: true,
		autoPlay: true,
		// Muted autoplay: an unmuted Player stalls its playback loop waiting on
		// AudioContext.resume(), which never resolves without a user gesture.
		initiallyMuted: true,
		clickToPlay: false,
		style: { width: '100%', height: '100%' },
		acknowledgeRemotionLicense: true,
		errorFallback
	});
};

// ── Mount registry ───────────────────────────────────────────────────────

const instances = new Map();

/**
 * Compile (if needed) and render the live player into `el`.
 * Returns true when the scene is live, false when compilation failed
 * (onError has already been called; a previously live player keeps playing).
 */
export const mountVideoPlayer = (el, options) => {
	const {
		tsx,
		inputProps = {},
		width,
		height,
		fps,
		durationInFrames,
		onError,
		onSchema,
		onFrame
	} = options;

	let instance = instances.get(el);
	if (!instance) {
		instance = { root: createRoot(el), tsx: null, compiled: null };
		instances.set(el, instance);
	}

	if (instance.tsx !== tsx || !instance.compiled) {
		try {
			instance.compiled = compileScene(tsx);
			instance.tsx = tsx;
		} catch (error) {
			if (onError) onError(error?.message || String(error));
			return false;
		}
	}

	const { component, schema } = instance.compiled;
	if (onSchema) {
		try {
			onSchema(extractSchemaFields(schema));
		} catch (error) {
			onSchema([]);
		}
	}

	instance.root.render(
		React.createElement(PlayerView, {
			component,
			inputProps,
			durationInFrames: Math.max(1, Math.floor(durationInFrames) || 1),
			fps: Math.max(1, Math.floor(fps) || 30),
			width: Math.max(16, Math.floor(width) || 1080),
			height: Math.max(16, Math.floor(height) || 1080),
			onFrame,
			onError
		})
	);
	return true;
};

export const unmount = (el) => {
	const instance = instances.get(el);
	if (!instance) return;
	instances.delete(el);
	instance.root.unmount();
};
