/**
 * Minimal Sanity client — a fetch wrapper over the public CDN query API.
 * No @sanity/client dependency: the dataset is public-read, queries are GROQ
 * over HTTP GET, and responses are plain JSON. House zero-dep style.
 *
 * Feature-flagged by env: while PUBLIC_SANITY_PROJECT_ID is unset,
 * `sanityEnabled` is false and callers fall back to the legacy Mongo-backed
 * blog API — so this ships dark and cuts over via env change alone.
 */
import { env } from '$env/dynamic/public';

const API_VERSION = 'v2024-01-01';

export const sanityEnabled = () => !!env.PUBLIC_SANITY_PROJECT_ID;

export async function sanityQuery(query, params = {}, fetchFn = fetch) {
	const projectId = env.PUBLIC_SANITY_PROJECT_ID;
	const dataset = env.PUBLIC_SANITY_DATASET || 'production';
	if (!projectId) return null;

	const url = new URL(`https://${projectId}.apicdn.sanity.io/${API_VERSION}/data/query/${dataset}`);
	url.searchParams.set('query', query);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(`$${key}`, JSON.stringify(value));
	}

	const res = await fetchFn(url.toString(), { headers: { Accept: 'application/json' } });
	if (!res.ok) throw new Error(`Sanity query failed (${res.status})`);
	const body = await res.json();
	return body.result ?? null;
}

/** Map a Sanity post document onto the legacy blog shape the UI renders. */
export function toLegacyBlog(doc) {
	if (!doc) return null;
	return {
		title: doc.title,
		seoTitle: doc.seoTitle || null,
		slug: doc.slug,
		description: doc.description,
		content: doc.content,
		tags: doc.tags || [],
		author: doc.author || 'Pictify',
		type: doc.type || 'article',
		heroImage: doc.heroImage || null,
		image: doc.heroImage || null,
		readingTime: doc.readingTime || null,
		isFeatured: !!doc.featured,
		createdAt: doc.publishedAt,
		date: doc.publishedAt,
		updatedAt: doc._updatedAt
	};
}

const POST_PROJECTION = `{
	title, seoTitle, "slug": slug.current, legacySlugs, description, content,
	tags, author, type, heroImage, readingTime, featured, publishedAt, _updatedAt
}`;

/** One post by clean slug OR legacy slug. Returns { blog, matchedLegacy }. */
export async function getSanityPost(slug, fetchFn = fetch) {
	const doc = await sanityQuery(
		`*[_type == "post" && !(_id in path("drafts.**")) && (slug.current == $slug || $slug in legacySlugs)][0] ${POST_PROJECTION}`,
		{ slug },
		fetchFn
	);
	if (!doc) return { blog: null, matchedLegacy: false };
	return { blog: toLegacyBlog(doc), matchedLegacy: doc.slug !== slug };
}

/** All published posts, newest first. */
export async function getSanityPosts(fetchFn = fetch) {
	const docs = await sanityQuery(
		`*[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) ${POST_PROJECTION}`,
		{},
		fetchFn
	);
	return (docs || []).map(toLegacyBlog);
}
