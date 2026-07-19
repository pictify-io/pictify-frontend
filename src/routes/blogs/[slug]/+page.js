import { error, redirect } from '@sveltejs/kit';
import { getBlog } from '../../../api/blog';

export async function load({ params }) {
	// Fetch directly instead of via blogStore: the module-level store is shared
	// across concurrent SSR requests, so reading it back after an await could
	// return another request's blog and 301 this slug to the wrong URL.
	let blog = null;
	try {
		const response = await getBlog({ slug: params.slug });
		blog = response?.blog || null;
	} catch (e) {
		blog = null;
	}

	if (!blog) {
		throw error(404, 'Blog not found');
	}

	// If the API resolved this post under a different (cleaned) slug,
	// permanently redirect legacy punctuation-heavy URLs to the canonical one.
	if (blog.slug && blog.slug !== params.slug) {
		throw redirect(301, `/blogs/${blog.slug}`);
	}

	return { props: { blog } };
}
