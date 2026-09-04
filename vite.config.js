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
		/*
		 * One React, always.
		 *
		 * @pixi/layout ships its own react 19.2.8 under its node_modules while the
		 * app is on 18.3.1. Two copies means two hook dispatchers, and whichever
		 * one a module resolves against depends on load order — so mounting the
		 * Pixi engine and then the Remotion player got "Invalid hook call"
		 * warnings and, when the dispatcher came back null, a throw at the first
		 * `React.useRef` in PlayerView. That surfaced as a white rectangle where
		 * the video should be, and only on some navigation orders, which is the
		 * worst kind of bug to chase.
		 *
		 * Deduping is the structural fix; the error boundary in playerHost.js is
		 * the belt to this pair of braces.
		 */
		dedupe: ['react', 'react-dom'],
		alias: {
			'@imgly/background-removal': resolve(projectRoot, 'src/lib/shims/backgroundRemovalStub.js')
		}
	},
	optimizeDeps: {
		/*
		 * Everything the studio reaches through a DYNAMIC import has to be listed
		 * here, or opening it for the first time breaks the page.
		 *
		 * Vite only scans static imports when it pre-bundles. The studio loads its
		 * engine from inside onMount, so Vite meets @openvideo/core and
		 * engine-pixi for the first time mid-mount, stops to optimise them, and
		 * invalidates every dependency URL already in flight. The half-loaded page
		 * then fails with a wall of "504 Outdated Optimize Dep" and the editor
		 * never mounts — on a cold cache, which is exactly a new clone or a fresh
		 * npm install.
		 *
		 * It reproduces only on the FIRST visit after a cold cache, because the
		 * second load finds everything already optimised. That is what makes it
		 * look intermittent and unrelated to whatever was last edited.
		 *
		 * The list originally covered just the vendored timeline island. The
		 * studio has since grown to import core and engine-pixi directly (18 and 8
		 * call sites), and this was never updated to match.
		 */
		include: [
			// Vendored React timeline island deps (dynamic imports from onMount).
			'react',
			'react-dom/client',
			'react/jsx-runtime',
			'zustand',
			'hotkeys-js',
			'@openvideo/timeline',
			// The engine itself, imported dynamically by editorHost/studioHost.
			'@openvideo/core',
			'@openvideo/engine-pixi',
			'codemirror',
			'@codemirror/lang-html',
			// The playground's VARIABLES pane and its JSON linter.
			'@codemirror/lang-json',
			'@codemirror/lint',
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
