import { error, redirect } from '@sveltejs/kit';
import { getBlog } from '../../../api/blog';
import { sanityEnabled, getSanityPost } from '$lib/sanity/client';

export async function load({ params, fetch }) {
	// CMS first: posts live in Sanity after the migration. Legacy
	// punctuation-heavy slugs are stored on the doc as `legacySlug`, so old
	// URLs 301 to the clean slug without a hardcoded redirect map.
	if (sanityEnabled()) {
		try {
			const { blog, matchedLegacy } = await getSanityPost(params.slug, fetch);
			if (blog) {
				if (matchedLegacy) {
					throw redirect(301, `/blogs/${blog.slug}`);
				}
				return { props: { blog } };
			}
		} catch (e) {
			if (e?.status === 301) throw e;
			// Sanity outage → fall through to the legacy API below.
		}
	}

	// Legacy Mongo-backed API (also the pre-migration path).
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
