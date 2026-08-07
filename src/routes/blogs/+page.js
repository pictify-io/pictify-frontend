import { get } from 'svelte/store';
import { blogStore, getBlogsAction } from '../../store/blogs.store';
import { sanityEnabled, getSanityPosts } from '$lib/sanity/client';

export async function load({ fetch }) {
	// CMS first (see src/lib/sanity/client.js — env-gated, ships dark).
	if (sanityEnabled()) {
		try {
			const posts = await getSanityPosts(fetch);
			if (posts.length) {
				const articles = posts.filter((p) => p.type !== 'guide');
				const guides = posts.filter((p) => p.type === 'guide');
				const featured = posts.find((p) => p.isFeatured) || posts[0];
				return { props: { articles, guides, featured } };
			}
		} catch (e) {
			// Sanity outage → legacy API below. Logged so a misconfiguration
			// (bad dataset, revoked CDN access) doesn't fail silently forever.
			console.error('Sanity blog list fetch failed, falling back to legacy API:', e);
		}
	}

	await getBlogsAction();
	const articles = get(blogStore).articles;
	const guides = get(blogStore).guides;
	const featured = get(blogStore).featured;
	return { props: { articles, guides, featured } };
}
