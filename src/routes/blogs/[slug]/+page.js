import { get } from 'svelte/store';
import { blogStore, getBlogAction } from '../../../store/blogs.store';

export async function load({ params, fetch }) {
	await getBlogAction(params.slug);
	const blog = get(blogStore).selectedBlog;
	return { props: { blog } };
}
