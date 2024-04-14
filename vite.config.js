import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ["codemirror", "@codemirror/lang-html", "@codemirror/state", "@codemirror/view", "@codemirror/basic-setup", "@codemirror/commands", "@codemirror/language"],
	},
});
