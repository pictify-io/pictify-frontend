import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@imgly/background-removal': resolve(projectRoot, 'src/lib/shims/backgroundRemovalStub.js')
		}
	},
	optimizeDeps: {
		exclude: [
			'codemirror',
			'@codemirror/lang-html',
			'@codemirror/state',
			'@codemirror/view',
			'@codemirror/basic-setup',
			'@codemirror/commands',
			'@codemirror/language'
		]
	}
});
