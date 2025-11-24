import backend from '../service/backend';

const generateTemplate = async (messages, context = null) => {
	try {
		const response = await backend.post('/copilot/generate', { messages, context });
		return response;
	} catch (error) {
		throw error;
	}
};

export const editElement = async (element, prompt, context = null) => {
	try {
		const response = await backend.post('/copilot/edit-element', { element, prompt, context });
		return response;
	} catch (error) {
		throw error;
	}
};

export { generateTemplate };
