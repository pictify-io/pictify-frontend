import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { markdownSchema } from 'sanity-plugin-markdown';
import { schemaTypes } from './schemaTypes';

// Project ID comes from the Sanity project you create with `sanity init`
// (or at sanity.io/manage). Keep it in sync with the frontend's
// PUBLIC_SANITY_PROJECT_ID env var.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'ayq6mmxw';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

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
