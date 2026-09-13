/** @type {import('tailwindcss').Config} */
export default {
	// jsx/tsx: the vendored React timeline island (src/lib/video/vendor).
	content: ['./src/**/*.{html,js,svelte,ts,jsx,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				// v2 display face. Variable weight 200–800 with width + optical-size axes.
				display: ['Bricolage Grotesque', 'Inter', 'sans-serif'],
				sans: ['Inter', 'sans-serif'],
				// Code face used by the HTML editor, CodeMirror panes, and API snippets.
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
				// v1 — marketing display face. Deprecated by `display`; still referenced
				// by pre-rebrand marketing pages.
				heading: ['DynaPuff', 'Inter', 'sans-serif']
			},
			// Marketing type scale. Deliberately in px, not rem: the density system in
			// app.css steps the root font-size down below 1680/1440px, which is right
			// for the dashboard but would shrink the marketing display type off-spec.
			fontSize: {
				'display-lg': ['112px', { lineHeight: '0.86', letterSpacing: '-0.045em' }],
				display: ['80px', { lineHeight: '0.88', letterSpacing: '-0.04em' }],
				'display-sm': ['52px', { lineHeight: '0.88', letterSpacing: '-0.04em' }],
				heading: ['64px', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
				'heading-sm': ['38px', { lineHeight: '0.94', letterSpacing: '-0.04em' }],
				title: ['40px', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
				subtitle: ['32px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
				card: ['26px', { lineHeight: '1.05', letterSpacing: '-0.03em' }]
			},
			colors: {
				// Semantic tokens used by the vendored OpenVideo studio + timeline
				// islands (src/lib/video/vendor/**). Upstream is a shadcn app on
				// Tailwind v4 CSS variables; nothing else in this codebase uses
				// these names.
				//
				// v2 (2026-08-16): re-pointed from the old dark-editor values to the
				// Repro Shop palette. The vendored panels are written entirely
				// against these semantic names, so remapping here restyles all 64
				// vendored files at once — no edits to third-party source, and no
				// override stylesheet fighting them on specificity.
				background: '#FFFFFF', // paper — panels sit on white cards
				foreground: '#000000', // ink
				muted: { DEFAULT: '#F4F6F4', foreground: '#8A8A85' }, // subtle / mute
				accent: { DEFAULT: '#F4F6F4', foreground: '#000000' },
				popover: { DEFAULT: '#FFFFFF', foreground: '#000000' },
				primary: { DEFAULT: '#D8F34A', foreground: '#000000' }, // field
				destructive: '#B0483A', // alarm
				border: '#E5E7EB', // rule
				brand: {
					// ── v2 (rebrand 2026) ──────────────────────────────────────────
					// Grounds
					paper: '#FFFFFF', // light section band
					canvas: '#E2E4DD', // greige section band
					field: '#D8F34A', // saturated colour field — hero + closing CTA
					sky: '#A9D7F2', // printed blue tint — integrations ground
					subtle: '#F4F6F4', // barely-there panel wash — chart wells, meta strips
					// Ink
					ink: '#000000', // display type, primary text
					slate: '#383A42', // body text on light grounds
					mute: '#8A8A85', // captions, mono labels
					rule: '#E5E7EB', // hairlines
					// Dark surfaces
					press: '#242628', // dark card
					'press-deep': '#131417', // dark section band + CTA strips
					'press-text': '#ADB9C6', // body text on dark
					// Actions
					plum: '#252527', // primary filled button
					// Decorative fills. NOT interactive surfaces — these carry the
					// pixel graphics, capsules and accent cards only.
					// Derived from the risograph ink drawer (2026-08 palette rework —
					// the previous family was hex-identical to fal.ai's tokens).
					blue: '#0078BF', // riso blue — the working ink
					royal: '#0054A6', // deep blue — focus rings, links
					powder: '#D3E7F6', // blue at light coverage
					rose: '#FFD3E8', // pink at light coverage
					pink: '#FF48B0', // fluorescent pink — spot punch, rare
					proof: '#00BE43', // rendered/delivered status wash
					alarm: '#B0483A', // failed / gone quiet — the only red in v2

					// ── v1 (neo-brutalist) — deprecated ────────────────────────────
					// Still referenced by /dashboard and pre-rebrand marketing pages.
					// Remove once those surfaces are migrated.
					bg: '#FFFDF8',
					accent: '#ffc480',
					danger: '#ff6b6b',
					success: '#10b981'
				},
				// Editor-specific tokens from the design spec. Kept under
				// `editor.*` so they don't pollute the wider brand palette.
				editor: {
					handlebars: '#c88a3b', // 4.5:1 contrast on #FFFDF8
					squiggle: '#c62828',
					gutter: '#f5f0e6',
					selection: 'rgba(255, 196, 128, 0.3)'
				},
				// Data-viz / category palette: experiment types & statuses, chart
				// series, badges. Named (1:1, not consolidated) so these usages are
				// intentional tokens instead of scattered hex literals.
				data: {
					green: '#4ade80',
					blue: '#3b82f6',
					sky: '#60a5fa',
					violet: '#a78bfa',
					purple: '#a855f7',
					amber: '#f59e0b',
					teal: '#4ecdc4',
					pink: '#f472b6',
					red: '#ff5252'
				}
			},
			borderRadius: {
				// v2 shape scale. Four steps, no more.
				btn: '4px', // buttons + inputs — sharp
				tile: '12px', // render tiles, media wells
				card: '16px', // accent cards, CTA strips
				pane: '28px' // large dark panes
			},
			boxShadow: {
				// v1 — deprecated. The v2 system uses flat surfaces and colour
				// inversion for hierarchy, not elevation.
				'brutal-sm': '2px 2px 0 0 #1f2937',
				'brutal-md': '3px 3px 0 0 #1f2937',
				'brutal-lg': '4px 4px 0 0 #1f2937',
				'brutal-xl': '6px 6px 0 0 #1f2937',
				'brutal-2xl': '8px 8px 0 0 #1f2937',
				'brutal-3xl': '12px 12px 0 0 #1f2937',
				'brutal-accent-sm': '2px 2px 0 0 #ffc480',
				'brutal-accent': '4px 4px 0 0 #ffc480'
			},
			borderWidth: {
				3: '3px'
			},
			maxWidth: {
				// Outer bound, not the content width: every landing container pairs
				// this with px-10, so content resolves to the drawn 1200px column.
				page: '1280px'
			}
		}
	},
	plugins: []
};
