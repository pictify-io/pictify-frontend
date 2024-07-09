import backend from '../service/backend';

const getAllBlogs = async ({ type, limit, offset }) => {
	const response = await backend.get('/blogs', {
		params: {
			type,
			limit,
			offset
		}
	});
	return response.data;
};

const getFeaturedBlog = async () => {
	const response = await backend.get('/blogs/featured');
	return response.data;
};

const getBlog = async ({ slug }) => {
	const response = await backend.get(`/blogs/${slug}`);
	return response.data;
};

export { getAllBlogs, getBlog, getFeaturedBlog };
