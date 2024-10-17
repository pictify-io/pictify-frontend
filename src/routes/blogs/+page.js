import { get } from 'svelte/store';
import { blogStore, getBlogsAction } from '../../store/blogs.store';

export async function load({ fetch }) {
  await getBlogsAction();
  const articles = get(blogStore).articles;
  const guides = get(blogStore).guides;
  const featured = get(blogStore).featured;
  return { props: { articles, guides, featured } };
}
