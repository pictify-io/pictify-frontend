import backend from '../service/backend';

const getAllBlogs = async () => {
	const response = await backend.get('/blogs');
	return response.data;
};

const getBlog = async ({ slug, limit, offset }) => {
	const response = await backend.get(`/blogs/${slug}`, {
		params: {
			limit,
			offset
		}
	});
	return response.data;
};

export { getAllBlogs, getBlog };
