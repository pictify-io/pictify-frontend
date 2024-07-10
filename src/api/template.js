import backend from '../service/backend';

const getTemplate = async ({ type, variables }) => {
	const url = `/fe/template?type=${type}&variables=${JSON.stringify(variables)}`;
	const response = await backend.get(url);
	return response;
};

export { getTemplate };
