import backend from '../service/backend';

const getAllBlogs = async ({ type, limit, offset }) => {
	const response = await backend.get('/blogs', {
		params: {
			type,
			limit,
			offset
		}
	});
	return response;
};

const getFeaturedBlog = async () => {
	const response = await backend.get('/blogs/featured');
	return response;
};

const getBlog = async ({ slug }) => {
	const response = await backend.get(`/blogs/${slug}`);
	return response;
};

const getRecommendedBlogs = async ({ slug, limit }) => {
	const response = await backend.get(`/blogs/${slug}/recommended`, {
		params: {
			limit
		}
	});
	return response;
};

const getBlogLinks = async () => {
	const response = await backend.get('/blogs/links');
	return response;
};

export { getAllBlogs, getBlog, getFeaturedBlog, getRecommendedBlogs, getBlogLinks };
