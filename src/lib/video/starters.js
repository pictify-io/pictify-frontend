/**
 * Starter scenes for the studio.
 *
 * A blank artboard is the worst first screen this product can show. It asks the
 * user to know what a video template IS before they can make one, and the thing
 * that actually needs teaching — that the text holds {{tokens}} and one scene
 * renders a hundred videos — is invisible until they discover variables on
 * their own.
 *
 * So every starter ships with tokens already in its copy. Opening one declares
 * real variables immediately (the studio auto-detects them), which puts the
 * whole product loop on screen in one click: scene -> variables -> render many.
 *
 * ── Why clip payloads and not project JSON ────────────────────────────────
 *
 * A starter is a list of clips, added through `core.clip.add` after the engine
 * mounts — the same call the Text and Shapes panels make. Hand-authoring a full
 * IProject ({ settings, tracks, clips }) would mean duplicating the engine's
 * track wiring and its microsecond timing defaults, and any drift there fails
 * at import with a document that silently loses clips. Going through the same
 * door the panels use means a starter cannot be more wrong than a hand-built
 * scene.
 *
 * Positions are expressed as fractions of the composition, so one definition
 * works at 9:16, 1:1 and 16:9 instead of needing three copies each.
 */
import { gradientStyle } from './gradients.js';

const SECOND = 1_000_000;

/** Every starter runs this long unless it says otherwise. */
export const DEFAULT_STARTER_DURATION_US = 6 * SECOND;

const timing = (fromS, toS) => ({
	display: { from: Math.round(fromS * SECOND), to: Math.round(toS * SECOND) },
	trim: { from: 0, to: Math.round((toS - fromS) * SECOND) },
	duration: Math.round((toS - fromS) * SECOND),
	playbackRate: 1
});

/**
 * A text clip from fractional geometry.
 *
 * `size` is a fraction of the composition's SHORTER side, so type reads at the
 * same optical weight in a 1080x1920 reel and a 1920x1080 embed. Scaling off
 * the width instead would make 16:9 headlines enormous.
 */
const text = ({ name, value, x, y, w, h, size, color, align = 'center', font, from, to }) => (comp) => {
	const short = Math.min(comp.width, comp.height);
	const width = Math.round(comp.width * w);
	return {
		type: 'Text',
		name,
		text: value,
		timing: timing(from, to),
		transform: {
			x: Math.round(comp.width * x),
			y: Math.round(comp.height * y),
			width,
			height: Math.round(comp.height * h),
			angle: 0,
			opacity: 1,
			zIndex: 10
		},
		style: {
			fontSize: Math.round(short * size),
			fontFamily: font || 'Inter-Bold',
			fontWeight: 'normal',
			fontStyle: 'normal',
			align,
			textAlign: align,
			wordWrap: true,
			// Without a wrap width the engine lays long copy out on one line and
			// it runs off the artboard — invisible until someone types a real
			// customer name into the token.
			wordWrapWidth: width,
			color: color || '#ffffff'
		},
		metadata: {},
		locked: false
	};
};

const gradient = ({ name, colors, angle = 160, type = 'linear' }) => (comp) => ({
	type: 'Backdrop',
	name,
	backdropType: 'gradient',
	src: 'backdrop://gradient',
	timing: timing(0, comp.durationUs / SECOND),
	transform: {
		x: 0,
		y: 0,
		width: comp.width,
		height: comp.height,
		angle: 0,
		opacity: 1,
		zIndex: 0
	},
	style: gradientStyle({ type, angle, colors }),
	metadata: {},
	locked: false
});

const bar = ({ name, x, y, w, h, fill, radius = 0, from, to }) => (comp) => ({
	type: 'Shape',
	name,
	shapeType: 'rectangle',
	src: 'shape://rectangle',
	timing: timing(from, to),
	transform: {
		x: Math.round(comp.width * x),
		y: Math.round(comp.height * y),
		width: Math.round(comp.width * w),
		height: Math.round(comp.height * h),
		angle: 0,
		opacity: 1,
		zIndex: 5
	},
	style: {
		fill,
		fillOpacity: 1,
		stroke: { color: '#000000', width: 0 },
		borderRadius: radius
	},
	metadata: {},
	locked: false
});

/**
 * The catalogue.
 *
 * Six, not twelve: each one has to be worth opening, and a wall of samey cards
 * is its own kind of blank page. They cover the jobs this product is actually
 * bought for — announce a thing, quote a customer, promote an event, ship a
 * changelog, report a number, label a speaker.
 *
 * Every `{{token}}` here becomes a declared variable the moment the scene
 * loads, so the Variables tab is populated before the user types anything.
 */
export const STARTERS = [
	{
		id: 'launch',
		name: 'Product launch',
		description: 'A headline, a subhead and a call to action over a warm gradient.',
		tokens: ['product', 'tagline', 'cta'],
		build: [
			gradient({ name: 'Launch', colors: ['#FF512F', '#F09819'], angle: 160 }),
			text({
				name: 'Product',
				value: '{{product}}',
				x: 0.08, y: 0.36, w: 0.84, h: 0.16, size: 0.11,
				from: 0, to: 6
			}),
			text({
				name: 'Tagline',
				value: '{{tagline}}',
				x: 0.08, y: 0.53, w: 0.84, h: 0.1, size: 0.05,
				font: 'Inter-Medium', color: '#ffe9d6',
				from: 0.3, to: 6
			}),
			text({
				name: 'Call to action',
				value: '{{cta}}',
				x: 0.08, y: 0.72, w: 0.84, h: 0.07, size: 0.038,
				font: 'Inter-SemiBold', color: '#ffffff',
				from: 0.8, to: 6
			})
		]
	},
	{
		id: 'quote',
		name: 'Customer quote',
		description: 'A testimonial with an attribution line. One row per customer.',
		tokens: ['quote', 'customer_name', 'customer_role'],
		build: [
			gradient({ name: 'Ink', colors: ['#0f172a', '#1e293b'], angle: 150 }),
			bar({ name: 'Accent', x: 0.08, y: 0.3, w: 0.1, h: 0.008, fill: '#ffc480', radius: 4, from: 0, to: 6 }),
			text({
				name: 'Quote',
				value: '“{{quote}}”',
				x: 0.08, y: 0.36, w: 0.84, h: 0.24, size: 0.062,
				align: 'left',
				from: 0, to: 6
			}),
			text({
				name: 'Name',
				value: '{{customer_name}}',
				x: 0.08, y: 0.66, w: 0.84, h: 0.06, size: 0.036,
				align: 'left', font: 'Inter-SemiBold', color: '#ffc480',
				from: 0.4, to: 6
			}),
			text({
				name: 'Role',
				value: '{{customer_role}}',
				x: 0.08, y: 0.71, w: 0.84, h: 0.05, size: 0.028,
				align: 'left', font: 'Inter-Medium', color: '#94a3b8',
				from: 0.5, to: 6
			})
		]
	},
	{
		id: 'event',
		name: 'Event promo',
		description: 'Date, title and location — the three things an invite has to say.',
		tokens: ['event', 'event_date', 'event_location'],
		build: [
			gradient({ name: 'Dusk', colors: ['#5b21b6', '#2563eb'], angle: 200 }),
			text({
				name: 'Date',
				value: '{{event_date}}',
				x: 0.08, y: 0.3, w: 0.84, h: 0.06, size: 0.034,
				font: 'Inter-SemiBold', color: '#c4b5fd',
				from: 0, to: 6
			}),
			text({
				name: 'Event',
				value: '{{event}}',
				x: 0.08, y: 0.38, w: 0.84, h: 0.2, size: 0.095,
				from: 0.2, to: 6
			}),
			text({
				name: 'Location',
				value: '{{event_location}}',
				x: 0.08, y: 0.62, w: 0.84, h: 0.06, size: 0.032,
				font: 'Inter-Medium', color: '#e0e7ff',
				from: 0.5, to: 6
			})
		]
	},
	{
		id: 'changelog',
		name: 'Feature announcement',
		description: 'A "new in {{version}}" card for release notes and changelogs.',
		tokens: ['version', 'feature', 'feature_summary'],
		build: [
			gradient({ name: 'Slate', colors: ['#111827', '#0b1120'], angle: 180 }),
			bar({ name: 'Badge', x: 0.08, y: 0.3, w: 0.26, h: 0.045, fill: '#22c55e', radius: 999, from: 0, to: 6 }),
			text({
				name: 'Version',
				value: 'NEW IN {{version}}',
				x: 0.08, y: 0.308, w: 0.26, h: 0.035, size: 0.022,
				font: 'Inter-Bold', color: '#052e16',
				from: 0, to: 6
			}),
			text({
				name: 'Feature',
				value: '{{feature}}',
				x: 0.08, y: 0.38, w: 0.84, h: 0.16, size: 0.085,
				align: 'left',
				from: 0.2, to: 6
			}),
			text({
				name: 'Summary',
				value: '{{feature_summary}}',
				x: 0.08, y: 0.56, w: 0.8, h: 0.14, size: 0.036,
				align: 'left', font: 'Inter-Medium', color: '#9ca3af',
				from: 0.4, to: 6
			})
		]
	},
	{
		id: 'metric',
		name: 'Number highlight',
		description: 'One big number with a label. For milestones and monthly reports.',
		tokens: ['metric', 'metric_label', 'company_name'],
		build: [
			gradient({ name: 'Deep', colors: ['#065f46', '#022c22'], angle: 170 }),
			text({
				name: 'Company',
				value: '{{company_name}}',
				x: 0.08, y: 0.3, w: 0.84, h: 0.05, size: 0.03,
				font: 'Inter-SemiBold', color: '#6ee7b7',
				from: 0, to: 6
			}),
			text({
				name: 'Value',
				value: '{{metric}}',
				x: 0.08, y: 0.38, w: 0.84, h: 0.2, size: 0.13,
				from: 0.2, to: 6
			}),
			text({
				name: 'Label',
				value: '{{metric_label}}',
				x: 0.08, y: 0.62, w: 0.84, h: 0.07, size: 0.04,
				font: 'Inter-Medium', color: '#d1fae5',
				from: 0.4, to: 6
			})
		]
	},
	{
		id: 'lower-third',
		name: 'Name tag',
		description: 'A lower third for talking heads. Drop your footage underneath.',
		tokens: ['speaker_name', 'speaker_title'],
		build: [
			// No gradient: this one is meant to sit OVER footage the user adds, so
			// a full-bleed backdrop would be the first thing they have to delete.
			bar({ name: 'Plate', x: 0.06, y: 0.72, w: 0.62, h: 0.1, fill: '#0f172a', radius: 12, from: 0, to: 6 }),
			bar({ name: 'Accent', x: 0.06, y: 0.72, w: 0.012, h: 0.1, fill: '#ffc480', radius: 12, from: 0, to: 6 }),
			text({
				name: 'Speaker',
				value: '{{speaker_name}}',
				x: 0.1, y: 0.735, w: 0.56, h: 0.045, size: 0.038,
				align: 'left', font: 'Inter-Bold',
				from: 0, to: 6
			}),
			text({
				name: 'Title',
				value: '{{speaker_title}}',
				x: 0.1, y: 0.775, w: 0.56, h: 0.04, size: 0.026,
				align: 'left', font: 'Inter-Medium', color: '#cbd5e1',
				from: 0.15, to: 6
			})
		]
	}
];

export const starterById = (id) => STARTERS.find((s) => s.id === id) || null;

/**
 * Resolve a starter into clip payloads for a given composition.
 *
 * @param {string} id
 * @param {{width:number, height:number, durationUs?:number}} composition
 * @returns {Array|null} clips ready for core.clip.add, or null for an unknown id
 */
export const buildStarterClips = (id, composition) => {
	const starter = starterById(id);
	if (!starter) return null;
	const comp = {
		width: composition?.width || 1080,
		height: composition?.height || 1920,
		durationUs: composition?.durationUs || DEFAULT_STARTER_DURATION_US
	};
	return starter.build.map((make) => make(comp));
};

/** How long a starter's scene runs, for the project's duration setting. */
export const starterDurationUs = (id) => {
	const starter = starterById(id);
	if (!starter) return DEFAULT_STARTER_DURATION_US;
	const clips = buildStarterClips(id, { width: 1080, height: 1920 });
	return clips.reduce((max, clip) => Math.max(max, clip.timing?.display?.to ?? 0), 0);
};
