import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { markdownSchema } from 'sanity-plugin-markdown';
import { schemaTypes } from './schemaTypes';
import { DEFAULT_PROJECT_ID, DEFAULT_DATASET } from './project';

// Project ID comes from the Sanity project you create with `sanity init`
// (or at sanity.io/manage).
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || DEFAULT_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || DEFAULT_DATASET;

export default defineConfig({
	name: 'pictify',
	title: 'Pictify Content',
	projectId,
	dataset,
	plugins: [structureTool(), markdownSchema()],
	schema: {
		types: schemaTypes
	}
});
