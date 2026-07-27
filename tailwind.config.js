/** @type {import('tailwindcss').Config} */
export default {
	// jsx/tsx: the vendored React timeline island (src/lib/video/vendor).
	content: ['./src/**/*.{html,js,svelte,ts,jsx,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['DynaPuff', 'Inter', 'sans-serif'],
				// Code face used by the HTML editor, CodeMirror panes, and API snippets.
				// Falls back through the Apple/Windows/Linux mono stack.
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
			},
			colors: {
				// Semantic tokens used by the vendored OpenVideo timeline island
				// (src/lib/video/vendor/openvideo-timeline). Upstream is a shadcn
				// app on Tailwind v4 CSS variables; here they are fixed dark-editor
				// values matching the /dashboard/video-editor chrome. No other
				// part of the site uses these names.
				background: '#101014',
				foreground: '#f4f4f5',
				muted: { DEFAULT: '#1c1c22', foreground: '#9ca3af' },
				accent: { DEFAULT: '#26262e', foreground: '#fafafa' },
				popover: { DEFAULT: '#16161c', foreground: '#e4e4e7' },
				primary: { DEFAULT: '#facc15', foreground: '#101014' },
				destructive: '#f87171',
				border: '#27272a',
				brand: {
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
			boxShadow: {
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
			}
		}
	},
	plugins: []
};
