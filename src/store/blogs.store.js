import { writable, get } from 'svelte/store';
import { getAllBlogs, getFeaturedBlog, getBlog } from '../api/blog';

export const blogStore = writable({
	articles: [],
	guides: [],
	featured: null,
	selectedBlog: null
});

export const getBlogsAction = async () => {
	try {
		const featuredBlog = await getFeaturedBlog();
		const [articles, guides] = await Promise.allSettled([
			getAllBlogs({ type: 'article' }),
			getAllBlogs({ type: 'guide' })
		]);

		if (articles.status === 'rejected' || guides.status === 'rejected') {
			throw new Error('Failed to fetch blogs');
		}

		blogStore.set({
			articles: articles.value.blogs,
			guides: guides.value.blogs,
			featured: featuredBlog.blog
		});
	} catch (error) {
		throw error;
	}
};

export const getBlogAction = async (slug) => {
	if (get(blogStore).selectedBlog && get(blogStore).selectedBlog.slug === slug) {
		return;
	}
	const selectedBlog =
		get(blogStore).articles.find((blog) => blog.slug === slug) ||
		get(blogStore).guides.find((blog) => blog.slug === slug);
	if (selectedBlog) {
		blogStore.update((store) => {
			store.selectedBlog = selectedBlog;
			return store;
		});
	} else {
		const data = await getBlog({ slug });
		const blog = data.blog;
		blogStore.update((store) => {
			store.selectedBlog = blog;
			return store;
		});
	}
};

export const clearSelectedBlog = () => {
	blogStore.update((store) => {
		store.selectedBlog = null;
		return store;
	});
};
