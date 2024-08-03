import backend from '../service/backend';

const getProducts = async () => {
	const response = await backend.get('/products');
	return response;
};

export { getProducts };
