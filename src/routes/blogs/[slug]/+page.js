import { error, redirect } from '@sveltejs/kit';
import { getBlog, getRecommendedBlogs } from '../../../api/blog';
import { sanityEnabled, getSanityPost } from '$lib/sanity/client';

// Runs server-side (was client-only via onMount) so related posts ship in
// the initial HTML crawlers see, instead of arriving after hydration.
async function fetchRecommended(slug) {
	try {
		const res = await getRecommendedBlogs({ slug, limit: 3 });
		return res?.recommendedBlogs || [];
	} catch (e) {
		return [];
	}
}

export async function load({ params, fetch }) {
	// CMS first: posts live in Sanity after the migration. Legacy
	// punctuation-heavy slugs are stored on the doc as `legacySlugs`, so old
	// URLs 301 to the clean slug without a hardcoded redirect map.
	if (sanityEnabled()) {
		try {
			const { blog, matchedLegacy } = await getSanityPost(params.slug, fetch);
			if (blog) {
				if (matchedLegacy) {
					throw redirect(301, `/blogs/${blog.slug}`);
				}
				const recommendedBlogs = await fetchRecommended(blog.slug);
				return { props: { blog, recommendedBlogs } };
			}
			// Migration moved every post into Sanity, so a clean miss here means
			// the post genuinely doesn't exist (or was deliberately unpublished/
			// deleted) — falling through to legacy would resurrect content that
			// was intentionally removed from the CMS.
			throw error(404, 'Blog not found');
		} catch (e) {
			if (e?.status === 301 || e?.status === 404) throw e;
			// Sanity outage → fall through to the legacy API below. Logged so a
			// misconfiguration doesn't silently and permanently mask the CMS here.
			console.error('Sanity post fetch failed, falling back to legacy API:', e);
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

	const recommendedBlogs = await fetchRecommended(blog.slug || params.slug);
	return { props: { blog, recommendedBlogs } };
}
