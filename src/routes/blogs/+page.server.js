import { getAllBlogs, getFeaturedBlog } from '../../api/blog';
import { sanityEnabled, getSanityPosts } from '$lib/sanity/client';

/*
 * SERVER load, deliberately — this used to be a universal `+page.js`.
 *
 * SvelteKit's universal fetch simulates CORS even while running on the server,
 * so a browser-unreadable response fails the load there too. Sanity's allowlist
 * covers https://pictify.io and localhost:5173, which meant every dev session on
 * any other port silently served the legacy Mongo blog instead of the CMS — nine
 * posts with no descriptions and no update dates, and a 401 from
 * /blogs/featured in the console. It also meant the CMS was one CORS entry away
 * from disappearing in production.
 *
 * A server load uses the platform fetch with no CORS simulation, so the origin
 * stops mattering. It also keeps the Sanity URL and query out of the client
 * bundle, and means a client-side navigation asks THIS server for JSON rather
 * than calling the blog API from the browser.
 */

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

export async function load() {
	// CMS first (see src/lib/sanity/client.js — env-gated, ships dark).
	if (sanityEnabled()) {
		try {
			const posts = await getSanityPosts();
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

	/*
	 * Legacy fallback, called directly rather than through blogStore: the store
	 * is module-level state shared by every concurrent SSR request, so reading
	 * it back after an await can hand this request another one's posts.
	 */
	try {
		const [featuredRes, articlesRes, guidesRes] = await Promise.all([
			getFeaturedBlog().catch(() => null),
			getAllBlogs({ type: 'article' }).catch(() => null),
			getAllBlogs({ type: 'guide' }).catch(() => null)
		]);
		const articles = articlesRes?.blogs || [];
		const guides = guidesRes?.blogs || [];
		const posts = [...guides, ...articles];
		return {
			props: { posts, articles, guides, featured: featuredRes?.blog || pickFeatured(posts) }
		};
	} catch (e) {
		console.error('Legacy blog list fetch failed:', e);
		return { props: { posts: [], articles: [], guides: [], featured: null } };
	}
}
