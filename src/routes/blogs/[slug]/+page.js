import { get } from 'svelte/store';
import { redirect } from '@sveltejs/kit';
import { blogStore, getBlogAction } from '../../../store/blogs.store';

export async function load({ params, fetch }) {
	await getBlogAction(params.slug);
	const blog = get(blogStore).selectedBlog;

	// If the API resolved this post under a different (cleaned) slug,
	// permanently redirect legacy punctuation-heavy URLs to the canonical one.
	if (blog?.slug && blog.slug !== params.slug) {
		throw redirect(301, `/blogs/${blog.slug}`);
	}

	return { props: { blog } };
}
