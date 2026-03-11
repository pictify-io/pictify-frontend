/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['DynaPuff', 'Inter', 'sans-serif']
			},
			colors: {
				brand: {
					bg: '#FFFDF8',
					accent: '#ffc480',
					danger: '#ff6b6b',
					success: '#10b981'
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
