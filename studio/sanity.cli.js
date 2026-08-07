import { defineCliConfig } from 'sanity/cli';
import { DEFAULT_PROJECT_ID, DEFAULT_DATASET } from './project';

// The CLI (schema deploy, studio deploy, dataset commands) reads project
// identity from here — it can't evaluate sanity.config.js's env-var lookups
// before Node env is loaded.
export default defineCliConfig({
	api: {
		projectId: process.env.SANITY_STUDIO_PROJECT_ID || DEFAULT_PROJECT_ID,
		dataset: process.env.SANITY_STUDIO_DATASET || DEFAULT_DATASET
	},
	studioHost: 'pictify-blog',
	deployment: {
		appId: 'gzomlh0di03ly7to27p7d92y'
	}
});
