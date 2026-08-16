import { get } from 'svelte/store';
import { blogStore, getBlogsAction } from '../../store/blogs.store';
import { sanityEnabled, getSanityPosts } from '$lib/sanity/client';

/**
 * Exactly one featured post, decided here rather than trusted from the data.
 *
 * The CMS says "keep exactly one" and currently has two, which the old code
 * resolved by `.find()` — first match wins, and "first" moved whenever the sort
 * changed. Picking the most recent of the flagged posts makes the page
 * deterministic no matter how many are ticked, and means a mis-set flag shows
 * the newer post rather than an arbitrary one.
 */
function pickFeatured(posts) {
	const flagged = posts.filter((p) => p.isFeatured);
	if (!flagged.length) return posts[0] || null;
	return flagged.reduce((best, p) => {
		const a = new Date(p.updatedAt || p.createdAt || 0).getTime();
		const b = new Date(best.updatedAt || best.createdAt || 0).getTime();
		return a > b ? p : best;
	});
}

export async function load({ fetch }) {
	// CMS first (see src/lib/sanity/client.js — env-gated, ships dark).
	if (sanityEnabled()) {
		try {
			const posts = await getSanityPosts(fetch);
			if (posts.length) {
				const featured = pickFeatured(posts);
				return {
					props: {
						posts,
						// Kept for any legacy consumer of this shape.
						articles: posts.filter((p) => p.type !== 'guide'),
						guides: posts.filter((p) => p.type === 'guide'),
						featured
					}
				};
			}
		} catch (e) {
			// Sanity outage → legacy API below. Logged so a misconfiguration
			// (bad dataset, revoked CDN access) doesn't fail silently forever.
			console.error('Sanity blog list fetch failed, falling back to legacy API:', e);
		}
	}

	await getBlogsAction();
	const articles = get(blogStore).articles || [];
	const guides = get(blogStore).guides || [];
	const posts = [...guides, ...articles];
	return {
		props: { posts, articles, guides, featured: get(blogStore).featured || pickFeatured(posts) }
	};
}
