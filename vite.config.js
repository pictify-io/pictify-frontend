import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	// The vendored OpenVideo timeline (src/lib/video/vendor/openvideo-timeline)
	// is React .tsx compiled by esbuild — use the automatic JSX runtime so the
	// files don't need `import React` in scope. Only affects .jsx/.tsx files.
	esbuild: {
		jsx: 'automatic'
	},
	resolve: {
		alias: {
			'@imgly/background-removal': resolve(projectRoot, 'src/lib/shims/backgroundRemovalStub.js')
		}
	},
	optimizeDeps: {
		include: [
			// Vendored React timeline island deps (dynamic imports from onMount).
			'react',
			'react-dom/client',
			'react/jsx-runtime',
			'zustand',
			'hotkeys-js',
			'@openvideo/timeline',
			'codemirror',
			'@codemirror/lang-html',
			'@codemirror/lang-css',
			'@codemirror/lang-javascript',
			'@codemirror/state',
			'@codemirror/view',
			'@codemirror/commands',
			'@codemirror/language',
			'@codemirror/theme-one-dark',
			'@lezer/common',
			'@lezer/highlight',
			'@lezer/html',
			'@lezer/css',
			'@lezer/javascript',
			'@lezer/lr'
		]
	}
});
