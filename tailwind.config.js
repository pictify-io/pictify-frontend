/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['DynaPuff', 'Inter', 'sans-serif'],
				// Code face used by the HTML editor, CodeMirror panes, and API snippets.
				// Falls back through the Apple/Windows/Linux mono stack.
				mono: [
					'JetBrains Mono',
					'ui-monospace',
					'SFMono-Regular',
					'Menlo',
					'Consolas',
					'monospace'
				]
			},
			colors: {
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
